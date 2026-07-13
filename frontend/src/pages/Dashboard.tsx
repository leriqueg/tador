import { Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';

/** Authenticated home stub until full dashboard panels are wired (US2/US3). */
export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();

  if (authLoading || gate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (gate.redirectTo) {
    return <Navigate to={gate.redirectTo} replace />;
  }

  return (
    <AppShell activePath="/dashboard" userLabel={user.email} onLogout={() => void logout()}>
      <section className="max-w-2xl">
        <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Resumen</h1>
        <p className="text-body-md text-on-surface-variant mb-lg">
          Tu libro ya está listo. Pronto verás aquí tu posición y el resultado del período.
        </p>
        <p className="text-label-md text-on-surface-variant">
          Modo: <span className="font-semibold text-primary">{gate.config?.mode}</span>
          {' · '}
          Moneda: <span className="font-semibold text-primary">{gate.config?.currency}</span>
        </p>
      </section>
    </AppShell>
  );
}
