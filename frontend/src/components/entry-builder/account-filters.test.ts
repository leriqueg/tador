import { describe, expect, it } from 'vitest';
import type { AccountSummary } from '../../lib/api.ts';
import {
  CREDIT_LABEL,
  DEBIT_LABEL,
  creditAccountOptions,
  debitAccountOptions,
  excludeAccount,
} from './account-filters.ts';

function account(overrides: Partial<AccountSummary>): AccountSummary {
  return {
    id: 'acc-1',
    codigo: null,
    nombre: 'Cuenta',
    tipoCuenta: 'wallet',
    entidadId: null,
    isEntityProvisioned: false,
    activa: true,
    ...overrides,
  };
}

const wallet = account({ id: 'wallet-1', tipoCuenta: 'wallet', nombre: 'Billetera' });
const bank = account({ id: 'bank-1', tipoCuenta: 'bank', nombre: 'Banco' });
const card = account({ id: 'card-1', tipoCuenta: 'card', nombre: 'Tarjeta' });
const incomeCategory = account({ id: 'income-1', tipoCuenta: 'incomeCategory', nombre: 'Ventas' });
const expenseCategory = account({ id: 'expense-1', tipoCuenta: 'expenseCategory', nombre: 'Servicios' });
const ALL = [wallet, bank, card, incomeCategory, expenseCategory];

describe('debitAccountOptions', () => {
  it('offers asset accounts (bank/wallet/bridge) as the debit side for INGRESO', () => {
    const options = debitAccountOptions(ALL, 'INGRESO');
    expect(options.map((a) => a.id).sort()).toEqual(['bank-1', 'wallet-1']);
  });

  it('offers only expense categories as the debit side for EGRESO', () => {
    const options = debitAccountOptions(ALL, 'EGRESO');
    expect(options).toEqual([expenseCategory]);
  });

  it('offers payment-method accounts (including card) as the debit side for TRANSFERENCIA', () => {
    const options = debitAccountOptions(ALL, 'TRANSFERENCIA');
    expect(options.map((a) => a.id).sort()).toEqual(['bank-1', 'card-1', 'wallet-1']);
  });
});

describe('creditAccountOptions', () => {
  it('offers only income categories as the credit side for INGRESO', () => {
    expect(creditAccountOptions(ALL, 'INGRESO')).toEqual([incomeCategory]);
  });

  it('offers payment-method accounts (including card) as the credit side for EGRESO', () => {
    const options = creditAccountOptions(ALL, 'EGRESO');
    expect(options.map((a) => a.id).sort()).toEqual(['bank-1', 'card-1', 'wallet-1']);
  });
});

describe('excludeAccount', () => {
  it('removes the given account id from the option list', () => {
    expect(excludeAccount([wallet, bank], 'bank-1')).toEqual([wallet]);
  });

  it('returns the same options when excludeId is null (nothing selected yet)', () => {
    expect(excludeAccount([wallet, bank], null)).toEqual([wallet, bank]);
  });
});

describe('step labels', () => {
  it('has a distinct label per operation type for both sides', () => {
    expect(DEBIT_LABEL.INGRESO).not.toBe(DEBIT_LABEL.EGRESO);
    expect(CREDIT_LABEL.TRANSFERENCIA).toContain('origen');
  });
});
