/**
 * Asiento domain entity.
 * Represents a journal entry — the atomic unit of an economic event.
 * Must always be balanced (total debes = total haberes) before persistence.
 */

export interface HistorialEdit {
  editadoAt: Date;
  editadoPorUsuarioId: string;
  descripcionAnterior: string;
  lineasAnteriores: Array<{ cuentaUsuarioId: string; debe: number; haber: number }>;
}

export interface Asiento {
  id: string;
  bookId: string;
  fecha: Date;
  descripcion: string;
  editHistory: HistorialEdit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAsientoInput {
  bookId: string;
  fecha: Date;
  descripcion: string;
}
