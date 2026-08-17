import type { SortOptionId } from '../data/mockData';
import type { Store } from '../types';

/**
 * Sem uma data real de cadastro no mock, "mais recentes"/"mais antigos"
 * usam a ordem em que os dados aparecem no catálogo (equivalente a uma
 * coluna `created_at` no banco de verdade).
 */
export function sortStores<T extends Store>(list: T[], sort: SortOptionId): T[] {
  const copy = [...list];
  switch (sort) {
    case 'antigos':
      return copy.reverse();
    case 'az':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    case 'za':
      return copy.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'));
    case 'recentes':
    default:
      return copy;
  }
}
