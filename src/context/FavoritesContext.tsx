import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import Toast from '../components/Toast';

interface FavoritesContextValue {
  isFavorite: (storeId: string) => boolean;
  toggleFavorite: (storeId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const REMOVED_FROM_FAVORITES_MESSAGE = 'Loja removida dos favoritos';

/**
 * Guarda os favoritos apenas em memória por enquanto (não persiste ao
 * recarregar a página). Quando a autenticação/backend estiverem
 * totalmente ligados, trocar por leitura/escrita na tabela `favorites`
 * do Supabase (já modelada em supabase/schema.sql).
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Toast de "removido dos favoritos": fica aqui no Provider (em vez de em
  // cada tela) porque `toggleFavorite` é chamado de vários lugares
  // diferentes (Início, Busca, Categoria, Lojas, StoreDetail, Favoritos) —
  // assim o aviso funciona em qualquer tela sem duplicar lógica.
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const toastIdRef = useRef(0);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      isFavorite: (storeId) => favoriteIds.has(storeId),
      toggleFavorite: (storeId) => {
        // Decide a DIREÇÃO da mudança fora do updater de `setFavoriteIds`
        // (lendo o estado atual do closure) — se já estava nos favoritos,
        // essa chamada é uma remoção. Isso evita disparar um efeito
        // colateral (setToast) de dentro da função updater do setState, que
        // o StrictMode pode invocar mais de uma vez.
        const wasFavorite = favoriteIds.has(storeId);

        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) {
            next.delete(storeId);
          } else {
            next.add(storeId);
          }
          return next;
        });

        // Só mostra o toast quando o favorito é REMOVIDO — ao adicionar,
        // o coração preenchido na tela já é feedback suficiente.
        if (wasFavorite) {
          toastIdRef.current += 1;
          setToast({ id: toastIdRef.current, message: REMOVED_FROM_FAVORITES_MESSAGE });
        }
      },
    }),
    [favoriteIds]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      {/* `key` muda a cada disparo pra reiniciar a animação/timer mesmo
          quando duas remoções seguidas geram a mesma mensagem. */}
      <Toast key={toast?.id ?? 'none'} message={toast?.message} onDismiss={() => setToast(null)} />
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites precisa ser usado dentro de <FavoritesProvider>');
  return ctx;
}
