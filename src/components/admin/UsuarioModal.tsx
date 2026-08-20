import { useState } from 'react';
import { XCircleIcon } from '../icons';
import { supabase } from '../../lib/supabaseClient';

export interface AllowedUserRow {
  id: number;
  email: string;
  full_name: string | null;
  whatsapp: string | null;
  plan: 'trimestral' | 'anual' | null;
  is_active: boolean;
  purchased_at: string;
  hubla_transaction_id: string | null;
  hubla_payment_method: string | null;
  hubla_amount_cents: number | null;
}

interface UsuarioModalProps {
  /** `null` = cadastro manual novo. Um objeto = ver/editar um usuário existente. */
  user: AllowedUserRow | null;
  canManage: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

function formatCentsToBRL(cents: number | null): string {
  if (cents === null) return '—';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Ver/editar usuário (Figma: `modal-usuario` node 627:10266) e cadastro
 * manual (`modal-usuario-Criado aqui` node 627:10327). "Informações Hubla"
 * é sempre somente leitura — não tem EDIT-TO-SAVE nela no Figma, e faz
 * sentido: esse dado vem de fora (Make/Hubla), o admin não deveria
 * reescrever manualmente. Pra um usuário cadastrado manualmente (sem
 * compra), essa seção nem aparece — mostrar 4 campos vazios seria
 * confuso.
 */
export default function UsuarioModal({ user, canManage, onCancel, onSaved }: UsuarioModalProps) {
  const isEdit = Boolean(user);
  const [editingBasico, setEditingBasico] = useState(!isEdit);
  const [name, setName] = useState(user?.full_name ?? '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [plan, setPlan] = useState<'trimestral' | 'anual' | ''>(user?.plan ?? '');
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasHublaData = Boolean(user?.hubla_transaction_id || user?.hubla_payment_method || user?.hubla_amount_cents);

  async function handleToggleStatus() {
    if (!user) return;
    const next = !isActive;
    setIsActive(next);
    const { error: updateError } = await supabase.from('allowed_users').update({ is_active: next }).eq('id', user.id);
    if (updateError) {
      setIsActive(!next);
      setError('Não foi possível atualizar o status.');
    }
  }

  async function handleSaveBasico() {
    if (!email.trim()) {
      setError('Informe o email.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        full_name: name.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim(),
        plan: plan || null,
      };

      if (isEdit) {
        const { error: updateError } = await supabase.from('allowed_users').update(payload).eq('id', user!.id);
        if (updateError) {
          setError('Não foi possível salvar as alterações.');
          return;
        }
        setEditingBasico(false);
        onSaved();
      } else {
        const { error: insertError } = await supabase
          .from('allowed_users')
          .insert({ ...payload, is_active: true, purchased_at: new Date().toISOString() });
        if (insertError) {
          setError('Não foi possível criar o usuário — confira se o email já não está cadastrado.');
          return;
        }
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/40 px-6">
      <div className="flex max-h-[90vh] w-full max-w-[455px] flex-col gap-6 overflow-y-auto rounded-2xl bg-base-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] font-bold tracking-[0.6px] text-main-dark-900">
            {isEdit ? 'Usuário' : 'Cadastrar Usuário'}
          </h2>
          <button type="button" aria-label="Fechar" onClick={onCancel}>
            <XCircleIcon className="size-6 text-gray-400" />
          </button>
        </div>

        {isEdit && (
          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-1">
              <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">iD do usuário</span>
              <span className="font-body text-[14px] text-gray-900">#{user!.id}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">Data do Cadastro</span>
              <span className="font-body text-[14px] text-gray-900">
                {new Date(user!.purchased_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={handleToggleStatus}
                className={`ml-auto rounded-full px-3 py-1 font-body text-[12px] font-bold tracking-[0.6px] ${
                  isActive ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isActive ? 'ativo' : 'inativo'}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-lg border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <p className="font-body text-[15px] font-bold tracking-[0.75px] text-main-dark-900">Informações Básicas</p>
            {isEdit && canManage && (
              <button
                type="button"
                onClick={editingBasico ? handleSaveBasico : () => setEditingBasico(true)}
                className="font-body text-[13px] font-bold tracking-[0.65px] text-main-red-700"
              >
                {editingBasico ? (saving ? 'Salvando...' : 'Salvar') : 'Editar'}
              </button>
            )}
          </div>

          {editingBasico ? (
            <div className="flex flex-col gap-4">
              <Field label="Nome" value={name} onChange={setName} disabled={!canManage} />
              <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} disabled={!canManage} />
              <Field label="Email" value={email} onChange={setEmail} disabled={!canManage} />
              <label className="flex flex-col gap-1.5">
                <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">Plano</span>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as 'trimestral' | 'anual' | '')}
                  disabled={!canManage}
                  className="flex h-[50px] w-full items-center rounded-lg border border-gray-200 px-4 font-body text-[14px] text-gray-900 disabled:opacity-60"
                >
                  <option value="">Escolha aqui</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="anual">Anual</option>
                </select>
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ReadField label="Nome" value={name || '—'} />
              <ReadField label="WhatsApp" value={whatsapp || '—'} />
              <ReadField label="Email" value={email} />
              <ReadField label="Plano" value={plan ? (plan === 'trimestral' ? 'Trimestral' : 'Anual') : '—'} />
            </div>
          )}
        </div>

        {isEdit && (
          <div className="flex flex-col gap-4 rounded-lg border border-gray-100 p-4">
            <p className="font-body text-[15px] font-bold tracking-[0.75px] text-main-dark-900">Informações Hubla</p>
            {hasHublaData ? (
              <div className="flex flex-col gap-4">
                <ReadField label="ID da Transação" value={user!.hubla_transaction_id || '—'} />
                <ReadField label="Plano Contratado" value={user!.plan === 'trimestral' ? 'Trimestral' : user!.plan === 'anual' ? 'Anual' : '—'} />
                <ReadField label="Forma de Pagamento" value={user!.hubla_payment_method || '—'} />
                <ReadField label="Valor da Compra" value={formatCentsToBRL(user!.hubla_amount_cents)} />
              </div>
            ) : (
              <p className="font-body text-[13px] text-gray-400">
                Cadastrado manualmente pelo painel — sem dados de compra da Hubla.
              </p>
            )}
          </div>
        )}

        {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

        {!isEdit && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-[50px] flex-1 items-center justify-center rounded-lg border-[1.5px] border-gray-200 font-body text-[15px] font-bold tracking-[0.75px] text-gray-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving || !canManage}
              onClick={handleSaveBasico}
              className="flex h-[50px] flex-1 items-center justify-center rounded-lg bg-main-red-600 font-body text-[15px] font-bold tracking-[0.75px] text-base-white transition-opacity disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex h-[50px] w-full items-center rounded-lg border border-gray-200 px-4 font-body text-[14px] text-gray-900 focus:outline-none disabled:opacity-60"
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
