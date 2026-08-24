/**
 * Filtro de período dos Relatórios (`AdminRelatorios.tsx`) — pedido da
 * Amanda em "Instruções Mudanças App V4" (24/08/2026, retomado): "quero
 * poder aplicar datas pra puxar os dados, como hoje, ontem, ultimos 7
 * dias, ultimos 30 dias, e seleção por mes ... últimos 6 meses".
 *
 * Fica separado de `adminReports.ts` de propósito: aqui só existe a
 * conversão "período escolhido → intervalo de datas" (matemática pura,
 * sem dado nenhum). Quem usa esse intervalo pra filtrar/agregar os dados
 * de verdade é `adminReports.ts`.
 *
 * O Resumo (`AdminDashboard.tsx`) NÃO usa nada deste arquivo — continua
 * sempre "hoje vs ontem", sem filtro de período, como já era antes dessa
 * mudança.
 */

export type ReportPeriodKind = 'hoje' | 'ontem' | '7dias' | '30dias' | 'mes';

export interface ReportPeriod {
  kind: ReportPeriodKind;
  /** Só usado quando kind === 'mes': 0 = mês atual (parcial, até agora), 1 = mês passado (completo), ..., 5 = há 5 meses. */
  monthsAgo?: number;
}

export interface DateRange {
  /** ms desde epoch, inclusivo. */
  start: number;
  /** ms desde epoch, exclusivo. */
  end: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function getPeriodRange(period: ReportPeriod, now: number = Date.now()): DateRange {
  const nowDate = new Date(now);
  if (period.kind === 'hoje') {
    const start = new Date(nowDate);
    start.setHours(0, 0, 0, 0);
    return { start: start.getTime(), end: now };
  }
  if (period.kind === 'ontem') {
    const startOfToday = new Date(nowDate);
    startOfToday.setHours(0, 0, 0, 0);
    return { start: startOfToday.getTime() - DAY_MS, end: startOfToday.getTime() };
  }
  if (period.kind === '7dias') {
    return { start: now - 7 * DAY_MS, end: now };
  }
  if (period.kind === '30dias') {
    return { start: now - 30 * DAY_MS, end: now };
  }
  // 'mes': mês de calendário inteiro (dia 1 00:00 até dia 1 00:00 do mês
  // seguinte) — exceto o mês atual (monthsAgo 0), que vai só até agora,
  // já que o resto do mês ainda não aconteceu.
  const monthsAgo = period.monthsAgo ?? 0;
  const first = new Date(nowDate.getFullYear(), nowDate.getMonth() - monthsAgo, 1, 0, 0, 0, 0);
  const firstOfNext = new Date(nowDate.getFullYear(), nowDate.getMonth() - monthsAgo + 1, 1, 0, 0, 0, 0);
  return { start: first.getTime(), end: monthsAgo === 0 ? now : firstOfNext.getTime() };
}

/**
 * Intervalo anterior equivalente, usado pro "vs período anterior" dos
 * cards. Pra 'mes' compara com o mês de calendário anterior de verdade
 * (não só "mesma duração antes"), já que meses têm tamanhos diferentes.
 */
export function getPreviousPeriodRange(period: ReportPeriod, now: number = Date.now()): DateRange {
  if (period.kind === 'mes') {
    return getPeriodRange({ kind: 'mes', monthsAgo: (period.monthsAgo ?? 0) + 1 }, now);
  }
  const range = getPeriodRange(period, now);
  const length = range.end - range.start;
  return { start: range.start - length, end: range.start };
}

export function isInRange(dateStr: string, range: DateRange): boolean {
  const t = new Date(dateStr).getTime();
  return t >= range.start && t < range.end;
}

export function countInRange(dates: string[], range: DateRange): number {
  return dates.filter((d) => isInRange(d, range)).length;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Últimos 6 meses de calendário (mês atual primeiro), pro seletor "mês específico". */
export function getLastSixMonths(now: number = Date.now()): { monthsAgo: number; label: string }[] {
  const nowDate = new Date(now);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
    const name = MONTH_NAMES_PT[d.getMonth()];
    const label = d.getFullYear() !== nowDate.getFullYear() ? `${name} de ${d.getFullYear()}` : name;
    return { monthsAgo: i, label };
  });
}

export function getPeriodLabel(period: ReportPeriod, now: number = Date.now()): string {
  switch (period.kind) {
    case 'hoje':
      return 'Hoje';
    case 'ontem':
      return 'Ontem';
    case '7dias':
      return 'Últimos 7 dias';
    case '30dias':
      return 'Últimos 30 dias';
    case 'mes': {
      const months = getLastSixMonths(now);
      return months.find((m) => m.monthsAgo === (period.monthsAgo ?? 0))?.label ?? 'Mês';
    }
    default:
      return '';
  }
}
