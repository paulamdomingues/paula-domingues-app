/**
 * As 4 opções fixas do filtro de bairro/localização (tela de Categoria) —
 * antes viviam em `mockData.ts`, movidas pra cá porque agora alimentam
 * tanto o filtro real (`NeighborhoodFilter`) quanto o cadastro de loja
 * (`AdminLojaForm`, campo `polo_location`). Continuam uma lista fechada de
 * propósito: `polo_location` é uma coluna de texto livre no banco, mas
 * deixar o admin digitar qualquer coisa fragmentaria o filtro em dezenas
 * de valores únicos e ele deixaria de servir pra filtrar (Amanda,
 * 18/08/2026, ao definir essas 4 opções).
 */
export const NEIGHBORHOODS = ['Brás', '25 de Março', 'Bom Retiro', 'Outros'] as const;
export type Neighborhood = (typeof NEIGHBORHOODS)[number];

/**
 * Os 3 bairros "de verdade" (com filtro exato) — tudo que NÃO for um
 * desses cai no balde "Outros". Usado tanto pro admin decidir quando
 * mostrar o campo de texto livre (`AdminLojaForm`) quanto pro app cliente
 * decidir quais lojas entram no agrupamento de "Outros" (`CategoryScreen`).
 */
export const NAMED_NEIGHBORHOODS: readonly string[] = ['Brás', '25 de Março', 'Bom Retiro'];

/**
 * 02/09/2026 (Amanda): a partir de agora, quando o admin escolhe "Outros"
 * na Localização, ele digita o nome de verdade (ex: "Limeira") num campo
 * de texto livre — e esse texto é sempre forçado pra CAIXA ALTA antes de
 * salvar, independente de como foi digitado, pra duas lojas com a mesma
 * cidade sempre caírem no mesmo grupo (o agrupamento em `CategoryScreen`
 * é por igualdade exata de string).
 */
export function normalizeOutroLocation(raw: string): string {
  return raw.toUpperCase();
}