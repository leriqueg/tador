import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button.tsx';
import Icon from '../ui/Icon.tsx';
import TextInput from '../ui/TextInput.tsx';
import ValidationMessage from '../ui/ValidationMessage.tsx';
import type { PlantillaDetail } from '../../lib/api.ts';
import { readLastAccount, writeLastAccount } from '../../lib/plantilla-meta.ts';

export interface ApunteMiniFormValues {
  templateCode: string;
  amount: number;
  date: string;
  concept: string;
  lines: Array<{ id: number; accountId: string }>;
  stickyAccountId: string;
}

export interface ApunteMiniFormInitialValues {
  amount: string;
  date: string;
  concept: string;
  accountByLine: Record<number, string>;
}

export interface ApunteMiniFormProps {
  plantilla: PlantillaDetail;
  error?: string;
  submitting?: boolean;
  /** Create vs edit an existing capture */
  mode?: 'create' | 'edit';
  initialValues?: ApunteMiniFormInitialValues;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (values: ApunteMiniFormValues) => void;
  onCancel?: () => void;
}

/** Mini-form: labeled account picks + amount + description — no ledger codes (FR-005b). */
export default function ApunteMiniForm({
  plantilla,
  error,
  submitting = false,
  mode = 'create',
  initialValues,
  submitLabel = 'Guardar',
  cancelLabel = 'Cambiar plantilla',
  onSubmit,
  onCancel,
}: ApunteMiniFormProps) {
  const isEdit = mode === 'edit';
  const sticky = readLastAccount(plantilla.code);

  const initialSelections = useMemo(() => {
    const map: Record<number, string> = {};
    const used = new Set<string>();
    // Prefer debit then credit so opposing sides get distinct defaults when possible
    const ordered = [
      ...plantilla.lines.filter((l) => l.side === 'debit'),
      ...plantilla.lines.filter((l) => l.side === 'credit'),
      ...plantilla.lines.filter((l) => l.side !== 'debit' && l.side !== 'credit'),
    ];
    for (const line of ordered) {
      const available = line.availableAccounts ?? [];
      if (available.length === 0) continue;
      const stickyOk =
        sticky &&
        available.some((a) => a.id === sticky) &&
        !used.has(sticky);
      if (stickyOk && sticky) {
        map[line.id] = sticky;
        used.add(sticky);
        continue;
      }
      const pick =
        available.find((a) => a.tipo === 'usuario' && !used.has(a.id)) ??
        available.find((a) => !used.has(a.id)) ??
        available[0];
      if (pick) {
        map[line.id] = pick.id;
        used.add(pick.id);
      }
    }
    return map;
  }, [plantilla, sticky]);

  const [accountByLine, setAccountByLine] = useState<Record<number, string>>(initialSelections);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [concept, setConcept] = useState('');

  useEffect(() => {
    if (initialValues) {
      setAccountByLine(initialValues.accountByLine);
      setAmount(initialValues.amount);
      setConcept(initialValues.concept);
      setDate(initialValues.date);
      return;
    }
    setAccountByLine(initialSelections);
    setAmount('');
    setConcept('');
    setDate(new Date().toISOString().slice(0, 10));
  }, [plantilla.code, initialSelections, initialValues]);

  const linesNeedingChoice = plantilla.lines.filter(
    (l) => (l.availableAccounts ?? []).length > 0,
  );
  const hasMissingLineAccounts = plantilla.lines.some(
    (l) => (l.availableAccounts ?? []).length === 0,
  );
  const incompleteSelection = linesNeedingChoice.some((l) => !accountByLine[l.id]);

  const debitLines = plantilla.lines.filter((l) => l.side === 'debit');
  const creditLines = plantilla.lines.filter((l) => l.side === 'credit');
  const sameAccountConflict =
    debitLines.length > 0 &&
    creditLines.length > 0 &&
    debitLines.some((d) =>
      creditLines.some(
        (c) =>
          accountByLine[d.id] &&
          accountByLine[c.id] &&
          accountByLine[d.id] === accountByLine[c.id],
      ),
    );

  function optionsForLine(lineId: number) {
    const line = plantilla.lines.find((l) => l.id === lineId);
    if (!line) return [];
    const opposingIds = new Set<string>();
    for (const other of plantilla.lines) {
      if (other.id === lineId) continue;
      if (other.side === line.side) continue;
      const selected = accountByLine[other.id];
      if (selected) opposingIds.add(selected);
    }
    return (line.availableAccounts ?? []).filter(
      (a) => !opposingIds.has(a.id) || a.id === accountByLine[lineId],
    );
  }

  function buildValues(): ApunteMiniFormValues | null {
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    if (incompleteSelection || sameAccountConflict) return null;

    const lines = plantilla.lines.map((l) => ({
      id: l.id,
      accountId: accountByLine[l.id],
    }));

    const stickyAccountId =
      accountByLine[linesNeedingChoice[0]?.id ?? plantilla.lines[0]?.id] ?? lines[0]?.accountId;

    return {
      templateCode: plantilla.code,
      amount: parsed,
      date,
      concept: concept.trim() || plantilla.name,
      lines,
      stickyAccountId,
    };
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const values = buildValues();
    if (!values) return;
    writeLastAccount(plantilla.code, values.stickyAccountId);
    onSubmit(values);
  }

  if (hasMissingLineAccounts) {
    return (
      <ValidationMessage tone="error" title="Falta una cuenta">
        Esta plantilla necesita una cuenta que aún no tienes.{' '}
        <Link to="/hogar/accounts" className="underline font-semibold">
          Ir a Cuentas
        </Link>{' '}
        y volvé a intentar.
        {onCancel && (
          <button type="button" className="block mt-sm underline font-semibold cursor-pointer" onClick={onCancel}>
            Elegir otra plantilla
          </button>
        )}
      </ValidationMessage>
    );
  }

  return (
    <form
      className={`space-y-lg rounded-xl border-2 p-md md:p-lg ${
        isEdit
          ? 'border-primary/25 bg-primary/5'
          : 'border-secondary/20 bg-secondary/5'
      }`}
      onSubmit={handleSubmit}
    >
      <div
        className={`flex items-start gap-sm rounded-lg border bg-surface-container-lowest px-md py-sm ${
          isEdit ? 'border-primary/20' : 'border-secondary/20'
        }`}
      >
        <Icon
          name={isEdit ? 'edit' : 'add_circle'}
          className={`text-xl shrink-0 mt-0.5 ${isEdit ? 'text-primary' : 'text-secondary'}`}
          filled
        />
        <div className="min-w-0">
          <p
            className={`text-label-md font-semibold ${
              isEdit ? 'text-primary' : 'text-secondary'
            }`}
          >
            {isEdit ? 'Editando un apunte existente' : 'Nuevo apunte'}
          </p>
          <p className="text-label-sm text-on-surface-variant">
            {isEdit
              ? 'Los cambios actualizan el registro ya guardado en tu libro.'
              : 'Se va a crear un registro nuevo en tu libro con esta plantilla.'}
          </p>
        </div>
      </div>

      <div>
        <p className="text-label-sm text-on-surface-variant mb-xs">Plantilla</p>
        <h2 className="text-headline-md text-on-surface font-bold">{plantilla.name}</h2>
      </div>

      {error && <ValidationMessage tone="error">{error}</ValidationMessage>}

      {sameAccountConflict && (
        <ValidationMessage tone="error" title="Cuentas iguales">
          Origen y destino deben ser distintas. Elegí otra cuenta.
        </ValidationMessage>
      )}

      {linesNeedingChoice.map((line) => (
        <div key={line.id}>
          <label
            htmlFor={`line-${line.id}`}
            className="text-label-md text-on-surface-variant mb-xs block"
          >
            {line.label}
          </label>
          <select
            id={`line-${line.id}`}
            name={`line-${line.id}`}
            autoComplete="off"
            value={accountByLine[line.id] ?? ''}
            onChange={(e) =>
              setAccountByLine((prev) => ({ ...prev, [line.id]: e.target.value }))
            }
            className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
            required
          >
            {optionsForLine(line.id).map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      ))}

      <TextInput
        label="Monto"
        id="amount"
        name="amount"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00…"
        required
      />

      <TextInput
        label="Fecha del movimiento"
        id="date"
        name="date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <TextInput
        label="Descripción breve"
        id="concept"
        name="concept"
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
        placeholder="Ej. Pago de alquiler de Mayo…"
        autoComplete="off"
      />

      <div className="flex flex-col sm:flex-row-reverse gap-sm pt-xs">
        <Button
          type="submit"
          fullWidth
          size="lg"
          className="rounded-xl sm:flex-1"
          disabled={submitting || !amount || incompleteSelection || sameAccountConflict}
        >
          {submitting ? 'Guardando…' : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            fullWidth
            size="lg"
            className="rounded-xl sm:flex-1"
            disabled={submitting}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
