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

/** TADOR chart codes are exactly 8 decimal digits (`[A][BBB][C][DDD]`). */
export function isValidGlobalAccountCodigo(codigo: string): boolean {
  return /^\d{8}$/.test(codigo);
}

/** Sequence `000` marks a group account (never postable). */
export function isGroupCodigo(codigo: string): boolean {
  return isValidGlobalAccountCodigo(codigo) && codigo.endsWith('000');
}

export function validateGlobalAccountCreate(input: {
  codigo: string;
  nombre: string;
  esPostable: boolean;
  parentEsPostable: boolean | null;
  parentId: string | null;
}): string | null {
  if (!isValidGlobalAccountCodigo(input.codigo)) {
    return 'codigo must be an 8-digit numeric code';
  }
  if (!input.nombre?.trim()) {
    return 'nombre is required';
  }
  if (input.esPostable && isGroupCodigo(input.codigo)) {
    return 'group codigo (…000) cannot be postable';
  }
  if (input.esPostable) {
    if (!input.parentId) {
      return 'postable accounts require a parent group';
    }
    if (input.parentEsPostable !== false) {
      return 'postable child must be under a non-postable group parent';
    }
  }
  return null;
}
