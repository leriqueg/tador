/**
 * Period routes: fiscal period management.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import type { AccountingService } from '../../application/accounting-service.js';
import type { BookApplicationService } from '../../application/book-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function registerPeriodRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  accountingService: AccountingService,
  bookService: BookApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  async function getBookId(userId: string): Promise<string | null> {
    try {
      const book = await bookService.getBook(userId, userId);
      return book.id;
    } catch {
      return null;
    }
  }

  app.post(
    '/api/periods/:año/close',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { año } = request.params as { año: string };
      const anioNum = parseInt(año, 10);

      if (isNaN(anioNum)) {
        return reply.status(400).send({ error: 'Invalid year parameter' });
      }

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const period = await accountingService.closePeriod(bookId, anioNum);

        return reply.status(200).send({ period });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to close period';
        if (message.includes('already closed')) {
          return reply.status(400).send({ error: message });
        }
        if (message.includes('does not exist')) {
          return reply.status(404).send({ error: message });
        }
        request.log.error(err, 'Failed to close period');
        return reply.status(500).send({ error: 'Failed to close period' });
      }
    },
  );

  app.post(
    '/api/periods/:año/reopen',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { año } = request.params as { año: string };
      const anioNum = parseInt(año, 10);

      if (isNaN(anioNum)) {
        return reply.status(400).send({ error: 'Invalid year parameter' });
      }

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const period = await accountingService.reopenPeriod(bookId, anioNum);

        return reply.status(200).send({ period });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reopen period';
        if (message.includes('already open')) {
          return reply.status(400).send({ error: message });
        }
        if (message.includes('does not exist')) {
          return reply.status(404).send({ error: message });
        }
        request.log.error(err, 'Failed to reopen period');
        return reply.status(500).send({ error: 'Failed to reopen period' });
      }
    },
  );
}
