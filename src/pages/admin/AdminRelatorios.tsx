import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, ClockIcon } from '../../components/icons';
import { supabase } from '../../lib/supabaseClient';

interface AllowedUserLite {
  id: number;
  full_name: string | null;
  email: string;
  plan: 'trimestral' | 'anual' | null;
  is_active: boolean;
  purchased_at: string;
}

interface StoreLite {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  category_id: number | null;
}

interface CategoryLite {
  id: number;
  name: string;
}

interface ClickRow {
  store_id: number;
  created_at: string;
}

interface SearchRow {
  term: string;
  category_id: number | null;
}

const CHART_COLORS = ['#A21919', '#67383D', '#D97706', '#928E8E', '#4EB362', '#C16565', '#B54747'];
const PLAN_DAYS: Record<'trimestral' | 'anual', number> = { trimestral: 90, anual: 365 };
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_MS = 24 * 60 * 60 * 1000;

function countSince(dates: string[], days: number): number {
  const threshold = Date.now() - days * DAY_MS;
  return dates.filter((d) => new Date(d).getTime() >= threshold).length;
}

function countBetween(dates: string[], fromDaysAgo: number, toDaysAgo: number): number {
  const from = Date.now() - fromDaysAgo * DAY_MS;
  const to = Date.now() - toDaysAgo * DAY_MS;
  return dates.filter((d) => {
    const t = new Date(d).getTime();
    return t >= from && t < to;
  }).length;
}

function computeDelta(dates: string[]): { pct: number; positive: boolean } | null {
  const last30 = countSince(dates, 30);
  const prev30 = countBetween(dates, 60, 30);
  if (prev30 === 0) return null; // sem base de comparação ainda (ex: recém-lançado)
  const pct = Math.round(((last30 - prev30) / prev30) * 100);
  return { pct: Math.abs(pct), positive: pct >= 0 };
}

/**
 * Relatórios (Figma: `Relatórios` node 627:10085). Diferente das outras
 * áreas do painel, aqui vários cards do Figma dependiam de dado que
 * simplesmente não existia (cliques em contato, termos de busca,
 * categorias mais buscadas, churn) — conversei com a Amanda antes de
 * codar (21/08/2026):
 *
 *  - Cliques/buscas: ela pediu pra deixar a estrutura pronta "pra ir se
 *    alimentando após o lançamento" — por isso as tabelas `store_contact_clicks`
 *    e `search_queries` (migration 0007) já existem e os cards abaixo já
 *    leem delas de verdade. Só que `StoreDetail`/`Busca` (app cliente)
 *    ainda rodam em cima de `mockData.ts`, não geram esses eventos ainda
 *    — então "Cliques em Contatos"/"Top 5 Lojas"/"Categorias mais
 *    buscadas"/"Termos de Busca" começam zerados, honestamente, até essas
 *    duas telas migrarem pra dado real (tarefa separada, já mapeada).
 *  - Taxa de Churn: fica de fora por completo (confirmado com ela) — não
 *    existe hoje nenhum evento de cancelamento/renovação; entra quando o
 *    Make gravar isso a partir do webhook da Hubla.
 *  - Vencimentos Próximo: aproximação combinada com ela (compra +
 *    90/365 dias conforme o plano) até esse mesmo webhook existir.
 *  - Os deltas "vs 30 dias anteriores" só aparecem quando já existe um
 *    período anterior pra comparar (senão a conta é 0→N, que não é uma
 *    porcentagem que signifique nada) — fica em branco nesse caso, em vez
 *    de mostrar um número inventado.
 *
 * O filtro de mês do Figma ("Julho ▾") virou só um selo com o mês atual,
 * sem funcionalidade de fatiar por mês — não existe snapshot histórico
 * pra isso ainda (só temos o estado atual + timestamps de criação).
 */
