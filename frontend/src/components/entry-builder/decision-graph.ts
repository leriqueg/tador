/**
 * Static decision graph for PRO EntryBuilder (specs/012).
 * Plantillas are leaf recipes only — never the primary UX catalog.
 */

export type AccountRole = 'debit' | 'credit';

export type DecisionNodeKind =
  | 'choice'
  | 'pick_entity'
  | 'pick_account'
  | 'concept'
  | 'amount'
  | 'leaf';

export interface DecisionOption {
  id: string;
  label: string;
  next: string;
}

export interface DecisionNodeBase {
  id: string;
  kind: DecisionNodeKind;
  /** Active-step prompt (question form). */
  question?: string;
  /** Completed-step label (affirmation form), e.g. "Registrar", "De", "Ingresa a". */
  affirmation?: string;
}

export interface ChoiceNode extends DecisionNodeBase {
  kind: 'choice';
  question: string;
  options: DecisionOption[];
}

export interface PickEntityNode extends DecisionNodeBase {
  kind: 'pick_entity';
  question: string;
  requiredCapability?: string | null;
  optional?: boolean;
  next: string;
}

export interface PickAccountNode extends DecisionNodeBase {
  kind: 'pick_account';
  question: string;
  role: AccountRole;
  /** Prefer groupCodes when set (chart ancestry). */
  groupCodes?: string[];
  tipoCuenta?: string[];
  next: string;
}

export interface ConceptNode extends DecisionNodeBase {
  kind: 'concept';
  question?: string;
  next: string;
}

export interface AmountNode extends DecisionNodeBase {
  kind: 'amount';
  question?: string;
  next: string;
}

export interface LeafNode extends DecisionNodeBase {
  kind: 'leaf';
  /** Existing plantilla code, or null for free-form lines. */
  templateCode: string | null;
}

export type DecisionNode =
  | ChoiceNode
  | PickEntityNode
  | PickAccountNode
  | ConceptNode
  | AmountNode
  | LeafNode;

export interface DecisionGraph {
  rootId: string;
  nodes: Record<string, DecisionNode>;
}

