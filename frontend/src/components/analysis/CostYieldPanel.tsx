import { formatMoney } from '../../lib/finance.ts';
import type { CostYieldTotals } from '../../lib/api.ts';

export interface CostYieldPanelProps {
  totals: CostYieldTotals;
  currency: string;
}

/** Cost and investment yield totals shown separately (FR-004 — no netting). */
export default function CostYieldPanel({ totals, currency }: CostYieldPanelProps) {
  const fmt = (n: number) => formatMoney(n, currency);

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md space-y-md">
      <h3 className="text-headline-md font-semibold">Servicios financieros ({totals.year})</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div>
          <p className="text-label-sm text-text-muted">Comisiones</p>
          <p className="text-headline-md text-expense-rose font-semibold">
            {fmt(totals.costs.comisiones)}
          </p>
        </div>
        <div>
          <p className="text-label-sm text-text-muted">Intereses</p>
          <p className="text-headline-md text-expense-rose font-semibold">
            {fmt(totals.costs.intereses)}
          </p>
        </div>
        <div>
          <p className="text-label-sm text-text-muted">Multas</p>
          <p className="text-headline-md text-expense-rose font-semibold">
            {fmt(totals.costs.multas)}
          </p>
        </div>
      </div>
      <div className="pt-sm border-t border-outline-variant/20">
        <p className="text-label-sm text-text-muted">Ganancias por invertir</p>
        <p className="text-headline-md text-success-emerald font-semibold">
          {fmt(totals.investmentYield)}
        </p>
        <p className="text-label-sm text-on-surface-variant mt-xs">
          Mostradas por separado — no se netean con comisiones ni intereses.
        </p>
      </div>
    </div>
  );
}
