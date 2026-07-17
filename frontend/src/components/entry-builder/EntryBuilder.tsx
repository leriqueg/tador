import { useEffect, useMemo, useReducer, useRef, useState, type RefObject } from 'react';
import Button from '../ui/Button.tsx';
import TextInput from '../ui/TextInput.tsx';
import ValidationMessage from '../ui/ValidationMessage.tsx';
import Icon from '../ui/Icon.tsx';
import EntityJitForm, { type EntityJitFormValues } from './EntityJitForm.tsx';
import {
  accountMemoryKey,
  resolveStickyAccounts,
  writeLastAccountPair,
} from '../../lib/entry-builder-account-memory.ts';
import {
  CREDIT_LABEL,
  DEBIT_LABEL,
  creditAccountOptions,
  debitAccountOptions,
  excludeAccount,
} from './account-filters.ts';
import {
  buildApunteSubmitPayload,
  canAdvance,
  createInitialEntryBuilderState,
  entityBlocksAdvance,
  entryBuilderHasDraft,
  entryBuilderReducer,
  requiredEntityCapability,
  stepOrderFor,
  type ApunteSubmitPayload,
  type EntryStepId,
  type OperationType,
} from './entry-builder-state.ts';
import type { AccountSummary, EntitySummary } from '../../lib/api.ts';

export interface EntryBuilderProps {
  accounts: AccountSummary[];
  entities: EntitySummary[];
  onSubmit: (payload: ApunteSubmitPayload) => Promise<void>;
  onCreateEntity: (values: EntityJitFormValues) => Promise<EntitySummary>;
  /** Notifies parent for abandon-guard wiring (T029). */
  onDraftChange?: (hasDraft: boolean) => void;
}

const TIPO_LABEL: Record<OperationType, string> = {
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
  TRANSFERENCIA: 'Transferencia',
};

