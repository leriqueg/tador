import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import RecentEntriesList from '../components/entries/RecentEntriesList.tsx';
import Button from '../components/ui/Button.tsx';
import TextInput from '../components/ui/TextInput.tsx';
import ValidationMessage from '../components/ui/ValidationMessage.tsx';
import { accounts, apuntes, type AccountSummary, type ApunteSummary } from '../lib/api.ts';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';
import { namespacePaths, type AppNamespace } from '../lib/namespace-paths.ts';

export interface FinancesApuntesProps {
  namespace?: AppNamespace;
}

/** Historial filtrable de apuntes (FR-007d). */
export default function FinancesApuntes({ namespace = 'hogar' }: FinancesApuntesProps) {
  const paths = namespacePaths(namespace);
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();
  const navigate = useNavigate();

  const [items, setItems] = useState<ApunteSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [accountOptions, setAccountOptions] = useState<AccountSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [q, setQ] = useState('');
  const [accountId, setAccountId] = useState('');

  const search = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apuntes.list({
        limit: 50,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        amountMin: amountMin ? Number(amountMin) : undefined,
        amountMax: amountMax ? Number(amountMax) : undefined,
        q: q.trim() || undefined,
        accountId: accountId || undefined,
      });
      setItems(res.apuntes);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo buscar');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, amountMin, amountMax, q, accountId]);

  useEffect(() => {
    if (!gate.config?.initialized) return;
    void accounts.list().then((r) => setAccountOptions(r.accounts)).catch(() => {});
    void search();
  }, [gate.config?.initialized, search]);

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
      <div className="max-w-lg mx-auto space-y-lg">
        <header>
          <Link to={paths.finances} className="text-label-md text-secondary no-underline mb-sm inline-block">
            ← Estado
          </Link>
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Todos tus apuntes</h1>
          <p className="text-body-md text-on-surface-variant">
            ¿Se te pasó algo por alto? Filtrá y corregí.
          </p>
        </header>

        <div className="rounded-xl border-2 border-secondary/20 bg-secondary/5 p-md space-y-sm">
          <TextInput
            label="Descripción"
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. luz, supermercado…"
          />
          <div className="grid grid-cols-2 gap-sm">
            <TextInput
              label="Desde"
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <TextInput
              label="Hasta"
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-sm">
            <TextInput
              label="Monto mín."
              id="amountMin"
              inputMode="decimal"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              placeholder="0"
            />
            <TextInput
              label="Monto máx."
              id="amountMax"
              inputMode="decimal"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              placeholder="9999"
            />
          </div>
          <label className="text-label-md text-on-surface-variant block">
            Cuenta
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-xs w-full h-12 px-md rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
            >
              <option value="">Todas</option>
              {accountOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
          <Button fullWidth className="rounded-xl mt-sm" onClick={() => void search()}>
            Buscar
          </Button>
        </div>

        {error && <ValidationMessage tone="error">{error}</ValidationMessage>}
        {loading ? (
          <p className="text-on-surface-variant">Buscando…</p>
        ) : (
          <>
            <p className="text-label-md text-on-surface-variant">{total} resultado(s)</p>
            <RecentEntriesList
              items={items}
              emptyMessage="No hay apuntes con esos filtros."
              onEdit={(item) => {
                navigate(paths.editApunte(item.id));
              }}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
