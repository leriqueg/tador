/**
 * Build a seed-shaped JSON snapshot from live CuentaGlobal rows (014).
 * Feedback for the next runtime seed at backend/data/plan-de-cuentas/.
 * Specs foundation plan-de-cuentas/ is no longer a mirror — live chart edits go through admin.
 */

import type { CuentaGlobal, ReportRole } from '../../domain/cuenta-global.js';

export interface SeedExportAccount {
  codigo: string;
  nombre: string;
  descripcion: string;
  esPostable: boolean;
  codigoPadre: string | null;
  nivel: number;
  naturaleza: 'root' | 'group' | 'postable';
  clasificacion: 'asset' | 'liability' | 'equity' | 'income' | 'expense' | 'other';
  reportRole: ReportRole;
  deprecatedAt: string | null;
  legacyId: number | null;
  legacyCodigo: string | null;
}

export interface ChartSeedExport {
  schemaVersion: string;
  purpose: string;
  exportedAt: string;
  source: 'live-database';
  summary: {
    totalAccounts: number;
    groups: number;
    postable: number;
    roots: number;
    deprecated: number;
    contra: number;
  };
  accounts: SeedExportAccount[];
}

function clasificacionOf(codigo: string): SeedExportAccount['clasificacion'] {
  switch (codigo[0]) {
    case '1':
      return 'asset';
    case '2':
      return 'liability';
    case '3':
      return 'equity';
    case '4':
      return 'income';
    case '6':
      return 'expense';
    default:
      return 'other';
  }
}

function naturalezaOf(
  esPostable: boolean,
  codigoPadre: string | null,
): SeedExportAccount['naturaleza'] {
  if (esPostable) return 'postable';
  if (!codigoPadre) return 'root';
  return 'group';
}

/** Depth in the parent chain (0 = root). */
export function computeNivel(
  codigo: string,
  parentByCodigo: Map<string, string | null>,
): number {
  let nivel = 0;
  let current: string | null = parentByCodigo.get(codigo) ?? null;
  const guard = new Set<string>();
  while (current) {
    if (guard.has(current)) break;
    guard.add(current);
    nivel += 1;
    current = parentByCodigo.get(current) ?? null;
  }
  return nivel;
}

export function buildChartSeedExport(
  accounts: CuentaGlobal[],
  now: Date = new Date(),
): ChartSeedExport {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const parentByCodigo = new Map<string, string | null>();
  for (const a of accounts) {
    const parentCodigo = a.parentId ? (byId.get(a.parentId)?.codigo ?? null) : null;
    parentByCodigo.set(a.codigo, parentCodigo);
  }

  const sorted = [...accounts].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const exported: SeedExportAccount[] = sorted.map((a) => {
    const codigoPadre = a.parentId
      ? (byId.get(a.parentId)?.codigo ?? null)
      : null;
    return {
      codigo: a.codigo,
      nombre: a.nombre,
      descripcion: a.descripcion || a.nombre,
      esPostable: a.esPostable,
      codigoPadre,
      nivel: computeNivel(a.codigo, parentByCodigo),
      naturaleza: naturalezaOf(a.esPostable, codigoPadre),
      clasificacion: clasificacionOf(a.codigo),
      reportRole: a.reportRole,
      deprecatedAt: a.deprecatedAt ? a.deprecatedAt.toISOString() : null,
      legacyId: a.legacyId,
      legacyCodigo: a.legacyCode,
    };
  });

  const groups = exported.filter((a) => !a.esPostable).length;
  const postable = exported.filter((a) => a.esPostable).length;
  const roots = exported.filter((a) => a.codigoPadre === null).length;
  const deprecated = exported.filter((a) => a.deprecatedAt).length;
  const contra = exported.filter((a) => a.reportRole === 'contra').length;

  return {
    schemaVersion: '0.5.0',
    purpose:
      'Live chart export from admin. Drop-in replacement for backend/data/plan-de-cuentas/plan-de-cuentas-final-seed.json (seed reads codigo/nombre/esPostable/codigoPadre/legacy*/descripcion/reportRole/deprecatedAt).',
    exportedAt: now.toISOString(),
    source: 'live-database',
    summary: {
      totalAccounts: exported.length,
      groups,
      postable,
      roots,
      deprecated,
      contra,
    },
    accounts: exported,
  };
}
