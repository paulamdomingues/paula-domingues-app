import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiArrowLeft, PiEnvelopeSimple } from 'react-icons/pi';
import Logo from '../../components/Logo';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthPrimaryButton from '../../components/auth/AuthPrimaryButton';
import AuthShowcasePanel from '../../components/auth/AuthShowcasePanel';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: resetError } = await requestPasswordReset(email);
    setLoading(false);

    if (resetError) {
      setError('Não foi possível enviar o e-mail. Confira o endereço digitado.');
      return;
    }
    navigate('/email-enviado', { state: { email } });
  };

  return (
    <div className="flex min-h-screen w-full items-stretch bg-screen-bg lg:mx-auto lg:max-w-[1440px]">
      <div className="flex w-full flex-col items-center gap-7 px-6 pt-[90px] lg:w-1/2 lg:max-w-[720px] lg:justify-center lg:gap-8 lg:px-[156px] lg:py-10">
        <div className="flex w-full flex-col items-center gap-8">
          <Logo />
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex w-full items-center gap-2 font-body text-[16px] tracking-[0.8px] text-main-red-700"
          >
            <PiArrowLeft className="size-4" />
            Voltar ao login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-col gap-1">
            <h1 className="w-full font-display text-[26px] font-bold tracking-[0.78px] text-main-red-600">
              Esqueci a senha
            </h1>
            <p className="w-full font-body text-[16px] tracking-[0.8px] text-gray-500">
              Digite seu e-mail cadastrado para redefinir sua senha.
            </p>
          </div>

          <div className="flex w-full flex-col gap-[44px]">
            <AuthTextField
              label="Email"
              placeholder="Ex: mariadasilva@gmail.com"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<PiEnvelopeSimple className="size-full" />}
            />
            {error && <p className="w-full text-center font-body text-[13px] text-main-red-800">{error}</p>}
            <AuthPrimaryButton loading={loading}>Receber Link</AuthPrimaryButton>
          </div>
        </form>
      </div>

      <AuthShowcasePanel />
    </div>
  );
}
