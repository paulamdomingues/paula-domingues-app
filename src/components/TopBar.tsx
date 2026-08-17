import { useNavigate } from 'react-router-dom';
import { PiBell } from 'react-icons/pi';
import Logo from './Logo';

interface TopBarProps {
  userFirstName?: string;
}

/**
 * Barra superior compartilhada (logo pequena + nome do usuário + sino de
 * notificações) usada em telas que têm um cabeçalho próprio abaixo dela
 * (Perfil, Dúvidas, Trocar Senha, ...). O ScreenHeader já inclui essa
 * mesma barra para as telas mais simples (Busca, Categoria, Lojas...).
 */
export default function TopBar({ userFirstName = 'Amanda' }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-[57px] w-full items-center justify-between border-b border-[rgba(169,169,169,0.42)] py-2">
      <Logo className="h-auto w-[clamp(84px,18vw,106px)]" />
      <div className="flex items-center gap-2">
        <span className="font-display font-semibold text-[18px] tracking-[0.54px] text-base-black">
          {userFirstName}
        </span>
        <button
          type="button"
          aria-label="Notificações"
          onClick={() => navigate('/notificacoes')}
          className="flex size-10 items-center justify-center"
        >
          <PiBell className="size-6 text-gray-900" />
        </button>
      </div>
    </div>
  );
}
