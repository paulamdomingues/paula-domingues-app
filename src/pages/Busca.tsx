import { useEffect, useMemo, useRef, useState } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import SearchInput from '../components/search/SearchInput';
import SortDropdown from '../components/search/SortDropdown';
import StoreCard from '../components/StoreCard';
import type { SortOptionId } from '../lib/sortOptions';
import { listCategories, listRecentStores, listStores, matchCategoryByTerm } from '../lib/catalog';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { sortStores } from '../lib/sortStores';
import { useLoadMore } from '../lib/useLoadMore';
import { supabase } from '../lib/supabaseClient';
import type { Category, StoreWithCategory } from '../types';

// Aguarda a pessoa parar de digitar antes de logar a busca em
// `search_queries` — sem isso, cada tecla digitada geraria uma linha nova
// na tabela (Amanda só precisa saber O QUE foi buscado, não cada letra
// digitada no caminho).
const SEARCH_LOG_DEBOUNCE_MS = 800;

export default function Busca() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOptionId>('populares');
  const [stores, setStores] = useState<StoreWithCategory[]>([]);
  const [recentStores, setRecentStores] = useState<StoreWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listStores(), listRecentStores(8), listCategories()])
      .then(([storesData, recentStoresData, categoriesData]) => {
        if (cancelled) return;
        setStores(storesData);
        setRecentStores(recentStoresData);
        setCategories(categoriesData);
      })
      .catch(() => {
        // Falha silenciosa: as listas ficam vazias em vez de quebrar a tela.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const trimmedQuery = query.trim().toLowerCase();
  const hasQuery = trimmedQuery.length > 0;

  const results = useMemo(() => {
    if (!hasQuery) return [];
    const matches = stores.filter(
      (store) =>
        store.name.toLowerCase().includes(trimmedQuery) ||
        store.categoryLabel.toLowerCase().includes(trimmedQuery) ||
        store.code.toLowerCase().includes(trimmedQuery) ||
        // 22/08/2026: as tags cadastradas na loja também entram na busca —
        // antes só nome/categoria/código eram considerados.
        // BUG corrigido em 22/08/2026: `store.details` é opcional
        // (`StoreDetails | undefined`) — o build da Vercel quebrou
        // (TS18048) porque isso aqui acessava `.tags` sem checar se
        // `details` existia primeiro. Faltava o `?.`, não só o `?? []`.
        (store.details?.tags ?? []).some((tag) => tag.toLowerCase().includes(trimmedQuery))
    );
    return sortStores(matches, sort);
  }, [hasQuery, trimmedQuery, sort, stores]);
  const {
    visibleItems: visibleResults,
    hasMore,
    loadMore,
  } = useLoadMore(results, `${trimmedQuery}-${sort}`);

  // Loga o termo buscado em `search_queries` (alimenta o card "Termos de
  // Busca" do Relatórios) — só depois de parar de digitar, e só uma vez por
  // termo (evita logar de novo se a pessoa só trocar a ordenação).
  const loggedQueryRef = useRef<string | null>(null);
  useEffect(() => {
    const userId = session?.user.id;
    if (!hasQuery || categories.length === 0 || !userId) return;
    const term = trimmedQuery;
    const timer = setTimeout(() => {
      if (loggedQueryRef.current === term) return;
      loggedQueryRef.current = term;
      const category = matchCategoryByTerm(term, categories);
      supabase
        .from('search_queries')
        .insert({
          term,
          category_id: category ? Number(category.id) : null,
          user_id: userId,
        })
        .then(() => {
          // Sem tratamento de erro aqui de propósito: logging de busca não
          // pode travar/atrapalhar a experiência de busca em si.
        });
    }, SEARCH_LOG_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [hasQuery, trimmedQuery, categories, session]);

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8 lg:px-[156px] lg:py-10">
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
            Nenhum Fornecedor encontrado
          </p>
          <p className="text-center font-body text-[14px] tracking-[0.7px] text-gray-400">
            tente pesquisar novamente
          </p>
        </div>
      )}

      {hasQuery && results.length > 0 && (
        <div className="flex w-full flex-col items-center gap-2">
          {/* 24/08/2026, pedido da Amanda: no mobile, "Ordem de exibição:" e
              o dropdown ficam justificados nas pontas (esquerda/direita),
              com espaçamento automático — sempre o mais afastados possível,
              independente da largura da tela (mesma lógica de
              `CategoryScreen.tsx`, `justify-between ... lg:justify-normal`).
              No desktop `lg:justify-normal` cancela isso e volta pro gap
              fixo de 20/08/2026 (rótulo + botão colados, com espaçamento
              confortável entre os dois). */}
          <div className="flex h-10 w-full items-center justify-between gap-4 lg:h-auto lg:justify-normal lg:gap-7">
            <span className="whitespace-nowrap font-body text-[13px] tracking-[0.65px] text-gray-800 lg:text-[14px] lg:tracking-[0.7px]">
              Ordem de exibição:
            </span>
            <SortDropdown value={sort} onChange={setSort} compact />
          </div>
          <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-6">
            {visibleResults.map((store) => (
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
      )}
    </div>
  );
}