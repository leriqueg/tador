import { afterEach, describe, expect, it } from 'vitest';
import {
  accountMemoryKey,
  readLastAccountPair,
  resolveStickyAccounts,
  writeLastAccountPair,
} from './entry-builder-account-memory.ts';

describe('entry-builder-account-memory', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('stores and reads debit/credit pair by operation key', () => {
    const key = accountMemoryKey('EGRESO', 'general');
    writeLastAccountPair(key, 'exp-1', 'bank-1');
    expect(readLastAccountPair(key)).toEqual({
      debitAccountId: 'exp-1',
      creditAccountId: 'bank-1',
    });
  });

  it('returns null when sticky ids are not in current option lists', () => {
    const key = accountMemoryKey('INGRESO', 'general');
    writeLastAccountPair(key, 'bank-1', 'income-1');
    expect(
      resolveStickyAccounts(key, [{ id: 'bank-2' }], [{ id: 'income-1' }]),
    ).toBeNull();
  });

  it('returns sticky pair when both accounts remain valid options', () => {
    const key = accountMemoryKey('TRANSFERENCIA', 'general');
    writeLastAccountPair(key, 'bank-1', 'wallet-1');
    expect(
      resolveStickyAccounts(
        key,
        [{ id: 'bank-1' }, { id: 'bank-2' }],
        [{ id: 'wallet-1' }],
      ),
    ).toEqual({ debitAccountId: 'bank-1', creditAccountId: 'wallet-1' });
  });
});
