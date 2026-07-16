import type { PyGMonthlyPoint } from './api.ts';

/** Pick one month from annual series (1–12). */
export function monthFromSeries(
  series: PyGMonthlyPoint[],
  month: number,
): PyGMonthlyPoint {
  const found = series.find((m) => m.month === month);
  return found ?? { month, income: 0, expenses: 0, balance: 0 };
}

/**
 * Client-only leverage hint (not an API contract).
 * payables / liquid assets; null if no liquid base.
 */
export function leverageRatio(
  totalAvailable: number,
  totalPayables: number,
): number | null {
  if (!(totalAvailable > 0)) return null;
  return totalPayables / totalAvailable;
}

export function leverageHint(ratio: number | null): string | null {
  if (ratio == null) return null;
  const pct = Math.round(ratio * 100);
  if (pct <= 30) return `Debés cerca del ${pct}% de lo que tenés líquido. Vas tranquilo.`;
  if (pct <= 70) return `Debés cerca del ${pct}% de lo que tenés líquido. Conviene mirarlo.`;
  return `Debés cerca del ${pct}% de lo que tenés líquido. El peso de la deuda es alto.`;
}

export function formatMoney(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export const MONTH_LABELS = [
  '',
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];
