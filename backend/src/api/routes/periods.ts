/**
 * Periods routes: annual period close/reopen.
 *
 * POST /api/periods/:year/close   — close fiscal year (FR-005)
 * POST /api/periods/:year/reopen  — reopen fiscal year (FR-007)
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import type { PeriodoApplicationService } from '../../application/periodo-service.js';
import type { BookRepository } from '../../infrastructure/repositories/book-repo.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function registerPeriodRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  periodoService: PeriodoApplicationService,
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

  // POST /api/periods/:year/close — close a fiscal year
  app.post(
    '/api/periods/:year/close',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { year } = request.params as { year: string };
      const año = parseInt(year, 10);

      if (isNaN(año) || año < 1900 || año > 2100) {
        return reply.status(400).send({ error: 'Invalid year' });
      }

      try {
        const bookId = await resolveBookId(userId);
        const periodo = await periodoService.cerrarPeriodo(bookId, año, userId);

        return reply.status(200).send({ periodo });
      } catch (err) {
        request.log.error(err, 'Failed to close period');
        return reply.status(500).send({ error: 'Failed to close period' });
      }
    },
  );

  // POST /api/periods/:year/reopen — reopen a fiscal year
  app.post(
    '/api/periods/:year/reopen',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { year } = request.params as { year: string };
      const año = parseInt(year, 10);

      if (isNaN(año) || año < 1900 || año > 2100) {
        return reply.status(400).send({ error: 'Invalid year' });
      }

      try {
        const bookId = await resolveBookId(userId);
        const periodo = await periodoService.reabrirPeriodo(bookId, año, userId);

        return reply.status(200).send({ periodo });
      } catch (err) {
        request.log.error(err, 'Failed to reopen period');
        return reply.status(500).send({ error: 'Failed to reopen period' });
      }
    },
  );
}
