import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockIcon } from '../../components/icons';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthPrimaryButton from '../../components/auth/AuthPrimaryButton';
import { useAuth } from '../../context/AuthContext';

/**
 * Login do painel admin (node 638:6467, canvas "Desktop V1 - Dash").
 * Usa o MESMO Supabase Auth do app cliente (`signIn` do `AuthContext`) — só
 * depois do login é que `ProtectedAdminRoute` confere se essa conta tem
 * registro em `team_members`. Por isso o erro de "conta sem acesso" só
 * aparece aqui: o `signIn` em si pode ter sucesso normalmente (senha
 * correta) mesmo pra uma cliente final, que só não tem permissão de entrar
 * no painel.
 */
export default function AdminLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const unauthorized = Boolean((location.state as { unauthorized?: boolean } | null)?.unauthorized);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
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
    navigate('/admin', { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-main-dark-50 px-6 py-10">
      <div className="flex w-full max-w-[480px] flex-col gap-8">
        <div className="flex w-full flex-col items-center gap-1">
          <p className="font-display text-[18px] font-bold tracking-[0.9px] text-gray-500">
            PAINEL ADMINISTRATIVO
          </p>
          <h1 className="font-display text-[48px] font-extrabold tracking-[1.44px] text-main-red-800">
            Entrar
          </h1>
          <p className="font-body text-[16px] tracking-[0.8px] text-gray-500">Acesse sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-col gap-4">
            <AuthTextField
              label="Email"
              placeholder="Ex: mariadasilva@gmail.com"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<EnvelopeIcon className="size-full" />}
            />
            <AuthTextField
              label="Senha"
              placeholder="digite sua senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<LockIcon className="size-full" />}
              rightIcon={showPassword ? <EyeIcon className="size-full" /> : <EyeSlashIcon className="size-full" />}
              onRightIconClick={() => setShowPassword((v) => !v)}
            />
          </div>

          <div className="flex w-full items-center justify-between">
            <label className="flex items-center gap-2 font-body text-[14px] tracking-[0.7px] text-gray-800">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="size-4 accent-main-red-600"
              />
              Lembrar deste dispositivo
            </label>
            <a href="/admin/esqueci-senha" className="font-body text-[14px] tracking-[0.7px] text-main-red-700">
              Esqueceu sua senha ?
            </a>
          </div>

          {unauthorized && (
            <p className="w-full text-center font-body text-[13px] text-error-700">
              Essa conta não tem acesso ao painel administrativo.
            </p>
          )}
          {error && <p className="w-full text-center font-body text-[13px] text-main-red-800">{error}</p>}

          <AuthPrimaryButton loading={loading}>Entrar</AuthPrimaryButton>
        </form>
      </div>
    </div>
  );
}
