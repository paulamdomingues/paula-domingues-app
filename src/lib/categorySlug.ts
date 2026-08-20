/**
 * Gera o `slug` de uma categoria a partir do nome — mesmo padrão das 3
 * categorias reais já cadastradas (conferido no Supabase, 21/08/2026):
 * "Alfaiataria" → "alfaiataria", "T-Shirts" → "t-shirts", "Acessórios" →
 * "acessorios". Remove acento, deixa minúsculo, troca espaço por hífen.
 */
const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

export function generateSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
