import { supabase } from './supabaseClient';

const STORAGE_BUCKET = 'stores';

// Tamanho/qualidade máximos pra foto de loja depois de comprimida no
// navegador (15/10/2026, pedido da Amanda: menos peso por envio, pra chegar
// mais rápido pro cliente final mesmo em conexão fraca — hoje no PWA, e já
// valendo igual quando virar app nativo). 1600px já é mais do que suficiente
// pra qualquer tela de celular/desktop do app; se um dia precisar de mais
// nitidez (ex: zoom na foto), sobe esse número — o ganho de peso vem
// principalmente da dimensão, não só da qualidade do JPEG.
const MAX_DIMENSION_PX = 1600;
const JPEG_QUALITY = 0.75;

/**
 * Redimensiona (só se for maior que `MAX_DIMENSION_PX`) e recomprime a foto
 * pra JPEG direto no navegador, antes do upload — usa só a Canvas API, que já
 * vem no navegador (nenhuma lib nova). Se a compressão falhar por qualquer
 * motivo (formato exótico, navegador sem suporte), devolve o arquivo
 * original sem travar o cadastro da loja.
 */
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob) return file;

    const compressedName = `${file.name.replace(/\.[^.]+$/, '')}.jpg`;
    return new File([blob], compressedName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/**
 * Sobe uma imagem (Fachada ou uma posição da Galeria) pro bucket público
 * `stores` do Supabase Storage e devolve a URL pública completa — já pronta
 * pra salvar direto em `storefront_image_url`/`gallery_images`. Antes de
 * subir, a imagem passa por `compressImage` (ver acima).
 *
 * Guardamos a URL completa (não só o nome do arquivo) porque
 * `resolveBunnyImageUrl` (usado em `<ImagePlaceholder>`) já sabe repassar
 * uma URL absoluta sem mexer nela — funciona pros dois formatos sem
 * precisar tocar em nenhuma tela do app cliente.
 *
 * `folderKey` identifica a loja: o `id` real (edição) ou um id temporário
 * gerado no front (`crypto.randomUUID()`) enquanto a loja ainda não foi
 * salva (cadastro novo) — assim dá pra fazer upload de foto antes de
 * clicar em "Salvar".
 */
export async function uploadStoreImage(
  file: File,
  folderKey: string,
  slot: 'fachada' | `galeria-${number}`
): Promise<string> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folderKey}/${slot}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, compressed, {
    upsert: true,
    contentType: compressed.type || undefined,
  });

  if (error) {
    // Repassa a mensagem real do Supabase Storage (em vez de um texto
    // genérico) — 22/08/2026, pra dar pra diagnosticar upload que falha sem
    // acesso aos logs do servidor no momento (ex: RLS, tamanho do arquivo,
    // rede).
    throw new Error(`Não foi possível enviar a imagem: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
