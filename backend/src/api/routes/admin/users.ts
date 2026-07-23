/**
 * Admin user support HTTP routes (013 US2).
 */

import type { FastifyInstance } from 'fastify';
import type { OperatorAuthApplicationService } from '../../../application/admin/operator-auth-service.js';
import type { AdminUserApplicationService } from '../../../application/admin/admin-user-service.js';
import { createOperatorAuthMiddleware } from './middleware/require-operator.js';
import { requireRole } from './middleware/require-role.js';
import { requirePasswordChanged } from './middleware/require-password-changed.js';

export function registerAdminUserRoutes(
  app: FastifyInstance,
  operatorAuth: OperatorAuthApplicationService,
  userService: AdminUserApplicationService,
): void {
  const requireOperator = createOperatorAuthMiddleware(operatorAuth);

  app.get(
    '/api/admin/users',
    {
      preHandler: [requireOperator, requirePasswordChanged, requireRole('support')],
    },
    async (request, reply) => {
      const query = request.query as {
        q?: string;
        blocked?: 'true' | 'false' | 'all';
        page?: string;
        pageSize?: string;
      };
      const result = await userService.list({
        q: query.q,
        blocked: query.blocked,
        page: query.page ? Number(query.page) : undefined,
        pageSize: query.pageSize ? Number(query.pageSize) : undefined,
      });
      return reply.status(200).send(result);
    },
  );

  app.get(
    '/api/admin/users/:id',
    {
      preHandler: [requireOperator, requirePasswordChanged, requireRole('support')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = await userService.get(id);
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      return reply.status(200).send({ user });
    },
  );

  app.post(
    '/api/admin/users/:id/block',
    {
      preHandler: [requireOperator, requirePasswordChanged, requireRole('admin')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as { reason?: string };
      try {
        const user = await userService.block(request.operatorId!, id, body.reason);
        return reply.status(200).send({
          user: {
            id: user.id,
            email: user.email,
            blockedAt: user.blockedAt,
            blockedReason: user.blockedReason,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Block failed';
        if (message === 'User not found') {
          return reply.status(404).send({ error: message });
        }
        throw err;
      }
    },
  );

  app.post(
    '/api/admin/users/:id/unblock',
    {
      preHandler: [requireOperator, requirePasswordChanged, requireRole('admin')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        const user = await userService.unblock(request.operatorId!, id);
        return reply.status(200).send({
          user: {
            id: user.id,
            email: user.email,
            blockedAt: user.blockedAt,
            blockedReason: user.blockedReason,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unblock failed';
        if (message === 'User not found') {
          return reply.status(404).send({ error: message });
        }
        throw err;
      }
    },
  );

  app.post(
    '/api/admin/users/:id/force-password-recovery',
    {
      preHandler: [requireOperator, requirePasswordChanged, requireRole('admin')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        const result = await userService.forceRecovery(request.operatorId!, id);
        return reply.status(200).send({
          userId: result.userId,
          message: 'Password recovery initiated',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Force recovery failed';
        if (message === 'User not found') {
          return reply.status(404).send({ error: message });
        }
        throw err;
      }
    },
  );
}
