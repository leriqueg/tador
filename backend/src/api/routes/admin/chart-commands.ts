/**
 * Admin chart command HTTP routes (014).
 */

import type { FastifyInstance } from 'fastify';
import type { OperatorAuthApplicationService } from '../../../application/admin/operator-auth-service.js';
import {
  ChartValidationError,
  type ChartCommandService,
} from '../../../application/chart/chart-command-service.js';
import { createOperatorAuthMiddleware } from './middleware/require-operator.js';
import { requireRole } from './middleware/require-role.js';
import { requirePasswordChanged } from './middleware/require-password-changed.js';

export function registerAdminChartCommandRoutes(
  app: FastifyInstance,
  operatorAuth: OperatorAuthApplicationService,
  chartCommands: ChartCommandService,
): void {
  const requireOperator = createOperatorAuthMiddleware(operatorAuth);
  const writeGate = [
    requireOperator,
    requirePasswordChanged,
    requireRole('admin'),
  ];

  async function handle(
    reply: { status: (code: number) => { send: (body: unknown) => unknown } },
    fn: () => Promise<unknown>,
  ) {
    try {
      const result = await fn();
      return reply.status(200).send(result);
    } catch (err) {
      if (err instanceof ChartValidationError) {
        const status =
          err.message === 'Account not found' ||
          err.message === 'account not found' ||
          err.message === 'parent not found'
            ? 404
            : 400;
        return reply.status(status).send({ error: err.message });
      }
      throw err;
    }
  }

  app.post(
    '/api/admin/chart/commands/reparent',
    { preHandler: writeGate },
    async (request, reply) => {
      const body = (request.body ?? {}) as {
        accountId?: string;
        newParentId?: string;
        dryRun?: boolean;
        cascadeUserCodigos?: boolean;
      };
      return handle(reply, () =>
        chartCommands.reparent({
          operatorId: request.operatorId!,
          accountId: body.accountId ?? '',
          newParentId: body.newParentId ?? '',
          dryRun: Boolean(body.dryRun),
          cascadeUserCodigos: body.cascadeUserCodigos,
        }),
      );
    },
  );

  app.post(
    '/api/admin/chart/commands/create',
    { preHandler: writeGate },
    async (request, reply) => {
      const body = (request.body ?? {}) as {
        codigo?: string;
        nombre?: string;
        descripcion?: string;
        esPostable?: boolean;
        parentId?: string | null;
        reportRole?: 'normal' | 'contra';
        dryRun?: boolean;
      };
      return handle(reply, async () => {
        const result = await chartCommands.create({
          operatorId: request.operatorId!,
          codigo: body.codigo ?? '',
          nombre: body.nombre ?? '',
          descripcion: body.descripcion,
          esPostable: Boolean(body.esPostable),
          parentId: body.parentId,
          reportRole: body.reportRole,
          dryRun: Boolean(body.dryRun),
        });
        return result;
      });
    },
  );

  app.post(
    '/api/admin/chart/commands/rename',
    { preHandler: writeGate },
    async (request, reply) => {
      const body = (request.body ?? {}) as {
        accountId?: string;
        nombre?: string;
        descripcion?: string;
        reportRole?: 'normal' | 'contra';
        dryRun?: boolean;
      };
      return handle(reply, () =>
        chartCommands.rename({
          operatorId: request.operatorId!,
          accountId: body.accountId ?? '',
          nombre: body.nombre ?? '',
          descripcion: body.descripcion,
          reportRole: body.reportRole,
          dryRun: Boolean(body.dryRun),
        }),
      );
    },
  );

  app.post(
    '/api/admin/chart/commands/recode',
    { preHandler: writeGate },
    async (request, reply) => {
      const body = (request.body ?? {}) as {
        accountId?: string;
        newCodigo?: string;
        dryRun?: boolean;
        cascadeUserCodigos?: boolean;
      };
      return handle(reply, () =>
        chartCommands.recode({
          operatorId: request.operatorId!,
          accountId: body.accountId ?? '',
          newCodigo: body.newCodigo ?? '',
          dryRun: Boolean(body.dryRun),
          cascadeUserCodigos: body.cascadeUserCodigos,
        }),
      );
    },
  );

  app.post(
    '/api/admin/chart/commands/deprecate',
    { preHandler: writeGate },
    async (request, reply) => {
      const body = (request.body ?? {}) as {
        accountId?: string;
        dryRun?: boolean;
      };
      return handle(reply, () =>
        chartCommands.deprecate({
          operatorId: request.operatorId!,
          accountId: body.accountId ?? '',
          dryRun: Boolean(body.dryRun),
        }),
      );
    },
  );
}
