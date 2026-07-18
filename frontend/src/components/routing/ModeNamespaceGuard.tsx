import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useBookGate } from '../../lib/use-book-gate.ts';
import { resolveNamespaceRedirect } from '../../lib/namespace-guard.ts';

/**
 * Layout route (US0): keeps `/hogar/*` and `/pro/*` screens separated by
 * `BookConfig.mode`, and migrates legacy unprefixed routes to the right
 * namespace. Renders nothing while the book config is still loading to
 * avoid a redirect flicker to the wrong namespace.
 */
export default function ModeNamespaceGuard() {
  const location = useLocation();
  const gate = useBookGate();

  if (gate.loading) return null;

  const mode = gate.config?.mode ?? 'hogar';
  const redirectTo = resolveNamespaceRedirect(location.pathname, mode);
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
