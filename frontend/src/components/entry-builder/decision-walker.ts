/**
 * Pure walker for the EntryBuilder decision graph (specs/012).
 */

import {
  ENTRY_DECISION_GRAPH,
  getNode,
  type DecisionGraph,
  type DecisionNode,
  type LeafNode,
} from './decision-graph.ts';

export interface WalkerState {
  nodeId: string;
  entityId: string | null;
  debitAccountId: string | null;
  creditAccountId: string | null;
  concept: string;
  amount: string;
  /** Visited node ids for back/edit (excluding current). */
  history: string[];
  /** Choice node id → selected option id (for history affirmations). */
  choices: Record<string, string>;
}

export type WalkerAction =
  | { type: 'CHOOSE'; optionId: string }
  | { type: 'SET_ENTITY'; entityId: string | null }
  | { type: 'SET_ACCOUNT'; accountId: string }
  | { type: 'SET_CONCEPT'; concept: string }
  | { type: 'SET_AMOUNT'; amount: string }
  | { type: 'ADVANCE' }
  | { type: 'BACK' }
  | { type: 'BURST' }
  | { type: 'RESET' }
  | { type: 'JUMP_TO'; nodeId: string }
  | { type: 'HYDRATE'; state: WalkerState };

export interface EntityCapabilityLike {
  id: string;
  capabilities?: string[] | null;
}

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

export function createInitialWalkerState(
  graph: DecisionGraph = ENTRY_DECISION_GRAPH,
): WalkerState {
  return {
    nodeId: graph.rootId,
    entityId: null,
    debitAccountId: null,
    creditAccountId: null,
    concept: '',
    amount: '',
    history: [],
    choices: {},
  };
}

export function walkerHasDraft(state: WalkerState, graph: DecisionGraph = ENTRY_DECISION_GRAPH): boolean {
  return state.nodeId !== graph.rootId || state.concept.trim().length > 0 || state.amount.trim().length > 0;
}

function parsedAmount(raw: string): number {
  return Number(raw.replace(',', '.'));
}

export function currentNode(
  state: WalkerState,
  graph: DecisionGraph = ENTRY_DECISION_GRAPH,
): DecisionNode | undefined {
  return getNode(graph, state.nodeId);
}

export function isLeaf(state: WalkerState, graph: DecisionGraph = ENTRY_DECISION_GRAPH): boolean {
  return currentNode(state, graph)?.kind === 'leaf';
}

export function entityBlocksAdvance(
  state: WalkerState,
  entities: EntityCapabilityLike[],
  graph: DecisionGraph = ENTRY_DECISION_GRAPH,
): boolean {
  const node = currentNode(state, graph);
  if (!node || node.kind !== 'pick_entity') return false;
  if (node.optional) return false;
  const required = node.requiredCapability;
  if (!required) return !state.entityId;
  if (!state.entityId) return true;
  const entity = entities.find((e) => e.id === state.entityId);
  if (!entity) return true;
  return !(entity.capabilities ?? []).includes(required);
}

export function canAdvance(
  state: WalkerState,
  entities: EntityCapabilityLike[] = [],
  graph: DecisionGraph = ENTRY_DECISION_GRAPH,
): boolean {
  const node = currentNode(state, graph);
  if (!node) return false;
  switch (node.kind) {
    case 'choice':
      return false; // choose option instead of ADVANCE
    case 'pick_entity':
      if (node.optional) return true;
      return !entityBlocksAdvance(state, entities, graph);
    case 'pick_account': {
      const id = node.role === 'debit' ? state.debitAccountId : state.creditAccountId;
      if (!id) return false;
      if (state.debitAccountId && state.creditAccountId && state.debitAccountId === state.creditAccountId) {
        return false;
      }
      return true;
    }
    case 'concept':
      return state.concept.trim().length > 0;
    case 'amount': {
      const value = parsedAmount(state.amount);
      return Number.isFinite(value) && value > 0;
    }
    case 'leaf':
      return false;
    default:
      return false;
  }
}

function pushHistory(state: WalkerState, nextId: string): WalkerState {
  return {
    ...state,
    history: [...state.history, state.nodeId],
    nodeId: nextId,
  };
}

/** Keep answers that still belong to completed history (+ optional target being edited). */
function answersForPath(
  state: WalkerState,
  history: string[],
  targetId: string | null,
  graph: DecisionGraph,
): Pick<WalkerState, 'entityId' | 'debitAccountId' | 'creditAccountId' | 'concept' | 'amount'> {
  let entityId: string | null = null;
  let debitAccountId: string | null = null;
  let creditAccountId: string | null = null;
  let concept = '';
  let amount = '';

  const applyNode = (id: string) => {
    const n = getNode(graph, id);
    if (!n) return;
    if (n.kind === 'pick_entity') entityId = state.entityId;
    if (n.kind === 'pick_account' && n.role === 'debit') debitAccountId = state.debitAccountId;
    if (n.kind === 'pick_account' && n.role === 'credit') creditAccountId = state.creditAccountId;
    if (n.kind === 'concept') concept = state.concept;
    if (n.kind === 'amount') amount = state.amount;
  };

  for (const id of history) applyNode(id);
  if (targetId) applyNode(targetId);

  return { entityId, debitAccountId, creditAccountId, concept, amount };
}

