import { useState } from 'react';
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
import { canViewSection, type AdminSection } from '../../lib/adminPermissions';
import Toast from '../Toast';

const ACCESS_DENIED_MESSAGE = 'Sua conta não tem acesso a essa área.';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  section: AdminSection;
  /** `end` faz o item "Resumo" (index `/admin`) não ficar ativo em todas as sub-rotas. */
  end?: boolean;
}

// Ordem e rótulos conferidos direto na sidebar do Figma (node 666:10307,
// canvas "Desktop V1 - Dash", 21/08/2026). Ícones são os mesmos exportados
// pela Amanda pro app cliente (lote "all-icons", 20/08/2026) — HouseIcon/
// StorefrontIcon/SignOutIcon já existiam; os outros 4 entraram junto com
// essa sidebar (ver comentário em `components/icons/index.tsx`).
//
// 20/08/2026: cada item leva sua `section` (ver `adminPermissions.ts`) —
// o menu só mostra o que aquele nível de acesso pode ver (não é mais só
// os botões desabilitados dentro da tela).
const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Resumo', icon: HouseIcon, section: 'resumo', end: true },
  { to: '/admin/stories', label: 'Vídeos/Stories', icon: VideoCameraIcon, section: 'stories' },
  { to: '/admin/lojas', label: 'Lojas', icon: StorefrontIcon, section: 'lojas' },
  { to: '/admin/usuarios', label: 'Usuários', icon: UsersIcon, section: 'usuarios' },
  { to: '/admin/categorias', label: 'Categorias', icon: ListDashesIcon, section: 'categorias' },
  { to: '/admin/relatorios', label: 'Relatórios', icon: ChartBarIcon, section: 'relatorios' },
  { to: '/admin/configuracoes', label: 'Configurações', icon: GearIcon, section: 'configuracoes' },
];

// Nomes invertidos a pedido da Amanda (20/08/2026) — ver comentário em
// `AccessLevel` (AuthContext.tsx) pra entender por quê o rótulo não bate
// com o valor salvo no banco.
const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  master_admin: 'Adm Master',
  suporte: 'Editor de Conteúdo',
  editor_conteudo: 'Suporte',
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
 *
 * 20/08/2026: a Amanda pediu pra NÃO esconder a aba de quem não tem acesso
 * (achou o menu "esquisito" mudando de item por item entre níveis) — agora
 * toda aba sempre aparece, e as que o nível não alcança ficam com
 * `opacity-40` e sem navegação (clique dispara um toast de aviso em vez de
 * navegar, pra não parecer bug).
 */
export default function AdminSidebar() {
  const { firstName, accessLevel, signOut } = useAuth();
  const navigate = useNavigate();
  // `id` muda a cada clique pra reiniciar a animação/timer do Toast mesmo em
  // cliques seguidos numa aba travada (mesmo padrão do `FavoritesContext.tsx`).
  const [deniedToast, setDeniedToast] = useState<{ id: number } | null>(null);

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
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, section }) => {
            const allowed = canViewSection(accessLevel, section);

            if (!allowed) {
              return (
                <button
                  key={to}
                  type="button"
                  onClick={() => setDeniedToast({ id: Date.now() })}
                  title={ACCESS_DENIED_MESSAGE}
                  aria-disabled="true"
                  className="flex h-[46px] cursor-not-allowed items-center gap-3 rounded-lg px-3 font-body text-[15px] tracking-[0.75px] text-gray-900 opacity-40"
                >
                  <Icon className="size-[22px] shrink-0" />
                  {label}
                </button>
              );
            }

            return (
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
            );
          })}
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

      <Toast
        key={deniedToast?.id ?? 'none'}
        message={deniedToast ? ACCESS_DENIED_MESSAGE : null}
        variant="denied"
        onDismiss={() => setDeniedToast(null)}
      />
    </aside>
  );
}
