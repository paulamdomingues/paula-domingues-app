import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';

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

export function useAdminReportsData() {
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
        .select('id, full_name, email, plan, is_active, purchased_at')
        .order('purchased_at', { ascending: false }),
      supabase.from('stores').select('id, name, is_active, created_at, category_id'),
      supabase.from('categories').select('id, name'),
      supabase.from('store_contact_clicks').select('store_id, created_at'),
      supabase.from('search_queries').select('term, category_id'),
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
  };
}
