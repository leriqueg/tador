/**
 * CuentaGlobal domain entity.
 * Represents a global chart-of-accounts entry with hierarchical structure.
 * These are the 27 group accounts from legacy normalized data.
 * Leaf accounts (esPostable = true) can be posted to; groups cannot.
 */

export interface CuentaGlobal {
  id: string;
  parentId: string | null;
  codigo: string;
  nombre: string;
  descripcion: string;
  esPostable: boolean;
  legacyId: number | null;
  legacyCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}
