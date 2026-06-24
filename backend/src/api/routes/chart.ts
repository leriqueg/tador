/**
 * Chart routes: global chart of accounts and user activations.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';

interface ActivateBody {
  nombreOverride?: string;
}

export function registerChartRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // GET /api/chart — global chart of accounts + user's activations
  app.get('/api/chart', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;

    try {
      const chart = await prisma.cuentaGlobal.findMany({
        orderBy: { codigo: 'asc' },
      });
      const activations = await prisma.activacionCuentaGlobal.findMany({
        where: { userId },
      });

      return reply.status(200).send({ chart, activations });
    } catch (err) {
      request.log.error(err, 'Failed to fetch chart');
      return reply.status(500).send({ error: 'Failed to fetch chart' });
    }
  });

  // POST /api/chart/:id/activate — activate a global account for the user
  app.post(
    '/api/chart/:id/activate',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };
      const { nombreOverride } = request.body as ActivateBody;

      try {
        const activation = await prisma.activacionCuentaGlobal.upsert({
          where: {
            userId_globalId: { userId, globalId: id },
          },
          update: {
            activa: true,
            nombreOverride: nombreOverride ?? null,
          },
          create: {
            userId,
            globalId: id,
            activa: true,
            nombreOverride: nombreOverride ?? null,
          },
        });

        return reply.status(200).send({ activation });
      } catch (err) {
        request.log.error(err, 'Failed to activate global account');
        return reply.status(500).send({ error: 'Failed to activate account' });
      }
    },
  );
}
