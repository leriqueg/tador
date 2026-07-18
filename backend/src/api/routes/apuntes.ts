/**
 * Apunte routes: creates journal entries from templates (HOME) or free-form (PRO).
 *
 * POST /api/apuntes
 *   - With templateCode: validates against template, resolves lines
 *   - Without templateCode: accepts free-form lines with side/amount per line
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import {
  ApunteNotFoundError,
  ApunteValidationError,
  NegativeBalanceError,
  type ApunteApplicationService,
  type CreateApunteInput,
} from '../../application/apunte-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function registerApunteRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  apunteService: ApunteApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

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

      try {
        const result = await apunteService.list(userId, query);
        return reply.status(200).send(result);
      } catch (err) {
        request.log.error(err, 'Failed to list apuntes');
        return reply.status(500).send({ error: 'Failed to list apuntes' });
      }
    },
  );

  app.get(
    '/api/apuntes/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };

      try {
        const result = await apunteService.get(userId, id);
        return reply.status(200).send(result);
      } catch (err) {
        if (err instanceof ApunteNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
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
      const body = request.body as CreateApunteInput;
      const idempotencyKey =
        body.idempotencyKey ??
        (request.headers['idempotency-key'] as string | undefined);

      try {
        const result = await apunteService.create(userId, body, idempotencyKey);
        return reply.status(result.statusCode).send(result.body);
      } catch (err) {
        if (err instanceof ApunteValidationError) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        if (err instanceof NegativeBalanceError) {
          return reply.status(400).send({ error: err.message, code: err.code });
        }
        request.log.error(err, 'Failed to create apunte');
        return reply.status(500).send({ error: 'Failed to create apunte' });
      }
    },
  );

  app.patch(
    '/api/apuntes/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };
      const body = request.body as CreateApunteInput;

      try {
        const result = await apunteService.update(userId, id, body);
        return reply.status(200).send(result);
      } catch (err) {
        if (err instanceof ApunteNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof ApunteValidationError) {
          return reply.status(err.statusCode).send({ error: err.message });
        }
        if (err instanceof NegativeBalanceError) {
          return reply.status(400).send({ error: err.message, code: err.code });
        }
        const message =
          err instanceof Error ? err.message : 'Failed to update apunte';
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
