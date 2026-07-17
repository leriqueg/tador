/**
 * Apunte routes: creates journal entries from templates (HOME) or free-form (PRO).
 *
 * POST /api/apuntes
 *   - With templateCode: validates against template, resolves lines
 *   - Without templateCode: accepts free-form lines with side/amount per line
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import type { AccountingService } from '../../application/accounting-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';
import { getPlantilla } from '../../plantillas/index.js';
import type { Plantilla } from '../../plantillas/index.js';
import {
  isCuentaGlobalUnderGroups,
  isCuentaUsuarioUnderGroups,
} from '../../application/plantilla-validator.js';
import {
  DEFAULT_CURRENCY,
  moneyEquals,
  moneyToFixed,
  moneyToNumber,
  quantizeMoney,
  sumMoney,
} from '../../domain/money.js';
import { buildApunteListWhere } from '../../application/apunte-list-filters.js';
import { assertEntityCapability, EntityCapabilityError } from '../../domain/entity-capability-rule.js';

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
 * Resolve an entityId and assert it holds the required capability (V11).
 * Never validates retroactively — only the entity selected for this apunte.
 */
async function requireEntityCapability(
  entityId: string,
  userId: string,
  requiredCapability: string,
): Promise<void> {
  const entity = await prisma.entidad.findFirst({
    where: { id: entityId, userId },
    select: { tipo: true, capabilities: true },
  });
  if (!entity) {
    throw new ValidationError(`Entity ${entityId} not found (V11)`, 404);
  }
  try {
    assertEntityCapability(
      { tipo: entity.tipo, capabilities: entity.capabilities as string[] },
      requiredCapability,
    );
  } catch (err) {
    if (err instanceof EntityCapabilityError) {
      throw new ValidationError(`${err.message} (V11)`, 400);
    }
    throw err;
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

function accountIdFromLinea(linea: {
  cuentaId: string | null;
  cuentaGlobalId: string | null;
}): string {
  return linea.cuentaId ?? linea.cuentaGlobalId ?? '';
}

/** Map persisted asiento lines back to template line ids (debit/credit order). */
function templateLinesFromAsiento(
  template: Plantilla,
  lineas: Array<{
    cuentaId: string | null;
    cuentaGlobalId: string | null;
    debito: { toString: () => string };
    credito: { toString: () => string };
  }>,
): ApunteLineInput[] {
  const debits = lineas.filter((l) => Number(l.debito.toString()) > 0);
  const credits = lineas.filter((l) => Number(l.credito.toString()) > 0);
  const tplDebits = template.lines.filter((l) => l.side === 'debit');
  const tplCredits = template.lines.filter((l) => l.side === 'credit');
  const out: ApunteLineInput[] = [];

  tplDebits.forEach((tl, i) => {
    const row = debits[i];
    if (row) out.push({ id: tl.id, accountId: accountIdFromLinea(row) });
  });
  tplCredits.forEach((tl, i) => {
    const row = credits[i];
    if (row) out.push({ id: tl.id, accountId: accountIdFromLinea(row) });
  });

  return out;
}

export function registerApunteRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  accountingService: AccountingService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // GET /api/apuntes — recent/history list (no journal lines)
  app.get(
    '/api/apuntes',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const query = request.query as {
        limit?: string;
        offset?: string;
        dateFrom?: string;
        dateTo?: string;
        amountMin?: string;
        amountMax?: string;
        q?: string;
        accountId?: string;
      };

      const limitRaw = query.limit ? parseInt(query.limit, 10) : 20;
      const offsetRaw = query.offset ? parseInt(query.offset, 10) : 0;
      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(limitRaw, 1), 100)
        : 20;
      const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

      const where = buildApunteListWhere(userId, query) as Parameters<
        typeof prisma.apunte.findMany
      >[0] extends { where?: infer W }
        ? W
        : never;

      try {
        const [total, rows] = await Promise.all([
          prisma.apunte.count({ where }),
          prisma.apunte.findMany({
            where,
            orderBy: { createdAt: 'desc' },
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
            amount: moneyToNumber(row.amount.toString()),
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

  // GET /api/apuntes/:id — detail for edit (template lines + amounts)
  app.get(
    '/api/apuntes/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };

      try {
        const row = await prisma.apunte.findFirst({
          where: { id, userId },
          include: {
            asiento: { include: { lineas: { orderBy: { createdAt: 'asc' } } } },
          },
        });
        if (!row) {
          return reply.status(404).send({ error: 'Apunte not found' });
        }

        let lines: ApunteLineInput[] = [];
        if (row.templateCode) {
          const template = getPlantilla(row.templateCode);
          if (template) {
            lines = templateLinesFromAsiento(template, row.asiento.lineas);
          }
        }

        return reply.status(200).send({
          apunte: {
            id: row.id,
            templateCode: row.templateCode,
            date: formatApunteDate(row.date),
            concept: row.concept,
            amount: moneyToNumber(row.amount.toString()),
            asientoId: row.asientoId,
            createdAt: row.createdAt.toISOString(),
            lines,
          },
        });
      } catch (err) {
        request.log.error(err, 'Failed to get apunte');
        return reply.status(500).send({ error: 'Failed to get apunte' });
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
        // Resolve book + currency scale
        // ---------------------------------------------------------------
        const bookId = await getBookId(userId);
        const bookConfig = await prisma.bookConfig.findUnique({
          where: { bookId },
          select: { currency: true },
        });
        const currency = bookConfig?.currency ?? DEFAULT_CURRENCY;
        const amountD = quantizeMoney(body.amount ?? 0, currency);

        // ---------------------------------------------------------------
        // Template-based (HOME) or free-form (PRO)
        // ---------------------------------------------------------------
        let template: Plantilla | undefined;
        let amount = moneyToNumber(amountD, currency);
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
            amount = moneyToNumber(quantizeMoney(body.amount, currency), currency);
          }

          // V11: When a template requires an entity capability (e.g. salary →
          // is_employment_dependency) and an entity was selected, it must hold it.
          if (body.entityId && template.entity?.requiresCapability) {
            await requireEntityCapability(
              body.entityId,
              userId,
              template.entity.requiresCapability,
            );
          }
        }

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
          debito: string;
          credito: string;
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
            const lineAmount = quantizeMoney(amount, currency).toFixed();
            entryLines.push({
              ...(resolved.tipo === 'global'
                ? { cuentaGlobalId: resolved.id }
                : { cuentaId: resolved.id }),
              debito: isDebit ? lineAmount : moneyToFixed(0, currency),
              credito: isDebit ? moneyToFixed(0, currency) : lineAmount,
            });
          } else {
            // PRO wizard: side and amount come from the request
            if (!line.side || line.amount === undefined || line.amount === null) {
              return reply
                .status(400)
                .send({ error: `Line ${line.id}: side and amount required when no template` });
            }

            const isDebit = line.side === 'debit';
            const lineAmount = quantizeMoney(line.amount, currency).toFixed();
            entryLines.push({
              ...(resolved.tipo === 'global'
                ? { cuentaGlobalId: resolved.id }
                : { cuentaId: resolved.id }),
              debito: isDebit ? lineAmount : moneyToFixed(0, currency),
              credito: isDebit ? moneyToFixed(0, currency) : lineAmount,
            });
          }
        }

        // V10: Origin and destination must be different accounts when both sides present
        {
          const debitIds = new Set<string>();
          const creditIds = new Set<string>();
          for (const line of body.lines) {
            if (template) {
              const templateLine = template.lines.find((l) => l.id === line.id);
              if (!templateLine) continue;
              if (templateLine.side === 'debit') debitIds.add(line.accountId);
              else creditIds.add(line.accountId);
            } else if (line.side === 'debit') {
              debitIds.add(line.accountId);
            } else if (line.side === 'credit') {
              creditIds.add(line.accountId);
            }
          }
          for (const id of debitIds) {
            if (creditIds.has(id)) {
              return reply.status(400).send({
                error:
                  'Origin and destination must be different accounts (V10)',
              });
            }
          }
        }

        // ---------------------------------------------------------------
        // V8: Validate balance (decimal.js)
        // ---------------------------------------------------------------
        const totalDebito = sumMoney(
          entryLines.map((l) => l.debito),
          currency,
        );
        const totalCredito = sumMoney(
          entryLines.map((l) => l.credito),
          currency,
        );
        if (!moneyEquals(totalDebito, totalCredito, currency)) {
          return reply.status(400).send({
            error: `Entry not balanced: debito ${moneyToFixed(totalDebito, currency)} ≠ credito ${moneyToFixed(totalCredito, currency)} (V8)`,
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
              amount: quantizeMoney(amount, currency).toFixed(),
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
            amount: moneyToNumber(result.apunte.amount.toString(), currency),
            asientoId: result.apunte.asientoId,
          },
          asiento: {
            id: result.asiento.id,
            fecha: result.asiento.fecha.toISOString(),
            descripcion: result.asiento.concepto,
            lines: result.lineas.map((l) => ({
              cuentaId: l.cuentaId,
              cuentaGlobalId: l.cuentaGlobalId,
              debito: moneyToNumber(l.debito.toString(), currency),
              credito: moneyToNumber(l.credito.toString(), currency),
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

  // PATCH /api/apuntes/:id — update apunte + underlying asiento (open period)
  app.patch(
    '/api/apuntes/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };
      const body = request.body as CreateApunteBody;

      try {
        const existing = await prisma.apunte.findFirst({
          where: { id, userId },
        });
        if (!existing) {
          return reply.status(404).send({ error: 'Apunte not found' });
        }

        if (!body.date || !body.concept || !body.lines?.length) {
          return reply
            .status(400)
            .send({ error: 'date, concept, and lines are required' });
        }

        const bookId = await getBookId(userId);
        const bookConfig = await prisma.bookConfig.findUnique({
          where: { bookId },
          select: { currency: true },
        });
        const currency = bookConfig?.currency ?? DEFAULT_CURRENCY;
        const amountD = quantizeMoney(body.amount ?? 0, currency);

        let template: Plantilla | undefined;
        let amount = moneyToNumber(amountD, currency);
        const templateCode = body.templateCode ?? existing.templateCode ?? undefined;

        if (templateCode) {
          template = getPlantilla(templateCode);
          if (!template) {
            return reply
              .status(400)
              .send({ error: `Template '${templateCode}' not found (V1)` });
          }
          const templateLineIds = new Set(template.lines.map((l) => l.id));
          for (const line of body.lines) {
            if (!templateLineIds.has(line.id)) {
              return reply
                .status(400)
                .send({ error: `Line id ${line.id} not found in template (V2)` });
            }
          }
          if (template.amountMode === 'single') {
            if (body.amount === undefined || body.amount === null) {
              return reply
                .status(400)
                .send({ error: 'amount is required when template has amountMode single (V5)' });
            }
            amount = moneyToNumber(quantizeMoney(body.amount, currency), currency);
          }
        }

        const fecha = new Date(body.date);
        const año = fecha.getFullYear();
        const period = await prisma.periodoContable.findUnique({
          where: { bookId_año: { bookId, año } },
        });
        if (period && !period.abierto) {
          return reply.status(400).send({ error: `Period ${año} is closed (V6)` });
        }

        const entryLines: Array<{
          cuentaId?: string;
          cuentaGlobalId?: string;
          debito: number;
          credito: number;
        }> = [];

        for (const line of body.lines) {
          const resolved = await resolveAccount(line.accountId, userId);
          if (template) {
            const templateLine = template.lines.find((l) => l.id === line.id)!;
            await validateLineAgainstTemplate(line, templateLine, userId);
            const isDebit = templateLine.side === 'debit';
            const lineAmount = quantizeMoney(amount, currency).toFixed();
            entryLines.push({
              ...(resolved.tipo === 'global'
                ? { cuentaGlobalId: resolved.id }
                : { cuentaId: resolved.id }),
              debito: isDebit ? moneyToNumber(lineAmount, currency) : 0,
              credito: isDebit ? 0 : moneyToNumber(lineAmount, currency),
            });
          } else {
            if (!line.side || line.amount === undefined || line.amount === null) {
              return reply
                .status(400)
                .send({ error: `Line ${line.id}: side and amount required when no template` });
            }
            const isDebit = line.side === 'debit';
            const lineAmount = quantizeMoney(line.amount, currency).toFixed();
            entryLines.push({
              ...(resolved.tipo === 'global'
                ? { cuentaGlobalId: resolved.id }
                : { cuentaId: resolved.id }),
              debito: isDebit ? moneyToNumber(lineAmount, currency) : 0,
              credito: isDebit ? 0 : moneyToNumber(lineAmount, currency),
            });
          }
        }

        if (template) {
          const debitIds = new Set<string>();
          const creditIds = new Set<string>();
          for (const line of body.lines) {
            const templateLine = template.lines.find((l) => l.id === line.id);
            if (!templateLine) continue;
            if (templateLine.side === 'debit') debitIds.add(line.accountId);
            else creditIds.add(line.accountId);
          }
          for (const accountId of debitIds) {
            if (creditIds.has(accountId)) {
              return reply.status(400).send({
                error: 'Origin and destination must be different accounts (V10)',
              });
            }
          }
        }

        const totalDebito = sumMoney(
          entryLines.map((l) => String(l.debito)),
          currency,
        );
        const totalCredito = sumMoney(
          entryLines.map((l) => String(l.credito)),
          currency,
        );
        if (!moneyEquals(totalDebito, totalCredito, currency)) {
          return reply.status(400).send({
            error: `Entry not balanced: debito ${moneyToFixed(totalDebito, currency)} ≠ credito ${moneyToFixed(totalCredito, currency)} (V8)`,
          });
        }

        await accountingService.updateEntry(
          existing.asientoId,
          bookId,
          {
            fecha,
            concepto: body.concept,
            lineas: entryLines,
          },
          userId,
        );

        const updated = await prisma.apunte.update({
          where: { id },
          data: {
            templateCode: templateCode ?? null,
            date: fecha,
            concept: body.concept,
            amount: quantizeMoney(amount, currency).toFixed(),
          },
        });

        return reply.status(200).send({
          apunte: {
            id: updated.id,
            templateCode: updated.templateCode,
            date: formatApunteDate(updated.date),
            concept: updated.concept,
            amount: moneyToNumber(updated.amount.toString(), currency),
            asientoId: updated.asientoId,
            createdAt: updated.createdAt.toISOString(),
          },
        });
      } catch (err) {
        if (err instanceof ValidationError) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        const message = err instanceof Error ? err.message : 'Failed to update apunte';
        if (message.includes('closed') || message.includes('voided')) {
          return reply.status(400).send({ error: message });
        }
        if (message.includes('not found')) {
          return reply.status(404).send({ error: message });
        }
        request.log.error(err, 'Failed to update apunte');
        return reply.status(500).send({ error: 'Failed to update apunte' });
      }
    },
  );
}
