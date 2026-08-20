import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import { GearIcon, HouseIcon, StorefrontIcon, UsersIcon, VideoCameraIcon } from '../icons';
import { useAuth } from '../../context/AuthContext';
import { canViewSection, type AdminSection } from '../../lib/adminPermissions';
import Toast from '../Toast';

const ACCESS_DENIED_MESSAGE = 'Sua conta não tem acesso a essa área.';

interface NavItem {
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  section: AdminSection;
  /** `end` faz o item "Resumo" (index `/admin`) não ficar ativo em todas as sub-rotas. */
  end?: boolean;
}

// Menu inferior do admin no mobile (Figma: "nav-menu-adm", node 666:6587) —
// só 5 dos 7 itens da sidebar desktop (`AdminSidebar.tsx`): sem Categorias
// e sem Relatórios. Relatórios não tem tela mobile própria (o conteúdo dele
// entra dentro do Resumo mobile, ver `AdminDashboard.tsx`); Categorias
// também não tem nenhuma tela mobile desenhada no Figma — fica só
// acessível pelo desktop por enquanto.
//
// 20/08/2026: mesmo tratamento da sidebar desktop (`AdminSidebar.tsx`) —
// os ícones sempre aparecem todos, mas os de seções que o nível não alcança
// ficam com `opacity-40` e sem navegação (clique dispara o toast de aviso
// em vez de sumir o ícone, pra não parecer bug/menu quebrado no mobile).
const NAV_ITEMS: NavItem[] = [
  { to: '/admin', icon: HouseIcon, section: 'resumo', end: true },
  { to: '/admin/stories', icon: VideoCameraIcon, section: 'stories' },
  { to: '/admin/lojas', icon: StorefrontIcon, section: 'lojas' },
  { to: '/admin/usuarios', icon: UsersIcon, section: 'usuarios' },
  { to: '/admin/configuracoes', icon: GearIcon, section: 'configuracoes' },
];

/**
 * Sem rótulo de texto embaixo do ícone (diferente do `BottomNav` do app
 * cliente) — o Figma mobile do admin usa só os 5 ícones, sem legenda.
 */
export default function AdminMobileNav() {
  const { accessLevel } = useAuth();
  // `id` muda a cada clique pra reiniciar a animação/timer do Toast mesmo em
  // cliques seguidos num ícone travado (mesmo padrão do `AdminSidebar.tsx`).
  const [deniedToast, setDeniedToast] = useState<{ id: number } | null>(null);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex w-full items-center justify-between border-t-2 border-main-red-700 bg-base-white px-6 pb-8 pt-4 lg:hidden">
      {NAV_ITEMS.map(({ to, icon: Icon, end, section }) => {
        const allowed = canViewSection(accessLevel, section);

        if (!allowed) {
          return (
            <button
              key={to}
              type="button"
              onClick={() => setDeniedToast({ id: Date.now() })}
              title={ACCESS_DENIED_MESSAGE}
              aria-disabled="true"
              className="flex h-10 w-14 cursor-not-allowed flex-col items-center justify-center opacity-40"
            >
              <span className="flex items-center justify-center p-2">
                <Icon className="size-6 text-gray-900" />
              </span>
            </button>
          );
        }

        return (
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
        );
      })}

      <Toast
        key={deniedToast?.id ?? 'none'}
        message={deniedToast ? ACCESS_DENIED_MESSAGE : null}
        variant="denied"
        onDismiss={() => setDeniedToast(null)}
      />
    </nav>
  );
}