export const ENTRY_DECISION_GRAPH: DecisionGraph = {
  rootId: 'root',
  nodes: {
    root: {
      id: 'root',
      kind: 'choice',
      question: '¿Qué tipo de movimiento registrás?',
      affirmation: 'Registrar',
      options: [
        { id: 'ingreso', label: 'Ingreso', next: 'ingreso_origen' },
        { id: 'egreso', label: 'Egreso', next: 'egreso_gasto_cuenta' },
        { id: 'transferencia', label: 'Transferencia', next: 'xfer_origen' },
      ],
    },

    // —— INGRESO ——
    ingreso_origen: {
      id: 'ingreso_origen',
      kind: 'choice',
      question: '¿De dónde viene el dinero?',
      affirmation: 'De',
      options: [
        { id: 'sueldo', label: 'Cobré un sueldo', next: 'sueldo_empleador' },
        { id: 'cliente', label: 'Me pagó un cliente / trabajo', next: 'cliente_entidad' },
        { id: 'otro', label: 'Otro ingreso', next: 'otro_liquidez' },
      ],
    },

    sueldo_empleador: {
      id: 'sueldo_empleador',
      kind: 'pick_entity',
      question: '¿De qué empleador?',
      affirmation: 'Empleador',
      requiredCapability: 'is_employment_dependency',
      optional: false,
      next: 'sueldo_liquidez',
    },
    sueldo_liquidez: {
      id: 'sueldo_liquidez',
      kind: 'pick_account',
      question: '¿Dónde recibiste el dinero?',
      affirmation: 'Ingresa a',
      role: 'debit',
      groupCodes: ['11110000', '11120000'],
      next: 'sueldo_categoria',
    },
    sueldo_categoria: {
      id: 'sueldo_categoria',
      kind: 'pick_account',
      question: 'Categoría de ingreso',
      affirmation: 'Como',
      role: 'credit',
      groupCodes: ['41010000'],
      next: 'sueldo_concepto',
    },
    sueldo_concepto: {
      id: 'sueldo_concepto',
      kind: 'concept',
      question: 'Concepto',
      affirmation: 'Concepto',
      next: 'sueldo_monto',
    },
    sueldo_monto: {
      id: 'sueldo_monto',
      kind: 'amount',
      question: 'Monto',
      affirmation: 'Monto',
      next: 'leaf_sueldo',
    },
    leaf_sueldo: {
      id: 'leaf_sueldo',
      kind: 'leaf',
      templateCode: 'registrar_sueldo',
    },

    cliente_entidad: {
      id: 'cliente_entidad',
      kind: 'pick_entity',
      question: '¿Quién te pagó?',
      affirmation: 'Cliente',
      requiredCapability: 'can_be_customer',
      optional: false,
      next: 'cliente_liquidez',
    },
    cliente_liquidez: {
      id: 'cliente_liquidez',
      kind: 'pick_account',
      question: '¿Dónde recibiste el dinero?',
      affirmation: 'Ingresa a',
      role: 'debit',
      groupCodes: ['11110000', '11120000'],
      next: 'cliente_categoria',
    },
    cliente_categoria: {
      id: 'cliente_categoria',
      kind: 'pick_account',
      question: 'Categoría de ingreso',
      affirmation: 'Como',
      role: 'credit',
      groupCodes: ['41000000', '41010000', '41020000', '41100000', '41200000'],
      tipoCuenta: ['incomeCategory'],
      next: 'cliente_concepto',
    },
    cliente_concepto: {
      id: 'cliente_concepto',
      kind: 'concept',
      question: 'Concepto',
      affirmation: 'Concepto',
      next: 'cliente_monto',
    },
    cliente_monto: {
      id: 'cliente_monto',
      kind: 'amount',
      question: 'Monto',
      affirmation: 'Monto',
      next: 'leaf_cliente',
    },
    leaf_cliente: {
      id: 'leaf_cliente',
      kind: 'leaf',
      templateCode: null,
    },

    otro_liquidez: {
      id: 'otro_liquidez',
      kind: 'pick_account',
      question: '¿Dónde recibiste el dinero?',
      affirmation: 'Ingresa a',
      role: 'debit',
      groupCodes: ['11110000', '11120000'],
      next: 'otro_categoria',
    },
    otro_categoria: {
      id: 'otro_categoria',
      kind: 'pick_account',
      question: 'Categoría de ingreso',
      affirmation: 'Como',
      role: 'credit',
      tipoCuenta: ['incomeCategory'],
      next: 'otro_concepto',
    },
    otro_concepto: {
      id: 'otro_concepto',
      kind: 'concept',
      question: 'Concepto',
      affirmation: 'Concepto',
      next: 'otro_monto',
    },
    otro_monto: {
      id: 'otro_monto',
      kind: 'amount',
      question: 'Monto',
      affirmation: 'Monto',
      next: 'leaf_otro',
    },
    leaf_otro: {
      id: 'leaf_otro',
      kind: 'leaf',
      templateCode: null,
    },

    // —— EGRESO (minimal) ——
    egreso_gasto_cuenta: {
      id: 'egreso_gasto_cuenta',
      kind: 'pick_account',
      question: 'Categoría del gasto',
      affirmation: 'Gasto',
      role: 'debit',
      tipoCuenta: ['expenseCategory'],
      next: 'egreso_pago',
    },
    egreso_pago: {
      id: 'egreso_pago',
      kind: 'pick_account',
      question: '¿Con qué pagaste?',
      affirmation: 'Pagás con',
      role: 'credit',
      groupCodes: ['11110000', '11120000', '21200000'],
      next: 'egreso_concepto',
    },
    egreso_concepto: {
      id: 'egreso_concepto',
      kind: 'concept',
      question: 'Concepto',
      affirmation: 'Concepto',
      next: 'egreso_monto',
    },
    egreso_monto: {
      id: 'egreso_monto',
      kind: 'amount',
      question: 'Monto',
      affirmation: 'Monto',
      next: 'leaf_egreso',
    },
    leaf_egreso: {
      id: 'leaf_egreso',
      kind: 'leaf',
      templateCode: null,
    },

    // —— TRANSFERENCIA (minimal) ——
    // Ask origen first ("desde… hacia…"); debit = destino (money in), credit = origen (money out).
    xfer_origen: {
      id: 'xfer_origen',
      kind: 'pick_account',
      question: '¿Desde qué cuenta sale el dinero?',
      affirmation: 'Desde',
      role: 'credit',
      groupCodes: ['11110000', '11120000', '21200000'],
      next: 'xfer_destino',
    },
    xfer_destino: {
      id: 'xfer_destino',
      kind: 'pick_account',
      question: '¿A qué cuenta llega?',
      affirmation: 'Hacia',
      role: 'debit',
      groupCodes: ['11110000', '11120000', '21200000'],
      next: 'xfer_concepto',
    },
    xfer_concepto: {
      id: 'xfer_concepto',
      kind: 'concept',
      question: 'Concepto',
      affirmation: 'Concepto',
      next: 'xfer_monto',
    },
    xfer_monto: {
      id: 'xfer_monto',
      kind: 'amount',
      question: 'Monto',
      affirmation: 'Monto',
      next: 'leaf_xfer',
    },
    leaf_xfer: {
      id: 'leaf_xfer',
      kind: 'leaf',
      templateCode: 'transferencia',
    },
  },
};

export function getNode(graph: DecisionGraph, id: string): DecisionNode | undefined {
  return graph.nodes[id];
}
