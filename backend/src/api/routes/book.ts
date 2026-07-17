/**
 * Book routes: get book info, update config.
 */

import type { FastifyInstance } from 'fastify';
import type { BookApplicationService } from '../../application/book-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import type { AuthApplicationService } from '../../application/auth-service.js';
import type { BookConfig } from '../../domain/book.js';
import { isBookInitialized } from '../../domain/book.js';

function serializeConfig(config: BookConfig) {
  return {
    id: config.id,
    currency: config.currency,
    locale: config.locale,
    format: config.format,
    currencyLocked: config.currencyLocked,
    mode: config.mode,
    timeZone: config.timeZone,
    onboardingCompletedAt: config.onboardingCompletedAt,
    initialized: isBookInitialized(config),
  };
}

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
        config: serializeConfig(config),
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
    const body = request.body as {
      currency?: string;
      locale?: string;
      format?: string;
      mode?: 'hogar' | 'pro';
      timeZone?: string;
      completeOnboarding?: boolean;
    };

    try {
      const book = await bookService.getBook(userId, userId);
      const config = await bookService.updateConfig(userId, book.id, userId, {
        currency: body.currency,
        locale: body.locale,
        format: body.format,
        mode: body.mode,
        timeZone: body.timeZone,
        completeOnboarding: body.completeOnboarding,
      });

      return reply.status(200).send({
        config: serializeConfig(config),
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
        message === 'Cannot change currency after financial activity has been recorded' ||
        message === 'Invalid book mode' ||
        message === 'Invalid time zone'
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
