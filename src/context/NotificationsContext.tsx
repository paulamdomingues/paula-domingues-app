import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { recentStores } from '../data/mockData';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  read: boolean;
}

// "Novo parceiro no app!" para cada loja recém-chegada — mesma lista usada
// em "Chegaram Recentemente" na Início, só que aqui como notificação.
const initialNotifications: NotificationItem[] = recentStores.map((store, index) => ({
  id: store.id,
  title: 'Novo parceiro no app!',
  description: `${store.name} foi adicionado.`,
  timeAgo: `há ${index + 1}d`,
  read: index >= 2,
}));

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
 * sino nunca conseguia refletir o estado real). Só em memória por
 * enquanto, mesmo padrão do `FavoritesContext` — quando o backend estiver
 * ligado, troca por uma tabela `notifications` no Supabase (Amanda,
 * 19/08/2026: "a bolinha com notificações ativas e sem quando todas foram
 * marcadas como lidas, essa troca não está acontecendo").
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState(initialNotifications);

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
