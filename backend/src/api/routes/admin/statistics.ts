/**
 * Admin statistics HTTP routes (013 US5).
 */

import type { FastifyInstance } from 'fastify';
import type { OperatorAuthApplicationService } from '../../../application/admin/operator-auth-service.js';
import type { AdminStatisticsApplicationService } from '../../../application/admin/admin-statistics-service.js';
import type { Granularity } from '../../../application/admin/admin-statistics-bucketing.js';
import { createOperatorAuthMiddleware } from './middleware/require-operator.js';
import { requireRole } from './middleware/require-role.js';
import { requirePasswordChanged } from './middleware/require-password-changed.js';

function parseQuery(query: {
  from?: string;
  to?: string;
  granularity?: string;
}): { from: string; to: string; granularity: Granularity } | { error: string } {
  if (!query.from || !query.to) {
    return { error: 'from and to are required' };
  }
  const granularity = (query.granularity ?? 'day') as Granularity;
  if (!['day', 'week', 'month'].includes(granularity)) {
    return { error: 'invalid granularity' };
  }
  return { from: query.from, to: query.to, granularity };
}

export function registerAdminStatisticsRoutes(
  app: FastifyInstance,
  operatorAuth: OperatorAuthApplicationService,
  stats: AdminStatisticsApplicationService,
): void {
  const requireOperator = createOperatorAuthMiddleware(operatorAuth);
  const gate = [requireOperator, requirePasswordChanged, requireRole('support')];

  app.get(
    '/api/admin/statistics/overview',
    { preHandler: gate },
    async (request, reply) => {
      const parsed = parseQuery(request.query as {
        from?: string;
        to?: string;
        granularity?: string;
      });
      if ('error' in parsed) {
        return reply.status(400).send({ error: parsed.error });
      }
      const result = await stats.overview(
        parsed.from,
        parsed.to,
        parsed.granularity,
      );
      return reply.status(200).send(result);
    },
  );

  app.get(
    '/api/admin/statistics/users',
    { preHandler: gate },
    async (request, reply) => {
      const parsed = parseQuery(request.query as {
        from?: string;
        to?: string;
        granularity?: string;
      });
      if ('error' in parsed) {
        return reply.status(400).send({ error: parsed.error });
      }
      const full = await stats.overview(
        parsed.from,
        parsed.to,
        parsed.granularity,
      );
      return reply.status(200).send({
        from: parsed.from,
        to: parsed.to,
        granularity: parsed.granularity,
        series: full.series.map((s) => ({
          key: s.key,
          registrations: s.registrations,
        })),
      });
    },
  );

  app.get(
    '/api/admin/statistics/sessions',
    { preHandler: gate },
    async (request, reply) => {
      const parsed = parseQuery(request.query as {
        from?: string;
        to?: string;
        granularity?: string;
      });
      if ('error' in parsed) {
        return reply.status(400).send({ error: parsed.error });
      }
      const full = await stats.overview(
        parsed.from,
        parsed.to,
        parsed.granularity,
      );
      return reply.status(200).send({
        from: parsed.from,
        to: parsed.to,
        granularity: parsed.granularity,
        series: full.series.map((s) => ({ key: s.key, logins: s.logins })),
      });
    },
  );

  app.get(
    '/api/admin/statistics/apuntes',
    { preHandler: gate },
    async (request, reply) => {
      const parsed = parseQuery(request.query as {
        from?: string;
        to?: string;
        granularity?: string;
      });
      if ('error' in parsed) {
        return reply.status(400).send({ error: parsed.error });
      }
      const full = await stats.overview(
        parsed.from,
        parsed.to,
        parsed.granularity,
      );
      return reply.status(200).send({
        from: parsed.from,
        to: parsed.to,
        granularity: parsed.granularity,
        series: full.series.map((s) => ({
          key: s.key,
          apuntesCreated: s.apuntesCreated,
        })),
      });
    },
  );
}
