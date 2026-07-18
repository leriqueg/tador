/**
 * Entry routes: journal entry (asiento) CRUD.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import type { AccountingService } from '../../application/accounting-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';
import { NegativeBalanceError } from '../../application/account-balance-policy.js';

interface CreateEntryLineBody {
  cuentaId?: string;
  cuentaGlobalId?: string;
  debito?: number;
  credito?: number;
}

interface CreateEntryBody {
  fecha: string;
  concepto: string;
  lineas: CreateEntryLineBody[];
  idempotencyKey?: string;
}

interface UpdateEntryBody {
  fecha?: string;
  concepto?: string;
  lineas?: CreateEntryLineBody[];
}

export function registerEntryRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  accountingService: AccountingService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  async function getBookId(userId: string): Promise<string | null> {
    const book = await prisma.book.findFirst({
      where: { userId },
      select: { id: true },
    });
    return book?.id ?? null;
  }

  function normalizeLines(
    lineas: CreateEntryLineBody[],
  ): Array<{ cuentaId?: string; cuentaGlobalId?: string; debito: number; credito: number }> {
    return lineas.map((l) => ({
      cuentaId: l.cuentaId,
      cuentaGlobalId: l.cuentaGlobalId,
      debito: l.debito ?? 0,
      credito: l.credito ?? 0,
    }));
  }

  // ---------------------------------------------------------------------------
  // POST /api/entries — create entry
  // ---------------------------------------------------------------------------

  app.post(
    '/api/entries',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const body = request.body as CreateEntryBody;
      const idempotencyKey =
        body.idempotencyKey ??
        (request.headers['idempotency-key'] as string | undefined);

      if (!body.fecha || !body.concepto || !body.lineas?.length) {
        return reply
          .status(400)
          .send({ error: 'fecha, concepto, and lineas are required' });
      }

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const result = await accountingService.createEntry({
          bookId,
          fecha: new Date(body.fecha),
          concepto: body.concepto,
          lineas: normalizeLines(body.lineas),
          idempotencyKey,
        });

        return reply.status(201).send(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create entry';
        if (err instanceof NegativeBalanceError) {
          return reply.status(400).send({ error: message, code: err.code });
        }
        if (message.startsWith('Invalid line') || message.includes('balanced') || message.includes('at least two')) {
          return reply.status(400).send({ error: message });
        }
        if (message.includes('closed')) {
          return reply.status(400).send({ error: message });
        }
        if (message.includes('not found')) {
          return reply.status(404).send({ error: message });
        }
        request.log.error(err, 'Failed to create entry');
        return reply.status(500).send({ error: 'Failed to create entry' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // GET /api/entries — list entries
  // ---------------------------------------------------------------------------

  app.get(
    '/api/entries',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const query = request.query as { año?: string; mes?: string };
      const año = query.año ? parseInt(query.año, 10) : undefined;
      const mes = query.mes ? parseInt(query.mes, 10) : undefined;

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const entries = await accountingService.listEntries(bookId, año, mes);

        return reply.status(200).send({ entries });
      } catch (err) {
        request.log.error(err, 'Failed to list entries');
        return reply.status(500).send({ error: 'Failed to list entries' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // GET /api/entries/:id — get entry with lines
  // ---------------------------------------------------------------------------

  app.get(
    '/api/entries/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const result = await accountingService.getEntry(id, bookId);
        if (!result) {
          return reply.status(404).send({ error: 'Entry not found' });
        }

        return reply.status(200).send(result);
      } catch (err) {
        request.log.error(err, 'Failed to get entry');
        return reply.status(500).send({ error: 'Failed to get entry' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // PUT /api/entries/:id — update entry
  // ---------------------------------------------------------------------------

  app.put(
    '/api/entries/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };
      const body = request.body as UpdateEntryBody;

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const result = await accountingService.updateEntry(
          id,
          bookId,
          {
            ...(body.fecha !== undefined && { fecha: new Date(body.fecha) }),
            ...(body.concepto !== undefined && { concepto: body.concepto }),
            ...(body.lineas !== undefined && {
              lineas: normalizeLines(body.lineas),
            }),
          },
          userId,
        );

        return reply.status(200).send(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update entry';
        if (err instanceof NegativeBalanceError) {
          return reply.status(400).send({ error: message, code: err.code });
        }
        if (message.includes('closed')) {
          return reply.status(400).send({ error: message });
        }
        if (message.includes('voided')) {
          return reply.status(400).send({ error: message });
        }
        if (message.startsWith('Invalid line') || message.includes('balanced') || message.includes('at least two')) {
          return reply.status(400).send({ error: message });
        }
        if (message.includes('not found')) {
          return reply.status(404).send({ error: message });
        }
        request.log.error(err, 'Failed to update entry');
        return reply.status(500).send({ error: 'Failed to update entry' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // POST /api/entries/:id/void — void entry
  // ---------------------------------------------------------------------------

  app.post(
    '/api/entries/:id/void',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const result = await accountingService.voidEntry(id, bookId);

        return reply.status(200).send(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to void entry';
        if (err instanceof NegativeBalanceError) {
          return reply.status(400).send({ error: message, code: err.code });
        }
        if (message.includes('already voided')) {
          return reply.status(400).send({ error: message });
        }
        if (message.includes('closed')) {
          return reply.status(400).send({ error: message });
        }
        if (message.includes('not found')) {
          return reply.status(404).send({ error: message });
        }
        request.log.error(err, 'Failed to void entry');
        return reply.status(500).send({ error: 'Failed to void entry' });
      }
    },
  );
}
