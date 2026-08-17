import { useMemo, useState } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import SearchInput from '../components/search/SearchInput';
import SortDropdown from '../components/search/SortDropdown';
import StoreCard from '../components/StoreCard';
import { recentStores, stores, type SortOptionId } from '../data/mockData';
import { useFavorites } from '../context/FavoritesContext';
import { sortStores } from '../lib/sortStores';

export default function Busca() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOptionId>('recentes');

  const trimmedQuery = query.trim().toLowerCase();
  const hasQuery = trimmedQuery.length > 0;

  const results = useMemo(() => {
    if (!hasQuery) return [];
    const matches = stores.filter(
      (store) =>
        store.name.toLowerCase().includes(trimmedQuery) ||
        store.categoryLabel.toLowerCase().includes(trimmedQuery) ||
        store.code.toLowerCase().includes(trimmedQuery)
    );
    return sortStores(matches, sort);
  }, [hasQuery, trimmedQuery, sort]);

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8">
      <ScreenHeader title="Encontrar Lojas" />

      <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} />

      {!hasQuery && (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="w-full font-body text-[16px] tracking-[0.8px] text-base-black">
            Chegaram Recentemente
          </p>
          <div className="flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-8">
            {recentStores.map((store) => (
              <StoreCard
                key={store.id}
                store={{ ...store, isFavorite: isFavorite(store.id) }}
                onToggleFavorite={() => toggleFavorite(store.id)}
              />
            ))}
          </div>
        </div>
      )}

      {hasQuery && results.length === 0 && (
        <div className="flex w-full flex-col items-center gap-2 py-12">
          <p className="text-center font-display font-semibold text-[18px] tracking-[0.9px] text-base-black">
            Nenhum Resultado encontrado
          </p>
          <p className="text-center font-body text-[14px] tracking-[0.7px] text-gray-400">
            tente pesquisar novamente
          </p>
        </div>
      )}

      {hasQuery && results.length > 0 && (
        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex w-full items-center justify-end gap-7">
            <span className="font-body text-[14px] tracking-[0.7px] text-gray-800">Ordem de exibição:</span>
            <SortDropdown value={sort} onChange={setSort} />
          </div>
          <div className="flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-8">
            {results.map((store) => (
              <StoreCard
                key={store.id}
                store={{ ...store, isFavorite: isFavorite(store.id) }}
                onToggleFavorite={() => toggleFavorite(store.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
