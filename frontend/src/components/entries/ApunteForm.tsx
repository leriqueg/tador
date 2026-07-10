import { useState, type FormEvent } from 'react';
import Button from '../ui/Button.tsx';
import TextInput from '../ui/TextInput.tsx';
import ValidationMessage from '../ui/ValidationMessage.tsx';

export interface PlantillaOption {
  code: string;
  name: string;
  kind: 'gasto' | 'ingreso';
}

export interface ApunteFormValues {
  templateCode: string;
  amount: number;
  date: string;
  concept: string;
}

export interface ApunteFormProps {
  plantillas: PlantillaOption[];
  error?: string;
  submitting?: boolean;
  onSubmit: (values: ApunteFormValues) => void;
}

export default function ApunteForm({
  plantillas,
  error,
  submitting = false,
  onSubmit,
}: ApunteFormProps) {
  const [kind, setKind] = useState<'gasto' | 'ingreso'>('gasto');
  const [templateCode, setTemplateCode] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [concept, setConcept] = useState('');

  const filtered = plantillas.filter((p) => p.kind === kind);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!templateCode || !Number.isFinite(parsed) || parsed <= 0) return;
    onSubmit({ templateCode, amount: parsed, date, concept });
  }

  return (
    <form className="space-y-lg" onSubmit={handleSubmit}>
      <div className="flex gap-sm p-1 bg-surface-container rounded-xl">
        {(['gasto', 'ingreso'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setTemplateCode('');
            }}
            className={`flex-1 py-sm rounded-lg text-label-md font-semibold capitalize transition-colors ${
              kind === k ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {error && <ValidationMessage tone="error">{error}</ValidationMessage>}

      <TextInput
        label="Monto"
        type="number"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        required
      />

      <TextInput
        label="Fecha"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <div>
        <p className="text-label-md text-on-surface-variant px-base mb-sm">Categoría</p>
        <div className="grid grid-cols-2 gap-sm">
          {filtered.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => setTemplateCode(p.code)}
              className={`p-md rounded-xl text-left text-label-md border transition-all ${
                templateCode === p.code
                  ? 'border-primary bg-primary/5 font-semibold text-primary'
                  : 'border-outline-variant/40 bg-surface-container-lowest'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <TextInput
        label="Descripción"
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
        placeholder="Ej: Supermercado semanal"
      />

      <Button
        type="submit"
        fullWidth
        size="lg"
        className="rounded-xl"
        disabled={submitting || !templateCode || !amount}
      >
        {submitting ? 'Guardando…' : 'Guardar apunte'}
      </Button>
    </form>
  );
}

export function ApunteConfirm({
  message = 'Apunte guardado. Ya está en tu libro.',
  onDismiss,
}: {
  message?: string;
  onDismiss?: () => void;
}) {
  return (
    <ValidationMessage tone="success" title="Listo">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
        <span>{message}</span>
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="text-label-md font-semibold underline">
            Cerrar
          </button>
        )}
      </div>
    </ValidationMessage>
  );
}
