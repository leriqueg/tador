/**
 * Starter CuentaUsuario created when onboarding completes (FR-016 / T036).
 * Keeps EntryBuilder and Hogar capture usable without a second setup trip.
 */

import type { CreateAccountInput } from './api.ts';

export const ONBOARDING_STARTER_ACCOUNTS: readonly CreateAccountInput[] = [
  { tipoCuenta: 'wallet', nombre: 'Billetera' },
  { tipoCuenta: 'incomeCategory', nombre: 'Sueldo' },
  { tipoCuenta: 'incomeCategory', nombre: 'Otros ingresos' },
  { tipoCuenta: 'expenseCategory', nombre: 'Gastos varios' },
] as const;

export async function seedOnboardingStarterAccounts(
  createAccount: (input: CreateAccountInput) => Promise<unknown>,
): Promise<void> {
  for (const account of ONBOARDING_STARTER_ACCOUNTS) {
    await createAccount(account);
  }
}
