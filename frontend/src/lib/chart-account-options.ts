/**
 * Map chart postable globals into EntryBuilder account options (parity with
 * Hogar plantilla availableAccounts tipo "global").
 */

import type { AccountSummary, ChartGlobalNode } from './api.ts';

/** Derive EntryBuilder tipoCuenta from ISO-like chart codigo prefixes. */
export function inferTipoCuentaFromCodigo(codigo: string): string {
  if (codigo.startsWith('4')) return 'incomeCategory';
  if (codigo.startsWith('6')) return 'expenseCategory';
  if (codigo.startsWith('2120') || codigo.startsWith('2112')) return 'card';
  if (codigo.startsWith('1112')) return 'bank';
  if (codigo.startsWith('1111') || codigo.startsWith('1132') || codigo.startsWith('111')) {
    return 'wallet';
  }
  if (codigo.startsWith('1') || codigo.startsWith('2')) return 'bridge';
  return 'bridge';
}

/**
 * Globals that aren't already covered by a user account (same id or same name),
 * then user accounts first so EntryBuilder doesn't prefer catalog "Billetera"
 * over the seeded user wallet (avoids split-brain ledgers / false V12).
 */
export function mergePostableGlobalsIntoAccounts(
  chart: ChartGlobalNode[],
  userAccounts: AccountSummary[],
): AccountSummary[] {
  const userIds = new Set(userAccounts.map((a) => a.id));
  const userNames = new Set(
    userAccounts.map((a) => a.nombre.trim().toLowerCase()).filter(Boolean),
  );
  const globals: AccountSummary[] = chart
    .filter((node) => node.esPostable && !userIds.has(node.id))
    .filter((node) => !userNames.has(node.nombre.trim().toLowerCase()))
    .map((node) => ({
      id: node.id,
      codigo: node.codigo,
      nombre: node.nombre,
      tipoCuenta: inferTipoCuentaFromCodigo(node.codigo),
      entidadId: null,
      isEntityProvisioned: false,
      activa: true,
    }));

  return [...userAccounts, ...globals];
}
