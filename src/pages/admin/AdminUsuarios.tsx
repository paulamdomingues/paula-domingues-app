import { useEffect, useMemo, useState } from 'react';
import { PiPlus } from 'react-icons/pi';
import { BellIcon, EyeIcon, MagnifyingGlassIcon } from '../../components/icons';
import UsuarioModal, { type AllowedUserRow } from '../../components/admin/UsuarioModal';
import AdminSelect from '../../components/admin/AdminSelect';
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
 *
 * 21/08/2026: layout mobile adicionado (Figma node 666:13915) — tabela vira
 * lista de cards empilhados abaixo de `lg`, mesmo padrão do `AdminLojas.tsx`.
 */
export default function AdminUsuarios() {
  const { accessLevel } = useAuth();
  // 21/08/2026 (valores do banco renomeados de verdade, ver `AccessLevel`
  // em AuthContext.tsx): `suporte` passou a acessar essa aba, mas só pra
  // VISUALIZAR — de propósito não entra aqui, então "Cadastrar Usuário" e a
  // edição dentro do modal continuam travados só pra `master_admin`/`editor`.
  const canManage = accessLevel === 'master_admin' || accessLevel === 'editor';

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
        'id, short_id, email, full_name, whatsapp, plan, is_active, purchased_at, hubla_transaction_id, hubla_payment_method, hubla_amount_cents'
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
        row.short_id.includes(term) ||
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
    <div className="flex w-full flex-col gap-4 lg:gap-6">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-[26px] font-bold tracking-[0.78px] text-main-dark-900 lg:text-[32px] lg:tracking-[0.96px]">
          Usuários
        </h1>
        <div className="hidden items-center gap-4 lg:flex">
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
        <BellIcon className="size-6 shrink-0 text-gray-400 lg:hidden" />
      </div>

      {/* Mobile: botão "Cadastrar Usuário" em largura cheia, abaixo do título. */}
      <button
        type="button"
        disabled={!canManage}
        title={canManage ? undefined : 'Sua conta não tem permissão para cadastrar usuários.'}
        onClick={() => setModalUser(null)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-main-red-600 px-4 py-2 font-body text-[15px] font-bold tracking-[0.75px] text-base-white disabled:opacity-60 lg:hidden"
      >
        <PiPlus className="size-4" />
        Cadastrar Usuário
      </button>

      <div className="mx-auto grid w-full max-w-[640px] grid-cols-3 gap-3 lg:gap-4">
        <SummaryCard label="Total" value={totalCount} />
        <SummaryCard label="Trimestral" value={trimestralCount} />
        <SummaryCard label="Anual" value={anualCount} />
      </div>

      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-base-white px-3 lg:flex-1">
          <MagnifyingGlassIcon className="size-4 shrink-0 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, ID, email ou WhatsApp"
            className="w-full border-0 bg-transparent font-body text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none"
          />
        </div>
        <div className="lg:w-[200px]">
          <AdminSelect
            value={planFilter}
            onChange={(v) => setPlanFilter(v as PlanFilter)}
            options={[
              { value: 'todos', label: 'Planos' },
              { value: 'trimestral', label: 'Trimestral' },
              { value: 'anual', label: 'Anual' },
            ]}
          />
        </div>
      </div>

      {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

      {rows === null ? (
        <p className="font-body text-[14px] text-gray-600">Carregando usuários...</p>
      ) : (
        <>
          {/* Desktop: tabela. */}
          <table className="hidden w-full border-separate border-spacing-y-2 lg:table">
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
                  <td className="rounded-l-lg px-3 py-3">#{row.short_id}</td>
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

          {/* Mobile: lista de cards empilhados (node 666:14241
              "DASHBOARD-FICHA-RESUMIDA-MOBILE" reaproveitado pra usuário). */}
          <div className="flex w-full flex-col lg:hidden">
            {pagedRows.map((row) => (
              <div key={row.id} className="flex items-center gap-2 border-b border-gray-200 py-2">
                <div className="flex flex-1 flex-col items-start gap-2">
                  <p className="w-full truncate font-display text-[22px] font-bold tracking-[0.66px] text-main-dark-900">
                    {row.full_name ?? '—'}
                  </p>
                  <p className="w-full truncate font-body text-[14px] tracking-[0.7px] text-gray-700">{row.email}</p>
                  <div className="flex w-full items-center gap-2">
                    <p className="shrink-0 font-display text-[18px] font-semibold tracking-[0.54px] text-base-black">
                      #{row.short_id}
                    </p>
                    <span className="flex shrink-0 items-center justify-center rounded-lg bg-main-dark-800 px-2 py-1 font-body text-[14px] font-bold tracking-[0.65px] text-main-red-50">
                      {row.plan === 'trimestral' ? 'Trimestral' : row.plan === 'anual' ? 'Anual' : '—'}
                    </span>
                    <p className="truncate font-body text-[14px] text-gray-500">
                      {new Date(row.purchased_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalUser(row)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-600"
                  aria-label={`Ver ${row.full_name ?? row.email}`}
                >
                  <EyeIcon className="size-5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {rows !== null && filteredRows.length === 0 && (
        <p className="font-body text-[14px] text-gray-600">Nenhum usuário encontrado.</p>
      )}

      {rows !== null && filteredRows.length > 0 && (
        // 24/08/2026, pedido da Amanda: bloco "Anterior + número + Próxima"
        // centralizado (era `justify-end`, ficava colado na ponta direita).
        <div className="flex items-center justify-center gap-3">
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
    <div className="flex flex-col items-center gap-1 rounded-lg border border-gray-50 bg-base-white px-3 py-4 text-center shadow-sm lg:items-start lg:px-5 lg:text-left">
      <p className="font-body text-[13px] tracking-[0.65px] text-gray-500">{label}</p>
      <p className="font-display text-[24px] font-bold tracking-[0.72px] text-main-dark-900 lg:text-[32px] lg:tracking-[0.96px]">
        {value}
      </p>
    </div>
  );
}
