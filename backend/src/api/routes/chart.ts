/**
 * Chart routes: global chart of accounts and user activations.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';
import {
  isBalanceProtectedCode,
  lockBalancePolicyChange,
} from '../../application/account-balance-policy.js';

interface ActivateBody {
  nombreOverride?: string;
}

interface UpdateBalancePolicyBody {
  enforceNonNegativeBalance: boolean;
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

  app.patch(
    '/api/chart/:id/balance-policy',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };
      const { enforceNonNegativeBalance } =
        request.body as UpdateBalancePolicyBody;

      if (typeof enforceNonNegativeBalance !== 'boolean') {
        return reply.status(400).send({
          error: 'enforceNonNegativeBalance must be a boolean',
        });
      }

      try {
        const [global, book] = await Promise.all([
          prisma.cuentaGlobal.findUnique({
            where: { id },
            select: { id: true, codigo: true },
          }),
          prisma.book.findFirst({
            where: { userId },
            select: { id: true },
          }),
        ]);
        if (!global || !book) {
          return reply.status(404).send({ error: 'Account not found' });
        }
        if (!isBalanceProtectedCode(global.codigo)) {
          return reply.status(422).send({
            error: 'Balance policy only applies to liquidity and debt accounts',
          });
        }

        const activation = await prisma.$transaction(async (tx) => {
          await lockBalancePolicyChange(tx, book.id, 'global', id);
          return tx.activacionCuentaGlobal.upsert({
            where: { userId_globalId: { userId, globalId: id } },
            update: { enforceNonNegativeBalance },
            create: {
              userId,
              globalId: id,
              activa: true,
              enforceNonNegativeBalance,
            },
          });
        });

        return reply.status(200).send({ activation });
      } catch (err) {
        request.log.error(err, 'Failed to update global account balance policy');
        return reply
          .status(500)
          .send({ error: 'Failed to update global account balance policy' });
      }
    },
  );
}
