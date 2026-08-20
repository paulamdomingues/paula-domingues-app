import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, ClockIcon } from '../../components/icons';
import { DonutChart, SummaryCard, WeeklyBarChart } from '../../components/admin/charts';
import { computeDelta, useAdminReportsData } from '../../lib/adminReports';

/**
 * Resumo/Dashboard (Figma desktop: node 666:10258; Figma mobile: node
 * 666:6041 "Dashboard"). Ficou como placeholder por um bom tempo (ver
 * histórico do arquivo) esperando decidir como calcular os números — isso
 * já foi resolvido construindo o Relatórios (21/08/2026), então o Resumo
 * agora reaproveita os mesmos dados via `lib/adminReports.ts`.
 *
 * Os dois breakpoints mostram um recorte DIFERENTE, seguindo o Figma à
 * risca (não é só reflow do mesmo conteúdo):
 *  - Desktop: 4 cards + gráfico "Novos Usuários" + "Últimos Usuários
 *    Cadastrados" numa coluna, "Top 5 Lojas" + "Tipo de Assinaturas" na
 *    outra.
 *  - Mobile: 4 cards + "Top 5 Lojas" + "Vencimentos Próximo" + "Termos de
 *    Busca mais pesquisados" + "Últimos Usuários Cadastrados" — sem os 2
 *    gráficos (o menu mobile não tem item próprio pra Relatórios, então o
 *    Resumo mobile absorve esses cards do Relatórios em vez dos gráficos).
 *
 * Os 4 cards do topo usam delta "vs ontem" (janela de 1 dia) — diferente
 * do "vs 30 dias anteriores" do Relatórios — porque é isso que o Figma
 * mostra aqui (rótulo "vs ontem" nos cards do Resumo). "Stories Ativos" é
 * exclusivo desta tela (conta stories com `expires_at` no futuro).
 */
