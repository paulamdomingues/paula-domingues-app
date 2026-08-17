import { useEffect, useState } from 'react';

/**
 * Paginação "Ver mais lojas" usada em Lojas, Categoria e Busca: sempre
 * carrega 30 itens de início, e depois 20 em 20 a cada clique em "Ver mais"
 * (regra confirmada com a Amanda). Quando `resetKey` muda (ex: trocou de
 * categoria, ou o termo da busca mudou), volta pro início.
 */
const INITIAL_PAGE_SIZE = 30;
const PAGE_INCREMENT = 20;

export function useLoadMore<T>(items: T[], resetKey?: string | number) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const loadMore = () => setVisibleCount((v) => v + PAGE_INCREMENT);

  return { visibleItems, hasMore, loadMore };
}
