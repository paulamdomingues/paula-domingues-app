import { useEffect, useMemo, useState } from 'react';
import { PiPlus } from 'react-icons/pi';
import { BellIcon, EyeIcon, MagnifyingGlassIcon } from '../../components/icons';
import UsuarioModal, { type AllowedUserRow } from '../../components/admin/UsuarioModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

type PlanFilter = 'todos' | 'trimestral' | 'anual';

const PAGE_SIZE = 10;

/**
 * Usuários (Figma: `Usuários` node 627:10101). A tabela lê direto de
 * `public.allowed_users` — não dá pra usar `auth.users` porque o client do
 * browser não enxerga esse schema via PostgREST. A migration 0005 já deixa
 * `allowed_users` pronta pra receber nome/whatsapp/plano/dados da Hubla
 * assim que o Make disparar o webhook de compra; até lá esses campos ficam
 * null e aparecem como "—" na tabela.
 *
 * Paginação: o Figma desenha um paginador numerado completo — simplifiquei
 * pra um prev/next de 10 em 10 (mesmo padrão de simplificação já usado em
 * outras telas desse painel), suficiente pro volume atual de usuários.
 */
export default function AdminUsuarios() {
  const { accessLevel } = useAuth();
  const canManage = accessLevel === 'master_admin' || accessLevel === 'suporte';

  const [rows, setRows] = useState<AllowedUserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('todos');
  const [page, setPage] = useState(0);
  const [modalUser, setModalUser] = useState<AllowedUserRow | null | undefined>(undefined);

  useEffect(() => {
    fetchUsers();
  }, []);

  function fetchUsers() {
    supabase
      .from('allowed_users')
      .select(
        'id, email, full_name, whatsapp, plan, is_active, purchased_at, hubla_transaction_id, hubla_payment_method, hubla_amount_cents'
      )
      .order('purchased_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError('Não foi possível carregar os usuários.');
          return;
        }
        setRows(data ?? []);
      });
  }

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        String(row.id).includes(term) ||
        row.email.toLowerCase().includes(term) ||
        (row.full_name ?? '').toLowerCase().includes(term) ||
        (row.whatsapp ?? '').toLowerCase().includes(term);
      const matchesPlan = planFilter === 'todos' || row.plan === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [rows, search, planFilter]);

  useEffect(() => {
    setPage(0);
  }, [search, planFilter]);

  const totalCount = rows?.length ?? 0;
  const trimestralCount = rows?.filter((r) => r.plan === 'trimestral').length ?? 0;
  const anualCount = rows?.filter((r) => r.plan === 'anual').length ?? 0;

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-[32px] font-bold tracking-[0.96px] text-main-dark-900">Usuários</h1>
        <div className="flex items-center gap-4">
          <BellIcon className="size-6 text-gray-400" />
          <button
            type="button"
            disabled={!canManage}
            title={canManage ? undefined : 'Sua conta não tem permissão para cadastrar usuários.'}
            onClick={() => setModalUser(null)}
            className="flex items-center gap-2 rounded-lg bg-main-red-600 px-4 py-2 font-body text-[15px] font-bold tracking-[0.75px] text-base-white disabled:opacity-60"
          >
            <PiPlus className="size-4" />
            Cadastrar Usuário
          </button>
        </div>
      </div>

      <div className="grid w-full grid-cols-3 gap-4">
        <SummaryCard label="Total de Usuários" value={totalCount} />
        <SummaryCard label="Plano Trimestral" value={trimestralCount} />
        <SummaryCard label="Plano Anual" value={anualCount} />
      </div>

      <div className="flex w-full items-center gap-4">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-base-white px-3">
          <MagnifyingGlassIcon className="size-4 shrink-0 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, ID, email ou WhatsApp"
            className="w-full border-0 bg-transparent font-body text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
          className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-base-white px-3 font-body text-[14px] text-gray-800"
        >
          <option value="todos">Todos os planos</option>
          <option value="trimestral">Plano Trimestral</option>
          <option value="anual">Plano Anual</option>
        </select>
      </div>

      {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

      {rows === null ? (
        <p className="font-body text-[14px] text-gray-600">Carregando usuários...</p>
      ) : (
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left font-body text-[13px] tracking-[0.65px] text-gray-500">
              <th className="px-3 font-normal">ID Usuário</th>
              <th className="px-3 font-normal">Nome</th>
              <th className="px-3 font-normal">Email</th>
              <th className="px-3 font-normal">WhatsApp</th>
              <th className="px-3 font-normal">Plano</th>
              <th className="px-3 font-normal">Membro desde</th>
              <th className="px-3 font-normal text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => (
              <tr key={row.id} className="bg-base-white font-body text-[14px] text-gray-900">
                <td className="rounded-l-lg px-3 py-3">#{row.id}</td>
                <td className="px-3 py-3">{row.full_name ?? '—'}</td>
                <td className="px-3 py-3">{row.email}</td>
                <td className="px-3 py-3">{row.whatsapp ?? '—'}</td>
                <td className="px-3 py-3">{row.plan === 'trimestral' ? 'Trimestral' : row.plan === 'anual' ? 'Anual' : '—'}</td>
                <td className="px-3 py-3">
                  {new Date(row.purchased_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="rounded-r-lg px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setModalUser(row)}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50"
                    aria-label={`Ver ${row.full_name ?? row.email}`}
                  >
                    <EyeIcon className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rows !== null && filteredRows.length === 0 && (
        <p className="font-body text-[14px] text-gray-600">Nenhum usuário encontrado.</p>
      )}

      {rows !== null && filteredRows.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 font-body text-[13px] text-gray-700 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="font-body text-[13px] text-gray-500">
            Página {page + 1} de {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 font-body text-[13px] text-gray-700 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}

      {modalUser !== undefined && (
        <UsuarioModal
          user={modalUser}
          canManage={canManage}
          onCancel={() => setModalUser(undefined)}
          onSaved={() => {
            setModalUser(undefined);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-base-white px-5 py-4">
      <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">{label}</p>
      <p className="font-display text-[32px] font-bold tracking-[0.96px] text-main-dark-900">{value}</p>
    </div>
  );
}
