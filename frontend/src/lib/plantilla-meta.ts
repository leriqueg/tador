/**
 * Hogar plantilla discovery helpers: kind + category (curated MVP maps).
 */

export type PlantillaKind = 'gasto' | 'ingreso' | 'transferencia';

export type PlantillaCategory =
  | 'compras'
  | 'comida'
  | 'hogar'
  | 'transporte'
  | 'salud'
  | 'otros'
  | 'ingresos'
  | 'movimientos';

export const CATEGORY_LABELS: Record<PlantillaCategory, string> = {
  compras: 'Compras',
  comida: 'Comida',
  hogar: 'Hogar',
  transporte: 'Transporte',
  salud: 'Salud',
  otros: 'Otros',
  ingresos: 'Ingresos',
  movimientos: 'Movimientos',
};

/** Curated frequent tiles for new users (FR-005a). */
export const CURATED_FREQUENT_CODES = [
  'pagar_supermercado',
  'pagar_servicios',
  'registrar_sueldo',
  'transferencia',
  'deposito_bancario',
  'pagar_taxi',
] as const;

const CATEGORY_BY_CODE: Record<string, PlantillaCategory> = {
  pagar_supermercado: 'compras',
  pagar_cine: 'otros',
  pagar_servicios: 'hogar',
  pagar_taxi: 'transporte',
  pagar_cita_medica: 'salud',
  pago_tarjeta: 'otros',
  registrar_sueldo: 'ingresos',
  transferencia: 'movimientos',
  deposito_bancario: 'movimientos',
  retiro_bancario: 'movimientos',
};

export function plantillaKind(code: string): PlantillaKind {
  if (code.startsWith('registrar_')) return 'ingreso';
  if (
    code === 'transferencia' ||
    code.startsWith('deposito_') ||
    code.startsWith('retiro_')
  ) {
    return 'transferencia';
  }
  return 'gasto';
}

export function plantillaCategory(code: string): PlantillaCategory {
  return CATEGORY_BY_CODE[code] ?? 'otros';
}

export function categoriesForKind(kind: PlantillaKind): PlantillaCategory[] {
  if (kind === 'ingreso') return ['ingresos'];
  if (kind === 'transferencia') return ['movimientos'];
  return ['compras', 'comida', 'hogar', 'transporte', 'salud', 'otros'];
}

const USAGE_KEY = 'tador.hogar.plantillaUsage';

export function readPlantillaUsage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function bumpPlantillaUsage(code: string): void {
  const usage = readPlantillaUsage();
  usage[code] = (usage[code] ?? 0) + 1;
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

const LAST_ACCOUNT_KEY = 'tador.hogar.lastAccountByPlantilla';

export function readLastAccount(plantillaCode: string): string | null {
  try {
    const raw = localStorage.getItem(LAST_ACCOUNT_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[plantillaCode] ?? null;
  } catch {
    return null;
  }
}

export function writeLastAccount(plantillaCode: string, accountId: string): void {
  try {
    const raw = localStorage.getItem(LAST_ACCOUNT_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[plantillaCode] = accountId;
    localStorage.setItem(LAST_ACCOUNT_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}
