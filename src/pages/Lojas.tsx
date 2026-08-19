import { useMemo, useState } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import StoreCard from '../components/StoreCard';
import SortDropdown from '../components/search/SortDropdown';
import CategoryFilterSheet from '../components/search/CategoryFilterSheet';
import { stores, type SortOptionId } from '../data/mockData';
import { useFavorites } from '../context/FavoritesContext';
import { sortStores } from '../lib/sortStores';
import { useLoadMore } from '../lib/useLoadMore';

export default function Lojas() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [sort, setSort] = useState<SortOptionId>('populares');

  const sortedStores = useMemo(() => sortStores(stores, sort), [sort]);
  const { visibleItems: visibleStores, hasMore, loadMore } = useLoadMore(sortedStores, sort);

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8 lg:px-[156px] lg:py-10">
      <ScreenHeader
        title="Lojas"
        suffix={`(${sortedStores.length})`}
        centerTitleOnDesktop
      />

      {/* Mobile: os dois botões ficam com 163px de largura cada e 16px de gap
          entre eles (342px de largura total pra linha), pra bater com a
          largura de duas colunas da grade de cards embaixo. Desktop
          (`lg:justify-between`): volta a ficar como antes, com o rótulo
          "Ordem de exibição:" e os botões nas pontas (Amanda, 20/08/2026). */}
      <div className="flex w-full items-center gap-4 lg:justify-between">
        <div className="flex items-center gap-4">
          {/* No mobile o rótulo some (só o texto "Mais populares" + ícone,
              tipo aba) — no desktop mantém o rótulo, ver print da Amanda
              (19/08/2026). */}
          <span className="hidden font-body text-[14px] tracking-[0.7px] text-gray-800 lg:inline">
            Ordem de exibição:
          </span>
          <SortDropdown value={sort} onChange={setSort} align="left" fixedWidth />
        </div>
        <CategoryFilterSheet fixedWidth />
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
          onClick={loadMore}
          className="font-body text-[15px] tracking-[0.75px] text-main-red-800 underline"
        >
          Ver mais lojas
        </button>
      )}
    </div>
  );
}
