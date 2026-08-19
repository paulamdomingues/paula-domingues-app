import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import ScreenHeader from '../components/ScreenHeader';
import StoreCard from '../components/StoreCard';
import SortDropdown from '../components/search/SortDropdown';
import NeighborhoodFilter from '../components/search/NeighborhoodFilter';
import { categories, stores } from '../data/mockData';
import { useFavorites } from '../context/FavoritesContext';
import { sortStores } from '../lib/sortStores';
import { useLoadMore } from '../lib/useLoadMore';
import type { Neighborhood, SortOptionId } from '../data/mockData';

export default function CategoryScreen() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [sort, setSort] = useState<SortOptionId>('populares');
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);

  const category = categories.find((c) => c.id === categoryId);
  const storesInCategory = useMemo(
    () =>
      sortStores(
        stores.filter(
          (s) => s.categoryId === categoryId && (neighborhood === null || s.neighborhood === neighborhood)
        ),
        sort
      ),
    [categoryId, neighborhood, sort]
  );
  const {
    visibleItems: visibleStores,
    hasMore,
    loadMore,
  } = useLoadMore(storesInCategory, `${categoryId}-${neighborhood}-${sort}`);

  if (!category) {
    return <Navigate to="/lojas" replace />;
  }

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8 lg:px-[156px] lg:py-10">
      <ScreenHeader
        title={category.label}
        suffix={
          neighborhood === null
            ? `(${storesInCategory.length} ${storesInCategory.length === 1 ? 'loja' : 'lojas'})`
            : undefined
        }
        centerTitleOnDesktop
      />

      {neighborhood !== null && (
        <div className="flex w-full items-center justify-center gap-2 lg:justify-start">
          <p className="font-display text-[26px] font-bold tracking-[0.78px] text-gray-900">{neighborhood}</p>
          <p className="font-body text-[14px] tracking-[0.7px] text-gray-800">
            ({storesInCategory.length} {storesInCategory.length === 1 ? 'loja' : 'lojas'})
          </p>
        </div>
      )}

      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <NeighborhoodFilter value={neighborhood} onChange={setNeighborhood} />
        <div className="flex items-center justify-between gap-4 lg:justify-normal">
          <span className="font-body text-[14px] tracking-[0.7px] text-gray-800">Ordem de exibição:</span>
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {storesInCategory.length === 0 ? (
        <div className="flex w-full flex-col items-center gap-1 py-12">
          <p className="text-center font-display font-semibold text-[18px] tracking-[0.9px] text-base-black">
            Nenhum Fornecedor encontrado
          </p>
        </div>
      ) : (
        <>
          <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-6">
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
              onClick={loadMore}
              className="font-body text-[15px] tracking-[0.75px] text-main-red-800 underline"
            >
              Ver mais lojas
            </button>
          )}
        </>
      )}
    </div>
  );
}
