import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LockIcon } from '../../components/icons';
import Logo from '../../components/Logo';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthPrimaryButton from '../../components/auth/AuthPrimaryButton';
import { useAuth } from '../../context/AuthContext';

/**
 * Tela de destino do link de "esqueci a senha" — tanto do app cliente
 * (`ForgotPassword.tsx`) quanto do painel admin (`AdminForgotPassword.tsx`),
 * já que os dois usam a MESMA base de autenticação do Supabase e só esse
 * `requestPasswordReset` muda o redirect (`?admin=1` quando veio do admin,
 * ver `AuthContext.tsx`). 21/08/2026: essa tela simplesmente NÃO EXISTIA
 * até aqui — o link enviado por email apontava pra essa rota, mas não
 * tinha nenhuma página registrada nela (nem no `App.tsx`), então clicar no
 * link não levava a lugar nenhum. Foi assim que a Paula ficou sem
 * conseguir recuperar o próprio acesso ao painel.
 *
 * Como funciona: ao abrir o link do email, o Supabase Auth já cria sozinho
 * uma sessão de recuperação temporária (não é a mesma coisa que "estar
 * logado" — só serve pra trocar a senha uma vez). Por isso não pedimos a
 * senha atual aqui (diferente de `PerfilTrocarSenha.tsx`) — quem clicou no
 * link já provou que é dono do email. Sem sessão nenhuma (link expirado,
 * já usado, ou a pessoa chegou aqui direto sem clicar em nada) mostramos
 * um aviso em vez do formulário.
 */
export default function RedefinirSenha() {
  const { session, loading, completePasswordReset, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('admin') === '1';
  const loginPath = isAdmin ? '/admin/login' : '/login';
  const forgotPasswordPath = isAdmin ? '/admin/esqueci-senha' : '/esqueci-senha';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }

    setSubmitting(true);
    const { error: resetError } = await completePasswordReset(newPassword);
    setSubmitting(false);

    if (resetError) {
      setError('Não foi possível salvar a nova senha. Tente pedir um novo link.');
      return;
    }

    // Encerra a sessão de recuperação de propósito — a pessoa entra de novo
    // com a senha nova, em vez de continuar "meio logada" por essa sessão
    // temporária (evita confusão sobre em qual conta/dispositivo ela está).
    await signOut();
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-main-dark-50 px-6 py-10 text-center">
        <Logo />
        <div className="flex w-full max-w-[420px] flex-col gap-2">
          <h1 className="font-display text-[26px] font-bold tracking-[0.78px] text-main-red-600">
            Senha atualizada!
          </h1>
          <p className="font-body text-[15px] tracking-[0.75px] text-gray-500">
            Sua senha foi trocada com sucesso. Entre novamente com a senha nova.
          </p>
        </div>
        <AuthPrimaryButton onClick={() => navigate(loginPath, { replace: true })}>Ir para o login</AuthPrimaryButton>
      </div>
    );
  }

  if (!loading && !session) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-main-dark-50 px-6 py-10 text-center">
        <Logo />
        <div className="flex w-full max-w-[420px] flex-col gap-2">
          <h1 className="font-display text-[26px] font-bold tracking-[0.78px] text-main-red-800">
            Link inválido ou expirado
          </h1>
          <p className="font-body text-[15px] tracking-[0.75px] text-gray-500">
            Esse link de redefinição de senha não é mais válido. Peça um novo pra continuar.
          </p>
        </div>
        <AuthPrimaryButton onClick={() => navigate(forgotPasswordPath)}>Pedir novo link</AuthPrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-main-dark-50 px-6 py-10">
      <div className="flex w-full max-w-[480px] flex-col gap-8">
        <div className="flex w-full flex-col items-center gap-1">
          <Logo />
          <h1 className="mt-4 font-display text-[32px] font-bold tracking-[0.96px] text-main-red-800">
            Nova senha
          </h1>
          <p className="text-center font-body text-[15px] tracking-[0.75px] text-gray-500">
            Escolha uma nova senha pra sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-col gap-4">
            <AuthTextField
              label="Nova Senha"
              placeholder="digite uma nova senha"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<LockIcon className="size-full" />}
            />
            <AuthTextField
              label="Confirme a nova senha"
              placeholder="digite a nova senha novamente"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<LockIcon className="size-full" />}
            />
          </div>

          {error && <p className="w-full text-center font-body text-[13px] text-main-red-800">{error}</p>}

          <AuthPrimaryButton loading={submitting}>Salvar Nova Senha</AuthPrimaryButton>
        </form>
      </div>
    </div>
  );
}
