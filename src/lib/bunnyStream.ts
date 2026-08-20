/**
 * Bunny Stream (vídeos dos Stories) — diferente do `bunnyStorage.ts` (que é
 * pra Pull Zone de imagem/CDN direta). O Library ID NÃO é segredo (ele
 * aparece publicamente em qualquer URL de embed), então pode ficar aqui,
 * hardcoded, sem problema — quem é secreto de verdade é a AccessKey da API,
 * que mora só no servidor (Edge Function `bunny-video-upload`, secret
 * `BUNNY_STREAM_API_KEY`).
 */
export const BUNNY_STREAM_LIBRARY_ID = '732490';

/**
 * Monta a URL de embed (iframe) de um vídeo da Bunny Stream a partir do
 * `videoId` (guid) salvo em `stories.video_path`. `null`/`undefined` →
 * `null`, pra tela mostrar o estado de "vídeo ainda não disponível".
 */
export function getBunnyEmbedUrl(videoId?: string | null): string | null {
  if (!videoId) return null;
  return `https://iframe.mediadelivery.net/embed/${BUNNY_STREAM_LIBRARY_ID}/${videoId}?autoplay=true`;
}
