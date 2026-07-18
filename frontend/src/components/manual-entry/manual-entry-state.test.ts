import { describe, expect, it } from 'vitest';
import {
  computeEntryDifference,
  createEmptyManualLine,
  isManualEntryBalanced,
  manualEntrySubmitBlockReason,
  toCreateEntryPayload,
  type ManualEntryFormState,
} from './manual-entry-state.ts';

function state(overrides: Partial<ManualEntryFormState> = {}): ManualEntryFormState {
  return {
    fecha: '2026-06-15',
    concepto: 'Ajuste manual',
    lineas: [
      { id: '1', cuentaId: 'exp-1', debito: '100.00', credito: '' },
      { id: '2', cuentaId: 'inc-1', debito: '', credito: '100.00' },
    ],
    ...overrides,
  };
}

describe('manual-entry-state — balance (US3, T019/T020)', () => {
  it('reports zero difference when debits equal credits', () => {
    expect(computeEntryDifference(state())).toBe('0.00');
    expect(isManualEntryBalanced(state())).toBe(true);
  });

  it('reports a non-zero difference when debits and credits diverge', () => {
    const unbalanced = state({
      lineas: [
        { id: '1', cuentaId: 'exp-1', debito: '100', credito: '' },
        { id: '2', cuentaId: 'inc-1', debito: '', credito: '40' },
      ],
    });
    expect(computeEntryDifference(unbalanced)).toBe('60.00');
    expect(isManualEntryBalanced(unbalanced)).toBe(false);
  });

  it('accepts comma decimals like EntryBuilder', () => {
    const comma = state({
      lineas: [
        { id: '1', cuentaId: 'exp-1', debito: '45,50', credito: '' },
        { id: '2', cuentaId: 'inc-1', debito: '', credito: '45.50' },
      ],
    });
    expect(isManualEntryBalanced(comma)).toBe(true);
  });
});

describe('manual-entry-state — submit validation (US3, T020/T021)', () => {
  it('blocks submit when the entry is unbalanced', () => {
    expect(
      manualEntrySubmitBlockReason(
        state({
          lineas: [
            { id: '1', cuentaId: 'exp-1', debito: '10', credito: '' },
            { id: '2', cuentaId: 'inc-1', debito: '', credito: '5' },
          ],
        }),
      ),
    ).toMatch(/descuad/i);
  });

  it('blocks submit when concepto is empty', () => {
    expect(manualEntrySubmitBlockReason(state({ concepto: '   ' }))).toMatch(/concepto/i);
  });

  it('blocks submit when fewer than two lines have movement', () => {
    expect(
      manualEntrySubmitBlockReason(
        state({
          lineas: [{ id: '1', cuentaId: 'exp-1', debito: '100', credito: '' }],
        }),
      ),
    ).toMatch(/línea/i);
  });

  it('builds a balanced POST /api/entries payload', () => {
    const payload = toCreateEntryPayload(state());
    expect(payload).toEqual({
      fecha: '2026-06-15',
      concepto: 'Ajuste manual',
      lineas: [
        { cuentaId: 'exp-1', debito: 100, credito: 0 },
        { cuentaId: 'inc-1', debito: 0, credito: 100 },
      ],
    });
  });

  it('returns null payload when validation fails', () => {
    expect(toCreateEntryPayload(state({ concepto: '' }))).toBeNull();
  });
});

describe('manual-entry-state — helpers', () => {
  it('creates an empty line with a unique id', () => {
    const a = createEmptyManualLine();
    const b = createEmptyManualLine();
    expect(a.cuentaId).toBe('');
    expect(a.debito).toBe('');
    expect(a.credito).toBe('');
    expect(a.id).not.toBe(b.id);
  });
});