const TIPO_ICON: Record<OperationType, string> = {
  INGRESO: 'arrow_downward',
  EGRESO: 'arrow_upward',
  TRANSFERENCIA: 'swap_horiz',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function accountName(accounts: AccountSummary[], id: string | null): string {
  if (!id) return '—';
  return accounts.find((a) => a.id === id)?.nombre ?? '—';
}

/**
 * EntryBuilder — PRO sequential capture (US2). Replaces QuickAdd for `/pro/entries`.
 * Previous steps stay visible as editable summaries; the newly revealed step
 * receives focus and the whole region is `aria-live` for screen readers.
 */
export default function EntryBuilder({
  accounts,
  entities,
  onSubmit,
  onCreateEntity,
  onDraftChange,
}: EntryBuilderProps) {
  const [state, dispatch] = useReducer(entryBuilderReducer, createInitialEntryBuilderState());
  const [localEntities, setLocalEntities] = useState<EntitySummary[]>(entities);
  const [showJit, setShowJit] = useState(false);
  const [jitSubmitting, setJitSubmitting] = useState(false);
  const [jitError, setJitError] = useState('');
  const [entityError, setEntityError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [phase, setPhase] = useState<'builder' | 'success'>('builder');

  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [state.step]);

  useEffect(() => {
    onDraftChange?.(phase === 'builder' && entryBuilderHasDraft(state));
  }, [state, phase, onDraftChange]);

  useEffect(() => {
    if (state.step !== 'cuentas' || !state.tipo) return;
    if (state.debitAccountId && state.creditAccountId) return;

    const key = accountMemoryKey(state.tipo, state.subtype);
    const debitOpts = excludeAccount(debitAccountOptions(accounts, state.tipo), state.creditAccountId);
    const creditOpts = excludeAccount(creditAccountOptions(accounts, state.tipo), state.debitAccountId);
    const sticky = resolveStickyAccounts(key, debitOpts, creditOpts);
    if (!sticky) return;

    if (!state.debitAccountId) {
      dispatch({ type: 'SET_DEBIT_ACCOUNT', accountId: sticky.debitAccountId });
    }
    if (!state.creditAccountId) {
      dispatch({ type: 'SET_CREDIT_ACCOUNT', accountId: sticky.creditAccountId });
    }
  }, [
    state.step,
    state.tipo,
    state.subtype,
    state.debitAccountId,
    state.creditAccountId,
    accounts,
  ]);

  const order = stepOrderFor(state.tipo);
  const currentIndex = order.indexOf(state.step);
  const visibleSteps = order.slice(0, currentIndex + 1);

  const requiredCapability = requiredEntityCapability(state.subtype);
  const candidateEntities = useMemo(
    () =>
      requiredCapability
        ? localEntities.filter((e) => (e.capabilities ?? []).includes(requiredCapability))
        : localEntities,
    [localEntities, requiredCapability],
  );

  function selectTipo(tipo: OperationType) {
    dispatch({ type: 'SELECT_TIPO', tipo });
    dispatch({ type: 'ADVANCE' });
  }

  function editStep(step: EntryStepId) {
    dispatch({ type: 'EDIT_STEP', step });
  }

  function continueFromEntidad() {
    if (entityBlocksAdvance(state, localEntities)) {
      setEntityError('Elegí una entidad válida para continuar.');
      return;
    }
    setEntityError('');
    dispatch({ type: 'ADVANCE' });
  }

  async function handleCreateEntity(values: EntityJitFormValues) {
    setJitSubmitting(true);
    setJitError('');
    try {
      const created = await onCreateEntity(values);
      setLocalEntities((prev) => [...prev, created]);
      dispatch({ type: 'SELECT_ENTITY', entityId: created.id });
      setShowJit(false);
      setEntityError('');
    } catch (err) {
      setJitError(err instanceof Error ? err.message : 'No se pudo crear la entidad');
    } finally {
      setJitSubmitting(false);
    }
  }

  async function handleGuardar() {
    const payload = buildApunteSubmitPayload(state, todayIso());
    if (!payload) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(payload);
      if (state.tipo && state.debitAccountId && state.creditAccountId) {
        writeLastAccountPair(
          accountMemoryKey(state.tipo, state.subtype),
          state.debitAccountId,
          state.creditAccountId,
        );
      }
      setPhase('success');
      onDraftChange?.(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo guardar el apunte');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBurst() {
    dispatch({ type: 'BURST' });
    setPhase('builder');
  }

  function handleNuevoMovimiento() {
    dispatch({ type: 'RESET' });
    setShowJit(false);
    setPhase('builder');
    onDraftChange?.(false);
  }

  if (phase === 'success') {
    return (
      <section
        className="rounded-xl border border-success-emerald/25 bg-success-emerald/10 p-lg space-y-md"
        aria-live="polite"
      >
        <div className="flex items-center gap-sm">
          <Icon name="check_circle" className="text-success-emerald text-2xl" filled />
          <h2 className="text-headline-md text-on-surface font-bold">Apunte guardado</h2>
        </div>
        <p className="text-body-md text-on-surface-variant">
          Quedó registrado en tu libro PRO.
        </p>
        <div className="flex flex-col sm:flex-row gap-sm">
          <Button onClick={handleBurst}>Guardar y registrar otro</Button>
          <Button variant="outline" onClick={handleNuevoMovimiento}>
            Nuevo movimiento
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-md" aria-live="polite">
      {visibleSteps.map((stepId) => {
        const isCurrent = stepId === state.step;

        if (!isCurrent) {
          return (
            <StepSummaryRow
              key={stepId}
              stepId={stepId}
              state={state}
              accounts={accounts}
              entities={localEntities}
              onEdit={() => editStep(stepId)}
            />
          );
        }

        return (
          <div key={stepId} aria-live="polite">
            {stepId === 'tipo' && (
              <section>
                <h2
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-headline-md text-on-surface font-bold mb-md focus:outline-none"
                >
                  ¿Qué tipo de movimiento es?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
                  {(['INGRESO', 'EGRESO', 'TRANSFERENCIA'] as OperationType[]).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => selectTipo(tipo)}
                      className="flex flex-col items-center gap-xs p-md rounded-xl border-2 border-outline-variant/40 hover:border-primary text-label-md font-semibold text-on-surface transition-colors"
                    >
                      <Icon name={TIPO_ICON[tipo]} className="text-2xl text-primary" />
                      {TIPO_LABEL[tipo]}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {stepId === 'cuentas' && state.tipo && (
              <CuentasStep
                headingRef={stepHeadingRef}
                tipo={state.tipo}
                subtype={state.subtype}
                accounts={accounts}
                debitAccountId={state.debitAccountId}
                creditAccountId={state.creditAccountId}
                onSelectSubtype={(subtype) => dispatch({ type: 'SELECT_SUBTYPE', subtype })}
                onSelectDebit={(accountId) => dispatch({ type: 'SET_DEBIT_ACCOUNT', accountId })}
                onSelectCredit={(accountId) => dispatch({ type: 'SET_CREDIT_ACCOUNT', accountId })}
                onContinue={() => dispatch({ type: 'ADVANCE' })}
                canContinue={canAdvance(state)}
              />
            )}

            {stepId === 'entidad' && state.tipo && (
              <EntidadStep
                headingRef={stepHeadingRef}
                requiredCapability={requiredCapability}
                candidateEntities={candidateEntities}
                allEntities={localEntities}
                entityId={state.entityId}
                showJit={showJit}
                jitSubmitting={jitSubmitting}
                jitError={jitError}
                entityError={entityError}
                onSelectEntity={(entityId) => {
                  dispatch({ type: 'SELECT_ENTITY', entityId: entityId || null });
                  setEntityError('');
                }}
                onOpenJit={() => setShowJit(true)}
                onCancelJit={() => {
                  setShowJit(false);
                  setJitError('');
                }}
                onCreateEntity={handleCreateEntity}
                onSkip={() => {
                  dispatch({ type: 'SELECT_ENTITY', entityId: null });
                  dispatch({ type: 'ADVANCE' });
                }}
                onContinue={continueFromEntidad}
              />
            )}

            {stepId === 'concepto' && (
              <section>
                <h2
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-headline-md text-on-surface font-bold mb-md focus:outline-none"
                >
                  ¿Cuál es el concepto?
                </h2>
                <TextInput
                  label="Concepto"
                  id="entry-concepto"
                  name="entry-concepto"
                  value={state.concept}
                  onChange={(e) => dispatch({ type: 'SET_CONCEPT', concept: e.target.value })}
                  placeholder="Ej. Pago de internet de julio…"
                  autoComplete="off"
                />
                <Button
                  className="mt-md"
                  disabled={!canAdvance(state)}
                  onClick={() => dispatch({ type: 'ADVANCE' })}
                >
                  Continuar
                </Button>
              </section>
            )}

            {stepId === 'monto' && (
              <section>
                <h2
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-headline-md text-on-surface font-bold mb-md focus:outline-none"
                >
                  ¿Cuál es el monto?
                </h2>
                {submitError && (
                  <div className="mb-md">
                    <ValidationMessage tone="error">{submitError}</ValidationMessage>
                  </div>
                )}
                <TextInput
                  label="Monto"
                  id="entry-monto"
                  name="entry-monto"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={state.amount}
                  onChange={(e) => dispatch({ type: 'SET_AMOUNT', amount: e.target.value })}
                  placeholder="0.00…"
                />
                <Button
                  className="mt-md"
                  disabled={!canAdvance(state) || submitting}
                  onClick={() => void handleGuardar()}
                >
                  {submitting ? 'Guardando…' : 'Guardar'}
                </Button>
              </section>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Subtipo / cuenta filtrada
// ---------------------------------------------------------------------------

interface CuentasStepProps {
  headingRef: RefObject<HTMLHeadingElement | null>;
  tipo: OperationType;
  subtype: 'general' | 'salario';
  accounts: AccountSummary[];
  debitAccountId: string | null;
  creditAccountId: string | null;
  onSelectSubtype: (subtype: 'general' | 'salario') => void;
  onSelectDebit: (accountId: string) => void;
  onSelectCredit: (accountId: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}

function CuentasStep({
  headingRef,
  tipo,
  subtype,
  accounts,
  debitAccountId,
  creditAccountId,
  onSelectSubtype,
  onSelectDebit,
  onSelectCredit,
  onContinue,
  canContinue,
}: CuentasStepProps) {
  const debitOptions = excludeAccount(debitAccountOptions(accounts, tipo), creditAccountId);
  const creditOptions = excludeAccount(creditAccountOptions(accounts, tipo), debitAccountId);

  return (
    <section>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-headline-md text-on-surface font-bold mb-md focus:outline-none"
      >
        Cuentas del movimiento
      </h2>

      {tipo === 'INGRESO' && (
        <div className="flex gap-sm mb-md">
          <button
            type="button"
            onClick={() => onSelectSubtype('salario')}
            className={`p-sm rounded-lg border-2 text-label-md font-semibold ${
              subtype === 'salario' ? 'border-primary text-primary' : 'border-outline-variant/40'
            }`}
          >
            Sueldo
          </button>
          <button
            type="button"
            onClick={() => onSelectSubtype('general')}
            className={`p-sm rounded-lg border-2 text-label-md font-semibold ${
              subtype === 'general' ? 'border-primary text-primary' : 'border-outline-variant/40'
            }`}
          >
            Otro ingreso
          </button>
        </div>
      )}

      <div className="space-y-md">
        <div>
          <label
            htmlFor="entry-debit-account"
            className="text-label-md text-on-surface-variant mb-xs block"
          >
            {DEBIT_LABEL[tipo]}
          </label>
          <select
            id="entry-debit-account"
            value={debitAccountId ?? ''}
            onChange={(e) => onSelectDebit(e.target.value)}
            className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
          >
            <option value="" disabled>
              Elegí una cuenta…
            </option>
            {debitOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="entry-credit-account"
            className="text-label-md text-on-surface-variant mb-xs block"
          >
            {CREDIT_LABEL[tipo]}
          </label>
          <select
            id="entry-credit-account"
            value={creditAccountId ?? ''}
            onChange={(e) => onSelectCredit(e.target.value)}
            className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
          >
            <option value="" disabled>
              Elegí una cuenta…
            </option>
            {creditOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button className="mt-md" disabled={!canContinue} onClick={onContinue}>
        Continuar
      </Button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Entidad (JIT + salary capability gate)
// ---------------------------------------------------------------------------

interface EntidadStepProps {
  headingRef: RefObject<HTMLHeadingElement | null>;
  requiredCapability: string | null;
  candidateEntities: EntitySummary[];
  allEntities: EntitySummary[];
  entityId: string | null;
  showJit: boolean;
  jitSubmitting: boolean;
  jitError: string;
  entityError: string;
  onSelectEntity: (entityId: string) => void;
  onOpenJit: () => void;
  onCancelJit: () => void;
  onCreateEntity: (values: EntityJitFormValues) => void;
  onSkip: () => void;
  onContinue: () => void;
}

function EntidadStep({
  headingRef,
  requiredCapability,
  candidateEntities,
  allEntities,
  entityId,
  showJit,
  jitSubmitting,
  jitError,
  entityError,
  onSelectEntity,
  onOpenJit,
  onCancelJit,
  onCreateEntity,
  onSkip,
  onContinue,
}: EntidadStepProps) {
  const blocked = requiredCapability !== null && candidateEntities.length === 0;
  const options = requiredCapability ? candidateEntities : allEntities;

  return (
    <section>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-headline-md text-on-surface font-bold mb-md focus:outline-none"
      >
        ¿Con quién es este movimiento?
      </h2>

      {blocked ? (
        <div className="space-y-sm">
          <ValidationMessage tone="error" title="Falta la organización empleadora">
            Necesitás una organización con la capacidad de relación de dependencia para registrar
            un sueldo.
          </ValidationMessage>
          <Button onClick={onOpenJit}>Crear organización empleadora</Button>
        </div>
      ) : (
        <div className="space-y-sm">
          {entityError && <ValidationMessage tone="error">{entityError}</ValidationMessage>}
          <label
            htmlFor="entry-entity"
            className="text-label-md text-on-surface-variant mb-xs block"
          >
            {requiredCapability ? 'Organización empleadora' : 'Entidad (opcional)'}
          </label>
          <select
            id="entry-entity"
            value={entityId ?? ''}
            onChange={(e) => onSelectEntity(e.target.value)}
            className="w-full h-12 px-md rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md"
          >
            <option value="">Sin entidad</option>
            {options.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>

          <div className="flex gap-sm">
            <Button variant="outline" size="sm" onClick={onOpenJit}>
              + Nueva entidad
            </Button>
            {!requiredCapability && (
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Omitir
              </Button>
            )}
          </div>

          <Button onClick={onContinue}>Continuar</Button>
        </div>
      )}

      {showJit && (
        <EntityJitForm
          lockedCapability={requiredCapability}
          submitting={jitSubmitting}
          error={jitError}
          onCreate={onCreateEntity}
          onCancel={onCancelJit}
        />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Completed step summary row (previous steps stay visible + editable)
// ---------------------------------------------------------------------------

interface StepSummaryRowProps {
  stepId: EntryStepId;
  state: ReturnType<typeof createInitialEntryBuilderState>;
  accounts: AccountSummary[];
  entities: EntitySummary[];
  onEdit: () => void;
}

function StepSummaryRow({ stepId, state, accounts, entities, onEdit }: StepSummaryRowProps) {
  const label = summaryLabel(stepId, state, accounts, entities);
  return (
    <div className="flex items-center justify-between gap-md p-sm rounded-lg bg-surface-container-lowest border border-outline-variant/30">
      <span className="text-body-md text-on-surface">{label}</span>
      <button
        type="button"
        onClick={onEdit}
        className="text-label-sm text-secondary font-semibold cursor-pointer"
      >
        Editar
      </button>
    </div>
  );
}

function summaryLabel(
  stepId: EntryStepId,
  state: ReturnType<typeof createInitialEntryBuilderState>,
  accounts: AccountSummary[],
  entities: EntitySummary[],
): string {
  switch (stepId) {
    case 'tipo':
      return `Tipo: ${state.tipo ? TIPO_LABEL[state.tipo] : '—'}`;
    case 'cuentas':
      return `${accountName(accounts, state.debitAccountId)} → ${accountName(accounts, state.creditAccountId)}`;
    case 'entidad': {
      const entity = entities.find((e) => e.id === state.entityId);
      return `Entidad: ${entity?.nombre ?? 'Sin entidad'}`;
    }
    case 'concepto':
      return `Concepto: ${state.concept || '—'}`;
    default:
      return '';
  }
}
