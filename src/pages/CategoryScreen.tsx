import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import ScreenHeader from '../components/ScreenHeader';
import StoreCard from '../components/StoreCard';
import SortDropdown from '../components/search/SortDropdown';
import CategoryFilterSheet from '../components/search/CategoryFilterSheet';
import { categories, stores } from '../data/mockData';
import { useFavorites } from '../context/FavoritesContext';
import { sortStores } from '../lib/sortStores';
import type { SortOptionId } from '../data/mockData';

export default function CategoryScreen() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [sort, setSort] = useState<SortOptionId>('recentes');

  const category = categories.find((c) => c.id === categoryId);
  const storesInCategory = useMemo(
    () => sortStores(stores.filter((s) => s.categoryId === categoryId), sort),
    [categoryId, sort]
  );

  if (!category) {
    return <Navigate to="/lojas" replace />;
  }

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8">
      <ScreenHeader
        title={category.label}
        suffix={`(${storesInCategory.length} ${storesInCategory.length === 1 ? 'loja' : 'lojas'})`}
      />

      <div className="flex w-full items-center justify-between">
        <CategoryFilterSheet />
        <div className="flex items-center gap-4">
          <span className="font-body text-[14px] tracking-[0.7px] text-gray-800">Ordem de exibição:</span>
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {storesInCategory.length === 0 ? (
        <div className="flex w-full flex-col items-center gap-1 py-12">
          <p className="text-center font-display font-semibold text-[18px] tracking-[0.9px] text-base-black">
            Nenhuma loja encontrada
          </p>
          <p className="text-center font-body text-[14px] tracking-[0.7px] text-gray-400">
            Volte em breve, novas lojas chegam toda semana.
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-8">
          {storesInCategory.map((store) => (
            <StoreCard
              key={store.id}
              store={{ ...store, isFavorite: isFavorite(store.id) }}
              onToggleFavorite={() => toggleFavorite(store.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
