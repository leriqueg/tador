import { describe, expect, it } from 'vitest';
import {
  formatMoney,
  leverageHint,
  leverageRatio,
  monthFromSeries,
  MONTH_LABELS,
} from './finance.ts';

describe('monthFromSeries', () => {
  const series = [
    { month: 1, income: 100, expenses: 40, balance: 60 },
    { month: 3, income: 200, expenses: 50, balance: 150 },
  ];

  it('returns the matching month point', () => {
    expect(monthFromSeries(series, 3)).toEqual({
      month: 3,
      income: 200,
      expenses: 50,
      balance: 150,
    });
  });

  it('returns zeroed defaults when month is missing', () => {
    expect(monthFromSeries(series, 2)).toEqual({
      month: 2,
      income: 0,
      expenses: 0,
      balance: 0,
    });
  });
});

describe('leverageRatio', () => {
  it('returns null when liquid assets are zero or negative', () => {
    expect(leverageRatio(0, 100)).toBeNull();
    expect(leverageRatio(-10, 100)).toBeNull();
  });

  it('computes payables over liquid assets', () => {
    expect(leverageRatio(1000, 250)).toBe(0.25);
    expect(leverageRatio(500, 500)).toBe(1);
  });
});

describe('leverageHint', () => {
  it('returns null when ratio is null', () => {
    expect(leverageHint(null)).toBeNull();
  });

  it('uses calm copy up to 30%', () => {
    expect(leverageHint(0.2)).toContain('Vas tranquilo');
  });

  it('uses caution copy between 31% and 70%', () => {
    expect(leverageHint(0.5)).toContain('Conviene mirarlo');
  });

  it('uses high-debt copy above 70%', () => {
    expect(leverageHint(0.9)).toContain('peso de la deuda es alto');
  });
});

describe('formatMoney', () => {
  it('formats USD with two fraction digits (es-ES locale)', () => {
    const formatted = formatMoney(1234.5, 'USD');
    expect(formatted).toContain('1234,50');
    expect(formatted).toMatch(/US\$|USD/);
  });
});

describe('MONTH_LABELS', () => {
  it('has 13 entries with empty index 0 and Spanish abbreviations', () => {
    expect(MONTH_LABELS).toHaveLength(13);
    expect(MONTH_LABELS[0]).toBe('');
    expect(MONTH_LABELS[7]).toBe('Jul');
  });
});
