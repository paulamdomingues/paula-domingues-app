import { NavLink } from 'react-router-dom';
import type { IconType } from 'react-icons';
import {
  PiHouse,
  PiHouseFill,
  PiMagnifyingGlass,
  PiStorefront,
  PiStorefrontFill,
  PiHeart,
  PiHeartFill,
  PiUserCircle,
  PiUserCircleFill,
} from 'react-icons/pi';

interface NavItem {
  to: string;
  label: string;
  Icon: IconType;
  ActiveIcon: IconType;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Início', Icon: PiHouse, ActiveIcon: PiHouseFill },
  { to: '/busca', label: 'Busca', Icon: PiMagnifyingGlass, ActiveIcon: PiMagnifyingGlass },
  { to: '/lojas', label: 'Lojas', Icon: PiStorefront, ActiveIcon: PiStorefrontFill },
  { to: '/favoritos', label: 'Favoritos', Icon: PiHeart, ActiveIcon: PiHeartFill },
  { to: '/perfil', label: 'Meu Perfil', Icon: PiUserCircle, ActiveIcon: PiUserCircleFill },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 left-0 flex w-full items-center justify-between border-t-2 border-main-red-700 bg-base-white px-6 pb-8 pt-4 lg:hidden">
      {navItems.map(({ to, label, Icon, ActiveIcon }) => (
        <NavLink key={to} to={to} end={to === '/'} className="flex w-[62px] flex-col items-center gap-1">
          {({ isActive }) => (
            <>
              <span
                className={
                  isActive
                    ? 'flex items-center justify-center rounded-full bg-main-red-300 p-2'
                    : 'flex items-center justify-center p-2'
                }
              >
                {isActive ? (
                  <ActiveIcon className="size-6 text-base-white" />
                ) : (
                  <Icon className="size-6 text-main-red-800" />
                )}
              </span>
              <span
                className={
                  isActive
                    ? 'text-center font-body text-[12px] tracking-[0.36px] text-main-red-400'
                    : 'text-center font-body text-[12px] tracking-[0.36px] text-main-red-800'
                }
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
