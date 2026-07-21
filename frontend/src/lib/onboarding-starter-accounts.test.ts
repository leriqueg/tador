import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_STARTER_ACCOUNTS,
  seedOnboardingStarterAccounts,
} from './onboarding-starter-accounts.ts';

describe('onboarding starter accounts (T036)', () => {
  it('includes wallet plus income and expense categories', () => {
    const types = ONBOARDING_STARTER_ACCOUNTS.map((a) => a.tipoCuenta);
    expect(types).toContain('wallet');
    expect(types).toContain('incomeCategory');
    expect(types).toContain('expenseCategory');
  });

  it('creates each starter account via the provided callback', async () => {
    const created: string[] = [];
    await seedOnboardingStarterAccounts(async (input) => {
      created.push(`${input.tipoCuenta}:${input.nombre}`);
    });
    expect(created).toEqual(
      ONBOARDING_STARTER_ACCOUNTS.map((a) => `${a.tipoCuenta}:${a.nombre}`),
    );
  });
});
