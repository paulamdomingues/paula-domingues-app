/**
 * Opções de ordenação de lojas (Busca/Categoria/Lojas) — antes viviam em
 * `mockData.ts`, movidas pra cá por não terem nada de mock (são só rótulos
 * fixos de UI). Ver `sortStores.ts` pra lógica real de cada uma.
 */
export const sortOptions = [
  { id: 'populares', label: 'Mais populares' },
  { id: 'recentes', label: 'Mais recentes' },
  { id: 'antigos', label: 'Mais antigos' },
  { id: 'az', label: 'Ordem: A-Z' },
  { id: 'za', label: 'Ordem: Z-A' },
] as const;

export type SortOptionId = (typeof sortOptions)[number]['id'];
