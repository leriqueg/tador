/**
 * EntryBuilder step state machine (PRO capture, Sprint 07 T013).
 *
 * Pure reducer — no side effects, no API calls. The five visible steps
 * mirror the formal EntryBuilder screen (specs/007-frontend-pro-ligero/spec.md,
 * US2): 1 TipoOperacion, 2 Subtipo/cuenta filtrada, 3 Entidad, 4 Concepto,
 * 5 Monto. TRANSFERENCIA has no counterparty entity, so "entidad" is skipped
 * for that operation type only.
 */

export type OperationType = 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA';
export type EntrySubtype = 'general' | 'salario';
export type EntryStepId = 'tipo' | 'cuentas' | 'entidad' | 'concepto' | 'monto';

export interface EntityCapabilityLike {
  id: string;
  capabilities?: string[] | null;
}

export interface EntryBuilderState {
  step: EntryStepId;
  tipo: OperationType | null;
  subtype: EntrySubtype;
  debitAccountId: string | null;
  creditAccountId: string | null;
  entityId: string | null;
  concept: string;
  amount: string;
}

export type EntryBuilderAction =
  | { type: 'SELECT_TIPO'; tipo: OperationType }
  | { type: 'SELECT_SUBTYPE'; subtype: EntrySubtype }
  | { type: 'SET_DEBIT_ACCOUNT'; accountId: string }
  | { type: 'SET_CREDIT_ACCOUNT'; accountId: string }
  | { type: 'SELECT_ENTITY'; entityId: string | null }
  | { type: 'SET_CONCEPT'; concept: string }
  | { type: 'SET_AMOUNT'; amount: string }
  | { type: 'ADVANCE' }
  | { type: 'BACK' }
  | { type: 'EDIT_STEP'; step: EntryStepId }
  | { type: 'BURST' }
  | { type: 'RESET' };

const FULL_STEP_ORDER: EntryStepId[] = ['tipo', 'cuentas', 'entidad', 'concepto', 'monto'];

export function createInitialEntryBuilderState(): EntryBuilderState {
  return {
    step: 'tipo',
    tipo: null,
    subtype: 'general',
    debitAccountId: null,
    creditAccountId: null,
    entityId: null,
    concept: '',
    amount: '',
  };
}

/** True when the user started capture and would lose work by leaving (T029). */
export function entryBuilderHasDraft(state: EntryBuilderState): boolean {
  return (
    state.tipo !== null ||
    state.concept.trim().length > 0 ||
    state.amount.trim().length > 0
  );
}

/** TRANSFERENCIA is a movement between own accounts — no counterparty entity. */
export function hasEntityStep(tipo: OperationType | null): boolean {
  return tipo === 'INGRESO' || tipo === 'EGRESO';
}

/** Visible step order for the current operation type (previous steps stay visible/editable). */
export function stepOrderFor(tipo: OperationType | null): EntryStepId[] {
  return hasEntityStep(tipo) ? FULL_STEP_ORDER : FULL_STEP_ORDER.filter((s) => s !== 'entidad');
}

export function requiredEntityCapability(subtype: EntrySubtype): string | null {
  return subtype === 'salario' ? 'is_employment_dependency' : null;
}

/** Edge case (spec): "Entidad requerida omitida → bloquear avance". */
export function entityBlocksAdvance(
  state: EntryBuilderState,
  entities: EntityCapabilityLike[],
): boolean {
  const required = requiredEntityCapability(state.subtype);
  if (!required) return false;
  if (!state.entityId) return true;
  const entity = entities.find((e) => e.id === state.entityId);
  if (!entity) return true;
  return !(entity.capabilities ?? []).includes(required);
}

function parsedAmount(raw: string): number {
  return Number(raw.replace(',', '.'));
}

/** Structural completeness for the CURRENT step only — entity capability needs external
 * data (the entities list) and is checked separately via `entityBlocksAdvance`. */
