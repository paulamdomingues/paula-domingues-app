import { useEffect, useMemo, useState } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import StoreCard from '../components/StoreCard';
import SortDropdown from '../components/search/SortDropdown';
import CategoryFilterSheet from '../components/search/CategoryFilterSheet';
import { listStores } from '../lib/catalog';
import type { SortOptionId } from '../lib/sortOptions';
import { useFavorites } from '../context/FavoritesContext';
import { sortStores } from '../lib/sortStores';
import { useLoadMore } from '../lib/useLoadMore';
import type { StoreWithCategory } from '../types';

export default function Lojas() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [sort, setSort] = useState<SortOptionId>('populares');
  const [stores, setStores] = useState<StoreWithCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    listStores()
      .then((data) => {
        if (!cancelled) setStores(data);
      })
      .catch(() => {
        // Falha silenciosa: a lista fica vazia em vez de quebrar a tela.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedStores = useMemo(() => sortStores(stores, sort), [sort, stores]);
  const { visibleItems: visibleStores, hasMore, loadMore } = useLoadMore(sortedStores, sort);

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8 lg:px-[156px] lg:py-10">
      <ScreenHeader
        title="Lojas"
        suffix={`(${sortedStores.length})`}
        centerTitleOnDesktop
      />

      {/* 24/08/2026, pedido da Amanda: "Mais populares" e "Filtrar" ficam
          justificados nas pontas (esquerda/direita), com espaçamento
          automático entre eles — sempre o mais afastados possível,
          independente da largura da tela (mesma lógica já usada em
          `CategoryScreen.tsx`). Antes, no mobile, os dois tinham 163px
          fixos + 16px de gap (342px de caixa), então ficavam grudados no
          meio da tela em vez de nas pontas — por isso o `fixedWidth` saiu
          daqui (ele existia só pra forçar essa largura fixa). */}
      <div className="flex h-10 w-full items-center justify-between lg:h-auto">
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