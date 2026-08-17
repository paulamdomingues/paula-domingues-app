import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PiEnvelopeSimple, PiLockSimple } from 'react-icons/pi';
import Logo from '../../components/Logo';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthPrimaryButton from '../../components/auth/AuthPrimaryButton';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      setError('Não foi possível entrar. Confira o e-mail e a senha e tente novamente.');
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-screen-bg px-6 py-10">
      <Logo />

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
        <div className="flex w-full flex-col items-start">
          <h1 className="w-full font-display text-[48px] font-extrabold tracking-[1.44px] text-main-red-600">
            Entrar
          </h1>
          <p className="w-full font-body text-[16px] tracking-[0.8px] text-gray-500">
            Acesse sua conta
          </p>
        </div>

        <div className="flex w-full flex-col gap-[44px]">
          <div className="flex w-full flex-col items-end gap-2">
            <div className="flex w-full flex-col gap-4">
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
              <AuthTextField
                label="Senha"
                placeholder="digite sua senha"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<PiLockSimple className="size-full" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="self-end text-[12px] font-body text-gray-500 underline"
              >
                {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              </button>
            </div>
            <Link to="/esqueci-senha" className="font-body text-[14px] tracking-[0.7px] text-main-red-700">
              Esqueceu sua senha ?
            </Link>
          </div>

          {error && <p className="w-full text-center font-body text-[13px] text-main-red-800">{error}</p>}

          <div className="flex w-full flex-col items-center gap-[44px]">
            <AuthPrimaryButton loading={loading}>Entrar</AuthPrimaryButton>
            <p className="w-full text-center font-body text-[12px] tracking-[0.36px] text-gray-900">
              Ao continuar voce concorda com os
              <br />
              <a href="/termos" className="text-main-red-700">
                Termos de uso
              </a>{' '}
              e{' '}
              <a href="/privacidade" className="text-main-red-700">
                Politica de privacidade
              </a>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
