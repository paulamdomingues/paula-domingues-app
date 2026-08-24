import { useState } from 'react';
import { ClockIcon } from '../icons';
import { getLastSixMonths, getPeriodLabel, type ReportPeriod } from '../../lib/reportPeriods';

/**
 * Seletor de período dos Relatórios (24/08/2026, pedido antigo da Amanda
 * retomado — ver "Instruções Mudanças App V4"): Hoje / Ontem / Últimos 7
 * dias / Últimos 30 dias / um mês específico dos últimos 6. Substitui o
 * selo decorativo que só mostrava o mês atual sem função nenhuma.
 */
const FIXED_OPTIONS: { period: ReportPeriod; label: string }[] = [
  { period: { kind: 'hoje' }, label: 'Hoje' },
  { period: { kind: 'ontem' }, label: 'Ontem' },
  { period: { kind: '7dias' }, label: 'Últimos 7 dias' },
  { period: { kind: '30dias' }, label: 'Últimos 30 dias' },
];

interface ReportPeriodSelectorProps {
  value: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
}

export default function ReportPeriodSelector({ value, onChange }: ReportPeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const months = getLastSixMonths();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2"
      >
        <span className="font-body text-[14px] text-gray-700">{getPeriodLabel(value)}</span>
        <ClockIcon className="size-5 text-gray-500" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 max-h-[360px] w-[220px] overflow-y-auto rounded-lg border border-gray-200 bg-base-white shadow-lg">
            {FIXED_OPTIONS.map(({ period, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  onChange(period);
                  setOpen(false);
                }}
                className={`block w-full border-b border-gray-100 px-4 py-2 text-left font-body text-[14px] hover:bg-screen-bg ${
                  value.kind === period.kind ? 'font-bold text-main-red-700' : 'text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
            <p className="px-4 py-2 font-body text-[12px] uppercase tracking-[0.6px] text-gray-400">Mês específico</p>
            {months.map(({ monthsAgo, label }) => (
              <button
                key={monthsAgo}
                type="button"
                onClick={() => {
                  onChange({ kind: 'mes', monthsAgo });
                  setOpen(false);
                }}
                className={`block w-full border-b border-gray-100 px-4 py-2 text-left font-body text-[14px] last:border-b-0 hover:bg-screen-bg ${
                  value.kind === 'mes' && (value.monthsAgo ?? 0) === monthsAgo ? 'font-bold text-main-red-700' : 'text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
