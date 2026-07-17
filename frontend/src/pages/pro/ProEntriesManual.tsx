import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.tsx';
import ManualEntryForm from '../../components/manual-entry/ManualEntryForm.tsx';
import ValidationMessage from '../../components/ui/ValidationMessage.tsx';
import { accounts, entries, type AccountSummary } from '../../lib/api.ts';
import { useAuth } from '../../lib/auth.tsx';
import { useBookGate } from '../../lib/use-book-gate.ts';
import type { CreateEntryPayload } from '../../components/manual-entry/manual-entry-state.ts';

/** PRO manual journal entry escape hatch (US3, T019). */
export default function ProEntriesManual() {
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();

  const [accountList, setAccountList] = useState<AccountSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setLoadError('');
    try {
      const res = await accounts.list();
      setAccountList(res.accounts);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar las cuentas');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(payload: CreateEntryPayload) {
    setSubmitting(true);
    setSubmitError('');
    setSuccess('');
    try {
      await entries.create(payload);
      setSuccess('Asiento guardado correctamente.');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo guardar el asiento');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

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
    <AppShell mode="pro" activePath="/pro/entries" userLabel={user.email} onLogout={() => void logout()}>
      <div className="max-w-2xl mx-auto">
        <header className="mb-lg">
          <p className="text-label-sm text-on-surface-variant mb-xs">
            <Link to="/pro/entries" className="text-primary underline">
              ← Volver a Apuntes PRO
            </Link>
          </p>
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Asiento manual</h1>
          <p className="text-body-md text-on-surface-variant">
            Registrá débitos y créditos balanceados cuando el constructor no cubre el caso.
          </p>
        </header>

        {loadError && (
          <div className="mb-md">
            <ValidationMessage tone="error">{loadError}</ValidationMessage>
          </div>
        )}

        {success && (
          <div className="mb-md">
            <ValidationMessage tone="success">{success}</ValidationMessage>
          </div>
        )}

        {loadingData ? (
          <p className="text-on-surface-variant">Cargando cuentas…</p>
        ) : (
          <ManualEntryForm
            accounts={accountList}
            onSubmit={handleSubmit}
            error={submitError}
            submitting={submitting}
          />
        )}
      </div>
    </AppShell>
  );
}
