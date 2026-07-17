import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import Button from '../components/ui/Button.tsx';
import TextInput from '../components/ui/TextInput.tsx';
import { accounts, type AccountSummary } from '../lib/api';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';

type CategoryTipo = 'incomeCategory' | 'expenseCategory';

/** Hogar category admin only — no banks/cards/wallets saldos (FR-004b / US1d). */
export default function Accounts() {
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();
  const [items, setItems] = useState<AccountSummary[]>([]);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<CategoryTipo>('expenseCategory');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accounts.list();
      setItems(res.accounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar cuentas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && gate.config?.initialized) void load();
  }, [user, gate.config?.initialized, load]);

  const categories = useMemo(
    () =>
      items.filter(
        (a) => a.tipoCuenta === 'incomeCategory' || a.tipoCuenta === 'expenseCategory',
      ),
    [items],
  );

  if (authLoading || gate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (gate.redirectTo) return <Navigate to={gate.redirectTo} replace />;

  async function handleCreate() {
    const name = nombre.trim();
    if (!name) return;
    setError('');
    setSaving(true);
    try {
      await accounts.create({ tipoCuenta: tipo, nombre: name });
      setNombre('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell activePath="/accounts" userLabel={user.email} onLogout={() => void logout()}>
      <section className="max-w-xl">
        <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Cuentas</h1>
        <p className="text-body-md text-on-surface-variant mb-lg">
          Categorías de ingreso y gasto del hogar. Bancos, tarjetas y billeteras se gestionan en{' '}
          <Link to="/entities" className="underline text-primary">
            Entidades
          </Link>
          .
        </p>

        {error && (
          <div className="mb-md bg-error-container text-on-error-container p-md rounded-lg text-body-md">
            {error}
          </div>
        )}

        <div className="mb-lg p-md rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-sm">
          <p className="text-label-md font-semibold text-on-surface mb-sm">Nueva categoría</p>
          <label className="text-label-md text-on-surface-variant mb-xs block" htmlFor="acc-tipo">
            Tipo
          </label>
          <select
            id="acc-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as CategoryTipo)}
            className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-body-md"
          >
            <option value="expenseCategory">Gasto</option>
            <option value="incomeCategory">Ingreso</option>
          </select>
          <TextInput
            label="Nombre"
            id="acc-nombre"
            name="acc-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Supermercado · Sueldo"
            autoComplete="off"
          />
          <Button
            fullWidth
            className="rounded-xl mt-sm"
            disabled={saving || !nombre.trim()}
            onClick={() => void handleCreate()}
          >
            {saving ? 'Creando…' : 'Crear categoría'}
          </Button>
        </div>

        {loading ? (
          <p className="text-body-md text-on-surface-variant">Cargando…</p>
        ) : categories.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">
            Todavía no hay categorías propias. Podés usar las del plan en Apuntes y crear las tuyas
            acá cuando hace falta.
          </p>
        ) : (
          <ul className="space-y-xs">
            {categories.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-md p-md rounded-lg bg-surface-container-low"
              >
                <div>
                  <p className="text-body-md text-on-surface font-semibold">{a.nombre}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {a.tipoCuenta === 'incomeCategory' ? 'Ingreso' : 'Gasto'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
