import { useState } from 'react';
import { XCircleIcon } from '../icons';
import { supabase } from '../../lib/supabaseClient';
import type { AccessLevel } from '../../context/AuthContext';

interface NovoMembroModalProps {
  onCancel: () => void;
  onSaved: () => void;
}

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  master_admin: 'Master/Admin',
  suporte: 'Suporte',
  editor_conteudo: 'Editor Conteúdo',
  convidado: 'Convidado',
};

/**
 * "Adicionar Membro" (Figma: `modal - novo membro equipe`, node 627:10523).
 * Não cria a conta direto por aqui — chama a Edge Function
 * `invite-team-member`, que convida por email via Supabase Auth (a pessoa
 * define a própria senha pelo link recebido) e só então cria a linha em
 * `team_members`. Ninguém neste painel vê ou define a senha de outro
 * membro.
 */
export default function NovoMembroModal({ onCancel, onSaved }: NovoMembroModalProps) {
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!fullName.trim() || !email.trim() || !accessLevel) {
      setError('Preencha nome, email e nível de acesso.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke<{ success?: boolean; error?: string }>(
        'invite-team-member',
        {
          body: {
            fullName: fullName.trim(),
            whatsapp: whatsapp.trim() || null,
            email: email.trim(),
            accessLevel,
          },
        }
      );

      if (fnError || !data?.success) {
        setError(data?.error || fnError?.message || 'Não foi possível convidar esse membro. Tente novamente.');
        return;
      }

      onSaved();
    } catch {
      setError('Não foi possível convidar esse membro. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/40 px-6">
      <div className="flex w-full max-w-[407px] flex-col gap-11 rounded-2xl bg-base-white p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[20px] font-bold tracking-[0.6px] text-main-dark-900">Informações Básicas</h2>
            <button type="button" aria-label="Fechar" onClick={onCancel}>
              <XCircleIcon className="size-6 text-gray-400" />
            </button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">Nome</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome completo"
              className="flex h-[50px] w-full items-center rounded-lg border border-gray-200 px-4 font-body text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">WhatsApp</span>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="11966046494"
              className="flex h-[50px] w-full items-center rounded-lg border border-gray-200 px-4 font-body text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="email@exemplo.com"
              className="flex h-[50px] w-full items-center rounded-lg border border-gray-200 px-4 font-body text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-[13px] tracking-[0.65px] text-gray-500">Nível de Acesso</span>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
              className="flex h-[50px] w-full items-center rounded-lg border border-gray-200 px-4 font-body text-[14px] text-gray-900 focus:outline-none"
            >
              <option value="">Escolha aqui</option>
              {(Object.keys(ACCESS_LEVEL_LABELS) as AccessLevel[]).map((level) => (
                <option key={level} value={level}>
                  {ACCESS_LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
          </label>

          <p className="font-body text-[12px] tracking-[0.6px] text-gray-400">
            Vamos enviar um email de convite — a pessoa define a própria senha por lá.
          </p>

          {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}
        </div>

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
            disabled={saving}
            onClick={handleSave}
            className="flex h-[50px] flex-1 items-center justify-center rounded-lg bg-main-red-600 font-body text-[15px] font-bold tracking-[0.75px] text-base-white transition-opacity disabled:opacity-60"
          >
            {saving ? 'Enviando convite...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
