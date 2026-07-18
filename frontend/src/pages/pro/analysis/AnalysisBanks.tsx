import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../../../components/layout/AppShell.tsx';
import CostYieldPanel from '../../../components/analysis/CostYieldPanel.tsx';
import BankMissingEntityBanner from '../../../components/analysis/BankMissingEntityBanner.tsx';
import ValidationMessage from '../../../components/ui/ValidationMessage.tsx';
import {
  accounts,
  balances,
  reports,
  type AccountSummary,
  type CostYieldTotals,
  type MonthlyBalancePoint,
} from '../../../lib/api.ts';
import { useAuth } from '../../../lib/auth.tsx';
import { useBookGate } from '../../../lib/use-book-gate.ts';
import { formatMoney, MONTH_LABELS } from '../../../lib/finance.ts';
import { namespacePaths } from '../../../lib/namespace-paths.ts';

/** PRO bank analysis — monthly balance + cost/yield panels (T014). */
export default function AnalysisBanks() {
  const paths = namespacePaths('pro');
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [bankAccounts, setBankAccounts] = useState<AccountSummary[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [monthly, setMonthly] = useState<MonthlyBalancePoint[]>([]);
  const [costYield, setCostYield] = useState<CostYieldTotals | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const selectedBank = useMemo(
    () => bankAccounts.find((a) => a.id === selectedBankId) ?? null,
    [bankAccounts, selectedBankId],
  );

  useEffect(() => {
    if (!gate.config?.initialized) return;
    void accounts
      .list()
      .then((res) => {
        const banks = res.accounts.filter((a) => a.tipoCuenta === 'bank' && a.activa);
        setBankAccounts(banks);
        setSelectedBankId((current) => current || (banks[0]?.id ?? ''));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las cuentas');
      });
  }, [gate.config?.initialized]);

  useEffect(() => {
    if (!gate.config?.initialized || !selectedBankId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      setCostYield(null);
      try {
        const monthlyRes = await balances.monthly(selectedBankId, year);
        if (cancelled) return;
        setMonthly(monthlyRes.mensual);

        const bank = bankAccounts.find((a) => a.id === selectedBankId);
        if (bank?.entidadId) {
          const totals = await reports.costYield(bank.entidadId, year);
          if (!cancelled) setCostYield(totals);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el análisis');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [gate.config?.initialized, selectedBankId, year, bankAccounts]);

  const currency = gate.config?.currency ?? 'USD';
  const fmt = (n: number) => formatMoney(n, currency);
  const maxBar = Math.max(1, ...monthly.map((p) => Math.abs(p.saldo)));

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
      <div className="max-w-2xl mx-auto space-y-lg">
        <header>
          <Link to={paths.analysis} className="text-label-md text-secondary no-underline mb-sm inline-block">
            ← Análisis
          </Link>
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Analizar bancos</h1>
          <p className="text-body-md text-on-surface-variant">
            Saldos mensuales y costos de servicios financieros atribuidos por entidad.
          </p>
        </header>

        <div className="flex flex-wrap gap-sm items-end">
          <label className="text-label-md text-on-surface-variant">
            Banco
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="ml-xs h-10 px-sm rounded-lg border border-outline-variant bg-surface-container-lowest block mt-xs"
            >
              {bankAccounts.length === 0 && <option value="">Sin cuentas banco</option>}
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="text-label-md text-on-surface-variant">
            Año
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="ml-xs h-10 px-sm rounded-lg border border-outline-variant bg-surface-container-lowest"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <ValidationMessage tone="error">{error}</ValidationMessage>}

        {selectedBank && !selectedBank.entidadId && (
          <BankMissingEntityBanner bankName={selectedBank.nombre} entitiesPath={paths.entities} />
        )}

        {loading && <p className="text-on-surface-variant">Cargando…</p>}

        {!loading && monthly.length > 0 && (
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
            <h3 className="text-headline-md font-semibold mb-md">Saldo mensual</h3>
            <div className="h-40 flex items-end gap-1">
              {monthly.map((p) => (
                <div key={p.mes} className="flex-1 flex flex-col justify-end min-w-0">
                  <div
                    className="w-full bg-primary/70 rounded-t-sm"
                    style={{
                      height: `${(Math.abs(p.saldo) / maxBar) * 70}%`,
                      minHeight: p.saldo ? 4 : 0,
                    }}
                    title={`${MONTH_LABELS[p.mes] ?? p.mes}: ${fmt(p.saldo)}`}
                  />
                  <span className="text-[10px] text-center text-outline mt-xs truncate">
                    {MONTH_LABELS[p.mes] ?? p.mes}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && costYield && <CostYieldPanel totals={costYield} currency={currency} />}
      </div>
    </AppShell>
  );
}
