import { useEffect, useMemo, useReducer, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button.tsx';
import Icon from '../ui/Icon.tsx';
import TextInput from '../ui/TextInput.tsx';
import ValidationMessage from '../ui/ValidationMessage.tsx';
import EntityJitForm, { type EntityJitFormValues } from './EntityJitForm.tsx';
import {
  ENTRY_DECISION_GRAPH,
  getNode,
  type DecisionNode,
  type PickAccountNode,
} from './decision-graph.ts';
import {
  advanceWithEntities,
  buildApunteSubmitPayload,
  canAdvance,
  createInitialWalkerState,
  currentNode,
  decisionWalkerReducer,
  entityBlocksAdvance,
  walkerHasDraft,
  type ApunteSubmitPayload,
  type WalkerAction,
  type WalkerState,
} from './decision-walker.ts';
import { filterAccountsForPickNode } from './account-node-filter.ts';
import type { AccountSummary, ChartGlobalNode, EntitySummary } from '../../lib/api.ts';

export type { ApunteSubmitPayload };

export interface EntryBuilderProps {
  accounts: AccountSummary[];
  entities: EntitySummary[];
  chart?: ChartGlobalNode[];
  onSubmit: (payload: ApunteSubmitPayload) => Promise<void>;
  onCreateEntity: (values: EntityJitFormValues) => Promise<EntitySummary>;
  onDraftChange?: (hasDraft: boolean) => void;
}

const SELECT_CLASS =
  'w-full h-9 px-sm rounded-md border border-outline-variant bg-surface-container-lowest text-body-sm text-on-surface';
const HEADING_CLASS =
  'text-title-md text-on-surface font-semibold mb-sm focus:outline-none';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function accountName(accounts: AccountSummary[], id: string | null): string {
  if (!id) return '—';
  return accounts.find((a) => a.id === id)?.nombre ?? '—';
}

function choiceLabel(node: DecisionNode, optionId: string | undefined): string {
  if (!optionId || node.kind !== 'choice') return '—';
  return node.options.find((o) => o.id === optionId)?.label ?? optionId;
}

/** Affirmation + value for a completed history node. */
export function historyStepLabel(
  nodeId: string,
  state: WalkerState,
  accounts: AccountSummary[],
  entities: EntitySummary[],
): { label: string; value: string } | null {
  const histNode = getNode(ENTRY_DECISION_GRAPH, nodeId);
  if (!histNode || histNode.kind === 'leaf') return null;
  const prefix = histNode.affirmation ?? histNode.question ?? nodeId;
  let value = '—';
  if (histNode.kind === 'choice') {
    value = choiceLabel(histNode, state.choices[nodeId]);
  } else if (histNode.kind === 'pick_entity') {
    value = entities.find((e) => e.id === state.entityId)?.nombre ?? '—';
  } else if (histNode.kind === 'pick_account') {
    const accId = histNode.role === 'debit' ? state.debitAccountId : state.creditAccountId;
    value = accountName(accounts, accId);
  } else if (histNode.kind === 'concept') {
    value = state.concept.trim() || '—';
  } else if (histNode.kind === 'amount') {
    value = state.amount.trim() || '—';
  }
  return { label: prefix, value };
}

function reducer(state: WalkerState, action: WalkerAction): WalkerState {
  return decisionWalkerReducer(state, action, ENTRY_DECISION_GRAPH);
}

/** PRO EntryBuilder — compact decision graph walker (specs/012). */
export default function EntryBuilder({
  accounts,
  entities,
  chart = [],
  onSubmit,
  onCreateEntity,
  onDraftChange,
}: EntryBuilderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialWalkerState(ENTRY_DECISION_GRAPH),
  );
  const [localEntities, setLocalEntities] = useState<EntitySummary[]>(entities);
  const [showJit, setShowJit] = useState(false);
  const [jitSubmitting, setJitSubmitting] = useState(false);
  const [jitError, setJitError] = useState('');
  const [entityError, setEntityError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [phase, setPhase] = useState<'builder' | 'success'>('builder');

  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const node = currentNode(state, ENTRY_DECISION_GRAPH);
  const hasDraft = walkerHasDraft(state, ENTRY_DECISION_GRAPH);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [state.nodeId]);

  useEffect(() => {
    onDraftChange?.(phase === 'builder' && hasDraft);
  }, [hasDraft, phase, onDraftChange]);

  useEffect(() => {
    setLocalEntities(entities);
  }, [entities]);

  const pickAccountOptions = useMemo(() => {
    if (!node || node.kind !== 'pick_account') return [];
    return filterAccountsForPickNode(accounts, node, chart);
  }, [accounts, chart, node]);

  const candidateEntities = useMemo(() => {
    if (!node || node.kind !== 'pick_entity') return localEntities;
    const required = node.requiredCapability;
    if (!required) return localEntities;
    return localEntities.filter((e) => (e.capabilities ?? []).includes(required));
  }, [localEntities, node]);

  function clearAll() {
    dispatch({ type: 'RESET' });
    setShowJit(false);
    setJitError('');
    setEntityError('');
    setSubmitError('');
    setPhase('builder');
  }

  async function handleCreateEntity(values: EntityJitFormValues) {
    setJitSubmitting(true);
    setJitError('');
    try {
      const created = await onCreateEntity(values);
      setLocalEntities((prev) => [...prev, created]);
      dispatch({ type: 'SET_ENTITY', entityId: created.id });
      setShowJit(false);
      setEntityError('');
    } catch (err) {
      setJitError(err instanceof Error ? err.message : 'No se pudo crear la entidad');
    } finally {
      setJitSubmitting(false);
    }
  }

  function continueEntity() {
    if (entityBlocksAdvance(state, localEntities, ENTRY_DECISION_GRAPH)) {
      setEntityError('Elegí una entidad válida para continuar.');
      return;
    }
    setEntityError('');
    dispatch({
      type: 'HYDRATE',
      state: advanceWithEntities(state, localEntities, ENTRY_DECISION_GRAPH),
    });
  }

  async function handleSave(burst: boolean) {
    const payload = buildApunteSubmitPayload(state, todayIso(), ENTRY_DECISION_GRAPH);
    if (!payload) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(payload);
      if (burst) {
        dispatch({ type: 'BURST' });
        setPhase('builder');
      } else {
        setPhase('success');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo guardar el apunte');
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'success') {
    return (
      <div className="space-y-sm" aria-live="polite">
        <ValidationMessage tone="success">Apunte guardado.</ValidationMessage>
        <Button size="sm" onClick={clearAll}>
          Registrar otro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-sm text-body-sm" aria-live="polite">
      <div className="flex items-center justify-end min-h-8">
        {hasDraft && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-xs text-label-sm text-on-surface-variant hover:text-error"
            aria-label="Limpiar todo el apunte"
          >
                <Icon name="close" size="sm" className="!text-base" />
                Limpiar todo
              </button>
            )}
          </div>

          {state.history.length > 0 && (
            <ol className="space-y-1 mb-sm">
              {state.history.map((id) => {
                const step = historyStepLabel(id, state, accounts, localEntities);
                if (!step) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center gap-sm py-1 px-sm rounded-md bg-surface-container-low/60"
                  >
                    <span className="flex-1 min-w-0 text-body-sm text-on-surface truncate">
                      <span className="text-on-surface-variant">{step.label}:</span>{' '}
                      <span className="font-medium">{step.value}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'JUMP_TO', nodeId: id })}
                      className="shrink-0 inline-flex items-center justify-center size-7 rounded-md text-on-surface-variant hover:bg-outline-variant/30 hover:text-on-surface"
                      aria-label={`Editar: ${step.label} ${step.value}`}
                      title="Volver a este paso"
                    >
                      <Icon name="close" size="sm" className="!text-base" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

      {node?.kind === 'choice' && (
        <ChoiceStep
          headingRef={stepHeadingRef}
          question={node.question}
          options={node.options}
          canGoBack={state.history.length > 0}
          onChoose={(optionId) => dispatch({ type: 'CHOOSE', optionId })}
          onBack={() => dispatch({ type: 'BACK' })}
        />
      )}

      {node?.kind === 'pick_entity' && (
        <EntityStep
          headingRef={stepHeadingRef}
          question={node.question}
          requiredCapability={node.requiredCapability ?? null}
          candidates={candidateEntities}
          entityId={state.entityId}
          showJit={showJit}
          jitSubmitting={jitSubmitting}
          jitError={jitError}
          entityError={entityError}
          onSelect={(id) => dispatch({ type: 'SET_ENTITY', entityId: id })}
          onOpenJit={() => setShowJit(true)}
          onCancelJit={() => setShowJit(false)}
          onCreateEntity={handleCreateEntity}
          onContinue={continueEntity}
          onBack={() => dispatch({ type: 'BACK' })}
          canContinue={canAdvance(state, localEntities, ENTRY_DECISION_GRAPH)}
        />
      )}

      {node?.kind === 'pick_account' && (
        <AccountStep
          headingRef={stepHeadingRef}
          node={node}
          options={pickAccountOptions}
          selectedId={node.role === 'debit' ? state.debitAccountId : state.creditAccountId}
          onSelect={(accountId) => dispatch({ type: 'SET_ACCOUNT', accountId })}
          onContinue={() => dispatch({ type: 'ADVANCE' })}
          onBack={() => dispatch({ type: 'BACK' })}
          canContinue={canAdvance(state, localEntities, ENTRY_DECISION_GRAPH)}
        />
      )}

      {node?.kind === 'concept' && (
        <FieldStep
          headingRef={stepHeadingRef}
          title="Concepto"
          label="Concepto"
          inputId="entry-concept"
          value={state.concept}
          onChange={(concept) => dispatch({ type: 'SET_CONCEPT', concept })}
          onContinue={() => dispatch({ type: 'ADVANCE' })}
          onBack={() => dispatch({ type: 'BACK' })}
          canContinue={canAdvance(state, localEntities, ENTRY_DECISION_GRAPH)}
        />
      )}

      {node?.kind === 'amount' && (
        <FieldStep
          headingRef={stepHeadingRef}
          title="Monto"
          label="Monto"
          inputId="entry-amount"
          value={state.amount}
          inputMode="decimal"
          onChange={(amount) => dispatch({ type: 'SET_AMOUNT', amount })}
          onContinue={() => dispatch({ type: 'ADVANCE' })}
          onBack={() => dispatch({ type: 'BACK' })}
          canContinue={canAdvance(state, localEntities, ENTRY_DECISION_GRAPH)}
        />
      )}

      {node?.kind === 'leaf' && (
        <LeafStep
          headingRef={stepHeadingRef}
          flowSummary={
            state.debitAccountId && state.creditAccountId
              ? {
                  from: accountName(accounts, state.creditAccountId),
                  to: accountName(accounts, state.debitAccountId),
                  amount: state.amount,
                }
              : null
          }
          submitting={submitting}
          submitError={submitError}
          onSave={() => void handleSave(false)}
          onBurst={() => void handleSave(true)}
          onBack={() => dispatch({ type: 'BACK' })}
        />
      )}
    </div>
  );
}

function StepNav({
  onBack,
  onContinue,
  canContinue,
  continueLabel = 'Continuar',
}: {
  onBack: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
  continueLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-xs mt-sm">
      <Button variant="outline" size="sm" onClick={onBack}>
        Volver
      </Button>
      {onContinue && (
        <Button size="sm" disabled={!canContinue} onClick={onContinue}>
          {continueLabel}
        </Button>
      )}
    </div>
  );
}

function ChoiceStep({
  headingRef,
  question,
  options,
  canGoBack,
  onChoose,
  onBack,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  question: string;
  options: { id: string; label: string }[];
  canGoBack: boolean;
  onChoose: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1} className={HEADING_CLASS}>
        {question}
      </h2>
      <div className="flex flex-wrap items-center gap-xs">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChoose(opt.id)}
            className="px-sm py-1.5 rounded-md border border-outline-variant/60 hover:border-primary hover:bg-primary/5 text-label-sm font-semibold text-on-surface"
          >
            {opt.label}
          </button>
        ))}
        {canGoBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="!h-8 !px-sm">
            Volver
          </Button>
        )}
      </div>
    </section>
  );
}

