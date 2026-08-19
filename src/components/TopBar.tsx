import { NavLink, useNavigate } from 'react-router-dom';
import { BellIcon } from './icons';
import Logo from './Logo';
import { useNotifications } from '../context/NotificationsContext';

interface TopBarProps {
  userFirstName?: string;
}

const navItems = [
  { to: '/', label: 'Início', end: true },
  { to: '/busca', label: 'Buscar' },
  { to: '/lojas', label: 'Lojas' },
  { to: '/favoritos', label: 'Favoritos' },
  { to: '/perfil', label: 'Meu Perfil' },
];

/**
 * Barra superior compartilhada. No mobile é só logo + nome do usuário +
 * sino (a navegação fica no `BottomNav`, embaixo). A partir de `lg:`, essa
 * mesma barra vira o cabeçalho desktop completo: ganha o menu de navegação
 * central (Início/Buscar/Lojas/Favoritos/Meu Perfil) — substituindo o
 * `BottomNav`, que fica escondido em telas largas (ver `BottomNav.tsx`).
 */
export default function TopBar({ userFirstName = 'Amanda' }: TopBarProps) {
  const navigate = useNavigate();
  const { hasUnread } = useNotifications();

  return (
    <div className="flex h-[57px] w-full items-center justify-between border-b border-[rgba(169,169,169,0.42)] py-2 lg:h-[70px]">
      <Logo className="h-auto w-[clamp(84px,18vw,106px)] lg:w-[90px]" />

      <nav className="hidden items-center gap-6 lg:flex">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `font-display font-bold text-[22px] tracking-[0.66px] ${
                isActive ? 'text-main-red-300' : 'text-main-red-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <span className="font-display font-semibold text-[18px] tracking-[0.54px] text-base-black underline lg:text-[24px]">
          {userFirstName}
        </span>
        <button
          type="button"
          aria-label="Notificações"
          onClick={() => navigate('/notificacoes')}
          className="relative flex size-10 items-center justify-center"
        >
          <span className="relative flex items-center justify-center">
            <BellIcon className="size-6 text-gray-900 lg:size-[26px]" />
            {hasUnread && (
              <span className="absolute right-0 top-0 size-[10px] rounded-full bg-main-red-400" />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
