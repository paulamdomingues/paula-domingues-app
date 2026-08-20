import { supabase } from './supabaseClient';

const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');
const STOPWORDS = new Set(['E', 'DE', 'DA', 'DO', 'PARA']);

function cleanLetters(name: string): string {
  return name
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '') // remove acentos (marcas diacríticas, depois do NFD)
    .replace(/[^a-zA-Z\s]/g, '') // só letras e espaço (o espaço serve pra separar palavras)
    .toUpperCase();
}

/**
 * Resolve um prefixo de 2 letras ÚNICO pra uma categoria — usado só na
 * CRIAÇÃO da categoria (`CategoriaModal.tsx`), o resultado fica gravado
 * pra sempre em `categories.code_prefix` e nunca mais recalculado (renomear
 * a categoria depois não muda o iD de nenhuma loja já cadastrada nela).
 *
 * 21/08/2026: antes o prefixo (usado por `generateNextCodeBadge` abaixo)
 * era recalculado toda vez a partir do NOME da categoria (as 2 primeiras
 * letras, sem checar colisão com nenhuma outra) — a Amanda notou 3
 * colisões reais nas 22 categorias da Paula: "Bolsas e Cintos"/"Bom
 * Retiro" e "Tricô"/"Tropical" caindo em "BO"/"TR", "Premium"/"Praia" em
 * "PR". Essa função resolve isso tentando, em ordem, até achar uma
 * combinação de 2 letras que nenhuma outra categoria já usa:
 *   1. as 2 primeiras letras do nome (o padrão de sempre);
 *   2. se o nome tiver mais de uma palavra "significativa" (ignora "e"/
 *      "de"/"da"/"do"/"para"), a inicial das duas primeiras — ex: "Bom
 *      Retiro" vira "BR" em vez de repetir o "BO" de "Bolsas e Cintos";
 *   3. a 1ª letra do nome + cada letra seguinte, uma de cada vez (3ª, 4ª,
 *      5ª...) — ex: "Tropical" vira "TO" (1ª+3ª letra) pra não repetir o
 *      "TR" de "Tricô";
 *   4. por último (não deve acontecer na prática com nomes de verdade),
 *      1ª letra + um número.
 */
export function resolveCategoryPrefix(categoryName: string, usedPrefixes: Iterable<string>): string {
  const used = new Set(Array.from(usedPrefixes, (p) => p.toUpperCase()));
  const cleaned = cleanLetters(categoryName);
  const lettersOnly = cleaned.replace(/\s+/g, '');
  const firstLetter = lettersOnly[0] || 'L';

  const candidates: string[] = [];
  if (lettersOnly.length >= 2) candidates.push(lettersOnly.slice(0, 2));

  const words = cleaned
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w));
  if (words.length >= 2 && words[0][0] && words[1][0]) {
    candidates.push(`${words[0][0]}${words[1][0]}`);
  }

  for (let i = 2; i < lettersOnly.length; i++) {
    candidates.push(`${firstLetter}${lettersOnly[i]}`);
  }

  for (const candidate of candidates) {
    if (candidate.length === 2 && !used.has(candidate)) {
      return candidate;
    }
  }

  for (let n = 1; n <= 9; n++) {
    const fallback = `${firstLetter}${n}`;
    if (!used.has(fallback)) return fallback;
  }
  return `${firstLetter}X`;
}

/**
 * Descobre o próximo número sequencial pro prefixo (busca o maior
 * `code_badge` já usado com esse prefixo e soma 1) e devolve o código
 * completo, ex: "AL-0035". Não assume que os números existentes são
 * sequenciais sem furos (o dado real tem furos, ex: só existe AL-0034) —
 * só garante que o próximo não repete um já usado.
 *
 * 21/08/2026: recebe o `prefix` já pronto (vem de `categories.code_prefix`,
 * ver `resolveCategoryPrefix` acima) em vez do nome da categoria — antes
 * recalculava o prefixo do nome toda vez, o que não tinha como resolver
 * colisão entre categorias diferentes.
 *
 * Chamado de novo (não reaproveitado de um preview antigo) bem antes do
 * insert final, pra reduzir a janela de duas pessoas gerarem o mesmo código
 * ao mesmo tempo.
 */
export async function generateNextCodeBadge(prefix: string): Promise<string> {
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
