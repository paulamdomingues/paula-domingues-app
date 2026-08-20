import type { SortOptionId } from './sortOptions';
import type { Store } from '../types';

/**
 * "populares" (ordenação padrão) ainda não tem dado real — vai vir de
 * analytics (acessos/cliques/favoritos) quando existir. Por enquanto
 * mantém a ordem original do catálogo; trocar aqui pra usar o dado real
 * assim que ele existir no Supabase (ver `store_contact_clicks`).
 *
 * "recentes"/"antigos" agora ordenam por `store.createdAt` (vem de
 * `stores.created_at` via `catalog.ts`) em vez de depender da ordem em que
 * o array chegou de quem chamou — mais robusto que o `.reverse()` que o
 * mock permitia.
 */
export function sortStores<T extends Store>(list: T[], sort: SortOptionId): T[] {
  const copy = [...list];
  switch (sort) {
    case 'antigos':
      return copy.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
    case 'recentes':
      return copy.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    case 'az':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    case 'za':
      return copy.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'));
    case 'populares':
    default:
      return copy;
  }
}
