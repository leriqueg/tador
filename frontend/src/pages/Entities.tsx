import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import Button from '../components/ui/Button.tsx';
import TextInput from '../components/ui/TextInput.tsx';
import {
  entities,
  type EntitySummary,
  type EntityTipo,
} from '../lib/api';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';

const TIPO_LABELS: Record<string, string> = {
  bank: 'Banco',
  card_issuer: 'Tarjeta',
  wallet_platform: 'Billetera virtual',
  person: 'Persona',
  organization: 'Organización',
};

const CREATE_TIPOS: { value: EntityTipo; label: string }[] = [
  { value: 'bank', label: 'Banco' },
  { value: 'card_issuer', label: 'Tarjeta' },
  { value: 'wallet_platform', label: 'Billetera virtual' },
  { value: 'person', label: 'Persona' },
];

/** Counterpart management + atomic account provision (FR-004 / US1c). */
export default function Entities() {
  const { user, loading: authLoading, logout } = useAuth();
  const gate = useBookGate();
  const [items, setItems] = useState<EntitySummary[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<EntityTipo>('bank');
  const [network, setNetwork] = useState('VISA');
  const [lastFour, setLastFour] = useState('');
  const [cutoffDay, setCutoffDay] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await entities.list();
      setItems(res.entities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar entidades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && gate.config?.initialized) void load();
  }, [user, gate.config?.initialized, load]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((e) => e.tipo === filter)),
    [items, filter],
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
      const cutoff = Number.parseInt(cutoffDay, 10);
      await entities.create({
        nombre: name,
        tipo,
        metadata:
          tipo === 'card_issuer'
            ? {
                network,
                ...(lastFour ? { lastFour } : {}),
                ...(Number.isInteger(cutoff) && cutoff >= 1 && cutoff <= 31
                  ? { cutoffDay: cutoff }
                  : {}),
              }
            : undefined,
      });
      setNombre('');
      setLastFour('');
      setCutoffDay('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell activePath="/hogar/entities" userLabel={user.email} onLogout={() => void logout()}>
      <section className="max-w-xl">
        <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Entidades</h1>
        <p className="text-body-md text-on-surface-variant mb-lg">
          Bancos, tarjetas, billeteras virtuales y personas. Al crearlas, TADOR arma la cuenta
          asociada. Las categorías de ingreso/gasto viven en{' '}
          <Link to="/hogar/accounts" className="underline text-primary">
            Cuentas
          </Link>
          .
        </p>

        {error && (
          <div className="mb-md bg-error-container text-on-error-container p-md rounded-lg text-body-md">
            {error}
          </div>
        )}

        <div className="mb-lg p-md rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-sm">
          <p className="text-label-md font-semibold text-on-surface mb-sm">Nueva entidad</p>
          <label className="text-label-md text-on-surface-variant mb-xs block" htmlFor="ent-tipo">
            Tipo
          </label>
          <select
            id="ent-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as EntityTipo)}
            className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-body-md"
          >
            {CREATE_TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <TextInput
            label="Nombre"
            id="ent-nombre"
            name="ent-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Banco Pichincha · PayPal · Juan"
            autoComplete="off"
          />
          {tipo === 'card_issuer' && (
            <>
              <label className="text-label-md text-on-surface-variant mb-xs block" htmlFor="ent-net">
                Red
              </label>
              <select
                id="ent-net"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-body-md"
              >
                <option value="VISA">VISA</option>
                <option value="MASTERCARD">Mastercard</option>
                <option value="AMEX">AMEX</option>
                <option value="OTRO">Otro</option>
              </select>
              <TextInput
                label="Últimos 4 (opcional)"
                id="ent-last4"
                name="ent-last4"
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                inputMode="numeric"
                autoComplete="off"
              />
              <TextInput
                label="Día de corte (opcional)"
                id="ent-cutoff"
                name="ent-cutoff"
                value={cutoffDay}
                onChange={(e) => setCutoffDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="1–31"
                inputMode="numeric"
                autoComplete="off"
              />
            </>
          )}
          <Button
            fullWidth
            className="rounded-xl mt-sm"
            disabled={saving || !nombre.trim()}
            onClick={() => void handleCreate()}
          >
            {saving ? 'Creando…' : 'Crear'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-xs mb-md">
          {[
            { id: 'all', label: 'Todas' },
            ...CREATE_TIPOS.map((t) => ({ id: t.value, label: t.label })),
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-md py-xs rounded-lg text-label-md cursor-pointer ${
                filter === f.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-body-md text-on-surface-variant">Cargando…</p>
        ) : visible.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">
            Todavía no hay entidades. Creá un banco o una tarjeta para empezar.
          </p>
        ) : (
          <ul className="space-y-xs">
            {visible.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-md p-md rounded-lg bg-surface-container-low"
              >
                <div>
                  <p className="text-body-md text-on-surface font-semibold">{e.nombre}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {TIPO_LABELS[e.tipo] ?? e.tipo}
                    {e.provisionedAccountId ? ' · cuenta creada' : ''}
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
