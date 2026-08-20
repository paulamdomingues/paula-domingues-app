import { useEffect, useRef, useState } from 'react';
import { PiDotsThreeVerticalBold, PiPlus } from 'react-icons/pi';
import { BellIcon } from '../../components/icons';
import NovoMembroModal from '../../components/admin/NovoMembroModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { useAuth, type AccessLevel } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface TeamMemberRow {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  whatsapp: string | null;
  access_level: AccessLevel;
}

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  master_admin: 'Master/Admin',
  suporte: 'Suporte',
  editor_conteudo: 'Editor Conteúdo',
  convidado: 'Convidado',
};

/**
 * Configurações (Figma: `Configuraçoes` node 627:10103) — Meu Perfil,
 * Alterar Senha e Equipe, tudo numa página só (mesma divisão do Figma).
 *
 * O Figma mostra "PAULA DOMINGUES" repetido em toda linha da tabela de
 * Equipe — placeholder reaproveitado do mesmo jeito que já pegamos em
 * outras telas (ver `sure-logout`); aqui cada linha usa o `full_name` real
 * de cada membro.
 *
 * "Adicionar Membro" não cria a conta direto — chama a Edge Function
 * `invite-team-member`, que convida por email via Supabase Auth (a pessoa
 * escolhe a própria senha pelo link do email). Coerente com o mesmo
 * cuidado de segurança já aplicado à Bunny.net: nenhuma credencial de
 * outra pessoa passa por aqui.
 */
