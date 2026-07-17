/**
 * Monetary amounts for TADOR.
 *
 * Application and domain code MUST use Decimal (decimal.js) for all money
 * arithmetic and comparisons. IEEE 754 binary floating-point (`number`) is
 * forbidden for intermediate financial calculation.
 *
 * Persistence uses PostgreSQL NUMERIC / Prisma Decimal. JSON responses MAY
 * expose `number` only after quantization to the book's currency scale.
 *
 * MVP default currency is USD (2 fraction digits). Fraction digits follow
 * ISO 4217 minor units when known; unknown codes fall back to 2 so new
 * currencies can be added without rewriting callers.
 */

import Decimal from 'decimal.js';

Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

/** ISO 4217 currency code → number of fraction digits (minor units). */
const CURRENCY_FRACTION_DIGITS: Readonly<Record<string, number>> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  MXN: 2,
  CAD: 2,
  AUD: 2,
  CHF: 2,
  COP: 2,
  ARS: 2,
  CLP: 0,
  JPY: 0,
  KRW: 0,
  BHD: 3,
  KWD: 3,
  OMR: 3,
};

export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_FRACTION_DIGITS = 2;

export type MoneyInput = Decimal.Value;

export function normalizeCurrencyCode(currencyCode?: string | null): string {
  if (!currencyCode || currencyCode.trim() === '') {
    return DEFAULT_CURRENCY;
  }
  return currencyCode.trim().toUpperCase();
}

/**
 * Fraction digits for a currency. Unknown codes default to 2 (MVP-safe)
 * until an explicit ISO entry is added.
 */
export function fractionDigitsForCurrency(currencyCode?: string | null): number {
  const code = normalizeCurrencyCode(currencyCode);
  return CURRENCY_FRACTION_DIGITS[code] ?? DEFAULT_FRACTION_DIGITS;
}

/** Parse any Prisma/JSON/string/number input into a Decimal. */
export function toDecimal(value: MoneyInput): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Monetary amount must be a finite number');
    }
    // Prefer decimal string form to avoid binary float artifacts when possible
    return new Decimal(value.toString());
  }
  return new Decimal(value as Decimal.Value);
}

/**
 * Quantize to the currency's minor-unit scale (half-up).
 * Call before persistence and before equality checks that represent "cash".
 */
export function quantizeMoney(
  value: MoneyInput,
  currencyCode: string = DEFAULT_CURRENCY,
): Decimal {
  const digits = fractionDigitsForCurrency(currencyCode);
  return toDecimal(value).toDecimalPlaces(digits, Decimal.ROUND_HALF_UP);
}

export function sumMoney(
  values: readonly MoneyInput[],
  currencyCode: string = DEFAULT_CURRENCY,
): Decimal {
  let total = new Decimal(0);
  for (const value of values) {
    total = total.plus(toDecimal(value));
  }
  return quantizeMoney(total, currencyCode);
}

export function moneyEquals(
  left: MoneyInput,
  right: MoneyInput,
  currencyCode: string = DEFAULT_CURRENCY,
): boolean {
  return quantizeMoney(left, currencyCode).eq(quantizeMoney(right, currencyCode));
}

/**
 * API / DTO boundary helper. Exact math MUST happen before this call.
 * Prefer moneyToFixed for wire formats that must avoid float drift.
 */
export function moneyToNumber(
  value: MoneyInput,
  currencyCode: string = DEFAULT_CURRENCY,
): number {
  return quantizeMoney(value, currencyCode).toNumber();
}

/** Canonical string for a quantized amount (e.g. "85.50", "100"). */
export function moneyToFixed(
  value: MoneyInput,
  currencyCode: string = DEFAULT_CURRENCY,
): string {
  const digits = fractionDigitsForCurrency(currencyCode);
  return quantizeMoney(value, currencyCode).toFixed(digits);
}
