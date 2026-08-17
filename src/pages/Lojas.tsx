import { useMemo, useState } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import StoreCard from '../components/StoreCard';
import SortDropdown from '../components/search/SortDropdown';
import CategoryFilterSheet from '../components/search/CategoryFilterSheet';
import { stores, type SortOptionId } from '../data/mockData';
import { useFavorites } from '../context/FavoritesContext';
import { sortStores } from '../lib/sortStores';

const PAGE_SIZE = 12;

export default function Lojas() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [sort, setSort] = useState<SortOptionId>('recentes');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sortedStores = useMemo(() => sortStores(stores, sort), [sort]);
  const visibleStores = sortedStores.slice(0, visibleCount);
  const hasMore = visibleCount < sortedStores.length;

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8">
      <ScreenHeader
        title="Lojas"
        suffix={`(${sortedStores.length})`}
      />

      <div className="flex w-full items-center justify-between">
        <CategoryFilterSheet />
        <div className="flex items-center gap-4">
          <span className="font-body text-[14px] tracking-[0.7px] text-gray-800">Ordem de exibição:</span>
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      <div className="flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-8">
        {visibleStores.map((store) => (
          <StoreCard
            key={store.id}
            store={{ ...store, isFavorite: isFavorite(store.id) }}
            onToggleFavorite={() => toggleFavorite(store.id)}
          />
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          className="font-body text-[15px] tracking-[0.75px] text-main-red-800 underline"
        >
          Ver mais lojas
        </button>
      )}
    </div>
  );
}
