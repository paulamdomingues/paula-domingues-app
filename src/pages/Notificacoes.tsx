import { StorefrontIcon } from '../components/icons';
import ScreenHeader from '../components/ScreenHeader';
import { useNotifications } from '../context/NotificationsContext';

/**
 * O estado de lidas/não lidas agora mora no `NotificationsContext` (era
 * `useState` local aqui, então resetava toda vez que saía dessa tela — o
 * sino da Início/TopBar nunca conseguia refletir o estado real). Ver
 * `src/context/NotificationsContext.tsx` (Amanda, 19/08/2026).
 */
export default function Notificacoes() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8 lg:px-[156px] lg:py-10">
      <ScreenHeader title="Notificações" suffix={`(${unreadCount} novas)`} />

      <div className="flex w-full flex-col items-end gap-4 lg:mx-auto lg:max-w-[640px]">
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
              <StorefrontIcon className="size-[30px] shrink-0 text-main-red-800" />
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
