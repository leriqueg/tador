import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import SimplePieChart from '../components/dashboard/SimplePieChart.tsx';
import ValidationMessage from '../components/ui/ValidationMessage.tsx';
import { reports, type PyGReport } from '../lib/api.ts';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';
import { formatMoney, MONTH_LABELS, monthFromSeries } from '../lib/finance.ts';

type Scope = 'year' | 'month';

/** Estado financiero P&G — Top 10, barras + línea (FR-007b). */
export default function FinancesPyg() {
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [scope, setScope] = useState<Scope>('year');
  const [pyg, setPyg] = useState<PyGReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const report = await reports.pyg(year);
        if (!cancelled) setPyg(report);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el P&G');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (gate.config?.initialized) void load();
    return () => {
      cancelled = true;
    };
  }, [year, gate.config?.initialized]);

  const currency = gate.config?.currency ?? 'USD';
  const fmt = (n: number) => formatMoney(n, currency);

  const display = useMemo(() => {
    if (!pyg) return null;
    if (scope === 'year') {
      return {
        title: `Ejercicio ${pyg.year}`,
        income: pyg.totalIncome,
        expenses: pyg.totalExpenses,
        net: pyg.netResult,
        series: pyg.monthlySeries,
      };
    }
    const m = monthFromSeries(pyg.monthlySeries, month);
    return {
      title: `${MONTH_LABELS[month]} ${pyg.year}`,
      income: m.income,
      expenses: m.expenses,
      net: m.balance,
      series: [m],
      note: 'Vista mes: períodos diarios llegan después; por ahora ves el total del mes.',
    };
  }, [pyg, scope, month]);

  if (authLoading || gate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (gate.redirectTo) return <Navigate to={gate.redirectTo} replace />;

  const maxBar = Math.max(
    1,
    ...(display?.series.flatMap((p) => [p.income, p.expenses]) ?? [1]),
  );

  return (
    <AppShell activePath="/finances" userLabel={user.email} onLogout={() => void logout()}>
      <div className="max-w-2xl mx-auto space-y-lg">
        <header>
          <Link to="/finances" className="text-label-md text-secondary no-underline mb-sm inline-block">
            ← Estado
          </Link>
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Estado financiero</h1>
          <p className="text-body-md text-on-surface-variant">
            Cómo entra y sale el dinero en tu hogar.
          </p>
        </header>

        <div className="flex flex-wrap gap-sm items-end">
          <div className="flex gap-xs p-1 bg-surface-container rounded-xl">
            {(['year', 'month'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`px-md py-xs rounded-lg text-label-md font-semibold cursor-pointer ${
                  scope === s ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                {s === 'year' ? 'Ejercicio' : 'Mes'}
              </button>
            ))}
          </div>
          <label className="text-label-md text-on-surface-variant">
            Año
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="ml-xs h-10 px-sm rounded-lg border border-outline-variant bg-surface-container-lowest"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          {scope === 'month' && (
            <label className="text-label-md text-on-surface-variant">
              Mes
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="ml-xs h-10 px-sm rounded-lg border border-outline-variant bg-surface-container-lowest"
              >
                {MONTH_LABELS.slice(1).map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && <ValidationMessage tone="error">{error}</ValidationMessage>}
        {loading && <p className="text-on-surface-variant">Cargando…</p>}

        {!loading && display && (
          <>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-lg space-y-md">
              <p className="text-label-sm text-text-muted uppercase tracking-wider">{display.title}</p>
              <h2 className="text-headline-xl text-primary font-bold">{fmt(display.net)}</h2>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <p className="text-label-sm text-text-muted">Ingresos</p>
                  <p className="text-headline-md text-success-emerald font-semibold">
                    {fmt(display.income)}
                  </p>
                </div>
                <div>
                  <p className="text-label-sm text-text-muted">Gastos</p>
                  <p className="text-headline-md text-expense-rose font-semibold">
                    {fmt(display.expenses)}
                  </p>
                </div>
              </div>
              {'note' in display && display.note && (
                <p className="text-label-sm text-on-surface-variant">{display.note}</p>
              )}
            </div>

            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
              <h3 className="text-headline-md font-semibold mb-md">Ingresos vs egresos</h3>
              <div className="h-40 flex items-end gap-1">
                {display.series.map((p) => (
                  <div
                    key={p.month}
                    className="flex-1 flex flex-col justify-end gap-0.5 min-w-0 relative"
                  >
                    <div
                      className="w-full bg-success-emerald/70 rounded-t-sm"
                      style={{
                        height: `${(p.income / maxBar) * 70}%`,
                        minHeight: p.income ? 4 : 0,
                      }}
                      title={`Ingresos ${MONTH_LABELS[p.month] ?? p.month}`}
                    />
                    <div
                      className="w-full bg-expense-rose/70 rounded-t-sm"
                      style={{
                        height: `${(p.expenses / maxBar) * 70}%`,
                        minHeight: p.expenses ? 4 : 0,
                      }}
                      title={`Gastos ${MONTH_LABELS[p.month] ?? p.month}`}
                    />
                    <span className="text-[10px] text-center text-outline mt-xs truncate">
                      {scope === 'year' ? MONTH_LABELS[p.month] : 'Mes'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-label-sm text-on-surface-variant mt-sm">
                Verde = ingresos · Rosa = egresos · Neto del período: {fmt(display.net)}
              </p>
            </div>

            {scope === 'year' && pyg && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <SimplePieChart title="Top 10 egresos" items={pyg.topExpenses} />
                <SimplePieChart title="Top 10 ingresos" items={pyg.topIncome} />
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
