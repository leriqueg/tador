/**
 * Apunte routes: creates journal entries from templates (HOME) or free-form (PRO).
 *
 * POST /api/apuntes
 *   - With templateCode: validates against template, resolves lines
 *   - Without templateCode: accepts free-form lines with side/amount per line
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';
import { getPlantilla } from '../../plantillas/index.js';
import type { Plantilla } from '../../plantillas/index.js';
import {
  isCuentaGlobalUnderGroups,
  isCuentaUsuarioUnderGroups,
} from '../../application/plantilla-validator.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApunteLineInput {
  id: number;
  accountId: string;
  /** Only required when no template (PRO wizard) */
  side?: 'debit' | 'credit';
  /** Only required when no template or per_line mode */
  amount?: number;
}

interface CreateApunteBody {
  templateCode?: string | null;
  date: string;
  concept: string;
  /** Required when template specifies amountMode: 'single' */
  amount?: number;
  amountMode?: 'single' | 'per_line';
  entityId?: string | null;
  lines: ApunteLineInput[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve an accountId to either a CuentaGlobal or CuentaUsuario.
 * Returns { type: 'global', id } or { type: 'usuario', id } or throws.
 */
async function resolveAccount(
  accountId: string,
  userId: string,
): Promise<
  { tipo: 'global'; id: string } | { tipo: 'usuario'; id: string }
> {
  // Try CuentaGlobal
  const global = await prisma.cuentaGlobal.findUnique({
    where: { id: accountId },
    select: { id: true, esPostable: true },
  });
  if (global) {
    if (!global.esPostable) {
      throw new ValidationError(`Account ${accountId} is not postable`, 400);
    }
    return { tipo: 'global', id: global.id };
  }

  // Try CuentaUsuario
  const usuario = await prisma.cuentaUsuario.findUnique({
    where: { id: accountId },
    select: { id: true, userId: true, activa: true },
  });
  if (usuario) {
    if (usuario.userId !== userId) {
      throw new ValidationError(
        `Account ${accountId} does not belong to this user (V9)`,
        403,
      );
    }
    if (!usuario.activa) {
      throw new ValidationError(`Account ${accountId} is not active (V7)`, 400);
    }
    return { tipo: 'usuario', id: usuario.id };
  }

  throw new ValidationError(
    `Account ${accountId} not found (V3)`,
    404,
  );
}

class ValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

/**
 * Validate a single line against its template slot (V2, V4).
 */
async function validateLineAgainstTemplate(
  line: ApunteLineInput,
  templateLine: Plantilla['lines'][number],
  userId: string,
): Promise<void> {
  // V4: Hierarchy validation
  const groupCodes: string[] =
    templateLine.strategy === 'from_group' && templateLine.groupCode
      ? [templateLine.groupCode]
      : templateLine.strategy === 'from_groups' && templateLine.groupCodes
        ? templateLine.groupCodes
        : [];

  if (groupCodes.length > 0) {
    // Check both global and usuario paths
    const global = await prisma.cuentaGlobal.findUnique({
      where: { id: line.accountId },
      select: { id: true },
    });

    if (global) {
      const ok = await isCuentaGlobalUnderGroups(global.id, groupCodes);
      if (!ok) {
        throw new ValidationError(
          `Account ${line.accountId} is not under group(s) ${groupCodes.join(', ')} for line ${line.id} (V4)`,
          400,
        );
      }
    } else {
      const ok = await isCuentaUsuarioUnderGroups(line.accountId, groupCodes);
      if (!ok) {
        throw new ValidationError(
          `Account ${line.accountId} is not under group(s) ${groupCodes.join(', ')} for line ${line.id} (V4)`,
          400,
        );
      }
    }
  }
}

/**
 * Get the bookId for a user.
 */
async function getBookId(userId: string): Promise<string> {
  const book = await prisma.book.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!book) {
    throw new ValidationError('Book not found', 404);
  }
  return book.id;
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

function formatApunteDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function registerApunteRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // GET /api/apuntes — recent/history list (no journal lines)
  app.get(
    '/api/apuntes',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const query = request.query as { limit?: string; offset?: string };

      const limitRaw = query.limit ? parseInt(query.limit, 10) : 20;
      const offsetRaw = query.offset ? parseInt(query.offset, 10) : 0;
      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(limitRaw, 1), 100)
        : 20;
      const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

      try {
        const [total, rows] = await Promise.all([
          prisma.apunte.count({ where: { userId } }),
          prisma.apunte.findMany({
            where: { userId },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            take: limit,
            skip: offset,
          }),
        ]);

        return reply.status(200).send({
          apuntes: rows.map((row) => ({
            id: row.id,
            templateCode: row.templateCode,
            date: formatApunteDate(row.date),
            concept: row.concept,
            amount: Number(row.amount),
            asientoId: row.asientoId,
            createdAt: row.createdAt.toISOString(),
          })),
          total,
        });
      } catch (err) {
        request.log.error(err, 'Failed to list apuntes');
        return reply.status(500).send({ error: 'Failed to list apuntes' });
      }
    },
  );

  app.post(
    '/api/apuntes',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const body = request.body as CreateApunteBody;

      try {
        // ---------------------------------------------------------------
        // Validate required fields
        // ---------------------------------------------------------------
        if (!body.date || !body.concept || !body.lines?.length) {
          return reply
            .status(400)
            .send({ error: 'date, concept, and lines are required' });
        }

        // ---------------------------------------------------------------
        // Template-based (HOME) or free-form (PRO)
        // ---------------------------------------------------------------
        let template: Plantilla | undefined;
        let amount = body.amount ?? 0;
        const amountMode = body.amountMode ?? 'single';

        if (body.templateCode) {
          // V1: Template exists
          template = getPlantilla(body.templateCode);
          if (!template) {
            return reply
              .status(400)
              .send({ error: `Template '${body.templateCode}' not found (V1)` });
          }

          // V2: Each line.id must exist in the template
          const templateLineIds = new Set(template.lines.map((l) => l.id));
          for (const line of body.lines) {
            if (!templateLineIds.has(line.id)) {
              return reply
                .status(400)
                .send({ error: `Line id ${line.id} not found in template (V2)` });
            }
          }

          // V5: If amountMode is 'single', use the body.amount for all lines
          if (template.amountMode === 'single') {
            if (body.amount === undefined || body.amount === null) {
              return reply
                .status(400)
                .send({ error: 'amount is required when template has amountMode single (V5)' });
            }
            amount = body.amount;
          }
        }

        // ---------------------------------------------------------------
        // Resolve book
        // ---------------------------------------------------------------
        const bookId = await getBookId(userId);

        // ---------------------------------------------------------------
        // V6: Validate period is open (create if not exists)
        // ---------------------------------------------------------------
        const fecha = new Date(body.date);
        const año = fecha.getFullYear();
        const period = await prisma.periodoContable.upsert({
          where: { bookId_año: { bookId, año } },
          update: {},
          create: { bookId, año, abierto: true },
        });
        if (!period.abierto) {
          return reply
            .status(400)
            .send({ error: `Period ${año} is closed (V6)` });
        }

        // ---------------------------------------------------------------
        // Resolve lines into entry format
        // ---------------------------------------------------------------
        const entryLines: Array<{
          cuentaId?: string;
          cuentaGlobalId?: string;
          debito: number;
          credito: number;
        }> = [];

        for (const line of body.lines) {
          // V3: Resolve and validate account
          const resolved = await resolveAccount(line.accountId, userId);

          // Determine side and amount
          if (template) {
            // Template-based: side comes from template
            const templateLine = template.lines.find((l) => l.id === line.id)!;
            // V4: Validate hierarchy
            await validateLineAgainstTemplate(line, templateLine, userId);

            const isDebit = templateLine.side === 'debit';
            entryLines.push({
              ...(resolved.tipo === 'global'
                ? { cuentaGlobalId: resolved.id }
                : { cuentaId: resolved.id }),
              debito: isDebit ? amount : 0,
              credito: isDebit ? 0 : amount,
            });
          } else {
            // PRO wizard: side and amount come from the request
            if (!line.side || line.amount === undefined || line.amount === null) {
              return reply
                .status(400)
                .send({ error: `Line ${line.id}: side and amount required when no template` });
            }

            const isDebit = line.side === 'debit';
            const lineAmount = line.amount;
            entryLines.push({
              ...(resolved.tipo === 'global'
                ? { cuentaGlobalId: resolved.id }
                : { cuentaId: resolved.id }),
              debito: isDebit ? lineAmount : 0,
              credito: isDebit ? 0 : lineAmount,
            });
          }
        }

        // ---------------------------------------------------------------
        // V8: Validate balance
        // ---------------------------------------------------------------
        const totalDebito = entryLines.reduce((s, l) => s + l.debito, 0);
        const totalCredito = entryLines.reduce((s, l) => s + l.credito, 0);
        if (totalDebito !== totalCredito) {
          return reply
            .status(400)
            .send({
              error: `Entry not balanced: debito ${totalDebito} ≠ credito ${totalCredito} (V8)`,
            });
        }
        if (entryLines.length < 2) {
          return reply
            .status(400)
            .send({ error: 'Entry must have at least two lines (V8)' });
        }

        // ---------------------------------------------------------------
        // Create Asiento + Lineas + Apunte in a transaction
        // ---------------------------------------------------------------
        const result = await prisma.$transaction(async (tx) => {
          // Create the asiento (journal entry)
          const asiento = await tx.asiento.create({
            data: {
              bookId,
              fecha,
              concepto: body.concept,
              tipo: 'manual',
            },
          });

          // Create lineas_asiento
          const lineas = await Promise.all(
            entryLines.map((l) =>
              tx.lineaAsiento.create({
                data: {
                  asientoId: asiento.id,
                  cuentaId: l.cuentaId ?? null,
                  cuentaGlobalId: l.cuentaGlobalId ?? null,
                  debito: l.debito,
                  credito: l.credito,
                },
              }),
            ),
          );

          // Create Apunte record
          const apunte = await tx.apunte.create({
            data: {
              templateCode: body.templateCode ?? null,
              date: fecha,
              concept: body.concept,
              amount,
              asientoId: asiento.id,
              userId,
            },
          });

          return { asiento, lineas, apunte };
        });

        return reply.status(201).send({
          apunte: {
            id: result.apunte.id,
            templateCode: result.apunte.templateCode,
            date: result.apunte.date.toISOString(),
            concept: result.apunte.concept,
            amount: Number(result.apunte.amount),
            asientoId: result.apunte.asientoId,
          },
          asiento: {
            id: result.asiento.id,
            fecha: result.asiento.fecha.toISOString(),
            descripcion: result.asiento.concepto,
            lines: result.lineas.map((l) => ({
              cuentaId: l.cuentaId,
              cuentaGlobalId: l.cuentaGlobalId,
              debito: Number(l.debito),
              credito: Number(l.credito),
            })),
          },
        });
      } catch (err) {
        if (err instanceof ValidationError) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        request.log.error(err, 'Failed to create apunte');
        return reply.status(500).send({ error: 'Failed to create apunte' });
      }
    },
  );
}
