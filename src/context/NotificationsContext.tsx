import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { listRecentStores } from '../lib/catalog';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  read: boolean;
}

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  hasUnread: boolean;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

/**
 * Guarda o estado de lidas/não lidas fora da tela `/notificacoes` (era
 * `useState` local ali, então resetava toda vez que a tela desmontava e o
 * sino nunca conseguia refletir o estado real). O CONTEÚDO das notificações
 * ("Novo parceiro no app!") agora vem de lojas reais (`catalog.ts`) — mas o
 * mecanismo de lida/não lida continua só em memória por enquanto, mesmo
 * padrão de antes; quando existir uma tabela `notifications` de verdade no
 * Supabase, troca por leitura/escrita real (Amanda, 19/08/2026: "a bolinha
 * com notificações ativas e sem quando todas foram marcadas como lidas,
 * essa troca não está acontecendo" — isso já está resolvido pelo estado
 * centralizado aqui, só o backend de notificações em si que segue pendente).
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    listRecentStores(8)
      .then((stores) => {
        if (cancelled) return;
        setNotifications(
          stores.map((store, index) => ({
            id: store.id,
            title: 'Novo parceiro no app!',
            description: `${store.name} foi adicionado.`,
            timeAgo: `há ${index + 1}d`,
            read: index >= 2,
          }))
        );
      })
      .catch(() => {
        // Falha silenciosa: sino fica sem notificações em vez de quebrar o app.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<NotificationsContextValue>(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    return {
      notifications,
      unreadCount,
      hasUnread: unreadCount > 0,
      markAllAsRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    };
  }, [notifications]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications precisa ser usado dentro de <NotificationsProvider>');
  return ctx;
}
