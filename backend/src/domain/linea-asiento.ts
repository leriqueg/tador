/**
 * LineaAsiento domain entity.
 * Represents a single line in a journal entry, affecting one account
 * with either a debe (debit) or haber (credit) amount.
 */

export interface LineaAsiento {
  id: string;
  asientoId: string;
  cuentaUsuarioId: string;
  debe: number;
  haber: number;
}

export interface CreateLineaAsientoInput {
  cuentaUsuarioId: string;
  debe: number;
  haber: number;
}
