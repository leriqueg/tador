import { describe, expect, it } from 'vitest';
import { ENTRY_DECISION_GRAPH } from './decision-graph.ts';
import {
  advanceWithEntities,
  buildApunteSubmitPayload,
  canAdvance,
  createInitialWalkerState,
  currentNode,
  decisionWalkerReducer,
  isLeaf,
  walkerHasDraft,
} from './decision-walker.ts';

function walkSueldoToLeaf() {
  let state = createInitialWalkerState();
  state = decisionWalkerReducer(state, { type: 'CHOOSE', optionId: 'ingreso' });
  state = decisionWalkerReducer(state, { type: 'CHOOSE', optionId: 'sueldo' });
  state = decisionWalkerReducer(state, { type: 'SET_ENTITY', entityId: 'org-1' });
  state = advanceWithEntities(state, [
    { id: 'org-1', capabilities: ['is_employment_dependency'] },
  ]);
  state = decisionWalkerReducer(state, { type: 'SET_ACCOUNT', accountId: 'bank-1' });
  state = decisionWalkerReducer(state, { type: 'ADVANCE' });
  state = decisionWalkerReducer(state, { type: 'SET_ACCOUNT', accountId: 'income-1' });
  state = decisionWalkerReducer(state, { type: 'ADVANCE' });
  state = decisionWalkerReducer(state, { type: 'SET_CONCEPT', concept: 'Sueldo marzo' });
  state = decisionWalkerReducer(state, { type: 'ADVANCE' });
  state = decisionWalkerReducer(state, { type: 'SET_AMOUNT', amount: '1500' });
  state = decisionWalkerReducer(state, { type: 'ADVANCE' });
  return state;
}

