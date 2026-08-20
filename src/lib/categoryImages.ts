import { supabase } from './supabaseClient';

const STORAGE_BUCKET = 'capas';

/**
 * Sobe a capa de uma categoria pro bucket público `capas` do Supabase
 * Storage — o mesmo bucket que a Amanda já tinha combinado usar quando
 * cadastrasse capas manualmente (ver comentário em `src/data/mockData.ts`,
 * 18/08/2026). Devolve a URL pública completa, pronta pra salvar em
 * `categories.icon_url`.
 */
export async function uploadCategoryImage(file: File, folderKey: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folderKey}/capa-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error('Não foi possível enviar a capa. Tente novamente.');
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
