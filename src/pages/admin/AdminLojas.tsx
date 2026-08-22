import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PiPlus } from 'react-icons/pi';
import { BellIcon, FunnelIcon, MagnifyingGlassIcon, PencilIcon } from '../../components/icons';
import { supabase } from '../../lib/supabaseClient';
import AdminSelect from '../../components/admin/AdminSelect';

interface StoreRow {
  id: number;
  name: string;
  code_badge: string | null;
  is_active: boolean;
  category_id: number | null;
  category_name: string | null;
}

interface CategoryOption {
  id: number;
  name: string;
}

type StatusFilter = 'todos' | 'ativos' | 'inativos';

/**
 * Listagem de Lojas (node 627:9880) — primeira tela do painel admin com
 * dado real do Supabase (as outras rotas de `/admin/*` ainda são
 * placeholders "Em breve"). O toggle de status já grava de verdade
 * (`is_active` em `stores`), porque é uma ação simples e a política de RLS
 * `stores_update_team` (via `can_manage_catalog`) já libera isso pra
 * `master_admin`/`editor`/`suporte`.
 *
 * "+ Adicionar nova" e o lápis de editar ainda levam pra telas placeholder
 * — o formulário de cadastro (6 cards + upload de fachada/galeria via
 * Bunny/Supabase Storage) é o próximo passo, combinado com a Amanda.
 *
 * 21/08/2026: layout mobile adicionado (Figma node 666:11707) — tabela vira
 * uma lista de cards empilhados abaixo de `lg` (mesmo padrão de card usado
 * no "Top 5 Lojas"/"Últimos Usuários" do Resumo). O "Filtrar" do Figma
 * mobile (um sheet à parte) virou só o mesmo `<select>` de status em largura
 * cheia — mesma função, sem inventar um componente de sheet novo pra isso
 * só no mobile.
 */
export default function AdminLojas() {
  const [rows, setRows] = useState<StoreRow[] | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [categoryFilter, setCategoryFilter] = useState<number | 'todos'>('todos');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('stores')
      .select('id, name, code_badge, is_active, category_id, categories(name)')
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
            category_id: row.category_id,
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

  // 22/08/2026, a pedido da Amanda: filtro de Categoria (o "Filtrar" do
  // Figma tinha um sub-menu de Categoria que ficou pra depois — entra agora
  // junto, como um segundo `<select>` ao lado do de Status, mesmo padrão
  // (sem inventar um componente de sheet novo só pra essa tela).
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (cancelled || fetchError || !data) return;
        setCategories(data);
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
      const matchesCategory = categoryFilter === 'todos' || row.category_id === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [rows, search, statusFilter, categoryFilter]);

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
    <div className="flex w-full flex-col gap-4 lg:gap-6">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-[26px] font-bold tracking-[0.78px] text-main-dark-900 lg:text-[32px] lg:tracking-[0.96px]">
          Lojas
        </h1>
        {/* Desktop: botão "Adicionar nova" fica na mesma linha do título. */}
        <Link
          to="/admin/lojas/nova"
          className="hidden items-center gap-2 rounded-lg bg-main-red-600 px-4 py-2 font-body text-[15px] font-bold tracking-[0.75px] text-base-white lg:flex"
        >
          <PiPlus className="size-4" />
          Adicionar nova
        </Link>
        <BellIcon className="size-6 shrink-0 text-gray-400 lg:hidden" />
      </div>

      {/* Mobile: botão "Adicionar nova" em largura cheia, abaixo do título
          (node 666:11812). */}
      <Link
        to="/admin/lojas/nova"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-main-red-600 px-4 py-2 font-body text-[15px] font-bold tracking-[0.75px] text-base-white lg:hidden"
      >
        <PiPlus className="size-4" />
        Adicionar nova
      </Link>

      <div className="grid w-full grid-cols-3 gap-3 lg:gap-4">
        <SummaryCard label="Total" value={totalCount} />
        <SummaryCard label="Ativas" value={activeCount} />
        <SummaryCard label="Inativas" value={inactiveCount} />
      </div>

      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-base-white px-3 lg:flex-1">
          <MagnifyingGlassIcon className="size-4 shrink-0 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou Id da loja..."
            className="w-full border-0 bg-transparent font-body text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none"
          />
        </div>
        {/* Mobile: o "Filtrar" do Figma (um sheet à parte) vira só esse
            mesmo `<select>` de status em largura cheia — mesma função sem
            precisar de um componente de sheet novo só pra essa tela. */}
        <div className="flex w-full items-center gap-3 lg:w-auto">
          <div className="flex-1 lg:w-[160px] lg:flex-none">
            <AdminSelect
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
              options={[
                { value: 'todos', label: 'Status' },
                { value: 'ativos', label: 'Ativos' },
                { value: 'inativos', label: 'Inativos' },
              ]}
            />
          </div>
          {/* Filtro de Categoria (22/08/2026) — o "Filtrar" do Figma (node
              1160:10961) tinha um sub-menu de Categoria que ficou pra depois
              da primeira entrega. */}
          <div className="flex-1 lg:w-[200px] lg:flex-none">
            <AdminSelect
              value={String(categoryFilter)}
              onChange={(v) => setCategoryFilter(v === 'todos' ? 'todos' : Number(v))}
              icon={<FunnelIcon className="size-4 shrink-0 text-gray-500" />}
              options={[
                { value: 'todos', label: 'Categorias' },
                ...categories.map((category) => ({ value: String(category.id), label: category.name })),
              ]}
            />
          </div>
        </div>
      </div>

      {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

      {rows === null ? (
        <p className="font-body text-[14px] text-gray-600">Carregando lojas...</p>
      ) : (
        <>
          {/* Desktop: tabela. */}
          <table className="hidden w-full border-separate border-spacing-y-2 lg:table">
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

          {/* Mobile: lista de cards empilhados (node 666:11891
              "DASHBOARD-FICHA-RESUMIDA-MOBILE" reaproveitado pra loja). */}
          <div className="flex w-full flex-col lg:hidden">
            {filteredRows.map((row) => (
              <div key={row.id} className="flex items-center gap-2 border-b border-gray-200 py-2">
                <div className="flex flex-1 flex-col items-start gap-2">
                  <p className="w-full font-display text-[22px] font-bold tracking-[0.66px] text-main-dark-900">{row.name}</p>
                  <div className="flex w-full items-center gap-3">
                    <p className="font-display text-[18px] font-semibold tracking-[0.54px] text-base-black">
                      {row.code_badge ?? '—'}
                    </p>
                    <p className="flex-1 font-body text-[14px] tracking-[0.7px] text-gray-700">
                      {row.category_name ?? '—'}
                    </p>
                  </div>
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
                </div>
                <Link
                  to={`/admin/lojas/${row.id}`}
                  className="flex w-[80px] shrink-0 flex-col items-center gap-1 text-main-dark-900"
                >
                  <PencilIcon className="size-6" />
                  <span className="font-body text-[12px] text-main-dark-900">Editar</span>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {rows !== null && filteredRows.length === 0 && (
        <p className="font-body text-[14px] text-gray-600">Nenhuma loja encontrada.</p>
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
