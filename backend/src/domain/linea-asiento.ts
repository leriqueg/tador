/**
 * LineaAsiento domain entity.
 * Represents a single line in a journal entry (debit or credit).
 */

export interface LineaAsiento {
  id: string;
  asientoId: string;
  cuentaId: string | null;       // CuentaUsuario reference (financial accounts)
  cuentaGlobalId: string | null; // CuentaGlobal reference (shared categories)
  debito: number; // > 0 for debit
  credito: number; // > 0 for credit
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
  // Account reference validation
  const hasCuenta = Boolean(linea.cuentaId);
  const hasGlobal = Boolean(linea.cuentaGlobalId);
  if (hasCuenta && hasGlobal) {
    return 'Line cannot have both cuentaId and cuentaGlobalId';
  }
  if (!hasCuenta && !hasGlobal) {
    return 'Line must have either cuentaId or cuentaGlobalId';
  }

  // Amount validation
  if (linea.debito > 0 && linea.credito > 0) {
    return 'Line cannot have both debito and credito';
  }
  if (linea.debito === 0 && linea.credito === 0) {
    return 'Line must have either debito or credito';
  }
  if (linea.debito < 0 || linea.credito < 0) {
    return 'Amounts cannot be negative';
  }
  return null;
}

/**
 * Validate that total debito equals total credito across all lines.
 * Returns an error message string, or null if balanced.
 */
export function validateBalance(
  lineas: Array<{ debito: number; credito: number }>,
): string | null {
  if (lineas.length < 2) {
    return 'Entry must have at least two lines';
  }
  const totalDebito = lineas.reduce((s, l) => s + l.debito, 0);
  const totalCredito = lineas.reduce((s, l) => s + l.credito, 0);
  if (totalDebito !== totalCredito) {
    return `Entry not balanced: debito ${totalDebito} ≠ credito ${totalCredito}`;
  }
  return null;
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
  lineas: LineaAsiento[],
): ReversalLine[] {
  return lineas.map((l) => ({
    cuentaId: l.cuentaId,
    cuentaGlobalId: l.cuentaGlobalId,
    debito: l.credito,
    credito: l.debito,
  }));
}
