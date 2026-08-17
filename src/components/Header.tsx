import { PiBell } from 'react-icons/pi';

interface HeaderProps {
  userFirstName: string;
  hasUnreadNotifications?: boolean;
}

export default function Header({ userFirstName, hasUnreadNotifications = true }: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[rgba(169,169,169,0.42)] py-2 w-full">
      <div className="flex items-end gap-1">
        <span className="font-display font-semibold text-[18px] tracking-[0.9px] text-gray-900">
          Olá,
        </span>
        <span className="font-display font-bold text-[26px] tracking-[0.78px] text-base-black">
          {userFirstName} !
        </span>
      </div>
      <button
        type="button"
        aria-label="Notificações"
        className="relative flex size-10 items-center justify-center"
      >
        <span className="relative flex size-6 items-center justify-center">
          <PiBell className="size-6 text-gray-900" />
          {hasUnreadNotifications && (
            <span className="absolute right-0 top-0 size-[10px] rounded-full bg-main-red-400" />
          )}
        </span>
      </button>
    </div>
  );
}
