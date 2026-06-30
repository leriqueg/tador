/**
 * Entries routes: journal entry CRUD.
 *
 * POST /api/entries      — create a balanced entry (FR-001/002)
 * GET  /api/entries      — list entries with optional date range
 * GET  /api/entries/:id  — get entry by id with lines
 * PUT  /api/entries/:id  — update entry in open period (FR-009/010)
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import type { AsientoApplicationService } from '../../application/asiento-service.js';
import type { BookRepository } from '../../infrastructure/repositories/book-repo.js';
import { createAuthMiddleware } from '../middleware/auth.js';

interface CreateEntryBody {
  fecha: string;
  descripcion: string;
  lineas: Array<{
    cuentaUsuarioId: string;
    debe: number;
    haber: number;
  }>;
}

interface UpdateEntryBody {
  descripcion: string;
  lineas: Array<{
    cuentaUsuarioId: string;
    debe: number;
    haber: number;
  }>;
}

interface ListEntriesQuery {
  desde?: string;
  hasta?: string;
}

export function registerEntryRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  asientoService: AsientoApplicationService,
  bookRepo: BookRepository,
): void {
  const requireAuth = createAuthMiddleware(authService);

  /** Helper to resolve bookId from the authenticated user's session userId. */
  async function resolveBookId(userId: string): Promise<string> {
    const book = await bookRepo.findByUserId(userId);
    if (!book) {
      throw new Error('Book not found for this user');
    }
    return book.id;
  }

  // POST /api/entries — create a balanced entry
  app.post(
    '/api/entries',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { fecha, descripcion, lineas } = request.body as CreateEntryBody;

      if (!fecha || !descripcion || !lineas || lineas.length === 0) {
        return reply.status(400).send({ error: 'fecha, descripcion, and lineas are required' });
      }

      try {
        const bookId = await resolveBookId(userId);
        const asiento = await asientoService.crearAsiento(bookId, userId, {
          fecha,
          descripcion,
          lineas,
        });

        return reply.status(201).send({ asiento });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create entry';
        if (
          message.startsWith('Unbalanced entry') ||
          message.startsWith('Account') ||
          message.startsWith('Fiscal year') ||
          message.startsWith('Entry must have')
        ) {
          return reply.status(400).send({ error: message });
        }
        request.log.error(err, 'Failed to create entry');
        return reply.status(500).send({ error: 'Failed to create entry' });
      }
    },
  );

  // GET /api/entries — list entries with optional date range
  app.get(
    '/api/entries',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { desde, hasta } = request.query as ListEntriesQuery;

      try {
        const bookId = await resolveBookId(userId);
        const entries = await asientoService.listarAsientos(bookId, userId, desde, hasta);

        return reply.status(200).send({ entries });
      } catch (err) {
        request.log.error(err, 'Failed to list entries');
        return reply.status(500).send({ error: 'Failed to list entries' });
      }
    },
  );

  // GET /api/entries/:id — get entry by id
  app.get(
    '/api/entries/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };

      try {
        const asiento = await asientoService.obtenerAsiento(id, userId);
        return reply.status(200).send({ asiento });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get entry';
        if (message === 'Entry not found') {
          return reply.status(404).send({ error: message });
        }
        request.log.error(err, 'Failed to get entry');
        return reply.status(500).send({ error: 'Failed to get entry' });
      }
    },
  );

  // PUT /api/entries/:id — update entry (FR-009/010)
  app.put(
    '/api/entries/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };
      const { descripcion, lineas } = request.body as UpdateEntryBody;

      if (!descripcion || !lineas || lineas.length === 0) {
        return reply.status(400).send({ error: 'descripcion and lineas are required' });
      }

      try {
        const asiento = await asientoService.editarAsiento(id, userId, {
          descripcion,
          lineas,
        });

        return reply.status(200).send({ asiento });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update entry';
        if (message === 'Entry not found') {
          return reply.status(404).send({ error: message });
        }
        if (
          message.startsWith('Cannot modify entry') ||
          message.startsWith('Unbalanced entry') ||
          message.startsWith('Account')
        ) {
          return reply.status(400).send({ error: message });
        }
        request.log.error(err, 'Failed to update entry');
        return reply.status(500).send({ error: 'Failed to update entry' });
      }
    },
  );
}
