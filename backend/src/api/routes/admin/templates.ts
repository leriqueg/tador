/**
 * Admin template HTTP routes (013 US4).
 */

import type { FastifyInstance } from 'fastify';
import type { OperatorAuthApplicationService } from '../../../application/admin/operator-auth-service.js';
import type { AdminTemplateApplicationService } from '../../../application/admin/admin-template-service.js';
import { createOperatorAuthMiddleware } from './middleware/require-operator.js';
import { requireRole } from './middleware/require-role.js';
import { requirePasswordChanged } from './middleware/require-password-changed.js';

export function registerAdminTemplateRoutes(
  app: FastifyInstance,
  operatorAuth: OperatorAuthApplicationService,
  templates: AdminTemplateApplicationService,
): void {
  const requireOperator = createOperatorAuthMiddleware(operatorAuth);
  const gate = [requireOperator, requirePasswordChanged, requireRole('support')];

  app.get(
    '/api/admin/templates',
    { preHandler: gate },
    async (request, reply) => {
      const query = request.query as { mode?: string };
      const result = templates.list(query.mode ?? 'hogar');
      return reply.status(200).send(result);
    },
  );

  app.get(
    '/api/admin/templates/:code',
    { preHandler: gate },
    async (request, reply) => {
      const { code } = request.params as { code: string };
      const query = request.query as { userId?: string };
      const detail = await templates.getDetail(code, query.userId);
      if (!detail) {
        return reply.status(404).send({ error: `Plantilla '${code}' not found` });
      }
      return reply.status(200).send(detail);
    },
  );

  app.get(
    '/api/admin/templates/:code/readiness',
    { preHandler: gate },
    async (request, reply) => {
      const { code } = request.params as { code: string };
      const query = request.query as { mode?: string; userId?: string };
      const readiness = await templates.getReadiness(code, {
        mode: query.mode,
        userId: query.userId,
      });
      if (!readiness) {
        return reply.status(404).send({ error: `Plantilla '${code}' not found` });
      }
      return reply.status(200).send(readiness);
    },
  );

  app.post(
    '/api/admin/templates/:code/preview',
    { preHandler: gate },
    async (request, reply) => {
      const { code } = request.params as { code: string };
      const body = (request.body ?? {}) as {
        userId?: string;
        amount?: number;
        concept?: string;
        lines?: Array<{ id: number; accountId: string }>;
      };
      try {
        if (!body.userId) {
          return reply.status(400).send({ error: 'userId is required' });
        }
        const result = await templates.preview(code, {
          userId: body.userId,
          amount: body.amount as number,
          concept: body.concept,
          lines: body.lines ?? [],
        });
        return reply.status(200).send(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Preview failed';
        if (message.includes('not found')) {
          return reply.status(404).send({ error: message });
        }
        if (
          message.includes('required') ||
          message.includes('not in template')
        ) {
          return reply.status(400).send({ error: message });
        }
        throw err;
      }
    },
  );
}
