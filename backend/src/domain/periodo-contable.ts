/**
 * PeriodoContable domain entity.
 * Represents an accounting period (year) for a book.
 * Entries can only be posted in open periods.
 */

export interface PeriodoContable {
  id: string;
  bookId: string;
  año: number;
  abierto: boolean;
  cerradoAt: Date | null;
  reabiertoAt: Date | null;
  createdAt: Date;
}

/**
 * Create a new accounting period, defaulting to open.
 */
export function createPeriodo(
  bookId: string,
  año: number,
): { bookId: string; año: number; abierto: boolean } {
  return { bookId, año, abierto: true };
}
