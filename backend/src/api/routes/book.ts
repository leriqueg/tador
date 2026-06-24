/**
 * Book routes: get book info, update config.
 */

import type { FastifyInstance } from 'fastify';
import type { BookApplicationService } from '../../application/book-service.js';
import { createAuthMiddleware, SESSION_COOKIE_OPTIONS } from '../middleware/auth.js';
import type { AuthApplicationService } from '../../application/auth-service.js';

export function registerBookRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  bookService: BookApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // GET /book — get user's book
  app.get('/book', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;

    try {
      const book = await bookService.getBook(userId, userId);
      const config = await bookService.getConfig(userId, book.id, userId);

      return reply.status(200).send({
        book: {
          id: book.id,
          createdAt: book.createdAt,
        },
        config: {
          id: config.id,
          currency: config.currency,
          locale: config.locale,
          format: config.format,
          currencyLocked: config.currencyLocked,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get book';
      if (message === 'Access denied: resource does not belong to this user') {
        return reply.status(403).send({ error: message });
      }
      if (message === 'Book not found' || message === 'Book config not found') {
        return reply.status(404).send({ error: message });
      }
      if (
        message === 'Email verification required before accessing financial book'
      ) {
        return reply.status(403).send({ error: message });
      }
      request.log.error(err, 'Failed to get book');
      return reply.status(500).send({ error: 'Failed to get book' });
    }
  });

  // PATCH /book/config — update book configuration
  app.patch('/book/config', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;
    const { currency, locale, format } = request.body as {
      currency?: string;
      locale?: string;
      format?: string;
    };

    try {
      // Get user's book ID first
      const book = await bookService.getBook(userId, userId);
      const config = await bookService.updateConfig(userId, book.id, userId, {
        currency,
        locale,
        format,
      });

      return reply.status(200).send({
        config: {
          id: config.id,
          currency: config.currency,
          locale: config.locale,
          format: config.format,
          currencyLocked: config.currencyLocked,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update config';
      if (
        message === 'Access denied: resource does not belong to this user'
      ) {
        return reply.status(403).send({ error: message });
      }
      if (
        message === 'Cannot change currency after financial activity has been recorded'
      ) {
        return reply.status(400).send({ error: message });
      }
      if (
        message === 'Email verification required before accessing financial book'
      ) {
        return reply.status(403).send({ error: message });
      }
      request.log.error(err, 'Failed to update book config');
      return reply.status(500).send({ error: 'Failed to update config' });
    }
  });
}
