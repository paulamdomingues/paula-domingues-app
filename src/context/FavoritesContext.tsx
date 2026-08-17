import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface FavoritesContextValue {
  isFavorite: (storeId: string) => boolean;
  toggleFavorite: (storeId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

/**
 * Guarda os favoritos apenas em memória por enquanto (não persiste ao
 * recarregar a página). Quando a autenticação/backend estiverem
 * totalmente ligados, trocar por leitura/escrita na tabela `favorites`
 * do Supabase (já modelada em supabase/schema.sql).
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const value = useMemo<FavoritesContextValue>(
    () => ({
      isFavorite: (storeId) => favoriteIds.has(storeId),
      toggleFavorite: (storeId) =>
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (next.has(storeId)) {
            next.delete(storeId);
          } else {
            next.add(storeId);
          }
          return next;
        }),
    }),
    [favoriteIds]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites precisa ser usado dentro de <FavoritesProvider>');
  return ctx;
}
