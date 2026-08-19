import { NavLink, useNavigate } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import {
  ChartBarIcon,
  GearIcon,
  HouseIcon,
  ListDashesIcon,
  SignOutIcon,
  StorefrontIcon,
  UsersIcon,
  VideoCameraIcon,
} from '../icons';
import { useAuth, type AccessLevel } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** `end` faz o item "Resumo" (index `/admin`) não ficar ativo em todas as sub-rotas. */
  end?: boolean;
}

// Ordem e rótulos conferidos direto na sidebar do Figma (node 666:10307,
// canvas "Desktop V1 - Dash", 21/08/2026). Ícones são os mesmos exportados
// pela Amanda pro app cliente (lote "all-icons", 20/08/2026) — HouseIcon/
// StorefrontIcon/SignOutIcon já existiam; os outros 4 entraram junto com
// essa sidebar (ver comentário em `components/icons/index.tsx`).
const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Resumo', icon: HouseIcon, end: true },
  { to: '/admin/stories', label: 'Vídeos/Stories', icon: VideoCameraIcon },
  { to: '/admin/lojas', label: 'Lojas', icon: StorefrontIcon },
  { to: '/admin/usuarios', label: 'Usuários', icon: UsersIcon },
  { to: '/admin/categorias', label: 'Categorias', icon: ListDashesIcon },
  { to: '/admin/relatorios', label: 'Relatórios', icon: ChartBarIcon },
  { to: '/admin/configuracoes', label: 'Configurações', icon: GearIcon },
];

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  master_admin: 'Adm Master',
  suporte: 'Suporte',
  editor_conteudo: 'Editor de Conteúdo',
  convidado: 'Convidado',
};

/**
 * Sidebar fixa do painel admin (260px, mesmas cores do Figma: fundo
 * `main-dark-50`, item ativo com fundo `main-red-100`/texto `main-red-800`,
 * inativo em `gray-900` sem fundo — ver node 666:10307). Ícones são
 * temporários (Phosphor via `react-icons`, mesma lib já usada em
 * `StoryPlayerOverlay`/`ImagePlaceholder`) até a Amanda exportar os ícones
 * reais do admin do Figma, igual fizemos com os ícones do app cliente em
 * 20/08/2026.
 */
export default function AdminSidebar() {
  const { firstName, accessLevel, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col justify-between bg-main-dark-50 px-4 py-8">
      <div className="flex flex-col gap-10">
        <p className="px-2 font-display text-[22px] font-extrabold tracking-[0.66px] text-main-red-800">
          Paula Domingues
        </p>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex h-[46px] items-center gap-3 rounded-lg px-3 font-body text-[15px] tracking-[0.75px] transition-colors ${
                  isActive ? 'bg-main-red-100 text-main-red-800' : 'text-gray-900 hover:bg-main-dark-100/30'
                }`
              }
            >
              <Icon className="size-[22px] shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-4 border-t border-main-dark-100 px-2 pt-4">
        <div className="flex flex-col">
          <p className="font-body text-[15px] font-bold tracking-[0.75px] text-main-dark-900">{firstName}</p>
          <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">
            {accessLevel ? ACCESS_LEVEL_LABELS[accessLevel] : '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 font-body text-[15px] tracking-[0.75px] text-main-red-700"
        >
          <SignOutIcon className="size-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
