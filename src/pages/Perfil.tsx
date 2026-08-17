import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiArrowLeft,
  PiCaretRight,
  PiChatCircleDots,
  PiFileText,
  PiHeart,
  PiIdentificationCard,
  PiLockKey,
  PiPaperPlaneTilt,
  PiQuestion,
  PiSignOut,
} from 'react-icons/pi';
import TopBar from '../components/TopBar';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import { useAuth } from '../context/AuthContext';

interface ProfileMenuItemProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

function ProfileMenuItem({ icon, label, onClick, href, disabled }: ProfileMenuItemProps) {
  const content = (
    <>
      <span className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center text-main-dark-900">{icon}</span>
        <span className="font-body text-[15px] tracking-[0.75px] text-main-dark-900">{label}</span>
      </span>
      <PiCaretRight className="size-3 shrink-0 text-gray-400" />
    </>
  );

  const className = `flex w-full items-center justify-between border-b border-gray-200 py-2 last:border-b-0 ${
    disabled ? 'pointer-events-none opacity-40' : 'cursor-pointer'
  }`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

/**
 * Tela Perfil (menu-perfil do Figma). Nome/e-mail vêm da sessão do
 * Supabase; "id #..." é um identificador curto derivado do id do usuário
 * (o app real de assinatura via Kiwify teria um id de assinante próprio —
 * por ora uso os primeiros caracteres do id da conta).
 */
export default function Perfil() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const firstName = (session?.user.user_metadata?.first_name as string | undefined) ?? 'Amanda';
  const email = session?.user.email ?? 'amanda@exemplo.com';
  const shortId = session?.user.id ? session.user.id.slice(0, 8).toUpperCase() : '—';

  const handleConfirmLogout = async () => {
    await signOut();
    navigate('/entrar', { replace: true });
  };

  return (
    <div className="flex w-full flex-col items-center gap-10 px-6 py-8">
      <div className="flex w-full flex-col gap-8">
        <TopBar userFirstName={firstName} />

        <div className="flex w-full flex-col gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 font-body text-[16px] tracking-[0.8px] text-main-red-800"
          >
            <PiArrowLeft className="size-4" />
            Voltar
          </button>

          <div className="flex w-full flex-col items-center">
            <h1 className="font-display font-bold text-[26px] tracking-[0.78px] text-gray-800">Perfil</h1>
            <p className="font-display font-semibold text-[18px] tracking-[0.54px] text-base-black">
              id #{shortId}
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-0.5">
            <p className="text-center font-display font-bold capitalize text-[32px] tracking-[1.6px] text-base-black underline">
              {firstName}
            </p>
            <p className="text-center font-body text-[15px] tracking-[0.75px] text-gray-500">{email}</p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4">
        <section className="flex w-full flex-col gap-2">
          <h2 className="w-full font-display font-bold text-[22px] tracking-[0.66px] text-base-black">Conta</h2>
          <div className="flex w-full flex-col rounded-lg bg-base-white px-4 py-2">
            <ProfileMenuItem
              icon={<PiLockKey className="size-full" />}
              label="Alterar Senha"
              onClick={() => navigate('/perfil/trocar-senha')}
            />
            <ProfileMenuItem
              icon={<PiHeart className="size-full" />}
              label="Meus Favoritos"
              onClick={() => navigate('/favoritos')}
            />
          </div>
        </section>

        <section className="flex w-full flex-col gap-2">
          <h2 className="w-full font-display font-bold text-[22px] tracking-[0.66px] text-main-dark-900">
            Informações e Suporte
          </h2>
          <div className="flex w-full flex-col rounded-lg bg-base-white px-4 py-2">
            <ProfileMenuItem icon={<PiChatCircleDots className="size-full" />} label="Entrar no grupo" href="#" />
            <ProfileMenuItem
              icon={<PiPaperPlaneTilt className="size-full" />}
              label="Falar com o Suporte"
              href="https://wa.me/5511966046494"
            />
            <ProfileMenuItem
              icon={<PiQuestion className="size-full" />}
              label="Dúvidas Frequentes"
              onClick={() => navigate('/perfil/duvidas')}
            />
          </div>
        </section>

        <section className="flex w-full flex-col gap-2">
          <h2 className="w-full font-display font-bold text-[22px] tracking-[0.66px] text-main-dark-900">
            Configurações
          </h2>
          <div className="flex w-full flex-col rounded-lg bg-base-white px-4 py-2">
            <ProfileMenuItem
              icon={<PiIdentificationCard className="size-full" />}
              label="Meu Plano - Trimestral"
              disabled
            />
            <ProfileMenuItem
              icon={<PiFileText className="size-full" />}
              label="Termos de Uso e Privacidade"
              onClick={() => navigate('/termos')}
            />
            <ProfileMenuItem
              icon={<PiSignOut className="size-full" />}
              label="Sair da Conta"
              onClick={() => setLogoutOpen(true)}
            />
          </div>
        </section>
      </div>

      {logoutOpen && (
        <LogoutConfirmModal onCancel={() => setLogoutOpen(false)} onConfirm={handleConfirmLogout} />
      )}
    </div>
  );
}
