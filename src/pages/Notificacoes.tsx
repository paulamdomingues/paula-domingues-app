import { useState } from 'react';
import { PiStorefront } from 'react-icons/pi';
import ScreenHeader from '../components/ScreenHeader';
import { recentStores } from '../data/mockData';

interface NotificationItem {
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

export default function Notificacoes() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8">
      <ScreenHeader title="Notificações" suffix={`(${unreadCount} novas)`} />

      <div className="flex w-full flex-col items-end gap-4">
        <button
          type="button"
          onClick={markAllAsRead}
          className="font-display font-bold text-[22px] tracking-[0.66px] text-base-black"
        >
          Marcar todas como lidas
        </button>

        <div className="flex w-full flex-col gap-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex w-full items-start gap-2 rounded-lg border-b border-gray-300 bg-base-white p-4 ${
                notification.read ? 'opacity-60' : ''
              }`}
            >
              <PiStorefront className="size-[30px] shrink-0 text-main-red-800" />
              <div className="flex flex-1 flex-col items-start gap-4">
                <div className="flex w-full flex-col items-start gap-1">
                  <p className="w-full font-display font-bold text-[22px] leading-[1.2] tracking-[0.66px] text-main-red-800">
                    {notification.title}
                  </p>
                  <p className="font-body font-medium text-[13px] leading-[1.35] tracking-[0.65px] text-gray-900">
                    {notification.description}
                  </p>
                </div>
                <p className="w-full font-body text-[14px] leading-[1.35] tracking-[0.7px] text-base-black">
                  {notification.timeAgo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
