/**
 * Plantilla routes: listing and fetching templates with resolved accounts.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';
import {
  getAllPlantillas,
  getPlantilla,
} from '../../plantillas/index.js';
import type { PlantillaLine, Plantilla } from '../../plantillas/index.js';

// ---------------------------------------------------------------------------
// Account resolution helpers
// ---------------------------------------------------------------------------

/**
 * Collect a chain of CuentaGlobal ancestor codigos (including the account itself).
 * Walks up parentId until null (root). Returns at most 10 levels.
 */
async function getGlobalAncestorCodes(
  cuentaGlobalId: string,
  maxDepth = 10,
): Promise<string[]> {
  const codes: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = cuentaGlobalId;
  let depth = 0;

  while (currentId && depth < maxDepth) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const record = await prisma.cuentaGlobal.findUnique({
      where: { id: currentId },
      select: { codigo: true, parentId: true },
    });
    if (!record) break;

    codes.push(record.codigo);
    currentId = record.parentId;
    depth++;
  }

  return codes;
}

/**
 * Check whether a CuentaGlobal's ancestor chain includes any of the groupCodes.
 */
async function cuentaGlobalMatchesGroup(
  cuentaGlobalId: string,
  groupCodes: string[],
): Promise<boolean> {
  const ancestorCodes = await getGlobalAncestorCodes(cuentaGlobalId);
  return ancestorCodes.some((c) => groupCodes.includes(c));
}

/**
 * Get all CuentaGlobal and CuentaUsuario accounts that match the given line strategy
 * for the specified user.
 */
async function resolveAvailableAccountsForLine(
  line: PlantillaLine,
  userId: string,
): Promise<
  Array<{
    id: string;
    nombre: string;
    codigo: string | null;
    tipo: 'global' | 'usuario';
  }>
> {
  const groupCodes: string[] =
    line.strategy === 'from_group' && line.groupCode
      ? [line.groupCode]
      : line.strategy === 'from_groups' && line.groupCodes
        ? line.groupCodes
        : [];

  if (groupCodes.length === 0) return [];

  const accounts: Array<{
    id: string;
    nombre: string;
    codigo: string | null;
    tipo: 'global' | 'usuario';
  }> = [];

  // 1. Find all CuentaGlobal whose codigo or ancestor codigo matches any groupCode.
  //    We also want the account to be postable (leaf accounts the user can select).
  const allGlobals = await prisma.cuentaGlobal.findMany({
    where: { esPostable: true },
    select: { id: true, codigo: true, nombre: true },
  });

  for (const g of allGlobals) {
    if (groupCodes.includes(g.codigo)) {
      // Exact codigo match (the account IS the group, if postable)
      accounts.push({ id: g.id, nombre: g.nombre, codigo: g.codigo, tipo: 'global' });
    } else if (await cuentaGlobalMatchesGroup(g.id, groupCodes)) {
      accounts.push({ id: g.id, nombre: g.nombre, codigo: g.codigo, tipo: 'global' });
    }
  }

  // 2. Find all CuentaUsuario for this user whose global -> parent chain matches
  const userAccounts = await prisma.cuentaUsuario.findMany({
    where: { userId, activa: true, globalId: { not: null } },
    select: { id: true, nombre: true, codigo: true, globalId: true },
  });

  for (const ua of userAccounts) {
    if (!ua.globalId) continue;
    if (await cuentaGlobalMatchesGroup(ua.globalId, groupCodes)) {
      accounts.push({ id: ua.id, nombre: ua.nombre, codigo: ua.codigo, tipo: 'usuario' });
    }
  }

  return accounts;
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerPlantillaRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // -------------------------------------------------------------------------
  // GET /api/plantillas — list all plantillas
  // -------------------------------------------------------------------------

  app.get(
    '/api/plantillas',
    { preHandler: requireAuth },
    async (request, reply) => {
      const query = request.query as { mode?: string };
      const mode = query.mode;

      const plantillas = getAllPlantillas(mode);

      // For each plantilla, resolve available accounts per line
      const userId = request.userId!;
      const enriched = await Promise.all(
        plantillas.map(async (p) => {
          const enrichedLines = await Promise.all(
            p.lines.map(async (line) => ({
              id: line.id,
              side: line.side,
              label: line.label,
              strategy: line.strategy,
              ...(line.groupCode !== undefined && { groupCode: line.groupCode }),
              ...(line.groupCodes !== undefined && { groupCodes: line.groupCodes }),
              ...(line.suggestedChild !== undefined && { suggestedChild: line.suggestedChild }),
              availableAccounts: await resolveAvailableAccountsForLine(line, userId),
            })),
          );

          return {
            code: p.code,
            version: p.version,
            name: p.name,
            modes: p.modes,
            amount: p.amount,
            concept: p.concept,
            date: p.date,
            entity: p.entity,
            amountMode: p.amountMode,
            descriptionTemplate: p.descriptionTemplate,
            lines: enrichedLines,
          };
        }),
      );

      return reply.status(200).send({ plantillas: enriched });
    },
  );

  // -------------------------------------------------------------------------
  // GET /api/plantillas/:code — get a single plantilla
  // -------------------------------------------------------------------------

  app.get(
    '/api/plantillas/:code',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { code } = request.params as { code: string };
      const plantilla = getPlantilla(code);

      if (!plantilla) {
        return reply.status(404).send({ error: `Plantilla '${code}' not found` });
      }

      const userId = request.userId!;
      const enrichedLines = await Promise.all(
        plantilla.lines.map(async (line) => ({
          id: line.id,
          side: line.side,
          label: line.label,
          strategy: line.strategy,
          ...(line.groupCode !== undefined && { groupCode: line.groupCode }),
          ...(line.groupCodes !== undefined && { groupCodes: line.groupCodes }),
          ...(line.suggestedChild !== undefined && { suggestedChild: line.suggestedChild }),
          availableAccounts: await resolveAvailableAccountsForLine(line, userId),
        })),
      );

      return reply.status(200).send({
        plantilla: {
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
          lines: enrichedLines,
        },
      });
    },
  );
}
