/**
 * Upload de vídeo direto pro Bunny Stream via TUS (protocolo de upload
 * resumível, em pedaços) — implementado à mão aqui (sem depender do pacote
 * `tus-js-client`) porque é só isso que a gente precisa: criar a sessão de
 * upload e mandar o arquivo em pedaços, com retentativa por pedaço se um
 * deles falhar. Documentação oficial da Bunny:
 * https://bunny.net/docs/stream/tus-resumable-uploads
 *
 * Criado em 10/09/2026 pra substituir o upload antigo, que passava o
 * arquivo inteiro pela Edge Function `bunny-video-upload` (proxy) antes de
 * chegar na Bunny — um upload duplo (navegador → Edge Function → Bunny),
 * sem retomada em caso de falha, que a Amanda relatou como "bem lento" e
 * que os logs confirmaram estar falhando de verdade (erro depois de ~33s
 * em uploads reais). Agora o navegador manda os bytes direto pra Bunny; a
 * Edge Function só autoriza o upload (ver comentário lá em cima daquele
 * arquivo) — a AccessKey da Bunny nunca chega no navegador.
 */

/** Tamanho de cada pedaço enviado — 20MB. Pequeno o suficiente pra uma
 * falha de rede custar só reenviar um pedaço (não o vídeo inteiro), grande
 * o suficiente pra não gerar requisição demais em vídeos maiores. */
const CHUNK_SIZE_BYTES = 20 * 1024 * 1024;

/** Quantas vezes tenta de novo o MESMO pedaço antes de desistir de vez. */
const MAX_RETRIES_PER_CHUNK = 4;
const RETRY_DELAYS_MS = [1000, 3000, 6000, 12000];

export interface BunnyTusUploadAuth {
  tusEndpoint: string;
  libraryId: string;
  videoId: string;
  authorizationSignature: string;
  authorizationExpire: number;
}

export interface BunnyTusUploadOptions extends BunnyTusUploadAuth {
  file: File;
  title: string;
  /** Chamado a cada pedaço enviado com sucesso, com o progresso de 0 a 1. */
  onProgress?: (fraction: number) => void;
}

function base64Utf8(value: string): string {
  // btoa só aceita Latin1 — passa primeiro por encodeURIComponent/unescape
  // pra suportar título com acento (ç, ã, é...) sem quebrar.
  return btoa(unescape(encodeURIComponent(value)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Faz uma requisição via XHR (em vez de fetch) só pra ganhar o evento de
 * progresso de upload (`xhr.upload.onprogress`) — fetch não expõe isso. */
function xhrRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: XMLHttpRequestBodyInit | null,
  onUploadProgress?: (loaded: number) => void
): Promise<{ status: number; getResponseHeader: (name: string) => string | null; responseText: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    if (onUploadProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onUploadProgress(e.loaded);
      };
    }
    xhr.onload = () => {
      resolve({
        status: xhr.status,
        getResponseHeader: (name) => xhr.getResponseHeader(name),
        responseText: xhr.responseText,
      });
    };
    xhr.onerror = () => reject(new Error('Falha de rede durante o upload.'));
    xhr.send(body ?? undefined);
  });
}

/**
 * Envia `file` direto pro Bunny Stream via TUS, usando a autorização
 * (`videoId` + assinatura) que a Edge Function `bunny-video-upload` já
 * gerou. Resolve quando o upload termina; rejeita com uma mensagem
 * amigável se falhar mesmo depois das retentativas.
 */
export async function uploadVideoToBunny({
  file,
  title,
  tusEndpoint,
  libraryId,
  videoId,
  authorizationSignature,
  authorizationExpire,
  onProgress,
}: BunnyTusUploadOptions): Promise<void> {
  const commonHeaders = {
    AuthorizationSignature: authorizationSignature,
    AuthorizationExpire: String(authorizationExpire),
    VideoId: videoId,
    LibraryId: libraryId,
  };

  // 1) Cria a sessão de upload TUS pra esse vídeo.
  const metadata = [
    `filetype ${base64Utf8(file.type || 'video/mp4')}`,
    `title ${base64Utf8(title)}`,
  ].join(',');

  const createRes = await xhrRequest('POST', tusEndpoint, {
    ...commonHeaders,
    'Tus-Resumable': '1.0.0',
    'Upload-Length': String(file.size),
    'Upload-Metadata': metadata,
  }, null);

  if (createRes.status < 200 || createRes.status >= 300) {
    throw new Error(
      `Bunny recusou iniciar o upload (status ${createRes.status}): ${createRes.responseText.slice(0, 300)}`
    );
  }

  const location = createRes.getResponseHeader('Location');
  if (!location) {
    throw new Error('Bunny não devolveu a URL de upload.');
  }
  const uploadUrl = new URL(location, tusEndpoint).toString();

  // 2) Envia o arquivo em pedaços de CHUNK_SIZE_BYTES, com retentativa por
  // pedaço (não do arquivo inteiro) se algum falhar.
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(offset + CHUNK_SIZE_BYTES, file.size));
    const chunkStartOffset = offset;

    let attempt = 0;
    let lastErrorDetail = '';
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const patchRes = await xhrRequest(
          'PATCH',
          uploadUrl,
          {
            // 10/09/2026: BUG meu — faltava mandar de novo aqui a
            // identificação/autorização (`commonHeaders`) que já ia certinho
            // na criação da sessão (POST acima). Sem isso a Bunny recusa
            // TODO pedaço com "status 400 library id missing or invalid",
            // mesmo com a sessão de upload já criada com sucesso.
            ...commonHeaders,
            'Tus-Resumable': '1.0.0',
            'Upload-Offset': String(chunkStartOffset),
            'Content-Type': 'application/offset+octet-stream',
          },
          chunk,
          (loadedInChunk) => {
            onProgress?.((chunkStartOffset + loadedInChunk) / file.size);
          }
        );

        if (patchRes.status < 200 || patchRes.status >= 300) {
          // 10/09/2026: inclui o corpo da resposta no erro — sem isso a
          // Amanda só via "não foi possível enviar depois de várias
          // tentativas", sem nenhuma pista de POR QUE (código da Bunny,
          // CORS, etc.), impossível de diagnosticar à distância.
          throw new Error(
            `Bunny recusou um pedaço do vídeo (status ${patchRes.status}): ${patchRes.responseText.slice(0, 300)}`
          );
        }

        const newOffsetHeader = patchRes.getResponseHeader('Upload-Offset');
        offset = newOffsetHeader ? Number(newOffsetHeader) : chunkStartOffset + chunk.size;
        onProgress?.(offset / file.size);
        break; // pedaço enviado com sucesso, sai do loop de retentativa
      } catch (err) {
        // Se o `xhr.onerror` disparar (status 0 — bloqueio de CORS ou
        // queda de conexão de verdade, o navegador não distingue os dois),
        // `xhrRequest` rejeita com "Falha de rede durante o upload." — bem
        // diferente de um status HTTP de verdade tipo 401/403. Guardamos
        // qual dos dois foi pra mostrar no erro final.
        lastErrorDetail = err instanceof Error ? err.message : String(err);
        attempt += 1;
        if (attempt > MAX_RETRIES_PER_CHUNK) {
          throw new Error(
            `Não foi possível enviar o vídeo depois de ${MAX_RETRIES_PER_CHUNK} tentativas. Último erro: ${lastErrorDetail}`
          );
        }
        await sleep(RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)]);
        // continua no while(true) — tenta o MESMO pedaço de novo
      }
    }
  }
}
