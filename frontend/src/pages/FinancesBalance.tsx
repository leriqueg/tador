import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import PositionPanel from '../components/dashboard/PositionPanel.tsx';
import ValidationMessage from '../components/ui/ValidationMessage.tsx';
import { reports, type PositionReport } from '../lib/api.ts';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';
import { formatMoney, leverageHint, leverageRatio } from '../lib/finance.ts';

/** Estado de Balance — posición + breakdown (FR-007c). */
export default function FinancesBalance() {
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();
  const [position, setPosition] = useState<PositionReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const pos = await reports.position();
        if (!cancelled) setPosition(pos);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el balance');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (gate.config?.initialized) void load();
    return () => {
      cancelled = true;
    };
  }, [gate.config?.initialized]);

  if (authLoading || gate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (gate.redirectTo) return <Navigate to={gate.redirectTo} replace />;

  const currency = gate.config?.currency ?? 'USD';
  const fmt = (n: number) => formatMoney(n, currency);
  const hint =
    position != null
      ? leverageHint(leverageRatio(position.totalAvailable, position.totalPayables))
      : null;

  return (
    <AppShell activePath="/finances" userLabel={user.email} onLogout={() => void logout()}>
      <div className="max-w-2xl mx-auto space-y-lg">
        <header>
          <Link to="/finances" className="text-label-md text-secondary no-underline mb-sm inline-block">
            ← Estado
          </Link>
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Estado de Balance</h1>
          <p className="text-body-md text-on-surface-variant">
            Lo que tenés, lo que te deben y lo que debés.
          </p>
        </header>

        {error && <ValidationMessage tone="error">{error}</ValidationMessage>}
        {loading && <p className="text-on-surface-variant">Cargando…</p>}

        {!loading && position && (
          <>
            <PositionPanel
              disponible={position.totalAvailable}
              porCobrar={position.totalReceivables}
              deudas={position.totalPayables}
              currencyFormat={fmt}
            />

            {hint && (
              <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-md">
                <p className="text-label-md font-semibold text-secondary mb-xs">Lectura rápida</p>
                <p className="text-body-md text-on-surface-variant">{hint}</p>
              </div>
            )}

            <BalanceGroup title="Disponible (bancos y billeteras)" items={position.breakdown.available} fmt={fmt} />
            <BalanceGroup title="Me deben" items={position.breakdown.receivables} fmt={fmt} />
            <BalanceGroup title="Deudas (tarjetas, préstamos…)" items={position.breakdown.payables} fmt={fmt} />
          </>
        )}
      </div>
    </AppShell>
  );
}

function BalanceGroup({
  title,
  items,
  fmt,
}: {
  title: string;
  items: Array<{ accountId: string; accountName: string; balance: number }>;
  fmt: (n: number) => string;
}) {
  return (
    <section>
      <h2 className="text-headline-md font-semibold text-on-surface mb-sm">{title}</h2>
      {items.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">Sin saldos en este grupo.</p>
      ) : (
        <ul className="divide-y divide-outline-variant/30 rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden">
          {items.map((item) => (
            <li key={item.accountId} className="flex justify-between gap-md px-md py-sm">
              <span className="text-label-md text-on-surface truncate">{item.accountName}</span>
              <span className="text-label-md font-semibold tabular-nums shrink-0">{fmt(item.balance)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
