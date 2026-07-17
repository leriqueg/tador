import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../../../components/layout/AppShell.tsx';
import CostYieldPanel from '../../../components/analysis/CostYieldPanel.tsx';
import RecentEntriesList from '../../../components/entries/RecentEntriesList.tsx';
import ValidationMessage from '../../../components/ui/ValidationMessage.tsx';
import {
  accounts,
  apuntes,
  reports,
  type AccountSummary,
  type ApunteSummary,
  type CostYieldTotals,
} from '../../../lib/api.ts';
import { useAuth } from '../../../lib/auth.tsx';
import { useBookGate } from '../../../lib/use-book-gate.ts';
import { namespacePaths } from '../../../lib/namespace-paths.ts';

function monthBounds(year: number, month: number): { dateFrom: string; dateTo: string } {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { dateFrom: from, dateTo: to };
}

/** PRO card analysis — apuntes list + cost panels (T015). */
export default function AnalysisCards() {
  const paths = namespacePaths('pro');
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cardAccounts, setCardAccounts] = useState<AccountSummary[]>([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [items, setItems] = useState<ApunteSummary[]>([]);
  const [costYield, setCostYield] = useState<CostYieldTotals | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const selectedCard = useMemo(
    () => cardAccounts.find((a) => a.id === selectedCardId) ?? null,
    [cardAccounts, selectedCardId],
  );

  useEffect(() => {
    if (!gate.config?.initialized) return;
    void accounts
      .list()
      .then((res) => {
        const cards = res.accounts.filter((a) => a.tipoCuenta === 'card' && a.activa);
        setCardAccounts(cards);
        setSelectedCardId((current) => current || (cards[0]?.id ?? ''));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las cuentas');
      });
  }, [gate.config?.initialized]);

  const loadData = useCallback(async () => {
    if (!selectedCardId) return;
    setLoading(true);
    setError('');
    setCostYield(null);
    try {
      const { dateFrom, dateTo } = monthBounds(year, month);
      const listRes = await apuntes.list({ accountId: selectedCardId, dateFrom, dateTo, limit: 50 });
      setItems(listRes.apuntes);

      const card = cardAccounts.find((a) => a.id === selectedCardId);
      if (card?.entidadId) {
        const totals = await reports.costYield(card.entidadId, year);
        setCostYield(totals);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el análisis');
    } finally {
      setLoading(false);
    }
  }, [selectedCardId, year, month, cardAccounts]);

  useEffect(() => {
    if (!gate.config?.initialized) return;
    void loadData();
  }, [gate.config?.initialized, loadData]);

  const currency = gate.config?.currency ?? 'USD';

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
          <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Analizar tarjetas</h1>
          <p className="text-body-md text-on-surface-variant">
            Movimientos del mes e intereses/multas atribuidos al emisor.
          </p>
        </header>

        <div className="flex flex-wrap gap-sm items-end">
          <label className="text-label-md text-on-surface-variant">
            Tarjeta
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="ml-xs h-10 px-sm rounded-lg border border-outline-variant bg-surface-container-lowest block mt-xs"
            >
              {cardAccounts.length === 0 && <option value="">Sin tarjetas</option>}
              {cardAccounts.map((a) => (
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
          <label className="text-label-md text-on-surface-variant">
            Mes
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="ml-xs h-10 px-sm rounded-lg border border-outline-variant bg-surface-container-lowest"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <ValidationMessage tone="error">{error}</ValidationMessage>}

        {selectedCard && !selectedCard.entidadId && (
          <ValidationMessage tone="warning" title={`${selectedCard.nombre} no tiene entidad vinculada`}>
            Los costos por entityId aparecerán cuando vincules la tarjeta con su emisor.
          </ValidationMessage>
        )}

        {loading && <p className="text-on-surface-variant">Cargando…</p>}

        {!loading && costYield && <CostYieldPanel totals={costYield} currency={currency} />}

        {!loading && (
          <section>
            <h2 className="text-headline-md font-semibold mb-md">Movimientos del mes</h2>
            <RecentEntriesList
              items={items}
              emptyMessage="No hay apuntes para esta tarjeta en el mes seleccionado."
            />
          </section>
        )}
      </div>
    </AppShell>
  );
}
