/**
 * Account filtering for EntryBuilder step 2 ("Subtipo / cuenta filtrada").
 *
 * Filters by `tipoCuenta` only — deeper chart-of-accounts hierarchy (e.g.
 * salary must land under group 41010000) is enforced by the backend at
 * write time (V4/V11 in `backend/src/api/routes/apuntes.ts`), consistent
 * with "validar la capacidad al apunte, no retroactivamente".
 */

import type { AccountSummary } from '../../lib/api.ts';
import type { OperationType } from './entry-builder-state.ts';

const ASSET_ACCOUNT_TYPES = new Set(['bank', 'wallet', 'bridge']);
const PAYMENT_METHOD_TYPES = new Set(['bank', 'wallet', 'bridge', 'card']);

export function debitAccountOptions(
  accounts: AccountSummary[],
  tipo: OperationType,
): AccountSummary[] {
  switch (tipo) {
    case 'INGRESO':
      return accounts.filter((a) => ASSET_ACCOUNT_TYPES.has(a.tipoCuenta));
    case 'EGRESO':
      return accounts.filter((a) => a.tipoCuenta === 'expenseCategory');
    case 'TRANSFERENCIA':
      return accounts.filter((a) => PAYMENT_METHOD_TYPES.has(a.tipoCuenta));
    default:
      return [];
  }
}

export function creditAccountOptions(
  accounts: AccountSummary[],
  tipo: OperationType,
): AccountSummary[] {
  switch (tipo) {
    case 'INGRESO':
      return accounts.filter((a) => a.tipoCuenta === 'incomeCategory');
    case 'EGRESO':
      return accounts.filter((a) => PAYMENT_METHOD_TYPES.has(a.tipoCuenta));
    case 'TRANSFERENCIA':
      return accounts.filter((a) => PAYMENT_METHOD_TYPES.has(a.tipoCuenta));
    default:
      return [];
  }
}

/** Keeps the opposing side from offering the account already picked (V10: origin ≠ destination). */
export function excludeAccount(
  options: AccountSummary[],
  excludeId: string | null,
): AccountSummary[] {
  if (!excludeId) return options;
  return options.filter((a) => a.id !== excludeId);
}

export const DEBIT_LABEL: Record<OperationType, string> = {
  INGRESO: '¿Dónde recibiste el dinero?',
  EGRESO: 'Categoría del gasto',
  TRANSFERENCIA: 'Cuenta destino',
};

export const CREDIT_LABEL: Record<OperationType, string> = {
  INGRESO: 'Categoría de ingreso',
  EGRESO: '¿Con qué pagaste?',
  TRANSFERENCIA: 'Cuenta origen',
};
