import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';
import { countInRange, getPeriodRange, getPreviousPeriodRange, isInRange, type ReportPeriod } from './reportPeriods';

/**
 * Dado compartilhado entre Relatórios (`AdminRelatorios.tsx`) e o Resumo
 * (`AdminDashboard.tsx`) — os dois mostram recortes diferentes das MESMAS
 * métricas (o Resumo mobile, em especial, reaproveita cards inteiros do
 * Relatórios porque o menu mobile não tem item próprio pra Relatórios, ver
 * Figma node 666:6041 "Dashboard" mobile). Antes essa lógica só existia
 * dentro de `AdminRelatorios.tsx`; movida pra cá em 21/08/2026 pra não
 * duplicar as mesmas 5 queries + cálculos nas duas telas.
 */

export interface AllowedUserLite {
  id: number;
  short_id: string | null;
  full_name: string | null;
  email: string;
  plan: 'trimestral' | 'anual' | null;
  is_active: boolean;
  purchased_at: string;
}

export interface StoreLite {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  category_id: number | null;
}

export interface CategoryLite {
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
  created_at: string;
}

interface StoryLite {
  id: string;
  expires_at: string;
}

export const CHART_COLORS = ['#A21919', '#67383D', '#D97706', '#928E8E', '#4EB362', '#C16565', '#B54747'];
const PLAN_DAYS: Record<'trimestral' | 'anual', number> = { trimestral: 90, anual: 365 };
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_MS = 24 * 60 * 60 * 1000;

export function countSince(dates: string[], days: number): number {
  const threshold = Date.now() - days * DAY_MS;
  return dates.filter((d) => new Date(d).getTime() >= threshold).length;
}

export function countBetween(dates: string[], fromDaysAgo: number, toDaysAgo: number): number {
  const from = Date.now() - fromDaysAgo * DAY_MS;
  const to = Date.now() - toDaysAgo * DAY_MS;
  return dates.filter((d) => {
    const t = new Date(d).getTime();
    return t >= from && t < to;
  }).length;
}

export interface Delta {
  pct: number;
  positive: boolean;
}

/**
 * Compara os últimos `windowDays` contra o período igual anterior — usado
 * tanto pro "vs 30 dias anteriores" do Relatórios (`windowDays: 30`) quanto
 * pro "vs ontem" do Resumo (`windowDays: 1`). `null` quando não há período
 * anterior pra comparar (ex: app recém-lançado) — mostra em branco em vez
 * de uma porcentagem 0→N que não significa nada.
 */
export function computeDelta(dates: string[], windowDays: number): Delta | null {
  const current = countSince(dates, windowDays);
  const previous = countBetween(dates, windowDays * 2, windowDays);
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct: Math.abs(pct), positive: pct >= 0 };
}

/**
 * `period` é opcional e só usado por Relatórios (`AdminRelatorios.tsx`) —
 * quando presente, o hook TAMBÉM devolve a versão "filtrada por período"
 * de cada card (prefixo `period*`), calculada em cima dos mesmos dados já
 * buscados (sem query nova nenhuma). O Resumo (`AdminDashboard.tsx`)
 * chama o hook sem argumento nenhum, então continua recebendo exatamente
 * os mesmos campos de sempre (`activeUsersCount`, `newUsersByDay`, etc,
 * sempre "geral"/"hoje vs ontem") — nada nele muda com essa adição.
 */
