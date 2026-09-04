import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import ScreenHeader from '../components/ScreenHeader';
import StoreCard from '../components/StoreCard';
import SortDropdown from '../components/search/SortDropdown';
import NeighborhoodFilter from '../components/search/NeighborhoodFilter';
import { listCategories, listStores } from '../lib/catalog';
import { useFavorites } from '../context/FavoritesContext';
import { sortStores } from '../lib/sortStores';
import { useLoadMore } from '../lib/useLoadMore';
import { NAMED_NEIGHBORHOODS, type Neighborhood } from '../lib/neighborhoods';
import type { SortOptionId } from '../lib/sortOptions';
import type { Category, StoreWithCategory } from '../types';

export default function CategoryScreen() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [sort, setSort] = useState<SortOptionId>('populares');
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<StoreWithCategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCategories(), listStores()])
      .then(([categoriesData, storesData]) => {
        if (cancelled) return;
        setCategories(categoriesData);
        setStores(storesData);
      })
      .catch(() => {
        // Falha silenciosa: as listas ficam vazias em vez de quebrar a tela.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const category = categories.find((c) => c.id === categoryId);
  const storesInCategory = useMemo(
    () =>
      sortStores(
        stores.filter((s) => {
          // 04/09/2026 (Amanda): loja aparece aqui se essa for a categoria
          // RAIZ dela OU uma das categorias adicionais vinculadas pela tela
          // Categorias do admin (`extraCategoryIds` — ver `catalog.ts`).
          if (s.categoryId !== categoryId && !s.extraCategoryIds.includes(categoryId ?? '')) return false;
          if (neighborhood === null) return true;
          // 02/09/2026: "Outros" deixou de ser um valor literal — agora
          // `s.neighborhood` guarda o texto customizado (ex: "LIMEIRA")
          // digitado no admin (ver `AdminLojaForm.tsx`), sempre em CAIXA
          // ALTA. Então "selecionou Outros" vira "qualquer loja cujo bairro
          // NÃO é um dos 3 fixos", em vez de comparar string exata.
          if (neighborhood === 'Outros') return !NAMED_NEIGHBORHOODS.includes(s.neighborhood ?? '');
          return s.neighborhood === neighborhood;
        }),
        sort
      ),
    [categoryId, neighborhood, sort, stores]
  );
  const {
    visibleItems: visibleStores,
    hasMore,
    loadMore,
  } = useLoadMore(storesInCategory, `${categoryId}-${neighborhood}-${sort}`);

  // Só quando o filtro "Outros" está ativo: agrupa as lojas já visíveis
  // (respeitando a ordenação e a paginação do "Ver mais lojas" acima) pelo
  // texto exato de `neighborhood` — cada grupo vira uma subseção com
  // subtítulo (ex: "LIMEIRA", "MONTE SIÃO - MG"), igual ao mockup do Figma.
  // `Map` preserva a ordem de primeira aparição, que já segue a ordenação
  // escolhida (`sort`).
  const groupedOutros = useMemo(() => {
    if (neighborhood !== 'Outros') return null;
    const groups = new Map<string, StoreWithCategory[]>();
    for (const store of visibleStores) {
      const key = store.neighborhood?.trim() || 'Outros';
      const group = groups.get(key);
      if (group) {
        group.push(store);
      } else {
        groups.set(key, [store]);
      }
    }
    return [...groups.entries()];
  }, [neighborhood, visibleStores]);

  // Só redireciona depois que o fetch terminou — antes disso `categories`
  // ainda está vazio e todo `categoryId` pareceria inválido.
  if (loaded && !category) {
    return <Navigate to="/lojas" replace />;
  }

  // Ainda carregando (fetch em andamento) — categoria pode não existir por
  // enquanto sem ser um categoryId inválido de verdade.
  if (!category) {
    return null;
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
          {groupedOutros ? (
            <div className="flex w-full flex-col gap-8">
              {groupedOutros.map(([groupName, groupStores]) => (
                <div key={groupName} className="flex w-full flex-col gap-4">
                  <p className="font-display text-[20px] font-bold uppercase tracking-[0.6px] text-gray-900">
                    {groupName}
                  </p>
                  <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-6">
                    {groupStores.map((store) => (
                      <StoreCard
                        key={store.id}
                        store={{ ...store, isFavorite: isFavorite(store.id) }}
                        onToggleFavorite={() => toggleFavorite(store.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-6">
              {visibleStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={{ ...store, isFavorite: isFavorite(store.id) }}
                  onToggleFavorite={() => toggleFavorite(store.id)}
                />
              ))}
            </div>
          )}
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