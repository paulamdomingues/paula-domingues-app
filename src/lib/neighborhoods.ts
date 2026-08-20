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
