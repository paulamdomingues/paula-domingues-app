import { NavLink } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import {
  HouseIcon,
  MagnifyingGlassIcon,
  StorefrontIcon,
  HeartIcon,
  HeartFillIcon,
  UserIcon,
} from './icons';

interface NavItem {
  to: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  ActiveIcon: ComponentType<SVGProps<SVGSVGElement>>;
}

// Só o de Favoritos tem uma variante "preenchida" exportada do Figma
// (HeartIcon/HeartFillIcon) — Início, Lojas e Perfil usam o mesmo ícone nos
// dois estados, já que só existe um glifo pra cada um entre os SVGs que a
// Amanda exportou; o estado ativo continua se destacando pelo fundo
// vermelho por trás do ícone (Amanda, 20/08/2026).
const navItems: NavItem[] = [
  { to: '/', label: 'Início', Icon: HouseIcon, ActiveIcon: HouseIcon },
  { to: '/busca', label: 'Busca', Icon: MagnifyingGlassIcon, ActiveIcon: MagnifyingGlassIcon },
  { to: '/lojas', label: 'Lojas', Icon: StorefrontIcon, ActiveIcon: StorefrontIcon },
  { to: '/favoritos', label: 'Favoritos', Icon: HeartIcon, ActiveIcon: HeartFillIcon },
  { to: '/perfil', label: 'Meu Perfil', Icon: UserIcon, ActiveIcon: UserIcon },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-between border-t-2 border-main-red-700 bg-base-white px-6 pb-8 pt-4 lg:hidden">
      {navItems.map(({ to, label, Icon, ActiveIcon }) => (
        <NavLink key={to} to={to} end={to === '/'} className="flex w-[62px] flex-col items-center gap-0">
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
                    ? 'whitespace-nowrap text-center font-body text-[12px] tracking-[0.36px] text-main-red-400'
                    : 'whitespace-nowrap text-center font-body text-[12px] tracking-[0.36px] text-main-red-800'
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
