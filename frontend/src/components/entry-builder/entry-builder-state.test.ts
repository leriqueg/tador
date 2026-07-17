import { describe, it, expect } from 'vitest';
import {
  buildApunteSubmitPayload,
  canAdvance,
  createInitialEntryBuilderState,
  entityBlocksAdvance,
  entryBuilderHasDraft,
  entryBuilderReducer,
  hasEntityStep,
  type EntryBuilderState,
} from './entry-builder-state.ts';

function advance(state: EntryBuilderState) {
  return entryBuilderReducer(state, { type: 'ADVANCE' });
}

describe('entryBuilderReducer — advance', () => {
  it('does not advance past "tipo" until an operation type is selected', () => {
    const result = advance(createInitialEntryBuilderState());
    expect(result.step).toBe('tipo');
  });

  it('advances tipo -> cuentas once INGRESO is selected', () => {
    let state = createInitialEntryBuilderState();
    state = entryBuilderReducer(state, { type: 'SELECT_TIPO', tipo: 'INGRESO' });
    state = advance(state);
    expect(state.step).toBe('cuentas');
    expect(state.tipo).toBe('INGRESO');
  });

  it('blocks advance from "cuentas" until both accounts are chosen and distinct', () => {
    let state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'EGRESO',
      step: 'cuentas',
    };
    expect(advance(state).step).toBe('cuentas');

    state = entryBuilderReducer(state, { type: 'SET_DEBIT_ACCOUNT', accountId: 'acc-expense' });
    expect(advance(state).step).toBe('cuentas'); // credit still missing

    state = entryBuilderReducer(state, { type: 'SET_CREDIT_ACCOUNT', accountId: 'acc-expense' });
    expect(advance(state).step).toBe('cuentas'); // same account on both sides

    state = entryBuilderReducer(state, { type: 'SET_CREDIT_ACCOUNT', accountId: 'acc-bank' });
    expect(advance(state).step).toBe('entidad');
  });

  it('skips the "entidad" step for TRANSFERENCIA (no counterparty entity)', () => {
    let state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'TRANSFERENCIA',
      step: 'cuentas',
      debitAccountId: 'acc-bank',
      creditAccountId: 'acc-wallet',
    };
    state = advance(state);
    expect(state.step).toBe('concepto');
    expect(hasEntityStep('TRANSFERENCIA')).toBe(false);
  });

  it('requires a non-blank concept before advancing to "monto"', () => {
    let state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'EGRESO',
      step: 'concepto',
      debitAccountId: 'a',
      creditAccountId: 'b',
    };
    expect(advance(state).step).toBe('concepto');
    state = entryBuilderReducer(state, { type: 'SET_CONCEPT', concept: '   ' });
    expect(advance(state).step).toBe('concepto');
    state = entryBuilderReducer(state, { type: 'SET_CONCEPT', concept: 'Pago de internet' });
    expect(advance(state).step).toBe('monto');
  });

  it('requires a positive numeric amount (comma decimal accepted) before the entry is ready', () => {
    let state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'EGRESO',
      step: 'monto',
    };
    expect(canAdvance(state)).toBe(false);
    state = entryBuilderReducer(state, { type: 'SET_AMOUNT', amount: '0' });
    expect(canAdvance(state)).toBe(false);
    state = entryBuilderReducer(state, { type: 'SET_AMOUNT', amount: '25,50' });
    expect(canAdvance(state)).toBe(true);
  });
});

describe('entryBuilderReducer — back / edit', () => {
  it('moves back one visible step at a time and stops at "tipo"', () => {
    let state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'INGRESO',
      step: 'monto',
    };
    state = entryBuilderReducer(state, { type: 'BACK' });
    expect(state.step).toBe('concepto');
    state = entryBuilderReducer(state, { type: 'BACK' });
    expect(state.step).toBe('entidad');
    state = entryBuilderReducer(state, { type: 'BACK' });
    expect(state.step).toBe('cuentas');
    state = entryBuilderReducer(state, { type: 'BACK' });
    expect(state.step).toBe('tipo');
    state = entryBuilderReducer(state, { type: 'BACK' });
    expect(state.step).toBe('tipo'); // no-op past the first step
  });

  it('EDIT_STEP jumps back to a previously visible step but never forward', () => {
    let state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'EGRESO',
      step: 'monto',
    };
    state = entryBuilderReducer(state, { type: 'EDIT_STEP', step: 'cuentas' });
    expect(state.step).toBe('cuentas');

    const blocked = entryBuilderReducer(state, { type: 'EDIT_STEP', step: 'monto' });
    expect(blocked.step).toBe('cuentas'); // can't jump ahead of current progress
  });

  it('changing the operation type resets downstream selections and returns to "tipo"', () => {
    let state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'INGRESO',
      step: 'cuentas',
      debitAccountId: 'acc-bank',
      creditAccountId: 'acc-income',
      concept: 'Cobro cliente',
      amount: '100',
    };
    state = entryBuilderReducer(state, { type: 'SELECT_TIPO', tipo: 'EGRESO' });
    expect(state.tipo).toBe('EGRESO');
    expect(state.debitAccountId).toBeNull();
    expect(state.creditAccountId).toBeNull();
    expect(state.concept).toBe('');
    expect(state.step).toBe('tipo');
  });
});

