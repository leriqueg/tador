import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../../../components/layout/AppShell.tsx';
import ValidationMessage from '../../../components/ui/ValidationMessage.tsx';
import { reports, type PortfolioEntityEntry } from '../../../lib/api.ts';
import { useAuth } from '../../../lib/auth.tsx';
import { useBookGate } from '../../../lib/use-book-gate.ts';
import { formatMoney } from '../../../lib/finance.ts';
import { namespacePaths } from '../../../lib/namespace-paths.ts';

/** PRO portfolio — CxC vs CxP by entity (T016). */
export default function AnalysisPortfolio() {
  const paths = namespacePaths('pro');
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();
  const [entities, setEntities] = useState<PortfolioEntityEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gate.config?.initialized) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const report = await reports.portfolio();
        if (!cancelled) setEntities(report.entities);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar la cartera');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [gate.config?.initialized]);

  const currency = gate.config?.currency ?? 'USD';
  const fmt = (n: number) => formatMoney(n, currency);

  if (authLoading || gate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (gate.redirectTo) return <Navigate to={gate.redirectTo} replace />;

  return (
    <AppShell mode="pro" activePath={paths.analysis} userLabel={user.email} onLogout={() => void logout()}>
      <div className="max-w-2xl mx-auto space-y-lg">
        <header>
          <Link to={paths.analysis} className="text-label-md text-secondary no-underline mb-sm inline-block">
            ← Análisis
          </Link>
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Analizar cartera</h1>
          <p className="text-body-md text-on-surface-variant">
            Cuentas por cobrar vs por pagar agrupadas por entidad.
          </p>
        </header>

        {error && <ValidationMessage tone="error">{error}</ValidationMessage>}
        {loading && <p className="text-on-surface-variant">Cargando…</p>}

        {!loading && entities.length === 0 && (
          <p className="text-body-md text-on-surface-variant">
            No hay saldos por cobrar o pagar vinculados a entidades todavía.
          </p>
        )}

        {!loading && entities.length > 0 && (
          <ul className="space-y-md">
            {entities.map((entry) => (
              <li
                key={entry.entityId}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md"
              >
                <h2 className="text-headline-md font-semibold mb-sm">{entry.entityName}</h2>
                <div className="grid grid-cols-3 gap-md">
                  <div>
                    <p className="text-label-sm text-text-muted">Por cobrar</p>
                    <p className="text-headline-md text-success-emerald font-semibold">
                      {fmt(entry.receivables)}
                    </p>
                  </div>
                  <div>
                    <p className="text-label-sm text-text-muted">Por pagar</p>
                    <p className="text-headline-md text-expense-rose font-semibold">
                      {fmt(entry.payables)}
                    </p>
                  </div>
                  <div>
                    <p className="text-label-sm text-text-muted">Neto</p>
                    <p className="text-headline-md text-primary font-semibold">{fmt(entry.net)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
