import { Link, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import Icon from '../components/ui/Icon.tsx';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';
import { namespacePaths, type AppNamespace } from '../lib/namespace-paths.ts';

export interface FinancesProps {
  namespace?: AppNamespace;
}

function financeCards(namespace: AppNamespace) {
  const paths = namespacePaths(namespace);
  const scope = namespace === 'pro' ? 'tu negocio' : 'tu hogar';
  return [
    {
      to: paths.financesPyg,
      icon: 'monitoring',
      title: 'Estado financiero (P&G)',
      body: `Para saber y conocer cómo entra y sale el dinero en ${scope}.`,
    },
    {
      to: paths.financesBalance,
      icon: 'account_balance',
      title: 'Estado de Balance',
      body: 'Para conocer lo que tenés, lo que te deben y lo que debés.',
    },
    {
      to: paths.financesApuntes,
      icon: 'search',
      title: 'Revisar apuntes',
      body: '¿Se te pasó algo por alto? Revisá todos tus apuntes.',
    },
  ] as const;
}

/** Landing explicativa — sin menú de 2 niveles (FR-007a). */
export default function Finances({ namespace = 'hogar' }: FinancesProps) {
  const paths = namespacePaths(namespace);
  const title = namespace === 'pro' ? 'Estado PRO' : 'Estado';
  const cards = financeCards(namespace);
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
    <AppShell
      mode={namespace}
      activePath={paths.finances}
      userLabel={user.email}
      onLogout={() => void logout()}
    >
      <div className="max-w-lg mx-auto">
        <header className="mb-lg">
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">{title}</h1>
          <p className="text-body-md text-on-surface-variant">
            Elegí qué querés revisar. El resumen del día a día sigue en Resumen.
          </p>
        </header>

        <ul className="space-y-md">
          {cards.map((card) => (
            <li key={card.to}>
              <Link
                to={card.to}
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
