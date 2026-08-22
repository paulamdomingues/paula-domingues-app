import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Toast from '../components/Toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface FavoritesContextValue {
  isFavorite: (storeId: string) => boolean;
  toggleFavorite: (storeId: string) => void;
  /**
   * Data (ISO) de quando a loja foi favoritada, pra quem precisa ordenar a
   * lista de favoritos "mais recente primeiro" (`Favoritos.tsx`, 22/08/2026 —
   * Amanda pediu pra ordenar por quando foi adicionado, não por nome).
   * `undefined` se a loja não está favoritada.
   */
  favoritedAt: (storeId: string) => string | undefined;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const REMOVED_FROM_FAVORITES_MESSAGE = 'Loja removida dos favoritos';
const ADDED_TO_FAVORITES_MESSAGE = 'Loja adicionada aos favoritos';

/**
 * Favoritos persistidos de verdade na tabela `favorites` do Supabase (RLS:
 * `favorites_select_own`/`favorites_insert_own`/`favorites_delete_own`,
 * migração 0001) — antes só vivia em memória (`Set` local), com um
 * comentário aqui mesmo dizendo pra trocar "quando a autenticação/backend
 * estiverem totalmente ligados". Essa condição já é verdade agora (Amanda,
 * 21/08/2026: "pode trazer dados reais").
 *
 * Estratégia: busca os favoritos da pessoa logada uma vez (por `user_id`),
 * guarda os `store_id` num `Set` local pra leitura instantânea (`isFavorite`
 * não pode depender de round-trip de rede toda hora que um card renderiza),
 * e cada `toggleFavorite` faz update otimista no estado local + persiste no
 * Supabase em paralelo — com rollback silencioso se a escrita falhar.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  // Guarda `store_id -> created_at` (em vez de só um Set) pra dar pra
  // ordenar a lista de favoritos por quando cada um foi adicionado
  // (22/08/2026 — antes só existia o Set, sem nenhuma noção de "quando").
  const [favorites, setFavorites] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!userId) {
      setFavorites(new Map());
      return;
    }
    let cancelled = false;
    supabase
      .from('favorites')
      .select('store_id, created_at')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setFavorites(
          new Map(
            data
              .filter((row) => row.store_id != null)
              .map((row) => [String(row.store_id), row.created_at as string])
          )
        );
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Toast de favoritar/desfavoritar: fica aqui no Provider (em vez de em
  // cada tela) porque `toggleFavorite` é chamado de vários lugares
  // diferentes (Início, Busca, Categoria, Lojas, StoreDetail, Favoritos) —
  // assim o aviso funciona em qualquer tela sem duplicar lógica.
  const [toast, setToast] = useState<{ id: number; message: string; variant: 'added' | 'removed' } | null>(
    null
  );
  const toastIdRef = useRef(0);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      isFavorite: (storeId) => favorites.has(storeId),
      favoritedAt: (storeId) => favorites.get(storeId),
      toggleFavorite: (storeId) => {
        if (!userId) return;

        const wasFavorite = favorites.has(storeId);
        const numericStoreId = Number(storeId);
        // Otimista: usa a hora local até o Supabase confirmar — é só pra
        // ordenação da lista, não precisa ser exata ao milissegundo.
        const optimisticCreatedAt = new Date().toISOString();

        setFavorites((prev) => {
          const next = new Map(prev);
          if (wasFavorite) {
            next.delete(storeId);
          } else {
            next.set(storeId, optimisticCreatedAt);
          }
          return next;
        });

        toastIdRef.current += 1;
        setToast({
          id: toastIdRef.current,
          message: wasFavorite ? REMOVED_FROM_FAVORITES_MESSAGE : ADDED_TO_FAVORITES_MESSAGE,
          variant: wasFavorite ? 'removed' : 'added',
        });

        // Persiste em paralelo — se falhar, desfaz o update otimista em
        // silêncio (sem travar a UI numa mensagem de erro por um toggle de
        // favorito, que não é uma ação crítica).
        const persist = wasFavorite
          ? supabase.from('favorites').delete().eq('user_id', userId).eq('store_id', numericStoreId)
          : supabase.from('favorites').insert({ user_id: userId, store_id: numericStoreId });

        persist.then(({ error }) => {
          if (!error) return;
          setFavorites((prev) => {
            const next = new Map(prev);
            if (wasFavorite) {
              next.set(storeId, optimisticCreatedAt);
            } else {
              next.delete(storeId);
            }
            return next;
          });
        });
      },
    }),
    [favorites, userId]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      {/* `key` muda a cada disparo pra reiniciar a animação/timer mesmo
          quando duas remoções seguidas geram a mesma mensagem. */}
      <Toast
        key={toast?.id ?? 'none'}
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites precisa ser usado dentro de <FavoritesProvider>');
  return ctx;
}
