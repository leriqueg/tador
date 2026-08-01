/**
 * Shared seed account shape + ordering used by admin export and prisma seed.
 */

export type SeedReportRole = 'normal' | 'contra';

/** Fields the catalogos seed upserts (export may include extras). */
export interface SeedAccountEntry {
  codigo: string;
  nombre: string;
  esPostable: boolean;
  codigoPadre: string | null;
  legacyId: number | null;
  legacyCodigo: string | null;
  descripcion?: string;
  nivel?: number;
  reportRole?: SeedReportRole | string;
  deprecatedAt?: string | null;
}

function treeDepth(
  account: SeedAccountEntry,
  byCodigo: Map<string, SeedAccountEntry>,
): number {
  if (typeof account.nivel === 'number' && Number.isFinite(account.nivel)) {
    return account.nivel;
  }
  let depth = 0;
  let current: string | null = account.codigoPadre;
  const guard = new Set<string>();
  while (current) {
    if (guard.has(current)) break;
    guard.add(current);
    depth += 1;
    current = byCodigo.get(current)?.codigoPadre ?? null;
  }
  return depth;
}

/** Parents before children so parentId can resolve in one pass. */
export function sortAccountsForSeed(
  accounts: SeedAccountEntry[],
): SeedAccountEntry[] {
  const byCodigo = new Map(accounts.map((a) => [a.codigo, a]));
  return [...accounts].sort((a, b) => {
    const da = treeDepth(a, byCodigo);
    const db = treeDepth(b, byCodigo);
    if (da !== db) return da - db;
    return a.codigo.localeCompare(b.codigo);
  });
}

export function parseSeedReportRole(value: unknown): SeedReportRole {
  return value === 'contra' ? 'contra' : 'normal';
}

export function parseSeedDeprecatedAt(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
