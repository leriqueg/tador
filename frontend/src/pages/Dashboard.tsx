import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import PygPanelHogar from '../components/dashboard/PygPanelHogar.tsx';
import PositionPanel from '../components/dashboard/PositionPanel.tsx';
import Button from '../components/ui/Button.tsx';
import ValidationMessage from '../components/ui/ValidationMessage.tsx';
import { reports, type PyGReport, type PositionReport } from '../lib/api.ts';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';
import { formatMoney, monthFromSeries, MONTH_LABELS } from '../lib/finance.ts';
import { namespacePaths, type AppNamespace } from '../lib/namespace-paths.ts';

type HubPeriod = 'month' | 'year';

export interface DashboardProps {
  namespace?: AppNamespace;
}

/** Hub informativo — mes default; no es el P&G completo (FR-007). */
export default function Dashboard({ namespace = 'hogar' }: DashboardProps) {
  const paths = namespacePaths(namespace);
  const title = namespace === 'pro' ? 'Resumen PRO' : 'Resumen';
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [period, setPeriod] = useState<HubPeriod>('month');
  const [pyg, setPyg] = useState<PyGReport | null>(null);
  const [position, setPosition] = useState<PositionReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [p, pos] = await Promise.all([reports.pyg(year), reports.position()]);
        if (!cancelled) {
          setPyg(p);
          setPosition(pos);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen');
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

  if (authLoading || gate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (gate.redirectTo) return <Navigate to={gate.redirectTo} replace />;

  const monthPoint = pyg ? monthFromSeries(pyg.monthlySeries, month) : null;
  const currency = gate.config?.currency ?? 'USD';
  const fmt = (n: number) => formatMoney(n, currency);

  return (
    <AppShell
      mode={namespace}
      activePath={paths.dashboard}
      userLabel={user.email}
      onLogout={() => void logout()}
    >
      <div className="max-w-2xl mx-auto space-y-lg">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-md">
          <div>
            <h1 className="text-headline-lg text-on-surface font-bold mb-xs">{title}</h1>
            <p className="text-body-md text-on-surface-variant">
              Cómo vas ahora — el detalle está en Estado.
            </p>
          </div>
          <div className="flex gap-xs p-1 bg-surface-container rounded-xl self-start">
            {(['month', 'year'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-md py-xs rounded-lg text-label-md font-semibold cursor-pointer ${
                  period === p ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                {p === 'month' ? 'Este mes' : 'Este año'}
              </button>
            ))}
          </div>
        </header>

        {error && <ValidationMessage tone="error">{error}</ValidationMessage>}
        {loading && <p className="text-on-surface-variant">Cargando resumen…</p>}

        {!loading && pyg && monthPoint && (
          <>
            {period === 'month' ? (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-lg ambient-shadow space-y-md">
                <p className="text-label-sm text-text-muted uppercase tracking-wider">
                  {MONTH_LABELS[month]} {year}
                </p>
                <h2 className="text-headline-xl text-primary font-bold">{fmt(monthPoint.balance)}</h2>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <p className="text-label-sm text-text-muted">Ingresos</p>
                    <p className="text-headline-md text-success-emerald font-semibold">
                      {fmt(monthPoint.income)}
                    </p>
                  </div>
                  <div>
                    <p className="text-label-sm text-text-muted">Gastos</p>
                    <p className="text-headline-md text-expense-rose font-semibold">
                      {fmt(monthPoint.expenses)}
                    </p>
                  </div>
                </div>
                {monthPoint.income === 0 && monthPoint.expenses === 0 && (
                  <p className="text-body-md text-on-surface-variant">
                    Todavía no hay movimientos este mes.{' '}
                    <Link to={paths.entries} className="text-primary underline font-semibold">
                      Registrar un apunte
                    </Link>
                  </p>
                )}
              </div>
            ) : (
              <PygPanelHogar
                year={pyg.year}
                totalIncome={pyg.totalIncome}
                totalExpenses={pyg.totalExpenses}
                netResult={pyg.netResult}
                monthlySeries={pyg.monthlySeries}
                currencyFormat={fmt}
              />
            )}

            <section className="rounded-xl border border-primary/15 bg-primary/5 p-md">
              <p className="text-label-md font-semibold text-primary mb-xs">Consejo</p>
              <p className="text-body-md text-on-surface-variant">
                {period === 'month' && monthPoint.expenses > monthPoint.income && monthPoint.expenses > 0
                  ? `Este mes gastaste ${fmt(monthPoint.expenses - monthPoint.income)} más de lo que ingresó.`
                  : 'Revisá tu Estado financiero cuando quieras ver categorías y el año completo.'}
              </p>
            </section>
          </>
        )}

        {!loading && position && (
          <section className="space-y-sm">
            <h2 className="text-headline-md font-semibold text-on-surface">Lo que tengo y lo que debo</h2>
            <PositionPanel
              disponible={position.totalAvailable}
              porCobrar={position.totalReceivables}
              deudas={position.totalPayables}
              currencyFormat={fmt}
            />
          </section>
        )}

        <Button to={paths.finances} fullWidth size="lg" className="rounded-xl" variant="outline">
          Ver Estado financiero y Balance
        </Button>
      </div>
    </AppShell>
  );
}