describe('entryBuilderReducer — burst ("Guardar y registrar otro")', () => {
  it('keeps operation type and both accounts, clears amount/concept, and returns to "concepto"', () => {
    const saved: EntryBuilderState = {
      step: 'monto',
      tipo: 'EGRESO',
      subtype: 'general',
      debitAccountId: 'acc-expense',
      creditAccountId: 'acc-bank',
      entityId: 'ent-1',
      concept: 'Pago de internet',
      amount: '45.90',
    };
    const burst = entryBuilderReducer(saved, { type: 'BURST' });
    expect(burst.tipo).toBe('EGRESO');
    expect(burst.debitAccountId).toBe('acc-expense');
    expect(burst.creditAccountId).toBe('acc-bank');
    expect(burst.concept).toBe('');
    expect(burst.amount).toBe('');
    expect(burst.step).toBe('concepto');
  });

  it('is a no-op before any operation type has been chosen', () => {
    const fresh = createInitialEntryBuilderState();
    expect(entryBuilderReducer(fresh, { type: 'BURST' })).toEqual(fresh);
  });
});

describe('entityBlocksAdvance — salary requires employer capability (edge case: entidad requerida omitida)', () => {
  const employerWithCapability = { id: 'org-1', capabilities: ['is_employment_dependency'] };
  const employerWithoutCapability = { id: 'org-2', capabilities: ['can_be_customer'] };

  it('does not block general (non-salary) entries even without an entity selected', () => {
    const state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'INGRESO',
      subtype: 'general',
      step: 'entidad',
      entityId: null,
    };
    expect(entityBlocksAdvance(state, [])).toBe(false);
  });

  it('blocks a salary entry when no employer entity is selected', () => {
    const state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'INGRESO',
      subtype: 'salario',
      step: 'entidad',
      entityId: null,
    };
    expect(entityBlocksAdvance(state, [employerWithCapability])).toBe(true);
  });

  it('blocks a salary entry when the selected entity lacks is_employment_dependency', () => {
    const state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'INGRESO',
      subtype: 'salario',
      step: 'entidad',
      entityId: 'org-2',
    };
    expect(entityBlocksAdvance(state, [employerWithoutCapability])).toBe(true);
  });

  it('allows a salary entry once the selected entity holds is_employment_dependency', () => {
    const state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'INGRESO',
      subtype: 'salario',
      step: 'entidad',
      entityId: 'org-1',
    };
    expect(entityBlocksAdvance(state, [employerWithCapability])).toBe(false);
  });
});

describe('buildApunteSubmitPayload', () => {
  it('returns null while required fields are incomplete', () => {
    const state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'EGRESO',
      step: 'monto',
      debitAccountId: 'acc-expense',
      creditAccountId: null,
      concept: 'Internet',
      amount: '10',
    };
    expect(buildApunteSubmitPayload(state, '2026-07-16')).toBeNull();
  });

  it('builds a free-form (no templateCode) payload with side/amount per line for a general entry', () => {
    const state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'EGRESO',
      subtype: 'general',
      step: 'monto',
      debitAccountId: 'acc-expense',
      creditAccountId: 'acc-bank',
      entityId: null,
      concept: 'Pago de internet',
      amount: '45.90',
    };
    const payload = buildApunteSubmitPayload(state, '2026-07-16');
    expect(payload).toEqual({
      date: '2026-07-16',
      concept: 'Pago de internet',
      amount: 45.9,
      lines: [
        { id: 1, accountId: 'acc-expense', side: 'debit', amount: 45.9 },
        { id: 2, accountId: 'acc-bank', side: 'credit', amount: 45.9 },
      ],
      entityId: undefined,
    });
  });

  it('builds a templateCode="registrar_sueldo" payload for the salary subtype so backend V11 capability check applies', () => {
    const state: EntryBuilderState = {
      ...createInitialEntryBuilderState(),
      tipo: 'INGRESO',
      subtype: 'salario',
      step: 'monto',
      debitAccountId: 'acc-bank',
      creditAccountId: 'acc-income-salary',
      entityId: 'org-1',
      concept: 'Sueldo julio',
      amount: '1200',
    };
    const payload = buildApunteSubmitPayload(state, '2026-07-16');
    expect(payload).toEqual({
      templateCode: 'registrar_sueldo',
      date: '2026-07-16',
      concept: 'Sueldo julio',
      amount: 1200,
      lines: [
        { id: 1, accountId: 'acc-bank' },
        { id: 2, accountId: 'acc-income-salary' },
      ],
      entityId: 'org-1',
    });
  });
});

describe('entryBuilderHasDraft (T029 abandon warning)', () => {
  it('is false on a fresh builder', () => {
    expect(entryBuilderHasDraft(createInitialEntryBuilderState())).toBe(false);
  });

  it('is true once an operation type is chosen', () => {
    const state = entryBuilderReducer(createInitialEntryBuilderState(), {
      type: 'SELECT_TIPO',
      tipo: 'INGRESO',
    });
    expect(entryBuilderHasDraft(state)).toBe(true);
  });

  it('is true when concept or amount has content', () => {
    let state = createInitialEntryBuilderState();
    state = entryBuilderReducer(state, { type: 'SET_CONCEPT', concept: 'Factura' });
    expect(entryBuilderHasDraft(state)).toBe(true);
  });
});
