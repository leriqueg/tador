export interface MonthlyPoint {
  month: number;
  income: number;
  expenses: number;
  balance: number;
}

export interface PygPanelHogarProps {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  monthlySeries?: MonthlyPoint[];
  currencyFormat?: (n: number) => string;
}

function defaultFormat(n: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

/** Hogar PYG summary — no account codes (FR-H-001/002/006). */
export default function PygPanelHogar({
  year,
  totalIncome,
  totalExpenses,
  netResult,
  monthlySeries = [],
  currencyFormat = defaultFormat,
}: PygPanelHogarProps) {
  const maxBar = Math.max(
    1,
    ...monthlySeries.flatMap((m) => [m.income, m.expenses]),
  );

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-lg ambient-shadow border border-outline-variant/20 space-y-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-label-sm text-text-muted uppercase tracking-wider">Resultado {year}</p>
          <h3 className="text-headline-xl text-primary font-bold mt-xs">{currencyFormat(netResult)}</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-md">
        <div>
          <p className="text-label-sm text-text-muted">Ingresos</p>
          <p className="text-headline-md text-success-emerald font-semibold">{currencyFormat(totalIncome)}</p>
        </div>
        <div>
          <p className="text-label-sm text-text-muted">Gastos</p>
          <p className="text-headline-md text-expense-rose font-semibold">{currencyFormat(totalExpenses)}</p>
        </div>
      </div>
      {monthlySeries.length > 0 && (
        <div className="h-28 flex items-end gap-1">
          {monthlySeries.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col justify-end gap-0.5 min-w-0">
              <div
                className="w-full bg-success-emerald/70 rounded-t-sm"
                style={{ height: `${(m.income / maxBar) * 100}%`, minHeight: m.income ? 4 : 0 }}
                title={`Ingresos mes ${m.month}`}
              />
              <div
                className="w-full bg-expense-rose/70 rounded-t-sm"
                style={{ height: `${(m.expenses / maxBar) * 100}%`, minHeight: m.expenses ? 4 : 0 }}
                title={`Gastos mes ${m.month}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
