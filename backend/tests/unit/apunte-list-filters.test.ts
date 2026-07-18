import { describe, it, expect } from 'vitest';
import { buildApunteListFilter } from '../../src/application/apunte-list-filters.js';

describe('buildApunteListFilter', () => {
  it('always scopes by userId', () => {
    expect(buildApunteListFilter('u1', {})).toEqual({ userId: 'u1' });
  });

  it('adds concept contains', () => {
    const filter = buildApunteListFilter('u1', { q: '  Luz  ' });
    expect(filter.conceptContains).toBe('Luz');
  });

  it('adds amount min/max as strings', () => {
    const filter = buildApunteListFilter('u1', {
      amountMin: '40',
      amountMax: '60',
    });
    expect(filter.amountGte).toBe('40');
    expect(filter.amountLte).toBe('60');
  });

  it('adds date range inclusive end of day', () => {
    const filter = buildApunteListFilter('u1', {
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(filter.dateGte!.toISOString().startsWith('2026-07-01')).toBe(true);
    expect(filter.dateLte!.getUTCHours()).toBe(23);
  });

  it('filters by account id', () => {
    const filter = buildApunteListFilter('u1', { accountId: 'acc-1' });
    expect(filter.accountId).toBe('acc-1');
  });
});
