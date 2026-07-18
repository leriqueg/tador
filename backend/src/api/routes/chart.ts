/**
 * Chart routes: global chart of accounts and user activations.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import {
  BalancePolicyNotApplicableError,
  ChartAccountNotFoundError,
  type ChartApplicationService,
} from '../../application/chart-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';

interface ActivateBody {
  nombreOverride?: string;
}

interface UpdateBalancePolicyBody {
  enforceNonNegativeBalance: boolean;
}

export function registerChartRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  chartService: ChartApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  app.get('/api/chart', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;

    try {
      const result = await chartService.listChart(userId);
      return reply.status(200).send(result);
    } catch (err) {
      request.log.error(err, 'Failed to fetch chart');
      return reply.status(500).send({ error: 'Failed to fetch chart' });
    }
  });

  app.post(
    '/api/chart/:id/activate',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };
      const { nombreOverride } = request.body as ActivateBody;

      try {
        const activation = await chartService.activateGlobalAccount(
          userId,
          id,
          nombreOverride,
        );
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
        const activation = await chartService.updateGlobalBalancePolicy(
          userId,
          id,
          enforceNonNegativeBalance,
        );
        return reply.status(200).send({ activation });
      } catch (err: unknown) {
        if (err instanceof ChartAccountNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof BalancePolicyNotApplicableError) {
          return reply.status(422).send({ error: err.message });
        }
        request.log.error(err, 'Failed to update global account balance policy');
        return reply
          .status(500)
          .send({ error: 'Failed to update global account balance policy' });
      }
    },
  );
}