export default function AdminDashboard() {
  const {
    loading,
    error,
    users,
    stores,
    clicks,
    activeUsersCount,
    visibleStoresCount,
    clicksCount,
    activeStoriesCount,
    newUsersByDay,
    latestUsers,
    top5Stores,
    topSearchTerms,
    planSegments,
    upcomingRenewals,
  } = useAdminReportsData();

  const activeUsersDelta = users ? computeDelta(users.map((u) => u.purchased_at), 1) : null;
  const visibleStoresDelta = stores ? computeDelta(stores.map((s) => s.created_at), 1) : null;
  const clicksDelta = clicks ? computeDelta(clicks.map((c) => c.created_at), 1) : null;

  const todayLabel = useMemo(() => {
    const label = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    return label.toUpperCase();
  }, []);

  const summaryCards = (
    <>
      <SummaryCard label="Alunas Novas" value={activeUsersCount} delta={activeUsersDelta} deltaSuffix="vs ontem" />
      <SummaryCard label="Lojas Visíveis" value={visibleStoresCount} delta={visibleStoresDelta} deltaSuffix="vs ontem" />
      <SummaryCard label="Cliques em Contatos" value={clicksCount} delta={clicksDelta} deltaSuffix="vs ontem" />
      <SummaryCard label="Stories Ativos" value={activeStoriesCount} delta={null} deltaSuffix="vs ontem" />
    </>
  );

  const top5LojasCard = (
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
  );

  const ultimosUsuariosDesktop = (
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
  );

  // Versão mobile da lista de últimos usuários: só id, nome e data (sem
  // e-mail nem plano) — assim que o Figma mobile mostra essas linhas
  // (node 666:9938), mais enxuto que a versão desktop.
  const ultimosUsuariosMobile = (
    <div className="flex flex-col gap-3 rounded-lg bg-base-white p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-[20px] font-bold tracking-[0.6px] text-main-dark-900">Últimos usuários cadastrados</p>
        <Link to="/admin/usuarios" className="shrink-0 font-body text-[13px] font-bold text-main-red-700">
          Ver todos
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        {latestUsers.length === 0 && <p className="font-body text-[13px] text-gray-400">Nenhum usuário ainda.</p>}
        {latestUsers.map((u) => (
          <div key={u.id} className="flex items-center gap-3 border-b border-gray-50 py-2 last:border-0">
            <p className="w-16 shrink-0 font-body text-[13px] text-main-dark-900">#{u.id}</p>
            <p className="flex-1 truncate font-body text-[13px] font-medium text-gray-900">{u.full_name || '—'}</p>
            <p className="shrink-0 font-body text-[11px] text-gray-400">
              {new Date(u.purchased_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-6 lg:gap-8">
      <div className="flex w-full items-center justify-between">
        <h1 className="font-display text-[26px] font-bold tracking-[0.78px] text-main-dark-900 lg:text-[32px] lg:tracking-[0.96px]">
          Resumo
        </h1>
        <div className="hidden items-center gap-8 lg:flex">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <span className="font-body text-[14px] text-gray-700">{todayLabel}</span>
            <ClockIcon className="size-5 text-gray-500" />
          </div>
          <BellIcon className="size-6 text-gray-400" />
        </div>
        <BellIcon className="size-6 shrink-0 text-gray-400 lg:hidden" />
      </div>

      {/* Selo "A data de hoje": no desktop fica junto do cabeçalho (acima);
          no mobile vira uma faixa cheia abaixo do título, igual ao Figma
          mobile (node 666:14735). */}
      <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 lg:hidden">
        <span className="font-body text-[14px] text-gray-700">{todayLabel}</span>
        <ClockIcon className="size-5 text-gray-500" />
      </div>

      {error && <p className="font-body text-[13px] text-main-red-800">{error}</p>}

      {loading ? (
        <p className="font-body text-[14px] text-gray-600">Carregando o resumo...</p>
      ) : (
        <>
          {/* Mobile: grade 2x2. Desktop: uma linha com as 4 (node 666:6614 vs 666:10268). */}
          <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">{summaryCards}</div>

          {/* Desktop: gráfico + últimos usuários numa coluna, Top 5 Lojas +
              Tipo de Assinaturas na outra (node 666:10267). */}
          <div className="hidden lg:grid lg:w-full lg:grid-cols-[1fr_420px] lg:gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
                <p className="font-display text-[32px] font-bold tracking-[1.6px] text-main-dark-900">Novos Usuários</p>
                <p className="font-body text-[13px] text-gray-400">Cadastros por dia, últimos 7 dias</p>
                <WeeklyBarChart buckets={newUsersByDay} />
              </div>
              {ultimosUsuariosDesktop}
            </div>
            <div className="flex flex-col gap-4">
              {top5LojasCard}
              <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
                <p className="font-display text-[24px] font-bold tracking-[0.72px] text-main-dark-900">Tipo de Assinaturas</p>
                {planSegments.every((s) => s.value === 0) ? (
                  <p className="font-body text-[13px] text-gray-400">Nenhum usuário com plano definido ainda.</p>
                ) : (
                  <DonutChart segments={planSegments} />
                )}
              </div>
            </div>
          </div>

          {/* Mobile: Top 5 Lojas, Vencimentos Próximo e Termos de Busca
              (cards do Relatórios que não têm tela própria no menu mobile,
              node 666:10025) + Últimos Usuários por último. */}
          <div className="flex w-full flex-col gap-4 lg:hidden">
            {top5LojasCard}

            <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-base-white p-6 text-center">
              <p className="font-display text-[20px] font-bold tracking-[0.6px] text-main-dark-900">Vencimentos Próximo</p>
              <p className="font-display text-[40px] font-extrabold tracking-[1.2px] text-main-dark-900">{upcomingRenewals}</p>
              <p className="font-body text-[13px] text-gray-400">Assinaturas vencendo em até 30 dias</p>
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-base-white p-6">
              <p className="font-display text-[20px] font-bold tracking-[0.6px] text-main-dark-900">
                Termos de Busca mais pesquisados
              </p>
              {topSearchTerms.length === 0 ? (
                <p className="font-body text-[13px] text-gray-400">Sem buscas registradas ainda.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topSearchTerms.map(([term, count]) => (
                    <span
                      key={term}
                      className="flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1.5 font-body text-[13px] text-main-dark-800"
                    >
                      {term}
                      <span className="font-body text-[11px] text-gray-500">({count})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {ultimosUsuariosMobile}
          </div>
        </>
      )}
    </div>
  );
}
