/**
 * SaldoActual domain type.
 * Derived — not persisted directly. Computed from LineaAsiento rows.
 * saldo = totalDebe - totalHaber (positive means debit balance).
 */

export interface SaldoActual {
  cuentaUsuarioId: string;
  totalDebe: number;
  totalHaber: number;
  saldo: number;
}
