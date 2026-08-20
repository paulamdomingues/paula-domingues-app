import { NavLink } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import { GearIcon, HouseIcon, StorefrontIcon, UsersIcon, VideoCameraIcon } from '../icons';

interface NavItem {
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** `end` faz o item "Resumo" (index `/admin`) não ficar ativo em todas as sub-rotas. */
  end?: boolean;
}

// Menu inferior do admin no mobile (Figma: "nav-menu-adm", node 666:6587) —
// só 5 dos 7 itens da sidebar desktop (`AdminSidebar.tsx`): sem Categorias
// e sem Relatórios. Relatórios não tem tela mobile própria (o conteúdo dele
// entra dentro do Resumo mobile, ver `AdminDashboard.tsx`); Categorias
// também não tem nenhuma tela mobile desenhada no Figma — fica só
// acessível pelo desktop por enquanto.
const NAV_ITEMS: NavItem[] = [
  { to: '/admin', icon: HouseIcon, end: true },
  { to: '/admin/stories', icon: VideoCameraIcon },
  { to: '/admin/lojas', icon: StorefrontIcon },
  { to: '/admin/usuarios', icon: UsersIcon },
  { to: '/admin/configuracoes', icon: GearIcon },
];

/**
 * Sem rótulo de texto embaixo do ícone (diferente do `BottomNav` do app
 * cliente) — o Figma mobile do admin usa só os 5 ícones, sem legenda.
 */
export default function AdminMobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex w-full items-center justify-between border-t-2 border-main-red-700 bg-base-white px-6 pb-8 pt-4 lg:hidden">
      {NAV_ITEMS.map(({ to, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="flex h-10 w-14 flex-col items-center justify-center">
          {({ isActive }) => (
            <span
              className={
                isActive
                  ? 'flex items-center justify-center rounded-full bg-main-red-300 p-2'
                  : 'flex items-center justify-center p-2'
              }
            >
              <Icon className={`size-6 ${isActive ? 'text-base-white' : 'text-gray-900'}`} />
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
