import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '../../components/icons';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';

export default function EmailSent() {
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email: string | undefined = (location.state as { email?: string } | null)?.email;

  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    await requestPasswordReset(email);
    setResent(true);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center gap-7 bg-screen-bg px-6 pt-[88px] lg:mx-auto lg:max-w-[548px] lg:pt-[160px]">
      <div className="flex w-full flex-col items-center gap-6">
        <Logo />
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex w-full items-center gap-2 font-body text-[16px] tracking-[0.8px] text-main-red-700"
        >
          <ArrowLeftIcon className="size-4" />
          Voltar ao login
        </button>
      </div>

      <div className="flex w-full flex-col items-center gap-[44px]">
        <div className="flex w-full flex-col gap-2">
          <h1 className="w-full font-display text-[26px] font-bold tracking-[0.78px] text-main-red-600">
            E-mail enviado!
          </h1>
          <p className="w-full font-body text-[15px] tracking-[0.75px] text-grey-800">
            Acesse sua caixa de entrada (confira também a pasta de spam) e clique no link para
            criar sua nova senha.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResend}
          disabled={!email}
          className="w-full text-center font-body text-[12px] tracking-[0.36px] text-main-red-700 disabled:opacity-50"
        >
          {resent ? 'E-mail reenviado!' : 'Não recebeu? Reenviar e-mail'}
        </button>
      </div>
    </div>
  );
}
