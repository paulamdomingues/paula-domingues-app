import { supabase } from './supabaseClient';

/**
 * Gera o "iD da loja" (code_badge) automático a partir do nome da
 * categoria, no mesmo padrão já usado nos dados reais cadastrados
 * (conferido direto no Supabase, 21/08/2026):
 *   Alfaiataria → AL-0034 · Acessórios → AC-0001/0002 · T-Shirts → TS-0001..0004
 *
 * O prefixo é: remove acento e qualquer caractere que não seja letra, deixa
 * maiúsculo, pega as 2 primeiras letras. Isso bate exatamente com as 3
 * categorias reais já cadastradas (inclusive "T-Shirts" → "TS", que só dá
 * certo removendo o hífen antes de cortar).
 */
const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

export function categoryPrefix(categoryName: string): string {
  const normalized = categoryName
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '') // remove acentos (marcas diacríticas, depois do NFD)
    .replace(/[^a-zA-Z]/g, '') // só letras
    .toUpperCase();
  return (normalized || 'LJ').slice(0, 2);
}

/**
 * Descobre o próximo número sequencial pro prefixo (busca o maior
 * `code_badge` já usado com esse prefixo e soma 1) e devolve o código
 * completo, ex: "AL-0035". Não assume que os números existentes são
 * sequenciais sem furos (o dado real tem furos, ex: só existe AL-0034) —
 * só garante que o próximo não repete um já usado.
 *
 * Chamado de novo (não reaproveitado de um preview antigo) bem antes do
 * insert final, pra reduzir a janela de duas pessoas gerarem o mesmo código
 * ao mesmo tempo.
 */
export async function generateNextCodeBadge(categoryName: string): Promise<string> {
  const prefix = categoryPrefix(categoryName);

  const { data, error } = await supabase
    .from('stores')
    .select('code_badge')
    .ilike('code_badge', `${prefix}-%`)
    .order('code_badge', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return `${prefix}-0001`;
  }

  const lastCode = data[0].code_badge ?? '';
  const match = lastCode.match(/-(\d+)$/);
  const nextNumber = match ? parseInt(match[1], 10) + 1 : 1;
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}
