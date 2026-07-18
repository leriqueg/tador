import { useMemo, useState, type FormEvent } from 'react';
import Button from '../ui/Button.tsx';
import TextInput from '../ui/TextInput.tsx';
import ValidationMessage from '../ui/ValidationMessage.tsx';
import type { AccountSummary } from '../../lib/api.ts';
import type { CreateEntryPayload } from './manual-entry-state.ts';
import {
  computeEntryDifference,
  createEmptyManualLine,
  friendlyManualEntryError,
  manualEntrySubmitBlockReason,
  toCreateEntryPayload,
  type ManualEntryFormState,
  type ManualEntryLine,
} from './manual-entry-state.ts';

export interface ManualEntryFormProps {
  accounts: AccountSummary[];
  onSubmit: (payload: CreateEntryPayload) => Promise<void>;
  error?: string;
  submitting?: boolean;
}

const TIPO_LABEL: Record<string, string> = {
  expenseCategory: 'Gasto',
  incomeCategory: 'Ingreso',
  bank: 'Banco',
  card: 'Tarjeta',
  wallet: 'Billetera',
  bridge: 'Puente',
};

function accountLabel(acc: AccountSummary): string {
  const code = acc.codigo ? `${acc.codigo} · ` : '';
  const tipo = TIPO_LABEL[acc.tipoCuenta] ?? acc.tipoCuenta;
  return `${code}${acc.nombre} (${tipo})`;
}

function initialState(): ManualEntryFormState {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    concepto: '',
    lineas: [createEmptyManualLine(), createEmptyManualLine()],
  };
}

export default function ManualEntryForm({
  accounts,
  onSubmit,
  error,
  submitting = false,
}: ManualEntryFormProps) {
  const [form, setForm] = useState<ManualEntryFormState>(initialState);
  const [localError, setLocalError] = useState('');

  const difference = useMemo(() => computeEntryDifference(form), [form]);
  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => (a.codigo ?? '').localeCompare(b.codigo ?? '')),
    [accounts],
  );

  function updateLine(id: string, patch: Partial<ManualEntryLine>) {
    setForm((prev) => ({
      ...prev,
      lineas: prev.lineas.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }));
  }

  function addLine() {
    setForm((prev) => ({ ...prev, lineas: [...prev.lineas, createEmptyManualLine()] }));
  }

  function removeLine(id: string) {
    setForm((prev) => ({
      ...prev,
      lineas: prev.lineas.length > 2 ? prev.lineas.filter((line) => line.id !== id) : prev.lineas,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError('');
    const block = manualEntrySubmitBlockReason(form);
    if (block) {
      setLocalError(block);
      return;
    }
    const payload = toCreateEntryPayload(form);
    if (!payload) {
      setLocalError('Revisá las líneas del asiento.');
      return;
    }
    try {
      await onSubmit(payload);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'No se pudo guardar el asiento';
      setLocalError(friendlyManualEntryError(raw));
    }
  }

  const displayError = localError || (error ? friendlyManualEntryError(error) : '');

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-md">
      {displayError && (
        <ValidationMessage tone="error">{displayError}</ValidationMessage>
      )}

      <TextInput
        label="Fecha"
        id="manual-fecha"
        name="manual-fecha"
        type="date"
        value={form.fecha}
        onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))}
      />

      <TextInput
        label="Concepto"
        id="manual-concepto"
        name="manual-concepto"
        value={form.concepto}
        onChange={(e) => setForm((prev) => ({ ...prev, concepto: e.target.value }))}
        autoComplete="off"
      />

      <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
        <table className="w-full text-body-md">
          <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
            <tr>
              <th className="text-left p-sm">Cuenta</th>
              <th className="text-right p-sm w-28">Débito</th>
              <th className="text-right p-sm w-28">Crédito</th>
              <th className="w-10" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {form.lineas.map((line) => (
              <tr key={line.id} role="row" className="border-t border-outline-variant/20">
                <td className="p-sm">
                  <label className="sr-only" htmlFor={`cuenta-${line.id}`}>
                    Cuenta
                  </label>
                  <select
                    id={`cuenta-${line.id}`}
                    value={line.cuentaId}
                    onChange={(e) => updateLine(line.id, { cuentaId: e.target.value })}
                    className="w-full h-10 px-sm rounded-lg border border-outline-variant bg-surface"
                  >
                    <option value="">Elegir cuenta…</option>
                    {sortedAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {accountLabel(acc)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-sm">
                  <label className="sr-only" htmlFor={`debito-${line.id}`}>
                    Débito
                  </label>
                  <input
                    id={`debito-${line.id}`}
                    inputMode="decimal"
                    value={line.debito}
                    onChange={(e) => updateLine(line.id, { debito: e.target.value })}
                    className="w-full h-10 px-sm rounded-lg border border-outline-variant bg-surface text-right"
                    placeholder="0.00"
                  />
                </td>
                <td className="p-sm">
                  <label className="sr-only" htmlFor={`credito-${line.id}`}>
                    Crédito
                  </label>
                  <input
                    id={`credito-${line.id}`}
                    inputMode="decimal"
                    value={line.credito}
                    onChange={(e) => updateLine(line.id, { credito: e.target.value })}
                    className="w-full h-10 px-sm rounded-lg border border-outline-variant bg-surface text-right"
                    placeholder="0.00"
                  />
                </td>
                <td className="p-sm text-center">
                  <button
                    type="button"
                    className="text-on-surface-variant hover:text-error text-label-sm"
                    aria-label="Quitar línea"
                    disabled={form.lineas.length <= 2}
                    onClick={() => removeLine(line.id)}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-md">
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          Agregar línea
        </Button>
        <p
          className="text-label-md text-on-surface-variant"
          data-testid="manual-entry-difference"
          aria-live="polite"
        >
          Diferencia: <span className="font-semibold text-on-surface">{difference}</span>
        </p>
      </div>

      <Button type="submit" fullWidth disabled={submitting}>
        {submitting ? 'Guardando…' : 'Guardar asiento'}
      </Button>
    </form>
  );
}
