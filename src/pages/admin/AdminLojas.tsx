import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PiPlus } from 'react-icons/pi';
import { FunnelIcon, MagnifyingGlassIcon, PencilIcon } from '../../components/icons';
import { supabase } from '../../lib/supabaseClient';

interface StoreRow {
  id: number;
  name: string;
  code_badge: string | null;
  is_active: boolean;
  category_name: string | null;
}

type StatusFilter = 'todos' | 'ativos' | 'inativos';

/**
 * Listagem de Lojas (node 627:9880) — primeira tela do painel admin com
 * dado real do Supabase (as outras rotas de `/admin/*` ainda são
 * placeholders "Em breve"). O toggle de status já grava de verdade
 * (`is_active` em `stores`), porque é uma ação simples e a política de RLS
 * `stores_update_team` já libera isso pra `master_admin`/`editor_conteudo`.
 *
 * "+ Adicionar nova" e o lápis de editar ainda levam pra telas placeholder
 * — o formulário de cadastro (6 cards + upload de fachada/galeria via
 * Bunny/Supabase Storage) é o próximo passo, combinado com a Amanda.
 */
export default function AdminLojas() {
  const [rows, setRows] = useState<StoreRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('stores')
      .select('id, name, code_badge, is_active, categories(name)')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          setError('Não foi possível carregar as lojas.');
          return;
        }
        setRows(
          (data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            code_badge: row.code_badge,
            is_active: row.is_active,
            // O client do Supabase tipa relações 1:N como array por padrão;
            // aqui é sempre 0 ou 1 item (fk simples category_id → categories.id).
            category_name: Array.isArray(row.categories) ? (row.categories[0]?.name ?? null) : null,
          }))
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((row) => {
      const matchesSearch = row.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'ativos' && row.is_active) ||
        (statusFilter === 'inativos' && !row.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const totalCount = rows?.length ?? 0;
  const activeCount = rows?.filter((r) => r.is_active).length ?? 0;
  const inactiveCount = totalCount - activeCount;

  const handleToggleStatus = async (row: StoreRow) => {
    setTogglingId(row.id);
    const nextValue = !row.is_active;
    const { error: updateError } = await supabase
      .from('stores')
      .update({ is_active: nextValue })
      .eq('id', row.id);
    setTogglingId(null);

    if (updateError) {
      setError('Não foi possível atualizar o status dessa loja.');
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, is_active: nextValue } : r)) ?? prev);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-[32px] font-bold tracking-[0.96px] text-main-dark-900">Lojas</h1>
        <Link
          to="/admin/lojas/nova"
          className="flex items-center gap-2 rounded-lg bg-main-red-600 px-4 py-2 font-body text-[15px] font-bold tracking-[0.75px] text-base-white"
        >
          <PiPlus className="size-4" />
          Adicionar nova
        </Link>
      </div>

      <div className="grid w-full grid-cols-3 gap-4">
        <SummaryCard label="Total de lojas" value={totalCount} />
        <SummaryCard label="Ativas" value={activeCount} />
        <SummaryCard label="Inativas" value={inactiveCount} />
      </div>

      <div className="flex w-full items-center gap-4">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-base-white px-3">
          <MagnifyingGlassIcon className="size-4 shrink-0 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome"
            className="w-full border-0 bg-transparent font-body text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-base-white px-3 font-body text-[14px] text-gray-800"
        >
          <option value="todos">Todos os status</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>
        {/* O Filtrar do Figma (node 1160:10961) também tem um sub-menu de
            Categoria — deixei só o filtro de status por enquanto pra não
            atrasar essa entrega; entra junto com a tela de Categorias. */}
        <button
          type="button"
          disabled
          title="Filtro por categoria — em breve"
          className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-base-white px-3 font-body text-[14px] text-gray-400"
        >
          <FunnelIcon className="size-4" />
          Categoria
        </button>
      </div>

      {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

      {rows === null ? (
        <p className="font-body text-[14px] text-gray-600">Carregando lojas...</p>
      ) : (
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left font-body text-[13px] tracking-[0.65px] text-gray-500">
              <th className="px-3 font-normal">Código</th>
              <th className="px-3 font-normal">Nome</th>
              <th className="px-3 font-normal">Categoria</th>
              <th className="px-3 font-normal">Status</th>
              <th className="px-3 font-normal text-right">Editar</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="bg-base-white font-body text-[14px] text-gray-900">
                <td className="rounded-l-lg px-3 py-3">{row.code_badge ?? '—'}</td>
                <td className="px-3 py-3">{row.name}</td>
                <td className="px-3 py-3">{row.category_name ?? '—'}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    disabled={togglingId === row.id}
                    onClick={() => handleToggleStatus(row)}
                    className={`rounded-full px-3 py-1 text-[13px] font-bold tracking-[0.65px] transition-opacity disabled:opacity-50 ${
                      row.is_active ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {row.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="rounded-r-lg px-3 py-3 text-right">
                  <Link
                    to={`/admin/lojas/${row.id}`}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    <PencilIcon className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rows !== null && filteredRows.length === 0 && (
        <p className="font-body text-[14px] text-gray-600">Nenhuma loja encontrada.</p>
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
