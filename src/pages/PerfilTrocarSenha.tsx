import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiArrowLeft, PiLockSimple } from 'react-icons/pi';
import TopBar from '../components/TopBar';
import AuthTextField from '../components/auth/AuthTextField';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import { useAuth } from '../context/AuthContext';

export default function PerfilTrocarSenha() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(currentPassword, newPassword);
    setLoading(false);

    if (updateError) {
      setError(updateError === 'Senha atual incorreta.' ? updateError : 'Não foi possível salvar a nova senha. Tente novamente.');
      return;
    }

    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 px-6 py-8 lg:px-[156px] lg:py-10">
      <TopBar />

      <div className="flex w-full flex-col gap-6 lg:mx-auto lg:max-w-[548px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-body text-[16px] tracking-[0.8px] text-main-red-800"
        >
          <PiArrowLeft className="size-4" />
          Voltar
        </button>

        <div className="flex w-full flex-col gap-1">
          <h1 className="w-full font-display font-bold capitalize text-[32px] tracking-[1.6px] text-[#1a1a1a]">
            Alterar senha
          </h1>
          <p className="w-full font-body text-[16px] tracking-[0.8px] text-grey-800">
            Escolha uma nova senha para acessar sua conta no app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-[44px]">
          <div className="flex w-full flex-col gap-4">
            <AuthTextField
              label="Senha Atual"
              placeholder="digite sua senha atual"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              icon={<PiLockSimple className="size-full" />}
            />
            <AuthTextField
              label="Nova Senha"
              placeholder="digite uma nova senha"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<PiLockSimple className="size-full" />}
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
              icon={<PiLockSimple className="size-full" />}
            />
          </div>

          {error && <p className="w-full text-center font-body text-[13px] text-main-red-800">{error}</p>}
          {success && (
            <p className="w-full text-center font-body text-[13px] text-success-800">Senha alterada com sucesso!</p>
          )}

          <AuthPrimaryButton loading={loading}>Salvar Nova Senha</AuthPrimaryButton>
        </form>
      </div>
    </div>
  );
}
