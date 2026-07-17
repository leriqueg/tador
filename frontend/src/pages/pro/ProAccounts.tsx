import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.tsx';
import AccountsTreePro from '../../components/accounts-tree/AccountsTreePro.tsx';
import ValidationMessage from '../../components/ui/ValidationMessage.tsx';
import { accounts, balances, chart, type AccountSummary, type CreateAccountInput } from '../../lib/api.ts';
import { useAuth } from '../../lib/auth.tsx';
import { useBookGate } from '../../lib/use-book-gate.ts';

/** PRO accounts tree with codes, mothers and balances (US4, T022–T023). */
export default function ProAccounts() {
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();

  const [accountList, setAccountList] = useState<AccountSummary[]>([]);
  const [chartNodes, setChartNodes] = useState<Awaited<ReturnType<typeof chart.list>>['chart']>([]);
  const [balanceMap, setBalanceMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [accountsRes, chartRes] = await Promise.all([accounts.list(), chart.list()]);
      setAccountList(accountsRes.accounts);
      setChartNodes(chartRes.chart);

      const saldoEntries = await Promise.all(
        accountsRes.accounts.map(async (acc) => {
          try {
            const res = await balances.get(acc.id);
            return [acc.id, res.saldo] as const;
          } catch {
            return [acc.id, undefined] as const;
          }
        }),
      );
      const map: Record<string, number> = {};
      for (const [id, saldo] of saldoEntries) {
        if (saldo != null) map[id] = saldo;
      }
      setBalanceMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las cuentas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && gate.config?.initialized) void load();
  }, [user, gate.config?.initialized, load]);

  async function handleCreateAccount(input: CreateAccountInput) {
    await accounts.create(input);
    await load();
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
    <AppShell mode="pro" activePath="/pro/accounts" userLabel={user.email} onLogout={() => void logout()}>
      <section className="max-w-2xl">
        <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Cuentas PRO</h1>
        <p className="text-body-md text-on-surface-variant mb-lg">
          Árbol con códigos y saldos. Bancos y tarjetas se crean desde{' '}
          <Link to="/pro/entities" className="underline text-primary">
            Entidades
          </Link>
          .
        </p>

        {error && (
          <div className="mb-md">
            <ValidationMessage tone="error">{error}</ValidationMessage>
          </div>
        )}

        {loading ? (
          <p className="text-body-md text-on-surface-variant">Cargando árbol…</p>
        ) : (
          <AccountsTreePro
            chart={chartNodes}
            accounts={accountList}
            balances={balanceMap}
            onCreateAccount={handleCreateAccount}
          />
        )}
      </section>
    </AppShell>
  );
}