export function decisionWalkerReducer(
  state: WalkerState,
  action: WalkerAction,
  graph: DecisionGraph = ENTRY_DECISION_GRAPH,
): WalkerState {
  const node = getNode(graph, state.nodeId);

  switch (action.type) {
    case 'RESET':
      return createInitialWalkerState(graph);

    case 'CHOOSE': {
      if (!node || node.kind !== 'choice') return state;
      const option = node.options.find((o) => o.id === action.optionId);
      if (!option) return state;
      const choices = {
        ...Object.fromEntries(
          Object.entries(state.choices).filter(([id]) => state.history.includes(id)),
        ),
        [state.nodeId]: action.optionId,
      };
      return pushHistory(
        {
          ...state,
          choices,
          entityId: null,
          debitAccountId: null,
          creditAccountId: null,
          concept: '',
          amount: '',
        },
        option.next,
      );
    }

    case 'SET_ENTITY':
      return { ...state, entityId: action.entityId };

    case 'SET_ACCOUNT': {
      if (!node || node.kind !== 'pick_account') return state;
      if (node.role === 'debit') return { ...state, debitAccountId: action.accountId };
      return { ...state, creditAccountId: action.accountId };
    }

    case 'SET_CONCEPT':
      return { ...state, concept: action.concept };

    case 'SET_AMOUNT':
      return { ...state, amount: action.amount };

    case 'ADVANCE': {
      if (!node || node.kind === 'choice' || node.kind === 'leaf') return state;
      if (!canAdvance(state, [], graph) && node.kind !== 'pick_entity') return state;
      if (node.kind === 'pick_entity' && !canAdvance(state, [], graph)) {
        if (!node.optional && !state.entityId) return state;
      }
      if (!('next' in node) || !node.next) return state;
      return pushHistory(state, node.next);
    }

    case 'BACK': {
      if (state.history.length === 0) return state;
      const history = [...state.history];
      const prev = history.pop()!;
      const choices = Object.fromEntries(
        Object.entries(state.choices).filter(([id]) => history.includes(id) || id === prev),
      );
      return {
        ...state,
        history,
        nodeId: prev,
        choices,
        ...answersForPath(state, history, prev, graph),
      };
    }

    case 'JUMP_TO': {
      const idx = state.history.indexOf(action.nodeId);
      if (idx < 0) return state;
      const history = state.history.slice(0, idx);
      const choices = Object.fromEntries(
        Object.entries(state.choices).filter(([id]) => history.includes(id)),
      );
      return {
        ...state,
        history,
        nodeId: action.nodeId,
        choices,
        ...answersForPath(state, history, action.nodeId, graph),
      };
    }

    case 'BURST': {
      if (!isLeaf(state, graph)) return state;
      const path = [...state.history, state.nodeId];
      let conceptId: string | null = null;
      for (let i = path.length - 1; i >= 0; i--) {
        const n = getNode(graph, path[i]!);
        if (n?.kind === 'concept') {
          conceptId = n.id;
          break;
        }
      }
      if (!conceptId) return { ...state, concept: '', amount: '' };
      const idx = state.history.indexOf(conceptId);
      return {
        ...state,
        concept: '',
        amount: '',
        nodeId: conceptId,
        history: idx >= 0 ? state.history.slice(0, idx) : state.history,
      };
    }

    case 'HYDRATE':
      return action.state;

    default:
      return state;
  }
}

/** Advance pick_entity with entity list for capability gating. */
export function advanceWithEntities(
  state: WalkerState,
  entities: EntityCapabilityLike[],
  graph: DecisionGraph = ENTRY_DECISION_GRAPH,
): WalkerState {
  if (!canAdvance(state, entities, graph)) return state;
  return decisionWalkerReducer(state, { type: 'ADVANCE' }, graph);
}

export function buildApunteSubmitPayload(
  state: WalkerState,
  date: string,
  graph: DecisionGraph = ENTRY_DECISION_GRAPH,
): ApunteSubmitPayload | null {
  const node = currentNode(state, graph);
  if (!node || node.kind !== 'leaf') return null;
  if (!state.debitAccountId || !state.creditAccountId) return null;
  if (state.debitAccountId === state.creditAccountId) return null;
  const concept = state.concept.trim();
  if (!concept) return null;
  const amount = parsedAmount(state.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const leaf = node as LeafNode;
  const entityId = state.entityId ?? undefined;

  if (leaf.templateCode) {
    return {
      templateCode: leaf.templateCode,
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
