/**
 * LineaAsiento domain entity.
 * Represents a single line in a journal entry (debit or credit).
 *
 * Monetary comparisons use domain/money (decimal.js), never IEEE 754 sums.
 */

import {
  DEFAULT_CURRENCY,
  moneyEquals,
  moneyToFixed,
  quantizeMoney,
  sumMoney,
  toDecimal,
} from './money.js';

export interface LineaAsiento {
  id: string;
  asientoId: string;
  cuentaId: string | null;
  cuentaGlobalId: string | null;
  debito: number;
  credito: number;
  createdAt: Date;
}

/**
 * Validate a single line:
 * - Exactly one of cuentaId or cuentaGlobalId must be set (never both, never neither).
 * - Exactly one of debito or credito must be > 0.
 * Returns an error message string, or null if valid.
 */
export function validateLinea(linea: {
  cuentaId?: string | null;
  cuentaGlobalId?: string | null;
  debito: number;
  credito: number;
}): string | null {
  const hasCuenta = Boolean(linea.cuentaId);
  const hasGlobal = Boolean(linea.cuentaGlobalId);
  if (hasCuenta && hasGlobal) {
    return 'Line cannot have both cuentaId and cuentaGlobalId';
  }
  if (!hasCuenta && !hasGlobal) {
    return 'Line must have either cuentaId or cuentaGlobalId';
  }

  const debito = toDecimal(linea.debito);
  const credito = toDecimal(linea.credito);

  if (debito.gt(0) && credito.gt(0)) {
    return 'Line cannot have both debito and credito';
  }
  if (debito.eq(0) && credito.eq(0)) {
    return 'Line must have either debito or credito';
  }
  if (debito.lt(0) || credito.lt(0)) {
    return 'Amounts cannot be negative';
  }
  return null;
}

/**
 * Validate that total debito equals total credito across all lines.
 * Amounts are quantized to the book currency scale before comparison.
 */
export function validateBalance(
  lineas: Array<{ debito: number; credito: number }>,
  currencyCode: string = DEFAULT_CURRENCY,
): string | null {
  if (lineas.length < 2) {
    return 'Entry must have at least two lines';
  }

  const totalDebito = sumMoney(
    lineas.map((l) => l.debito),
    currencyCode,
  );
  const totalCredito = sumMoney(
    lineas.map((l) => l.credito),
    currencyCode,
  );

  if (!moneyEquals(totalDebito, totalCredito, currencyCode)) {
    return `Entry not balanced: debito ${moneyToFixed(totalDebito, currencyCode)} ≠ credito ${moneyToFixed(totalCredito, currencyCode)}`;
  }
  return null;
}

/**
 * Quantize debit/credit on each line to the book currency before persistence.
 */
export function quantizeEntryLines<
  T extends { debito: number; credito: number },
>(lineas: T[], currencyCode: string = DEFAULT_CURRENCY): T[] {
  return lineas.map((l) => ({
    ...l,
    debito: quantizeMoney(l.debito, currencyCode).toNumber(),
    credito: quantizeMoney(l.credito, currencyCode).toNumber(),
  }));
}

/**
 * Build reversal lines by swapping debito/credito on each original line.
 * Preserves both cuentaId and cuentaGlobalId references.
 */
export interface ReversalLine {
  cuentaId: string | null;
  cuentaGlobalId: string | null;
  debito: number;
  credito: number;
}

export function buildReversalLines(
  lineas: Array<{
    cuentaId: string | null;
    cuentaGlobalId: string | null;
    debito: number;
    credito: number;
  }>,
): ReversalLine[] {
  return lineas.map((l) => ({
    cuentaId: l.cuentaId,
    cuentaGlobalId: l.cuentaGlobalId,
    debito: l.credito,
    credito: l.debito,
  }));
}

/**
 * Resolve account display info from a LineaAsiento Prisma row.
 * Handles both CuentaGlobal (direct) and CuentaUsuario (via cuenta.global) paths.
 */
export interface CuentaResolved {
  nombreCuenta: string;
  codigoCuenta: string;
  tipoCuenta: 'global' | 'usuario';
}

export function resolveCuenta(linea: {
  cuentaId?: string | null;
  cuentaGlobalId?: string | null;
  cuenta?: {
    nombre: string;
    codigo?: string | null;
    global?: { codigo: string; nombre: string } | null;
  } | null;
  cuentaGlobal?: { codigo: string; nombre: string } | null;
}): CuentaResolved {
  if (linea.cuentaGlobalId && linea.cuentaGlobal) {
    return {
      nombreCuenta: linea.cuentaGlobal.nombre,
      codigoCuenta: linea.cuentaGlobal.codigo,
      tipoCuenta: 'global',
    };
  }

  if (linea.cuentaId && linea.cuenta) {
    if (linea.cuenta.global) {
      return {
        nombreCuenta: linea.cuenta.nombre,
        codigoCuenta: linea.cuenta.global.codigo,
        tipoCuenta: 'usuario',
      };
    }
    return {
      nombreCuenta: linea.cuenta.nombre,
      codigoCuenta: linea.cuenta.codigo ?? '',
      tipoCuenta: 'usuario',
    };
  }

  return { nombreCuenta: '', codigoCuenta: '', tipoCuenta: 'usuario' };
}
