import { Link, Navigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.tsx';
import Icon from '../../components/ui/Icon.tsx';
import { useAuth } from '../../lib/auth.tsx';
import { useBookGate } from '../../lib/use-book-gate.ts';
import { namespacePaths } from '../../lib/namespace-paths.ts';

const ANALYSIS_CARDS = [
  {
    toKey: 'analysisBanks' as const,
    icon: 'account_balance',
    title: 'Analizar bancos',
    body: 'Saldos mensuales, comisiones, intereses y ganancias por invertir.',
  },
  {
    toKey: 'analysisCards' as const,
    icon: 'credit_card',
    title: 'Analizar tarjetas',
    body: 'Movimientos del mes e intereses/multas del emisor.',
  },
  {
    toKey: 'analysisPortfolio' as const,
    icon: 'groups',
    title: 'Analizar cartera',
    body: 'Cuentas por cobrar vs por pagar por entidad.',
  },
] as const;

/** PRO analysis landing (T013). */
export default function ProAnalysis() {
  const paths = namespacePaths('pro');
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();

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
      <div className="max-w-lg mx-auto">
        <header className="mb-lg">
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Análisis PRO</h1>
          <p className="text-body-md text-on-surface-variant">
            Recortes analíticos por banco, tarjeta y cartera — separados del P&G general.
          </p>
        </header>

        <ul className="space-y-md">
          {ANALYSIS_CARDS.map((card) => (
            <li key={card.toKey}>
              <Link
                to={paths[card.toKey]}
                className="flex gap-md p-md rounded-xl border-2 border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40 no-underline transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon name={card.icon} className="text-2xl" />
                </div>
                <div className="min-w-0">
                  <p className="text-headline-md font-semibold text-on-surface mb-xs">{card.title}</p>
                  <p className="text-body-md text-on-surface-variant">{card.body}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
