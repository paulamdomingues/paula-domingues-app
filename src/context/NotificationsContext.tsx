import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export type NotificationType = 'new_store' | 'new_story';

export interface NotificationItem {
  id: string;
  type: NotificationType;
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

interface NotificationRow {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  created_at: string;
}

/**
 * Feed de verdade agora (22/08/2026) — confirmado com a Amanda que são
 * exatamente 2 tipos de notificação: loja nova publicada e story novo,
 * alimentados por trigger no banco (`0010_notifications.sql`), não mais
 * fabricados aqui a partir de `listRecentStores`. "Lida/não lida" também
 * passa a ser real: `notification_reads.last_read_at` por usuário — uma
 * notificação é lida se `created_at <= last_read_at` (ver migration pro
 * racional completo). Continua centralizado aqui (fora da tela
 * `/notificacoes`) pelo mesmo motivo de antes: o sino da Início/TopBar
 * precisa do mesmo estado.
 */
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setRows([]);
      setLastReadAt(null);
      return;
    }

    let cancelled = false;

    Promise.all([
      supabase.from('notifications').select('id, type, title, description, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('notification_reads').select('last_read_at').eq('user_id', userId).maybeSingle(),
    ])
      .then(([notificationsRes, readsRes]) => {
        if (cancelled) return;
        setRows(notificationsRes.data ?? []);
        setLastReadAt(readsRes.data?.last_read_at ?? null);
      })
      .catch(() => {
        // Falha silenciosa: sino fica sem notificações em vez de quebrar o app.
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const notifications = useMemo<NotificationItem[]>(
    () =>
      rows.map((row) => ({
        id: String(row.id),
        type: row.type,
        title: row.title,
        description: row.description,
        timeAgo: timeAgo(row.created_at),
        read: lastReadAt !== null && new Date(row.created_at).getTime() <= new Date(lastReadAt).getTime(),
      })),
    [rows, lastReadAt]
  );

  const value = useMemo<NotificationsContextValue>(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    return {
      notifications,
      unreadCount,
      hasUnread: unreadCount > 0,
      markAllAsRead: () => {
        if (!userId) return;
        const now = new Date().toISOString();
        setLastReadAt(now);
        supabase.from('notification_reads').upsert({ user_id: userId, last_read_at: now }, { onConflict: 'user_id' }).then();
      },
    };
  }, [notifications, userId]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications precisa ser usado dentro de <NotificationsProvider>');
  return ctx;
}