describe('decision-walker (012 T004/T006)', () => {
  it('starts at root choice', () => {
    const state = createInitialWalkerState();
    expect(state.nodeId).toBe('root');
    expect(currentNode(state)?.kind).toBe('choice');
    expect(walkerHasDraft(state)).toBe(false);
  });

  it('walks INGRESO → sueldo to leaf with registrar_sueldo payload', () => {
    const state = walkSueldoToLeaf();
    expect(isLeaf(state)).toBe(true);
    expect(currentNode(state)).toMatchObject({
      kind: 'leaf',
      templateCode: 'registrar_sueldo',
    });

    const payload = buildApunteSubmitPayload(state, '2026-07-21');
    expect(payload).toEqual({
      templateCode: 'registrar_sueldo',
      date: '2026-07-21',
      concept: 'Sueldo marzo',
      amount: 1500,
      lines: [
        { id: 1, accountId: 'bank-1' },
        { id: 2, accountId: 'income-1' },
      ],
      entityId: 'org-1',
    });
  });

  it('blocks employer advance without capability', () => {
    let state = createInitialWalkerState();
    state = decisionWalkerReducer(state, { type: 'CHOOSE', optionId: 'ingreso' });
    state = decisionWalkerReducer(state, { type: 'CHOOSE', optionId: 'sueldo' });
    state = decisionWalkerReducer(state, { type: 'SET_ENTITY', entityId: 'org-x' });
    expect(
      canAdvance(state, [{ id: 'org-x', capabilities: ['can_be_customer'] }]),
    ).toBe(false);
    const next = advanceWithEntities(state, [{ id: 'org-x', capabilities: ['can_be_customer'] }]);
    expect(next.nodeId).toBe('sueldo_empleador');
  });

  it('cliente leaf is free-form (no templateCode)', () => {
    let state = createInitialWalkerState();
    state = decisionWalkerReducer(state, { type: 'CHOOSE', optionId: 'ingreso' });
    state = decisionWalkerReducer(state, { type: 'CHOOSE', optionId: 'cliente' });
    state = decisionWalkerReducer(state, { type: 'SET_ENTITY', entityId: 'c1' });
    state = advanceWithEntities(state, [{ id: 'c1', capabilities: ['can_be_customer'] }]);
    state = decisionWalkerReducer(state, { type: 'SET_ACCOUNT', accountId: 'wallet-1' });
    state = decisionWalkerReducer(state, { type: 'ADVANCE' });
    state = decisionWalkerReducer(state, { type: 'SET_ACCOUNT', accountId: 'inc-1' });
    state = decisionWalkerReducer(state, { type: 'ADVANCE' });
    state = decisionWalkerReducer(state, { type: 'SET_CONCEPT', concept: 'Factura 1' });
    state = decisionWalkerReducer(state, { type: 'ADVANCE' });
    state = decisionWalkerReducer(state, { type: 'SET_AMOUNT', amount: '200' });
    state = decisionWalkerReducer(state, { type: 'ADVANCE' });

    const payload = buildApunteSubmitPayload(state, '2026-07-21');
    expect(payload?.templateCode).toBeUndefined();
    expect(payload?.lines[0]).toMatchObject({ side: 'debit', amount: 200 });
  });

  it('BACK restores previous node', () => {
    let state = createInitialWalkerState();
    state = decisionWalkerReducer(state, { type: 'CHOOSE', optionId: 'ingreso' });
    expect(state.nodeId).toBe('ingreso_origen');
    expect(state.choices.root).toBe('ingreso');
    state = decisionWalkerReducer(state, { type: 'BACK' });
    expect(state.nodeId).toBe('root');
  });

  it('JUMP_TO returns to a history step and keeps earlier answers', () => {
    let state = walkSueldoToLeaf();
    state = decisionWalkerReducer(state, { type: 'JUMP_TO', nodeId: 'root' });
    expect(state.nodeId).toBe('root');
    expect(state.history).toEqual([]);
    expect(state.choices).toEqual({});
    expect(state.entityId).toBeNull();
    expect(state.debitAccountId).toBeNull();
  });

  it('JUMP_TO mid-path keeps prior choices and accounts', () => {
    let state = walkSueldoToLeaf();
    state = decisionWalkerReducer(state, { type: 'JUMP_TO', nodeId: 'sueldo_liquidez' });
    expect(state.nodeId).toBe('sueldo_liquidez');
    expect(state.choices.root).toBe('ingreso');
    expect(state.choices.ingreso_origen).toBe('sueldo');
    expect(state.entityId).toBe('org-1');
    expect(state.debitAccountId).toBe('bank-1');
    expect(state.creditAccountId).toBeNull();
  });

  it('BURST clears concept/amount and returns to concept node', () => {
    let state = walkSueldoToLeaf();
    state = decisionWalkerReducer(state, { type: 'BURST' });
    expect(state.concept).toBe('');
    expect(state.amount).toBe('');
    expect(currentNode(state)?.kind).toBe('concept');
    expect(state.debitAccountId).toBe('bank-1');
    expect(state.entityId).toBe('org-1');
  });

  it('graph root has three operation options', () => {
    const root = ENTRY_DECISION_GRAPH.nodes[ENTRY_DECISION_GRAPH.rootId];
    expect(root?.kind).toBe('choice');
    if (root?.kind === 'choice') {
      expect(root.options.map((o) => o.id)).toEqual(['ingreso', 'egreso', 'transferencia']);
    }
  });

  it('transfer bank → wallet: credit origen, debit destino (registrar_sueldo-compatible sides)', () => {
    let state = createInitialWalkerState();
    state = decisionWalkerReducer(state, { type: 'CHOOSE', optionId: 'transferencia' });
    expect(state.nodeId).toBe('xfer_origen');
    state = decisionWalkerReducer(state, { type: 'SET_ACCOUNT', accountId: 'pichincha' });
    state = decisionWalkerReducer(state, { type: 'ADVANCE' });
    expect(state.nodeId).toBe('xfer_destino');
    state = decisionWalkerReducer(state, { type: 'SET_ACCOUNT', accountId: 'billetera' });
    state = decisionWalkerReducer(state, { type: 'ADVANCE' });
    state = decisionWalkerReducer(state, { type: 'SET_CONCEPT', concept: 'Retiro' });
    state = decisionWalkerReducer(state, { type: 'ADVANCE' });
    state = decisionWalkerReducer(state, { type: 'SET_AMOUNT', amount: '50' });
    state = decisionWalkerReducer(state, { type: 'ADVANCE' });

    expect(state.creditAccountId).toBe('pichincha');
    expect(state.debitAccountId).toBe('billetera');
    expect(buildApunteSubmitPayload(state, '2026-07-21')).toEqual({
      templateCode: 'transferencia',
      date: '2026-07-21',
      concept: 'Retiro',
      amount: 50,
      lines: [
        { id: 1, accountId: 'billetera' },
        { id: 2, accountId: 'pichincha' },
      ],
      entityId: undefined,
    });
  });
});
