import { useState, type FormEvent } from 'react';
import Button from '../ui/Button.tsx';
import TextInput from '../ui/TextInput.tsx';
import ValidationMessage from '../ui/ValidationMessage.tsx';
import type { EntityTipo } from '../../lib/api.ts';

export interface EntityJitFormValues {
  nombre: string;
  tipo: EntityTipo;
  capabilities: string[];
}

export interface EntityJitFormProps {
  /** When set, tipo is locked to "organization" and this capability is pre-checked and locked (T018 CTA). */
  lockedCapability?: string | null;
  submitting?: boolean;
  error?: string;
  onCreate: (values: EntityJitFormValues) => void;
  onCancel: () => void;
}

const CAPABILITY_LABEL: Record<string, string> = {
  can_be_customer: 'Puede ser cliente',
  can_be_supplier: 'Puede ser proveedor',
  is_employment_dependency: 'Relación de dependencia (empleador)',
};

/** Just-in-time counterparty creation inline in EntryBuilder (T017 — US2.3). */
export default function EntityJitForm({
  lockedCapability = null,
  submitting = false,
  error,
  onCreate,
  onCancel,
}: EntityJitFormProps) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<EntityTipo>(lockedCapability ? 'organization' : 'person');
  const [capabilities, setCapabilities] = useState<string[]>(
    lockedCapability ? [lockedCapability] : [],
  );

  function toggleCapability(cap: string) {
    if (cap === lockedCapability) return;
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) return;
    onCreate({ nombre: trimmed, tipo, capabilities });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-sm space-y-md rounded-lg border border-primary/20 bg-primary/5 p-md"
      aria-label="Crear entidad al vuelo"
    >
      {error && <ValidationMessage tone="error">{error}</ValidationMessage>}

      <TextInput
        label="Nombre"
        id="jit-entity-name"
        name="jit-entity-name"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder={lockedCapability ? 'Ej. Acme Corp' : 'Nombre de la persona u organización'}
        autoComplete="off"
        autoFocus
      />

      {!lockedCapability && (
        <div className="flex gap-sm">
          <label className="flex items-center gap-xs text-label-md text-on-surface-variant">
            <input
              type="radio"
              name="jit-entity-tipo"
              value="person"
              checked={tipo === 'person'}
              onChange={() => setTipo('person')}
            />
            Persona
          </label>
          <label className="flex items-center gap-xs text-label-md text-on-surface-variant">
            <input
              type="radio"
              name="jit-entity-tipo"
              value="organization"
              checked={tipo === 'organization'}
              onChange={() => setTipo('organization')}
            />
            Organización
          </label>
        </div>
      )}

      {tipo === 'organization' && (
        <fieldset className="space-y-xs">
          <legend className="text-label-sm text-on-surface-variant mb-xs">Capacidades</legend>
          {Object.entries(CAPABILITY_LABEL).map(([cap, label]) => (
            <label key={cap} className="flex items-center gap-xs text-label-md text-on-surface">
              <input
                type="checkbox"
                checked={capabilities.includes(cap)}
                disabled={cap === lockedCapability}
                onChange={() => toggleCapability(cap)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}

      <div className="flex gap-sm">
        <Button type="submit" size="sm" disabled={submitting || !nombre.trim()}>
          {submitting ? 'Creando…' : 'Crear entidad'}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={submitting} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
