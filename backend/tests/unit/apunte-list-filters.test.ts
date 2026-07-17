import { describe, it, expect } from 'vitest';
import { buildApunteListWhere } from '../../src/application/apunte-list-filters.js';

describe('buildApunteListWhere', () => {
  it('always scopes by userId', () => {
    expect(buildApunteListWhere('u1', {})).toEqual({ userId: 'u1' });
  });

  it('adds case-insensitive concept contains', () => {
    const where = buildApunteListWhere('u1', { q: '  Luz  ' });
    expect(where.concept).toEqual({ contains: 'Luz', mode: 'insensitive' });
  });

  it('adds amount min/max', () => {
    const where = buildApunteListWhere('u1', {
      amountMin: '40',
      amountMax: '60',
    });
    expect(where.amount).toEqual({ gte: 40, lte: 60 });
  });

  it('adds date range inclusive end of day', () => {
    const where = buildApunteListWhere('u1', {
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    const date = where.date as { gte: Date; lte: Date };
    expect(date.gte.toISOString().startsWith('2026-07-01')).toBe(true);
    expect(date.lte.getUTCHours()).toBe(23);
  });

  it('filters by account via asiento lineas', () => {
    const where = buildApunteListWhere('u1', { accountId: 'acc-1' });
    expect(where.asiento).toEqual({
      lineas: {
        some: {
          OR: [{ cuentaId: 'acc-1' }, { cuentaGlobalId: 'acc-1' }],
        },
      },
    });
  });
});
