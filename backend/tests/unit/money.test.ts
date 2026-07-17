import { describe, it, expect } from 'vitest';
import {
  fractionDigitsForCurrency,
  moneyEquals,
  moneyToFixed,
  quantizeMoney,
  sumMoney,
  toDecimal,
} from '../../src/domain/money.js';
import { validateBalance } from '../../src/domain/linea-asiento.js';

describe('money domain', () => {
  it('quantizes USD to 2 fraction digits with half-up rounding', () => {
    expect(moneyToFixed('10.005', 'USD')).toBe('10.01');
    expect(moneyToFixed('10.004', 'USD')).toBe('10.00');
    expect(quantizeMoney(1.1 + 0.2, 'USD').toFixed(2)).toBe('1.30');
  });

  it('uses ISO minor units for JPY (0) and KWD (3)', () => {
    expect(fractionDigitsForCurrency('JPY')).toBe(0);
    expect(moneyToFixed('100.4', 'JPY')).toBe('100');
    expect(fractionDigitsForCurrency('KWD')).toBe(3);
    expect(moneyToFixed('1.2345', 'KWD')).toBe('1.235');
  });

  it('defaults unknown currency codes to 2 fraction digits', () => {
    expect(fractionDigitsForCurrency('XYZ')).toBe(2);
    expect(moneyToFixed('9.999', 'XYZ')).toBe('10.00');
  });

  it('compares and sums without IEEE 754 drift', () => {
    const total = sumMoney(['0.1', '0.2'], 'USD');
    expect(total.toFixed(2)).toBe('0.30');
    expect(moneyEquals('0.1', toDecimal('0.10'), 'USD')).toBe(true);
    // Classic float trap: 0.1 + 0.2 !== 0.3 in IEEE 754
    expect(0.1 + 0.2 === 0.3).toBe(false);
    expect(moneyEquals(0.1 + 0.2, '0.3', 'USD')).toBe(true);
  });
});

describe('validateBalance with money', () => {
  it('accepts balanced lines that would drift under binary float', () => {
    const err = validateBalance(
      [
        { debito: 0.1, credito: 0 },
        { debito: 0.2, credito: 0 },
        { debito: 0, credito: 0.3 },
      ],
      'USD',
    );
    expect(err).toBeNull();
  });

  it('rejects unbalanced lines at currency scale', () => {
    const err = validateBalance(
      [
        { debito: 10, credito: 0 },
        { debito: 0, credito: 9.99 },
      ],
      'USD',
    );
    expect(err).toMatch(/not balanced/);
  });
});