export function useAdminReportsData(period?: ReportPeriod) {
  const [users, setUsers] = useState<AllowedUserLite[] | null>(null);
  const [stores, setStores] = useState<StoreLite[] | null>(null);
  const [categories, setCategories] = useState<CategoryLite[] | null>(null);
  const [clicks, setClicks] = useState<ClickRow[] | null>(null);
  const [searches, setSearches] = useState<SearchRow[] | null>(null);
  const [stories, setStories] = useState<StoryLite[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase
        .from('allowed_users')
        .select('id, short_id, full_name, email, plan, is_active, purchased_at')
        .order('purchased_at', { ascending: false }),
      supabase.from('stores').select('id, name, is_active, created_at, category_id'),
      supabase.from('categories').select('id, name'),
      supabase.from('store_contact_clicks').select('store_id, created_at'),
      supabase.from('search_queries').select('term, category_id, created_at'),
      supabase.from('stories').select('id, expires_at'),
    ]).then(([u, s, c, cl, sq, st]) => {
      if (u.error || s.error || c.error || cl.error || sq.error || st.error) {
        setError('Não foi possível carregar os relatórios.');
        return;
      }
      setUsers(u.data ?? []);
      setStores(s.data ?? []);
      setCategories(c.data ?? []);
      setClicks(cl.data ?? []);
      setSearches(sq.data ?? []);
      setStories(st.data ?? []);
    });
  }, []);

  const loading =
    users === null || stores === null || categories === null || clicks === null || searches === null || stories === null;

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

  const activeUsersCount = users?.filter((u) => u.is_active).length ?? 0;
  const visibleStoresCount = stores?.filter((s) => s.is_active).length ?? 0;
  const clicksCount = clicks?.length ?? 0;
  // "Stories Ativos" (card exclusivo do Resumo/Dashboard, não usado no
  // Relatórios) — conta os stories que ainda não expiraram (`expires_at`
  // no futuro), já que a tabela `stories` não tem uma flag "ativo" própria.
  const activeStoriesCount = useMemo(() => {
    if (!stories) return 0;
    const now = Date.now();
    return stories.filter((s) => new Date(s.expires_at).getTime() > now).length;
  }, [stories]);

  // ------------------------------------------------------------------
  // A partir daqui: só roda de verdade quando `period` é passado
  // (Relatórios). `range`/`previousRange` ficam parados (mesmo objeto)
  // enquanto o período escolhido não muda — recalcular só quando `period`
  // muda é suficiente, não precisa reagir ao relógio passando.
  // ------------------------------------------------------------------
  const range = useMemo(() => (period ? getPeriodRange(period) : null), [period]);
  const previousRange = useMemo(() => (period ? getPreviousPeriodRange(period) : null), [period]);

  const periodUsers = useMemo(() => {
    if (!users || !range) return [];
    return users.filter((u) => isInRange(u.purchased_at, range));
  }, [users, range]);

  const periodStoresCount = useMemo(() => {
    if (!stores || !range) return 0;
    return countInRange(stores.map((s) => s.created_at), range);
  }, [stores, range]);

  const periodClicksInRange = useMemo(() => {
    if (!clicks || !range) return [];
    return clicks.filter((c) => isInRange(c.created_at, range));
  }, [clicks, range]);

  const periodSearchesInRange = useMemo(() => {
    if (!searches || !range) return [];
    return searches.filter((s) => isInRange(s.created_at, range));
  }, [searches, range]);

  function delta(dates: string[]): Delta | null {
    if (!range || !previousRange) return null;
    const current = countInRange(dates, range);
    const previous = countInRange(dates, previousRange);
    if (previous === 0) return null;
    const pct = Math.round(((current - previous) / previous) * 100);
    return { pct: Math.abs(pct), positive: pct >= 0 };
  }

  const periodUsersCount = periodUsers.length;
  const periodUsersDelta = users ? delta(users.map((u) => u.purchased_at)) : null;
  const periodStoresDelta = stores ? delta(stores.map((s) => s.created_at)) : null;
  const periodClicksCount = periodClicksInRange.length;
  const periodClicksDelta = clicks ? delta(clicks.map((c) => c.created_at)) : null;

  // Barras por dia dentro do período escolhido — rótulo por dia da semana
  // pra períodos curtos (≤7 dias, igual sempre foi), ou por dia do mês
  // pra períodos mais longos (30 dias/mês específico), senão os rótulos
  // "Seg/Ter/Qua" repetidos várias vezes ficariam sem sentido. O número de
  // barras vem do TIPO de período escolhido (não da duração em ms do
  // intervalo) — "últimos 7 dias" sempre = 7 barras (hoje + 6 anteriores),
  // nunca 8, mesmo o intervalo de comparação sendo calculado por hora.
  const periodNewUsersByDay = useMemo(() => {
    if (!users || !range || !period) return [];
    let totalDays: number;
    // 'hoje'/'7dias'/'30dias' são janelas móveis ancoradas em "agora", não
    // em meia-noite — por isso o cursor abaixo começa contando pra trás a
    // partir de HOJE (não de `range.start` truncado, que ficaria 1 dia
    // "atrasado" nesses três casos). 'ontem' e 'mes' já são alinhados à
    // meia-noite de verdade, então usam `range.start` direto.
    const anchorsOnToday = period.kind === 'hoje' || period.kind === '7dias' || period.kind === '30dias';
    if (period.kind === 'hoje' || period.kind === 'ontem') {
      totalDays = 1;
    } else if (period.kind === '7dias') {
      totalDays = 7;
    } else if (period.kind === '30dias') {
      totalDays = 30;
    } else {
      // 'mes': dias corridos do mês inteiro, ou só os que já passaram, se
      // for o mês atual (parcial).
      totalDays = Math.max(1, Math.ceil((range.end - range.start) / DAY_MS));
    }
    const useWeekday = totalDays <= 7;
    const cursor = anchorsOnToday ? new Date() : new Date(range.start);
    cursor.setHours(0, 0, 0, 0);
    if (anchorsOnToday) cursor.setDate(cursor.getDate() - (totalDays - 1));
    const buckets: { key: string; label: string }[] = [];
    for (let i = 0; i < totalDays; i++) {
      buckets.push({
        key: cursor.toISOString().slice(0, 10),
        label: useWeekday ? WEEKDAY_LABELS[cursor.getDay()] : String(cursor.getDate()).padStart(2, '0'),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return buckets.map(({ key, label }) => ({
      label,
      value: users.filter((u) => u.purchased_at.slice(0, 10) === key).length,
    }));
  }, [users, range, period]);

  const periodLatestUsers = useMemo(
    () => [...periodUsers].sort((a, b) => (a.purchased_at < b.purchased_at ? 1 : -1)).slice(0, 6),
    [periodUsers]
  );

  const periodTop5Stores = useMemo(() => {
    if (!stores) return [];
    const countByStore = new Map<number, number>();
    periodClicksInRange.forEach((c) => countByStore.set(c.store_id, (countByStore.get(c.store_id) ?? 0) + 1));
    return [...countByStore.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([storeId, count]) => {
        const store = stores.find((s) => s.id === storeId);
        const category = store ? categories?.find((c) => c.id === store.category_id) : undefined;
        return { id: storeId, name: store?.name ?? 'Loja removida', categoryName: category?.name ?? '—', count };
      });
  }, [stores, categories, periodClicksInRange]);

  const periodSearchedCategories = useMemo(() => {
    if (!categories) return [];
    const countByCategory = new Map<number, number>();
    periodSearchesInRange.forEach((s) => {
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
  }, [categories, periodSearchesInRange]);

  const periodTopSearchTerms = useMemo(() => {
    const countByTerm = new Map<string, number>();
    periodSearchesInRange.forEach((s) => {
      const key = s.term.trim();
      if (!key) return;
      countByTerm.set(key, (countByTerm.get(key) ?? 0) + 1);
    });
    return [...countByTerm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [periodSearchesInRange]);

  const periodPlanSegments = useMemo(() => {
    const withPlan = periodUsers.filter((u) => u.plan);
    return [
      { label: 'Trimestral', value: withPlan.filter((u) => u.plan === 'trimestral').length, color: CHART_COLORS[0] },
      { label: 'Anual', value: withPlan.filter((u) => u.plan === 'anual').length, color: CHART_COLORS[1] },
    ];
  }, [periodUsers]);

  return {
    loading,
    error,
    users,
    stores,
    categories,
    clicks,
    searches,
    activeUsersCount,
    visibleStoresCount,
    clicksCount,
    activeStoriesCount,
    newUsersByDay,
    latestUsers,
    top5Stores,
    searchedCategories,
    topSearchTerms,
    planSegments,
    upcomingRenewals,
    // Versões filtradas pelo `period` recebido (só fazem sentido quando
    // `period` foi passado — ficam vazias/zeradas caso contrário).
    periodUsersCount,
    periodUsersDelta,
    periodStoresCount,
    periodStoresDelta,
    periodClicksCount,
    periodClicksDelta,
    periodNewUsersByDay,
    periodLatestUsers,
    periodTop5Stores,
    periodSearchedCategories,
    periodTopSearchTerms,
    periodPlanSegments,
  };
}
