import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button.tsx';
import TextInput from '../ui/TextInput.tsx';
import ValidationMessage from '../ui/ValidationMessage.tsx';
import type { PlantillaView } from '../../lib/api.ts';
import { readLastAccount, writeLastAccount } from '../../lib/plantilla-meta.ts';

export interface ApunteMiniFormValues {
  templateCode: string;
  amount: number;
  date: string;
  concept: string;
  lines: Array<{ id: number; accountId: string }>;
  stickyAccountId: string;
}

export interface ApunteMiniFormProps {
  plantilla: PlantillaView;
  error?: string;
  submitting?: boolean;
  onSubmit: (values: ApunteMiniFormValues, opts: { burst: boolean }) => void;
  onCancel?: () => void;
}

function pickDefaultAccount(
  plantilla: PlantillaView,
  lineId: number,
  sticky?: string | null,
): string {
  const line = plantilla.lines.find((l) => l.id === lineId);
  if (!line) return '';
  const options = line.availableAccounts;
  if (sticky && options.some((a) => a.id === sticky)) return sticky;
  const usuario = options.find((a) => a.tipo === 'usuario');
  return usuario?.id ?? options[0]?.id ?? '';
}

/** Mini-form: labeled account picks + amount + description — no ledger codes (FR-005b). */
export default function ApunteMiniForm({
  plantilla,
  error,
  submitting = false,
  onSubmit,
  onCancel,
}: ApunteMiniFormProps) {
  const sticky = readLastAccount(plantilla.code);

  const initialSelections = useMemo(() => {
    const map: Record<number, string> = {};
    for (const line of plantilla.lines) {
      map[line.id] = pickDefaultAccount(plantilla, line.id, sticky);
    }
    return map;
  }, [plantilla, sticky]);

  const [accountByLine, setAccountByLine] = useState<Record<number, string>>(initialSelections);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [concept, setConcept] = useState('');
  const [burstNext, setBurstNext] = useState(false);

  useEffect(() => {
    setAccountByLine(initialSelections);
    setAmount('');
    setConcept('');
    setDate(new Date().toISOString().slice(0, 10));
    setBurstNext(false);
  }, [plantilla.code, initialSelections]);

  const linesNeedingChoice = plantilla.lines.filter((l) => l.availableAccounts.length > 0);
  const hasMissingLineAccounts = plantilla.lines.some((l) => l.availableAccounts.length === 0);
  const incompleteSelection = linesNeedingChoice.some((l) => !accountByLine[l.id]);

  function buildValues(): ApunteMiniFormValues | null {
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    if (incompleteSelection) return null;

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
    const burst = burstNext;
    setBurstNext(false);
    onSubmit(values, { burst });
    if (burst) {
      setAmount('');
      setConcept('');
    }
  }

  if (hasMissingLineAccounts) {
    return (
      <ValidationMessage tone="error" title="Falta una cuenta">
        Esta plantilla necesita una cuenta que aún no tienes.{' '}
        <Link to="/accounts" className="underline font-semibold">
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
    <form className="space-y-lg" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-md">
        <h2 className="text-headline-md text-on-surface font-bold">{plantilla.name}</h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-label-md text-secondary cursor-pointer">
            Cambiar
          </button>
        )}
      </div>

      {error && <ValidationMessage tone="error">{error}</ValidationMessage>}

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
            {line.availableAccounts.map((a) => (
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
        label="Fecha"
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

      <div className="flex flex-col sm:flex-row gap-sm">
        <Button
          type="submit"
          fullWidth
          size="lg"
          className="rounded-xl"
          disabled={submitting || !amount || incompleteSelection}
          onClick={() => setBurstNext(false)}
        >
          {submitting && !burstNext ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button
          type="submit"
          variant="outline"
          fullWidth
          size="lg"
          className="rounded-xl"
          disabled={submitting || !amount || incompleteSelection}
          onClick={() => setBurstNext(true)}
        >
          {submitting && burstNext ? 'Guardando…' : 'Guardar y registrar otro'}
        </Button>
      </div>
    </form>
  );
}
