import { supabase } from './supabaseClient';

const STORAGE_BUCKET = 'stores';

/**
 * Sobe uma imagem (Fachada ou uma posição da Galeria) pro bucket público
 * `stores` do Supabase Storage e devolve a URL pública completa — já pronta
 * pra salvar direto em `storefront_image_url`/`gallery_images`.
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
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folderKey}/${slot}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
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
