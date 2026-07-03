/**
 * Asiento domain entity.
 * Represents a journal entry (accounting entry) in a book.
 * Supports manual entries and reversals.
 */

export type AsientoTipo = 'manual' | 'reversa';

export interface Asiento {
  id: string;
  bookId: string;
  fecha: Date;
  concepto: string;
  tipo: AsientoTipo;
  asientoOriginalId: string | null; // for reversals
  idempotencyKey: string | null;
  anulado: boolean;
  anuladoAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
