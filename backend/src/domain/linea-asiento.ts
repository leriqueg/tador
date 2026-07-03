/**
 * LineaAsiento domain entity.
 * Represents a single line in a journal entry (debit or credit).
 */

export interface LineaAsiento {
  id: string;
  asientoId: string;
  cuentaId: string;
  debito: number; // > 0 for debit
  credito: number; // > 0 for credit
  createdAt: Date;
}

/**
 * Validate a single line: exactly one of debito or credito must be > 0.
 * Returns an error message string, or null if valid.
 */
export function validateLinea(linea: {
  debito: number;
  credito: number;
}): string | null {
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
 */
export function buildReversalLines(
  lineas: LineaAsiento[],
): Array<{ cuentaId: string; debito: number; credito: number }> {
  return lineas.map((l) => ({
    cuentaId: l.cuentaId,
    debito: l.credito,
    credito: l.debito,
  }));
}
