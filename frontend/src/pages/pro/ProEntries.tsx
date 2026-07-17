import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.tsx';
import EntryBuilder from '../../components/entry-builder/EntryBuilder.tsx';
import ValidationMessage from '../../components/ui/ValidationMessage.tsx';
import {
  accounts,
  apuntes,
  entities,
  type AccountSummary,
  type EntitySummary,
} from '../../lib/api.ts';
import { useAuth } from '../../lib/auth.tsx';
import { useBookGate } from '../../lib/use-book-gate.ts';
import { useAbandonGuard } from '../../lib/use-abandon-guard.ts';
import type { ApunteSubmitPayload } from '../../components/entry-builder/entry-builder-state.ts';
import type { EntityJitFormValues } from '../../components/entry-builder/EntityJitForm.tsx';

/** PRO capture — EntryBuilder replaces QuickAdd here; there is no template picker (US2, T014). */
export default function ProEntries() {
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();

  const [accountList, setAccountList] = useState<AccountSummary[]>([]);
  const [entityList, setEntityList] = useState<EntitySummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hasDraft, setHasDraft] = useState(false);

  useAbandonGuard(hasDraft);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setLoadError('');
    try {
      const [accountsRes, entitiesRes] = await Promise.all([accounts.list(), entities.list()]);
      setAccountList(accountsRes.accounts);
      setEntityList(entitiesRes.entities);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'No se pudieron cargar cuentas y entidades',
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(payload: ApunteSubmitPayload) {
    await apuntes.create({
      templateCode: payload.templateCode,
      date: payload.date,
      concept: payload.concept,
      amount: payload.amount,
      lines: payload.lines,
      entityId: payload.entityId ?? null,
    });
  }

  async function handleCreateEntity(values: EntityJitFormValues): Promise<EntitySummary> {
    const res = await entities.create({
      nombre: values.nombre,
      tipo: values.tipo,
      capabilities: values.capabilities,
    });
    return res.entity;
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
      <div className="max-w-lg mx-auto">
        <header className="mb-lg">
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Apuntes PRO</h1>
          <p className="text-body-md text-on-surface-variant">
            Construí el movimiento paso a paso: tipo, cuentas, entidad, concepto y monto.
          </p>
          <p className="text-label-sm mt-sm">
            <Link to="/pro/entries/manual" className="text-primary underline">
              Asiento manual
            </Link>{' '}
            — cuando el constructor no alcanza.
          </p>
        </header>

        {loadError && (
          <div className="mb-md">
            <ValidationMessage tone="error">{loadError}</ValidationMessage>
          </div>
        )}

        {loadingData ? (
          <p className="text-on-surface-variant">Cargando cuentas y entidades…</p>
        ) : (
          <EntryBuilder
            accounts={accountList}
            entities={entityList}
            onSubmit={handleSubmit}
            onCreateEntity={handleCreateEntity}
            onDraftChange={setHasDraft}
          />
        )}
      </div>
    </AppShell>
  );
}
