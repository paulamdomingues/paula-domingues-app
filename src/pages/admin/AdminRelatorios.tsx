import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, ClockIcon } from '../../components/icons';
import { DonutChart, SummaryCard, WeeklyBarChart } from '../../components/admin/charts';
import { computeDelta, useAdminReportsData } from '../../lib/adminReports';

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
 *    ainda rodavam em cima de `mockData.ts` até essa mesma data — agora já
 *    migraram pra dado real (ver `catalog.ts`), então esses cards começam
 *    a se alimentar a partir de agora.
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
 *
 * 21/08/2026: dados/cálculos movidos pra `lib/adminReports.ts` (hook
 * `useAdminReportsData`) e os cards/gráficos pra
 * `components/admin/charts.tsx` — o Resumo (`AdminDashboard.tsx`) precisa
 * dos mesmos números, e reaproveitar em vez de duplicar as 5 queries.
 */
export default function AdminRelatorios() {
  const {
    loading,
    error,
    users,
    stores,
    clicks,
    activeUsersCount,
    visibleStoresCount,
    clicksCount,
    newUsersByDay,
    latestUsers,
    top5Stores,
    searchedCategories,
    topSearchTerms,
    planSegments,
    upcomingRenewals,
  } = useAdminReportsData();

  const activeUsersDelta = users ? computeDelta(users.map((u) => u.purchased_at), 30) : null;
  const visibleStoresDelta = stores ? computeDelta(stores.map((s) => s.created_at), 30) : null;
  const clicksDelta = clicks ? computeDelta(clicks.map((c) => c.created_at), 30) : null;

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