export default function AdminRelatorios() {
  const [users, setUsers] = useState<AllowedUserLite[] | null>(null);
  const [stores, setStores] = useState<StoreLite[] | null>(null);
  const [categories, setCategories] = useState<CategoryLite[] | null>(null);
  const [clicks, setClicks] = useState<ClickRow[] | null>(null);
  const [searches, setSearches] = useState<SearchRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('allowed_users').select('id, full_name, email, plan, is_active, purchased_at').order('purchased_at', { ascending: false }),
      supabase.from('stores').select('id, name, is_active, created_at, category_id'),
      supabase.from('categories').select('id, name'),
      supabase.from('store_contact_clicks').select('store_id, created_at'),
      supabase.from('search_queries').select('term, category_id'),
    ]).then(([u, s, c, cl, sq]) => {
      if (u.error || s.error || c.error || cl.error || sq.error) {
        setError('Não foi possível carregar os relatórios.');
        return;
      }
      setUsers(u.data ?? []);
      setStores(s.data ?? []);
      setCategories(c.data ?? []);
      setClicks(cl.data ?? []);
      setSearches(sq.data ?? []);
    });
  }, []);

  const loading = users === null || stores === null || categories === null || clicks === null || searches === null;

  const activeUsersCount = users?.filter((u) => u.is_active).length ?? 0;
  const activeUsersDelta = users ? computeDelta(users.map((u) => u.purchased_at)) : null;

  const visibleStoresCount = stores?.filter((s) => s.is_active).length ?? 0;
  const visibleStoresDelta = stores ? computeDelta(stores.map((s) => s.created_at)) : null;

  const clicksCount = clicks?.length ?? 0;
  const clicksDelta = clicks ? computeDelta(clicks.map((c) => c.created_at)) : null;

  const last7Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toISOString().slice(0, 10), label: WEEKDAY_LABELS[d.getDay()] };
    });
  }, []);

  const newUsersByDay = useMemo(() => {
    if (!users) return [];
    return last7Days.map(({ key, label }) => ({
      label,
      value: users.filter((u) => u.purchased_at.slice(0, 10) === key).length,
    }));
  }, [users, last7Days]);

  const latestUsers = users?.slice(0, 6) ?? [];

  const top5Stores = useMemo(() => {
    if (!stores || !clicks) return [];
    const countByStore = new Map<number, number>();
    clicks.forEach((c) => countByStore.set(c.store_id, (countByStore.get(c.store_id) ?? 0) + 1));
    return [...countByStore.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([storeId, count]) => {
        const store = stores.find((s) => s.id === storeId);
        const category = store ? categories?.find((c) => c.id === store.category_id) : undefined;
        return { id: storeId, name: store?.name ?? 'Loja removida', categoryName: category?.name ?? '—', count };
      });
  }, [stores, clicks, categories]);

  const searchedCategories = useMemo(() => {
    if (!searches || !categories) return [];
    const countByCategory = new Map<number, number>();
    searches.forEach((s) => {
      if (s.category_id == null) return;
      countByCategory.set(s.category_id, (countByCategory.get(s.category_id) ?? 0) + 1);
    });
    return [...countByCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([categoryId, count], i) => ({
        label: categories.find((c) => c.id === categoryId)?.name ?? 'Categoria removida',
        value: count,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [searches, categories]);

  const topSearchTerms = useMemo(() => {
    if (!searches) return [];
    const countByTerm = new Map<string, number>();
    searches.forEach((s) => {
      const key = s.term.trim();
      if (!key) return;
      countByTerm.set(key, (countByTerm.get(key) ?? 0) + 1);
    });
    return [...countByTerm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [searches]);

  const planSegments = useMemo(() => {
    if (!users) return [];
    const withPlan = users.filter((u) => u.plan);
    return [
      { label: 'Trimestral', value: withPlan.filter((u) => u.plan === 'trimestral').length, color: CHART_COLORS[0] },
      { label: 'Anual', value: withPlan.filter((u) => u.plan === 'anual').length, color: CHART_COLORS[1] },
    ];
  }, [users]);

  const upcomingRenewals = useMemo(() => {
    if (!users) return 0;
    const now = Date.now();
    const in30Days = now + 30 * DAY_MS;
    return users.filter((u) => {
      if (!u.plan || !u.is_active) return false;
      const expiryTime = new Date(u.purchased_at).getTime() + PLAN_DAYS[u.plan] * DAY_MS;
      return expiryTime >= now && expiryTime <= in30Days;
    }).length;
  }, [users]);

  const currentMonthLabel = useMemo(() => {
    const label = new Date().toLocaleDateString('pt-BR', { month: 'long' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, []);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-[32px] font-bold tracking-[0.96px] text-main-dark-900">Relatórios</h1>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <span className="font-body text-[14px] text-gray-700">{currentMonthLabel}</span>
            <ClockIcon className="size-5 text-gray-500" />
          </div>
          <BellIcon className="size-6 text-gray-400" />
        </div>
      </div>

      {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

      {loading ? (
        <p className="font-body text-[14px] text-gray-600">Carregando relatórios...</p>
      ) : (
        <>
          <div className="grid w-full grid-cols-3 gap-4">
            <SummaryCard label="Alunas Ativas" value={activeUsersCount} delta={activeUsersDelta} deltaSuffix="novos cadastros vs 30 dias anteriores" />
            <SummaryCard label="Lojas Visíveis" value={visibleStoresCount} delta={visibleStoresDelta} deltaSuffix="novas lojas vs 30 dias anteriores" />
            <SummaryCard label="Cliques em Contatos" value={clicksCount} delta={clicksDelta} deltaSuffix="vs 30 dias anteriores" />
          </div>

          <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
            <p className="font-display text-[32px] font-bold tracking-[1.6px] text-main-dark-900">Novos Usuários</p>
            <p className="font-body text-[13px] text-gray-400">Cadastros por dia, últimos 7 dias</p>
            <WeeklyBarChart buckets={newUsersByDay} />
          </div>

          <div className="grid w-full grid-cols-[1fr_420px] gap-4">
            <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
              <div className="flex items-center justify-between">
                <p className="font-display text-[24px] font-bold tracking-[0.72px] text-main-dark-900">Últimos Usuários Cadastrados</p>
                <Link to="/admin/usuarios" className="font-body text-[14px] font-bold text-main-red-700">
                  Ver todos
                </Link>
              </div>
              <div className="flex flex-col gap-1">
                {latestUsers.length === 0 && <p className="font-body text-[14px] text-gray-400">Nenhum usuário ainda.</p>}
                {latestUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 border-b border-gray-50 px-2 py-3 last:border-0">
                    <p className="w-16 shrink-0 font-body text-[14px] text-main-dark-900">#{u.id}</p>
                    <p className="w-36 shrink-0 truncate font-body text-[13px] font-medium text-gray-900">{u.full_name || '—'}</p>
                    <p className="flex-1 truncate font-body text-[12px] text-gray-600">{u.email}</p>
                    <p className="w-20 shrink-0 font-body text-[13px] font-medium text-gray-500">
                      {u.plan === 'trimestral' ? 'Trimestral' : u.plan === 'anual' ? 'Anual' : '—'}
                    </p>
                    <p className="w-24 shrink-0 text-right font-body text-[12px] text-gray-400">
                      {new Date(u.purchased_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
              <p className="font-display text-[24px] font-bold tracking-[0.72px] text-main-dark-900">Top 5 Lojas</p>
              <p className="font-body text-[12px] text-gray-400">Por cliques em WhatsApp/Instagram</p>
              {top5Stores.length === 0 ? (
                <p className="font-body text-[13px] text-gray-400">Sem cliques registrados ainda.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {top5Stores.map((store) => (
                    <Link
                      key={store.id}
                      to={`/admin/lojas/${store.id}`}
                      className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0"
                    >
                      <div className="flex flex-col">
                        <p className="font-display text-[18px] font-bold tracking-[0.54px] text-main-dark-900">{store.name}</p>
                        <p className="font-body text-[12px] text-gray-400">{store.categoryName}</p>
                      </div>
                      <span className="font-body text-[13px] text-gray-500">{store.count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-4">
            <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
              <p className="font-display text-[24px] font-bold tracking-[0.72px] text-main-dark-900">Categorias mais buscadas</p>
              {searchedCategories.length === 0 ? (
                <p className="font-body text-[13px] text-gray-400">Sem buscas registradas ainda.</p>
              ) : (
                <DonutChart segments={searchedCategories} />
              )}
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
              <p className="font-display text-[24px] font-bold tracking-[0.72px] text-main-dark-900">Termos de Busca mais pesquisados</p>
              {topSearchTerms.length === 0 ? (
                <p className="font-body text-[13px] text-gray-400">Sem buscas registradas ainda.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topSearchTerms.map(([term, count]) => (
                    <span
                      key={term}
                      className="flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1.5 font-body text-[14px] text-main-dark-800"
                    >
                      {term}
                      <span className="font-body text-[12px] text-gray-500">({count})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-4">
            <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-lg bg-base-white p-6 text-center">
              <p className="font-display text-[24px] font-bold tracking-[0.72px] text-main-dark-900">Vencimentos Próximo</p>
              <p className="font-display text-[48px] font-extrabold tracking-[1.44px] text-main-dark-900">{upcomingRenewals}</p>
              <p className="font-body text-[13px] text-gray-400">
                Estimativa (compra + duração do plano) — assinaturas vencendo em até 30 dias
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
              <p className="font-display text-[24px] font-bold tracking-[0.72px] text-main-dark-900">Tipo de Assinaturas</p>
              {planSegments.every((s) => s.value === 0) ? (
                <p className="font-body text-[13px] text-gray-400">Nenhum usuário com plano definido ainda.</p>
              ) : (
                <DonutChart segments={planSegments} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  delta,
  deltaSuffix,
}: {
  label: string;
  value: number;
  delta: { pct: number; positive: boolean } | null;
  deltaSuffix: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-main-red-50 bg-base-white p-4 text-center shadow-sm">
      <p className="font-body text-[16px] tracking-[0.8px] text-gray-500">{label}</p>
      <p className="font-display text-[32px] font-bold tracking-[1.6px] text-main-dark-900">{value}</p>
      {delta && (
        <p className="font-body text-[13px] tracking-[0.65px]">
          <span className={delta.positive ? 'text-success-800' : 'text-error-500'}>
            {delta.positive ? '+' : '-'}
            {delta.pct}%
          </span>{' '}
          <span className="text-gray-500">{deltaSuffix}</span>
        </p>
      )}
    </div>
  );
}

function WeeklyBarChart({ buckets }: { buckets: { label: string; value: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.value));
  return (
    <div className="flex h-[180px] w-full items-end gap-4">
      {buckets.map((b) => (
        <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="font-body text-[12px] text-gray-500">{b.value}</span>
          <div
            className="w-full min-h-[4px] rounded-t-md bg-main-red-500"
            style={{ height: `${(b.value / max) * 130}px` }}
          />
          <span className="font-body text-[13px] text-gray-600">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cumulative = 0;
  const stops = segments.map((s) => {
    const start = total > 0 ? (cumulative / total) * 360 : 0;
    cumulative += s.value;
    const end = total > 0 ? (cumulative / total) * 360 : 0;
    return `${s.color} ${start}deg ${end}deg`;
  });

  return (
    <div className="flex items-center gap-8">
      <div className="relative size-[160px] shrink-0 rounded-full" style={{ background: `conic-gradient(${stops.join(', ')})` }}>
        <div className="absolute inset-[22%] rounded-full bg-base-white" />
      </div>
      <div className="flex flex-col gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-body text-[14px] text-gray-800">{s.label}</span>
            <span className="font-body text-[12px] text-gray-400">
              {s.value} ({total > 0 ? Math.round((s.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
