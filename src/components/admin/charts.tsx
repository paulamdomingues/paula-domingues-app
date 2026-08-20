import type { Delta } from '../../lib/adminReports';

/**
 * Peças visuais compartilhadas entre Relatórios e o Resumo (Dashboard) do
 * admin — movidas de `AdminRelatorios.tsx` pra cá em 21/08/2026 pra não
 * duplicar o mesmo card/gráfico nas duas telas (ver `lib/adminReports.ts`
 * pro lado dos dados).
 */

export function SummaryCard({
  label,
  value,
  delta,
  deltaSuffix,
}: {
  label: string;
  value: number;
  delta: Delta | null;
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

export function WeeklyBarChart({ buckets }: { buckets: { label: string; value: number }[] }) {
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

export function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
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