function AccountStep({
  headingRef,
  node,
  options,
  selectedId,
  onSelect,
  onContinue,
  onBack,
  canContinue,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  node: PickAccountNode;
  options: AccountSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
  canContinue: boolean;
}) {
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1} className={HEADING_CLASS}>
        {node.question}
      </h2>
      {options.length === 0 ? (
        <ValidationMessage tone="error">
          No hay cuentas para este paso. Revisá{' '}
          <Link to="/pro/accounts" className="underline font-semibold">
            Cuentas
          </Link>{' '}
          o{' '}
          <Link to="/pro/entities" className="underline font-semibold">
            Entidades
          </Link>
          .
        </ValidationMessage>
      ) : (
        <select
          id={`entry-account-${node.role}`}
          aria-label={node.question}
          value={selectedId ?? ''}
          onChange={(e) => onSelect(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="" disabled>
            Elegí una cuenta…
          </option>
          {options.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      )}
      <StepNav onBack={onBack} onContinue={onContinue} canContinue={canContinue} />
    </section>
  );
}

function EntityStep({
  headingRef,
  question,
  requiredCapability,
  candidates,
  entityId,
  showJit,
  jitSubmitting,
  jitError,
  entityError,
  onSelect,
  onOpenJit,
  onCancelJit,
  onCreateEntity,
  onContinue,
  onBack,
  canContinue,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  question: string;
  requiredCapability: string | null;
  candidates: EntitySummary[];
  entityId: string | null;
  showJit: boolean;
  jitSubmitting: boolean;
  jitError: string;
  entityError: string;
  onSelect: (id: string) => void;
  onOpenJit: () => void;
  onCancelJit: () => void;
  onCreateEntity: (v: EntityJitFormValues) => void;
  onContinue: () => void;
  onBack: () => void;
  canContinue: boolean;
}) {
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1} className={HEADING_CLASS}>
        {question}
      </h2>
      {entityError && <ValidationMessage tone="error">{entityError}</ValidationMessage>}
      {candidates.length === 0 ? (
        <ValidationMessage tone="error">
          No hay entidades aptas. Creá una abajo
          {requiredCapability === 'is_employment_dependency' ? ' (empleador)' : ''}.
        </ValidationMessage>
      ) : (
        <select
          aria-label={
            requiredCapability === 'is_employment_dependency'
              ? 'organización empleadora'
              : question
          }
          value={entityId ?? ''}
          onChange={(e) => onSelect(e.target.value)}
          className={`${SELECT_CLASS} mb-sm`}
        >
          <option value="" disabled>
            Elegí…
          </option>
          {candidates.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      )}
      {!showJit ? (
        <Button variant="outline" size="sm" onClick={onOpenJit}>
          Crear entidad
        </Button>
      ) : (
        <EntityJitForm
          lockedCapability={requiredCapability}
          submitting={jitSubmitting}
          error={jitError}
          onCreate={onCreateEntity}
          onCancel={onCancelJit}
        />
      )}
      <StepNav onBack={onBack} onContinue={onContinue} canContinue={canContinue} />
    </section>
  );
}

