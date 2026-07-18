import { Navigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.tsx';
import { useAuth } from '../../lib/auth.tsx';
import { useBookGate } from '../../lib/use-book-gate.ts';

export interface ProPlaceholderPageProps {
  /** Full `/pro/*` path this screen is mounted at, for AppShell nav highlighting. */
  activePath: string;
  title: string;
  description: string;
}

/**
 * Minimal PRO namespace shell (US0/T009). Proves `/pro/*` destinations exist
 * so namespace-guard redirects never land on a 404. Real EntryBuilder
 * (T013+), accounts tree (T022+) and finances mount (T025+) replace this
 * placeholder content screen by screen.
 */
export default function ProPlaceholderPage({ activePath, title, description }: ProPlaceholderPageProps) {
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
    <AppShell mode="pro" activePath={activePath} userLabel={user.email} onLogout={() => void logout()}>
      <section className="max-w-xl">
        <h1 className="text-headline-lg text-on-surface font-bold mb-xs">{title}</h1>
        <p className="text-body-md text-on-surface-variant">{description}</p>
      </section>
    </AppShell>
  );
}