export function canAdvance(state: EntryBuilderState): boolean {
  switch (state.step) {
    case 'tipo':
      return state.tipo !== null;
    case 'cuentas':
      return (
        Boolean(state.debitAccountId) &&
        Boolean(state.creditAccountId) &&
        state.debitAccountId !== state.creditAccountId
      );
    case 'entidad':
      return true;
    case 'concepto':
      return state.concept.trim().length > 0;
    case 'monto': {
      const value = parsedAmount(state.amount);
      return Number.isFinite(value) && value > 0;
    }
    default:
      return false;
  }
}

function stepAfter(order: EntryStepId[], step: EntryStepId): EntryStepId {
  const idx = order.indexOf(step);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : step;
}

function stepBefore(order: EntryStepId[], step: EntryStepId): EntryStepId {
  const idx = order.indexOf(step);
  return idx > 0 ? order[idx - 1] : step;
}

export function entryBuilderReducer(
  state: EntryBuilderState,
  action: EntryBuilderAction,
): EntryBuilderState {
  switch (action.type) {
    case 'SELECT_TIPO': {
      if (state.tipo === action.tipo) return state;
      return {
        ...createInitialEntryBuilderState(),
        tipo: action.tipo,
      };
    }
    case 'SELECT_SUBTYPE': {
      if (state.subtype === action.subtype) return state;
      return {
        ...state,
        subtype: action.subtype,
        debitAccountId: null,
        creditAccountId: null,
      };
    }
    case 'SET_DEBIT_ACCOUNT':
      return { ...state, debitAccountId: action.accountId };
    case 'SET_CREDIT_ACCOUNT':
      return { ...state, creditAccountId: action.accountId };
    case 'SELECT_ENTITY':
      return { ...state, entityId: action.entityId };
    case 'SET_CONCEPT':
      return { ...state, concept: action.concept };
    case 'SET_AMOUNT':
      return { ...state, amount: action.amount };
    case 'ADVANCE': {
      if (!canAdvance(state)) return state;
      return { ...state, step: stepAfter(stepOrderFor(state.tipo), state.step) };
    }
    case 'BACK':
      return { ...state, step: stepBefore(stepOrderFor(state.tipo), state.step) };
    case 'EDIT_STEP': {
      const order = stepOrderFor(state.tipo);
      const targetIdx = order.indexOf(action.step);
      const currentIdx = order.indexOf(state.step);
      if (targetIdx < 0 || targetIdx > currentIdx) return state;
      return { ...state, step: action.step };
    }
    case 'BURST': {
      if (!state.tipo) return state;
      return { ...state, concept: '', amount: '', step: 'concepto' };
    }
    case 'RESET':
      return createInitialEntryBuilderState();
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Submit payload (T015) — pure mapping from builder state to the apuntes API
// shape. Salary uses templateCode="registrar_sueldo" so the backend's V11
// employer-capability check runs; every other entry is free-form (side +
// amount per line), matching FR-007 ("con o sin templateCode").
// ---------------------------------------------------------------------------

export interface ApunteSubmitLine {
  id: number;
  accountId: string;
  side?: 'debit' | 'credit';
  amount?: number;
}

export interface ApunteSubmitPayload {
  templateCode?: string;
  date: string;
  concept: string;
  amount: number;
  lines: ApunteSubmitLine[];
  entityId?: string;
}

const SALARY_TEMPLATE_CODE = 'registrar_sueldo';

export function buildApunteSubmitPayload(
  state: EntryBuilderState,
  date: string,
): ApunteSubmitPayload | null {
  if (!state.tipo || !state.debitAccountId || !state.creditAccountId) return null;
  const concept = state.concept.trim();
  if (!concept) return null;
  const amount = parsedAmount(state.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const entityId = state.entityId ?? undefined;

  if (state.subtype === 'salario') {
    return {
      templateCode: SALARY_TEMPLATE_CODE,
      date,
      concept,
      amount,
      lines: [
        { id: 1, accountId: state.debitAccountId },
        { id: 2, accountId: state.creditAccountId },
      ],
      entityId,
    };
  }

  return {
    date,
    concept,
    amount,
    lines: [
      { id: 1, accountId: state.debitAccountId, side: 'debit', amount },
      { id: 2, accountId: state.creditAccountId, side: 'credit', amount },
    ],
    entityId,
  };
}
