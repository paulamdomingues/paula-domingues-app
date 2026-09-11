import { useNavigate } from 'react-router-dom';
import { StorefrontIcon, VideoCameraIcon } from '../components/icons';
import ScreenHeader from '../components/ScreenHeader';
import { useNotifications } from '../context/NotificationsContext';
import type { NotificationItem } from '../context/NotificationsContext';

/**
 * O estado de lidas/não lidas agora mora no `NotificationsContext` (era
 * `useState` local aqui, então resetava toda vez que saía dessa tela — o
 * sino da Início/TopBar nunca conseguia refletir o estado real). Ver
 * `src/context/NotificationsContext.tsx` (Amanda, 19/08/2026).
 *
 * 22/08/2026: o feed agora tem 2 tipos reais (loja nova / story novo) — o
 * ícone à esquerda de cada card muda conforme `notification.type`, em vez
 * de ser sempre `StorefrontIcon` fixo.
 *
 * 11/09/2026 (Amanda): clicar num card agora navega pro destino da
 * notificação — loja nova leva direto pra `/loja/:id`; story novo leva pra
 * Início e força a abertura daquele story específico no player (em vez de
 * só cair na Início "genérica", o que pareceria erro/clique sem efeito).
 * Só é clicável quando `targetId` existe — notificações antigas, criadas
 * antes da coluna `target_id` existir no banco, ficam sem ação (sem
 * `cursor-pointer`, sem `onClick`).
 */
function handleNotificationClick(notification: NotificationItem, navigate: ReturnType<typeof useNavigate>) {
  if (notification.targetId === null) return;
  if (notification.type === 'new_store') {
    navigate(`/loja/${notification.targetId}`);
  } else if (notification.type === 'new_story') {
    navigate('/', { state: { openStoryId: notification.targetId } });
  }
}

export default function Notificacoes() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

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
              onClick={() => handleNotificationClick(notification, navigate)}
              className={`flex w-full items-start gap-2 rounded-lg border-b border-gray-300 bg-base-white p-4 ${
                notification.read ? 'opacity-60' : ''
              } ${notification.targetId !== null ? 'cursor-pointer' : ''}`}
            >
              {notification.type === 'new_story' ? (
                <VideoCameraIcon className="size-[30px] shrink-0 text-main-red-800" />
              ) : (
                <StorefrontIcon className="size-[30px] shrink-0 text-main-red-800" />
              )}
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
