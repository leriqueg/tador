/**
 * PRO accounts tree helpers — chart mothers + user accounts (US4, T022–T023).
 */

import type { AccountSummary, ChartGlobalNode, TipoCuentaManualCreate } from '../../lib/api.ts';

export interface AccountTreeRow extends AccountSummary {
  saldo?: number;
}

export interface AccountsTreeGroup {
  id: string;
  codigo: string;
  nombre: string;
  esPostable: boolean;
  accounts: AccountTreeRow[];
  children: AccountsTreeGroup[];
}

const MANUAL_CREATE_TYPES: TipoCuentaManualCreate[] = [
  'incomeCategory',
  'expenseCategory',
  'wallet',
  'bridge',
];

export function manualCreateAccountTypes(): TipoCuentaManualCreate[] {
  return [...MANUAL_CREATE_TYPES];
}

/** Maps backend account-create errors to everyday Spanish (US4, T023). */
export function friendlyAccountCreateError(message: string): string {
  if (message.includes('bank and card') || message.includes('/api/entities')) {
    return 'Las cuentas bancarias y tarjetas se crean desde Entidades, no manualmente.';
  }
  if (message.includes('Unknown parentGroupCodigo')) {
    return 'La cuenta madre seleccionada no es válida.';
  }
  return message;
}

/** Closest non-postable chart node for a user account codigo. */
export function resolveParentCodigo(
  chart: ChartGlobalNode[],
  acc: AccountSummary,
): string | null {
  if (!acc.codigo) return null;
  const mothers = chart
    .filter((node) => !node.esPostable)
    .filter((node) => accountBelongsUnderMother(node.codigo, acc.codigo!))
    .sort((a, b) => b.codigo.length - a.codigo.length);
  return mothers[0]?.codigo ?? null;
}

function accountBelongsUnderMother(motherCodigo: string, accountCodigo: string): boolean {
  if (accountCodigo.startsWith(motherCodigo)) return true;
  // User accounts follow [A][BBB][1][DDD] under the same ABBB block as the mother.
  return (
    accountCodigo.length >= 4 &&
    motherCodigo.length >= 4 &&
    accountCodigo.slice(0, 4) === motherCodigo.slice(0, 4)
  );
}

export function listAllowedCreateMothers(chart: ChartGlobalNode[]): ChartGlobalNode[] {
  return chart
    .filter((node) => !node.esPostable)
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
}

/**
 * Mothers for the create form, filtered by class so PRO users don't hang
 * income/expense categories under Activo/Pasivo by accident.
 */
export function mothersForAccountType(
  chart: ChartGlobalNode[],
  tipo: TipoCuentaManualCreate,
): ChartGlobalNode[] {
  const all = listAllowedCreateMothers(chart);
  switch (tipo) {
    case 'incomeCategory':
      return all.filter((n) => n.codigo.startsWith('4'));
    case 'expenseCategory':
      return all.filter((n) => n.codigo.startsWith('6'));
    case 'wallet':
      return all.filter((n) => n.codigo.startsWith('1111') || n.codigo.startsWith('111'));
    case 'bridge':
      return all.filter(
        (n) =>
          n.codigo.startsWith('11') ||
          n.codigo.startsWith('12') ||
          n.codigo.startsWith('21') ||
          n.codigo.startsWith('22'),
      );
    default:
      return all;
  }
}

/** Prefer a concrete operational group when several mothers match. */
export function preferredMotherCodigo(
  mothers: ChartGlobalNode[],
  tipo: TipoCuentaManualCreate,
): string {
  if (mothers.length === 0) return '';
  const preferred =
    tipo === 'incomeCategory'
      ? mothers.find((m) => m.codigo === '41010000') ??
        mothers.find((m) => m.codigo.startsWith('4101'))
      : tipo === 'expenseCategory'
        ? mothers.find((m) => m.codigo === '61000000') ??
          mothers.find((m) => m.codigo.startsWith('610'))
        : undefined;
  return preferred?.codigo ?? mothers[0]!.codigo;
}

function emptyGroup(node: ChartGlobalNode): AccountsTreeGroup {
  return {
    id: node.id,
    codigo: node.codigo,
    nombre: node.nombre,
    esPostable: node.esPostable,
    accounts: [],
    children: [],
  };
}

/**
 * Builds a flat list of top-level groups (chart mothers) each holding nested
 * sub-groups and leaf user accounts matched by codigo prefix.
 */
export function buildAccountsTree(
  chart: ChartGlobalNode[],
  accounts: AccountSummary[],
  balances: Record<string, number>,
): AccountsTreeGroup[] {
  const byId = new Map(chart.map((node) => [node.id, emptyGroup(node)]));
  const roots: AccountsTreeGroup[] = [];

  for (const node of chart) {
    const group = byId.get(node.id)!;
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(group);
    } else {
      roots.push(group);
    }
  }

  const orphans: AccountTreeRow[] = [];

  for (const acc of accounts) {
    const row: AccountTreeRow = {
      ...acc,
      saldo: balances[acc.id],
    };
    const parentCodigo = resolveParentCodigo(chart, acc);
    const parentNode = parentCodigo
      ? chart.find((n) => n.codigo === parentCodigo)
      : undefined;
    if (parentNode && byId.has(parentNode.id)) {
      byId.get(parentNode.id)!.accounts.push(row);
    } else {
      orphans.push(row);
    }
  }

  if (orphans.length > 0) {
    roots.push({
      id: '__orphan__',
      codigo: '—',
      nombre: 'Otras cuentas',
      esPostable: true,
      accounts: orphans,
      children: [],
    });
  }

  return roots.sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export function flattenVisibleAccounts(groups: AccountsTreeGroup[]): AccountTreeRow[] {
  const rows: AccountTreeRow[] = [];
  function walk(group: AccountsTreeGroup) {
    rows.push(...group.accounts);
    for (const child of group.children) walk(child);
  }
  for (const group of groups) walk(group);
  return rows;
}

export function findAccountsTreeGroup(
  groups: AccountsTreeGroup[],
  codigo: string,
): AccountsTreeGroup | undefined {
  for (const group of groups) {
    if (group.codigo === codigo) return group;
    const nested = findAccountsTreeGroup(group.children, codigo);
    if (nested) return nested;
  }
  return undefined;
}