export default function AdminConfiguracoes() {
  const { session, accessLevel, updatePassword } = useAuth();
  const canManageTeam = accessLevel === 'master_admin';
  const myUserId = session?.user.id;

  // --- Meu Perfil ---------------------------------------------------------
  const [myRow, setMyRow] = useState<TeamMemberRow | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!myUserId) return;
    supabase
      .from('team_members')
      .select('id, user_id, full_name, email, whatsapp, access_level')
      .eq('user_id', myUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setMyRow(data);
        setName(data.full_name ?? '');
        setWhatsapp(data.whatsapp ?? '');
      });
  }, [myUserId]);

  async function handleSaveProfile() {
    if (!myUserId) return;
    setProfileError(null);
    setProfileSaving(true);
    const { error } = await supabase
      .from('team_members')
      .update({ full_name: name.trim() || null, whatsapp: whatsapp.trim() || null })
      .eq('user_id', myUserId);
    setProfileSaving(false);
    if (error) {
      setProfileError('Não foi possível salvar as alterações.');
      return;
    }
    setMyRow((prev) => (prev ? { ...prev, full_name: name.trim() || null, whatsapp: whatsapp.trim() || null } : prev));
    setEditingProfile(false);
  }

  // --- Alterar Senha -------------------------------------------------------
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleSavePassword() {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação não confere com a nova senha.');
      return;
    }
    setPasswordSaving(true);
    const { error } = await updatePassword(currentPassword, newPassword);
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error === 'Senha atual incorreta.' ? error : 'Não foi possível salvar a nova senha.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setEditingPassword(false);
  }

  // --- Equipe ---------------------------------------------------------------
  const [members, setMembers] = useState<TeamMemberRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNovoMembro, setShowNovoMembro] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMemberRow | null>(null);
  const [removing, setRemoving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  function fetchMembers() {
    supabase
      .from('team_members')
      .select('id, user_id, full_name, email, whatsapp, access_level')
      .order('created_at', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError('Não foi possível carregar a equipe.');
          return;
        }
        setMembers(data ?? []);
      });
  }

  async function handleRoleChange(row: TeamMemberRow, nextLevel: AccessLevel) {
    setRoleSavingId(row.id);
    const { error: updateError } = await supabase
      .from('team_members')
      .update({ access_level: nextLevel })
      .eq('id', row.id);
    setRoleSavingId(null);
    if (updateError) {
      setError('Não foi possível atualizar a função desse membro.');
      return;
    }
    setMembers((prev) => prev?.map((m) => (m.id === row.id ? { ...m, access_level: nextLevel } : m)) ?? prev);
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    const { error: deleteError } = await supabase.from('team_members').delete().eq('id', removeTarget.id);
    setRemoving(false);
    if (deleteError) {
      setError('Não foi possível remover esse membro.');
      setRemoveTarget(null);
      return;
    }
    setRemoveTarget(null);
    fetchMembers();
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-[32px] font-bold tracking-[0.96px] text-main-dark-900">Configurações</h1>
        <BellIcon className="size-6 text-gray-400" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[48px] font-extrabold tracking-[1.44px] text-main-dark-900">Meu Perfil</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-[18px] font-bold tracking-[0.54px] text-main-dark-900">Informações Básicas</p>
              <button
                type="button"
                onClick={editingProfile ? handleSaveProfile : () => setEditingProfile(true)}
                disabled={profileSaving}
                className="font-body text-[13px] font-bold tracking-[0.65px] text-main-red-700 disabled:opacity-60"
              >
                {editingProfile ? (profileSaving ? 'Salvando...' : 'Salvar') : 'Editar'}
              </button>
            </div>

            {editingProfile ? (
              <div className="flex flex-col gap-4">
                <Field label="Nome" value={name} onChange={setName} />
                <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <ReadField label="Nome" value={myRow?.full_name || '—'} />
                <ReadField label="WhatsApp" value={myRow?.whatsapp || '—'} />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">Email</p>
              <p className="font-body text-[14px] text-gray-900">{myRow?.email ?? session?.user.email ?? '—'}</p>
              <p className="font-body text-[12px] text-gray-400">
                Email de login — pra trocar, fale com um master_admin.
              </p>
            </div>

            {profileError && <p className="font-body text-[13px] text-main-red-800">{profileError}</p>}
          </div>

          <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-[18px] font-bold tracking-[0.54px] text-main-dark-900">Alterar Senha</p>
              <button
                type="button"
                onClick={editingPassword ? handleSavePassword : () => setEditingPassword(true)}
                disabled={passwordSaving}
                className="font-body text-[13px] font-bold tracking-[0.65px] text-main-red-700 disabled:opacity-60"
              >
                {editingPassword ? (passwordSaving ? 'Salvando...' : 'Salvar') : 'Editar'}
              </button>
            </div>

            {editingPassword ? (
              <div className="flex flex-col gap-4">
                <Field label="Senha Atual" value={currentPassword} onChange={setCurrentPassword} type="password" />
                <Field label="Nova senha" value={newPassword} onChange={setNewPassword} type="password" />
                <Field label="Confirme a nova senha" value={confirmPassword} onChange={setConfirmPassword} type="password" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <ReadField label="Senha Atual" value="insira sua senha" />
                <ReadField label="Nova senha" value="****************" />
                <ReadField label="Confirme a nova senha" value="*******************" />
              </div>
            )}

            {passwordError && <p className="font-body text-[13px] text-main-red-800">{passwordError}</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[48px] font-extrabold tracking-[1.44px] text-main-dark-900">Equipe</h2>
          {canManageTeam && (
            <button
              type="button"
              onClick={() => setShowNovoMembro(true)}
              className="flex items-center gap-2 rounded-lg bg-main-red-600 px-4 py-2 font-body text-[15px] font-bold tracking-[0.75px] text-base-white"
            >
              <PiPlus className="size-4" />
              Adicionar Membro
            </button>
          )}
        </div>

        {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

        {members === null ? (
          <p className="font-body text-[14px] text-gray-600">Carregando equipe...</p>
        ) : (
          <table className="w-full border-separate border-spacing-y-0">
            <thead>
              <tr className="bg-main-red-50 text-left font-body text-[13px] font-bold tracking-[0.65px] text-gray-600">
                <th className="px-4 py-2 font-bold">Nome</th>
                <th className="px-4 py-2 font-bold">Email</th>
                <th className="px-4 py-2 font-bold">WhatsApp</th>
                <th className="px-4 py-2 font-bold">Função</th>
                {canManageTeam && <th className="px-4 py-2 font-bold text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isSelf = member.user_id === myUserId;
                return (
                  <tr key={member.id} className="border-b border-gray-100 font-body text-[14px] text-gray-900">
                    <td className="px-4 py-3 font-display text-[16px] font-bold tracking-[0.48px]">
                      {(member.full_name || member.email).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{member.email}</td>
                    <td className="px-4 py-3 text-gray-600">{member.whatsapp || '—'}</td>
                    <td className="px-4 py-3">
                      {canManageTeam ? (
                        <select
                          value={member.access_level}
                          disabled={isSelf || roleSavingId === member.id}
                          title={isSelf ? 'Você não pode alterar sua própria função por aqui.' : undefined}
                          onChange={(e) => handleRoleChange(member, e.target.value as AccessLevel)}
                          className="h-10 rounded-lg border border-gray-300 bg-base-white px-3 font-body text-[14px] text-gray-800 disabled:opacity-60"
                        >
                          {(Object.keys(ACCESS_LEVEL_LABELS) as AccessLevel[]).map((level) => (
                            <option key={level} value={level}>
                              {ACCESS_LEVEL_LABELS[level]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        ACCESS_LEVEL_LABELS[member.access_level]
                      )}
                    </td>
                    {canManageTeam && (
                      <td className="relative px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((prev) => (prev === member.id ? null : member.id))}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50"
                          aria-label="Mais ações"
                        >
                          <PiDotsThreeVerticalBold className="size-4" />
                        </button>
                        {openMenuId === member.id && (
                          <MemberMenu
                            disabled={isSelf}
                            disabledReason="Você não pode remover a si mesmo."
                            onClose={() => setOpenMenuId(null)}
                            onRemove={() => {
                              setOpenMenuId(null);
                              setRemoveTarget(member);
                            }}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {members !== null && members.length === 0 && (
          <p className="font-body text-[14px] text-gray-600">Nenhum membro cadastrado.</p>
        )}
      </div>

      {showNovoMembro && (
        <NovoMembroModal
          onCancel={() => setShowNovoMembro(false)}
          onSaved={() => {
            setShowNovoMembro(false);
            fetchMembers();
          }}
        />
      )}

      {removeTarget && (
        <DeleteConfirmModal
          title="Remover da equipe?"
          description={`${removeTarget.full_name || removeTarget.email} perde o acesso ao painel admin. A conta de login não é apagada.`}
          confirmLabel="Sim, remover"
          loading={removing}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={handleRemove}
        />
      )}
    </div>
  );
}

function MemberMenu({
  disabled,
  disabledReason,
  onClose,
  onRemove,
}: {
  disabled: boolean;
  disabledReason: string;
  onClose: () => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-4 top-10 z-10 w-48 rounded-lg border border-gray-100 bg-base-white py-1 shadow-lg">
      <button
        type="button"
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        onClick={onRemove}
        className="w-full px-4 py-2 text-left font-body text-[14px] text-error-700 hover:bg-gray-50 disabled:opacity-40"
      >
        Remover da equipe
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">{label}</span>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-[50px] w-full items-center rounded-lg border border-gray-200 px-4 font-body text-[14px] text-gray-900 focus:outline-none"
      />
    </label>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">{label}</p>
      <p className="font-body text-[14px] text-gray-900">{value}</p>
    </div>
  );
}
