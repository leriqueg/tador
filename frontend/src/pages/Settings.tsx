import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.tsx';
import Button from '../components/ui/Button.tsx';
import TextInput from '../components/ui/TextInput.tsx';
import { auth, book } from '../lib/api';
import { useAuth } from '../lib/auth.tsx';
import { useBookGate } from '../lib/use-book-gate.ts';
import {
  CURATED_TIME_ZONES,
  detectDefaultTimeZone,
} from '../lib/time-zones.ts';

/** Profile + book preferences (FR-004c): currency readonly, timezone + fullName editable. */
export default function Settings() {
  const { user, loading: authLoading, logout, refresh } = useAuth();
  const gate = useBookGate();
  const [fullName, setFullName] = useState('');
  const [timeZone, setTimeZone] = useState('UTC');
  const [currency, setCurrency] = useState('');
  const [currencyLocked, setCurrencyLocked] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setFullName(user.fullName ?? '');
  }, [user]);

  useEffect(() => {
    if (!gate.config) return;
    setTimeZone(gate.config.timeZone || detectDefaultTimeZone());
    setCurrency(gate.config.currency);
    setCurrencyLocked(gate.config.currencyLocked);
  }, [gate.config]);

  if (authLoading || gate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (gate.redirectTo) return <Navigate to={gate.redirectTo} replace />;

  async function handleSave() {
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await auth.updateProfile({ fullName: fullName.trim() || null });
      await book.updateConfig({ timeZone });
      await refresh();
      await gate.reload();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell activePath="/hogar/settings" userLabel={user.email} onLogout={() => void logout()}>
      <section className="max-w-lg">
        <h1 className="text-headline-lg text-on-surface font-bold mb-xs">Ajustes</h1>
        <p className="text-body-md text-on-surface-variant mb-lg">
          Perfil y preferencias del libro. El email y la contraseña no se cambian en este MVP.
        </p>

        {error && (
          <div className="mb-md bg-error-container text-on-error-container p-md rounded-lg text-body-md">
            {error}
          </div>
        )}
        {saved && (
          <div className="mb-md bg-secondary-container text-on-secondary-container p-md rounded-lg text-body-md">
            Guardado.
          </div>
        )}

        <TextInput
          label="Nombre"
          id="full-name"
          name="full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Cómo querés que te llamemos"
          autoComplete="name"
          className="mb-md"
        />

        <label className="text-label-md text-on-surface-variant mb-xs block" htmlFor="email-ro">
          Email
        </label>
        <input
          id="email-ro"
          value={user.email}
          readOnly
          className="w-full h-12 px-md mb-md rounded-lg border border-outline-variant/40 bg-surface-container-low text-body-md text-on-surface-variant"
        />

        <label className="text-label-md text-on-surface-variant mb-xs block" htmlFor="currency-ro">
          Moneda del libro
        </label>
        <input
          id="currency-ro"
          value={currency}
          readOnly
          className="w-full h-12 px-md mb-xs rounded-lg border border-outline-variant/40 bg-surface-container-low text-body-md text-on-surface-variant"
        />
        <p className="text-label-sm text-outline mb-md">
          {currencyLocked
            ? 'Bloqueada porque ya hay movimientos.'
            : 'Se elige en el onboarding; después solo lectura en Ajustes.'}
        </p>

        <label className="text-label-md text-on-surface-variant mb-xs block" htmlFor="tz">
          Zona horaria
        </label>
        <select
          id="tz"
          value={timeZone}
          onChange={(e) => setTimeZone(e.target.value)}
          className="w-full h-12 px-md mb-xl rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
        >
          {CURATED_TIME_ZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>

        <Button fullWidth size="lg" className="rounded-xl" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </section>
    </AppShell>
  );
}