function FieldStep({
  headingRef,
  title,
  label,
  inputId,
  value,
  onChange,
  onContinue,
  onBack,
  canContinue,
  inputMode,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  title: string;
  label: string;
  inputId: string;
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  onBack: () => void;
  canContinue: boolean;
  inputMode?: 'decimal';
}) {
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1} className={HEADING_CLASS}>
        {title}
      </h2>
      <TextInput
        label={label}
        id={inputId}
        name={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        autoComplete="off"
        className="!h-9 !text-body-sm"
      />
      <StepNav onBack={onBack} onContinue={onContinue} canContinue={canContinue} />
    </section>
  );
}

function LeafStep({
  headingRef,
  flowSummary,
  submitting,
  submitError,
  onSave,
  onBurst,
  onBack,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  flowSummary: { from: string; to: string; amount: string } | null;
  submitting: boolean;
  submitError: string;
  onSave: () => void;
  onBurst: () => void;
  onBack: () => void;
}) {
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1} className={HEADING_CLASS}>
        Confirmar
      </h2>
      {flowSummary && (
        <p className="text-body-sm text-on-surface mb-sm rounded-md bg-surface-container-low/80 px-sm py-2">
          Sale de <span className="font-semibold">{flowSummary.from}</span>
          {' → '}
          Entra a <span className="font-semibold">{flowSummary.to}</span>
          {flowSummary.amount.trim() ? (
            <>
              {' '}
              (<span className="font-semibold">{flowSummary.amount}</span>)
            </>
          ) : null}
        </p>
      )}
      {submitError && <ValidationMessage tone="error">{submitError}</ValidationMessage>}
      <div className="flex flex-wrap gap-xs mt-sm">
        <Button variant="outline" size="sm" onClick={onBack} disabled={submitting}>
          Volver
        </Button>
        <Button size="sm" onClick={onSave} disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button variant="outline" size="sm" onClick={onBurst} disabled={submitting}>
          Guardar y registrar otro
        </Button>
      </div>
    </section>
  );
}
