import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon } from '../../components/icons';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthPrimaryButton from '../../components/auth/AuthPrimaryButton';
import { useAuth } from '../../context/AuthContext';

/**
 * "Esqueci minha senha" do painel admin (21/08/2026) — até aqui essa rota
 * era só um placeholder `<ComingSoon>`. Mesmo estilo de card centralizado
 * do `AdminLogin.tsx` (sem o painel de imagem do fluxo cliente, que não
 * faz sentido aqui). Usa a MESMA função `requestPasswordReset` do app
 * cliente (`ForgotPassword.tsx`) — só passa `fromAdmin=true` pra marcar o
 * link do email com `?admin=1`, assim `RedefinirSenha.tsx` sabe mandar a
 * pessoa de volta pro `/admin/login` depois de trocar a senha (em vez do
 * `/login` do app cliente).
 */
export default function AdminForgotPassword() {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: resetError } = await requestPasswordReset(email, true);
    setLoading(false);

    if (resetError) {
      setError('Não foi possível enviar o e-mail. Confira o endereço digitado.');
      return;
    }
    setSent(true);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-main-dark-50 px-6 py-10">
      <div className="flex w-full max-w-[480px] flex-col gap-8">
        <div className="flex w-full flex-col items-center gap-1">
          <p className="font-display text-[18px] font-bold tracking-[0.9px] text-gray-500">
            PAINEL ADMINISTRATIVO
          </p>
          <h1 className="font-display text-[40px] font-extrabold tracking-[1.2px] text-main-red-800">
            Esqueci a senha
          </h1>
          <p className="text-center font-body text-[16px] tracking-[0.8px] text-gray-500">
            {sent
              ? 'Confira sua caixa de entrada (e a pasta de spam).'
              : 'Digite o e-mail cadastrado da sua conta de equipe pra receber o link de redefinição.'}
          </p>
        </div>

        {sent ? (
          <div className="flex w-full flex-col gap-6">
            <p className="w-full text-center font-body text-[14px] tracking-[0.7px] text-gray-700">
              Enviamos um link pra <strong>{email}</strong>. Clique nele pra criar uma senha nova.
            </p>
            <button
              type="button"
              onClick={async () => {
                await requestPasswordReset(email, true);
                setResent(true);
              }}
              className="w-full text-center font-body text-[13px] tracking-[0.65px] text-main-red-700"
            >
              {resent ? 'E-mail reenviado!' : 'Não recebeu? Reenviar e-mail'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
            <AuthTextField
              label="Email"
              placeholder="Ex: mariadasilva@gmail.com"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              icon={<EnvelopeIcon className="size-full" />}
            />

            {error && <p className="w-full text-center font-body text-[13px] text-main-red-800">{error}</p>}

            <AuthPrimaryButton loading={loading}>Receber Link</AuthPrimaryButton>
          </form>
        )}

        <Link
          to="/admin/login"
          className="w-full text-center font-body text-[14px] tracking-[0.7px] text-main-red-700"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
