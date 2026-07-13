/**
 * Efficient plantilla ↔ account matching.
 *
 * Loads the chart once per resolve request and walks ancestors in memory
 * (avoids N+1 findUnique per account/level that made GET /api/plantillas slow).
 */

import { prisma } from '../infrastructure/database.js';
import type { Plantilla, PlantillaLine } from '../plantillas/index.js';

const MAX_DEPTH = 10;

export interface AvailableAccount {
  id: string;
  nombre: string;
  codigo: string | null;
  tipo: 'global' | 'usuario';
}

interface GlobalNode {
  id: string;
  codigo: string;
  nombre: string;
  parentId: string | null;
  esPostable: boolean;
}

export interface ChartIndex {
  byId: Map<string, GlobalNode>;
  /** codigo → ids of postable globals that match that group (self or descendant) */
}

/**
 * Build ancestor codigo list using an in-memory parent map.
 */
export function ancestorCodesOf(
  byId: Map<string, GlobalNode>,
  startId: string,
): string[] {
  const codes: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = startId;
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    const node = byId.get(currentId);
    if (!node) break;
    codes.push(node.codigo);
    currentId = node.parentId;
    depth++;
  }

  return codes;
}

export function matchesGroups(
  byId: Map<string, GlobalNode>,
  cuentaGlobalId: string,
  groupCodes: string[],
): boolean {
  if (groupCodes.length === 0) return false;
  const set = new Set(groupCodes);
  return ancestorCodesOf(byId, cuentaGlobalId).some((c) => set.has(c));
}

export async function loadChartIndex(): Promise<Map<string, GlobalNode>> {
  const rows = await prisma.cuentaGlobal.findMany({
    select: {
      id: true,
      codigo: true,
      nombre: true,
      parentId: true,
      esPostable: true,
    },
  });
  const byId = new Map<string, GlobalNode>();
  for (const row of rows) {
    byId.set(row.id, row);
  }
  return byId;
}

/**
 * Resolve available accounts for one line using a preloaded chart + user accounts.
 */
export function resolveLineAccounts(
  line: PlantillaLine,
  byId: Map<string, GlobalNode>,
  userAccounts: Array<{
    id: string;
    nombre: string;
    codigo: string | null;
    globalId: string | null;
  }>,
): AvailableAccount[] {
  const groupCodes: string[] =
    line.strategy === 'from_group' && line.groupCode
      ? [line.groupCode]
      : line.strategy === 'from_groups' && line.groupCodes
        ? line.groupCodes
        : [];

  if (groupCodes.length === 0) return [];

  const accounts: AvailableAccount[] = [];

  for (const g of byId.values()) {
    if (!g.esPostable) continue;
    if (matchesGroups(byId, g.id, groupCodes)) {
      accounts.push({
        id: g.id,
        nombre: g.nombre,
        codigo: g.codigo,
        tipo: 'global',
      });
    }
  }

  for (const ua of userAccounts) {
    if (!ua.globalId) continue;
    if (matchesGroups(byId, ua.globalId, groupCodes)) {
      accounts.push({
        id: ua.id,
        nombre: ua.nombre,
        codigo: ua.codigo,
        tipo: 'usuario',
      });
    }
  }

  return accounts;
}

export async function loadUserAccounts(userId: string) {
  return prisma.cuentaUsuario.findMany({
    where: { userId, activa: true, globalId: { not: null } },
    select: { id: true, nombre: true, codigo: true, globalId: true },
  });
}

/**
 * Enrich one plantilla with availableAccounts (2 DB round-trips shared across all lines).
 */
export async function enrichPlantilla(
  plantilla: Plantilla,
  userId: string,
  charts?: Map<string, GlobalNode>,
  userAccounts?: Awaited<ReturnType<typeof loadUserAccounts>>,
): Promise<
  Plantilla & {
    lines: Array<
      PlantillaLine & { availableAccounts: AvailableAccount[] }
    >;
  }
> {
  const byId = charts ?? (await loadChartIndex());
  const users = userAccounts ?? (await loadUserAccounts(userId));

  return {
    ...plantilla,
    lines: plantilla.lines.map((line) => ({
      ...line,
      availableAccounts: resolveLineAccounts(line, byId, users),
    })),
  };
}

/**
 * Enrich many plantillas sharing one chart load + one user-accounts load.
 */
export async function enrichPlantillas(
  plantillas: Plantilla[],
  userId: string,
): Promise<
  Array<
    Plantilla & {
      lines: Array<PlantillaLine & { availableAccounts: AvailableAccount[] }>;
    }
  >
> {
  const byId = await loadChartIndex();
  const users = await loadUserAccounts(userId);
  return Promise.all(
    plantillas.map((p) => enrichPlantilla(p, userId, byId, users)),
  );
}

/** List payload without availableAccounts (fast path for discovery UI). */
export function serializePlantillaLight(plantilla: Plantilla) {
  return {
    code: plantilla.code,
    version: plantilla.version,
    name: plantilla.name,
    modes: plantilla.modes,
    amount: plantilla.amount,
    concept: plantilla.concept,
    date: plantilla.date,
    entity: plantilla.entity,
    amountMode: plantilla.amountMode,
    descriptionTemplate: plantilla.descriptionTemplate,
    lines: plantilla.lines.map((line) => ({
      id: line.id,
      side: line.side,
      label: line.label,
      strategy: line.strategy,
      ...(line.groupCode !== undefined && { groupCode: line.groupCode }),
      ...(line.groupCodes !== undefined && { groupCodes: line.groupCodes }),
      ...(line.suggestedChild !== undefined && {
        suggestedChild: line.suggestedChild,
      }),
    })),
  };
}

export function serializePlantillaEnriched(
  plantilla: Plantilla & {
    lines: Array<PlantillaLine & { availableAccounts: AvailableAccount[] }>;
  },
) {
  return {
    ...serializePlantillaLight(plantilla),
    lines: plantilla.lines.map((line) => ({
      id: line.id,
      side: line.side,
      label: line.label,
      strategy: line.strategy,
      ...(line.groupCode !== undefined && { groupCode: line.groupCode }),
      ...(line.groupCodes !== undefined && { groupCodes: line.groupCodes }),
      ...(line.suggestedChild !== undefined && {
        suggestedChild: line.suggestedChild,
      }),
      availableAccounts: line.availableAccounts,
    })),
  };
}
