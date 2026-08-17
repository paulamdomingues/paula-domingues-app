import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PiEnvelopeSimple, PiLockSimple, PiUser } from 'react-icons/pi';
import Logo from '../../components/Logo';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthPrimaryButton from '../../components/auth/AuthPrimaryButton';
import AuthShowcasePanel from '../../components/auth/AuthShowcasePanel';
import TermsFooter from '../../components/auth/TermsFooter';
import { useAuth } from '../../context/AuthContext';

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const firstName = fullName.trim().split(' ')[0] ?? fullName;
    if (!firstName) {
      setError('Digite seu nome completo.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email, password, firstName);
    setLoading(false);

    if (signUpError) {
      setError('Não foi possível criar sua conta. Verifique os dados e tente novamente.');
      return;
    }

    // Por padrão o Supabase Auth exige confirmação por e-mail antes do login.
    navigate('/login', { replace: true, state: { justSignedUp: true } });
  };

  return (
    <div className="flex min-h-screen w-full items-stretch bg-screen-bg">
      <div className="flex w-full flex-col items-center justify-center gap-10 px-6 py-10 lg:w-1/2 lg:max-w-[720px] lg:px-[156px]">
        <Logo />

        <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-[38px]">
        <div className="flex w-full flex-col items-center gap-[44px]">
          <div className="flex w-full flex-col gap-6">
            <div className="flex w-full flex-col items-start">
              <h1 className="w-full font-display text-[48px] font-extrabold tracking-[1.44px] text-main-red-600">
                Criar conta
              </h1>
              <p className="w-full font-body text-[16px] tracking-[0.8px] text-gray-500">
                Preencha seus dados para começar
              </p>
            </div>

            <div className="flex w-full flex-col gap-4">
              <AuthTextField
                label="Nome Completo"
                placeholder="Ex: Maria da Silva Santos"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<PiUser className="size-full" />}
              />
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
              <div className="flex w-full flex-col gap-1">
                <AuthTextField
                  label="Senha"
                  placeholder="digite sua senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
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
            </div>
          </div>

          {error && <p className="w-full text-center font-body text-[13px] text-main-red-800">{error}</p>}

          <AuthPrimaryButton loading={loading}>Criar Conta</AuthPrimaryButton>
        </div>

        <div className="flex w-full flex-col items-center gap-8">
          <p className="whitespace-nowrap text-center font-body text-[12px] tracking-[0.36px] text-gray-900">
            Já tem conta ?{' '}
            <Link to="/login" className="text-main-red-600 underline">
              Fazer Login
            </Link>
          </p>
          <TermsFooter prefix="Ao criar uma conta, você concorda com os" />
        </div>
        </form>
      </div>

      <AuthShowcasePanel />
    </div>
  );
}
