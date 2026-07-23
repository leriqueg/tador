/**
 * Admin global accounts HTTP routes (013 US3).
 */

import type { FastifyInstance } from 'fastify';
import type { OperatorAuthApplicationService } from '../../../application/admin/operator-auth-service.js';
import {
  GlobalAccountDependencyError,
  GlobalAccountValidationError,
  type AdminGlobalAccountApplicationService,
} from '../../../application/admin/admin-global-account-service.js';
import { createOperatorAuthMiddleware } from './middleware/require-operator.js';
import { requireRole } from './middleware/require-role.js';
import { requirePasswordChanged } from './middleware/require-password-changed.js';

export function registerAdminGlobalAccountRoutes(
  app: FastifyInstance,
  operatorAuth: OperatorAuthApplicationService,
  service: AdminGlobalAccountApplicationService,
): void {
  const requireOperator = createOperatorAuthMiddleware(operatorAuth);
  const readGate = [
    requireOperator,
    requirePasswordChanged,
    requireRole('admin'),
  ];
  const writeGate = readGate;

  app.get(
    '/api/admin/global-accounts',
    { preHandler: readGate },
    async (_request, reply) => {
      const result = await service.listTree();
      return reply.status(200).send(result);
    },
  );

  app.get(
    '/api/admin/global-accounts/:id',
    { preHandler: readGate },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await service.get(id);
      if (!result) {
        return reply.status(404).send({ error: 'Account not found' });
      }
      return reply.status(200).send(result);
    },
  );

  app.post(
    '/api/admin/global-accounts',
    { preHandler: writeGate },
    async (request, reply) => {
      const body = (request.body ?? {}) as {
        codigo?: string;
        nombre?: string;
        descripcion?: string;
        esPostable?: boolean;
        parentId?: string | null;
      };
      try {
        const account = await service.create(request.operatorId!, {
          codigo: body.codigo ?? '',
          nombre: body.nombre ?? '',
          descripcion: body.descripcion,
          esPostable: Boolean(body.esPostable),
          parentId: body.parentId ?? null,
        });
        return reply.status(201).send({ account });
      } catch (err) {
        if (err instanceof GlobalAccountValidationError) {
          return reply.status(400).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  app.patch(
    '/api/admin/global-accounts/:id',
    { preHandler: writeGate },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as {
        nombre?: string;
        descripcion?: string;
        esPostable?: boolean;
        parentId?: string | null;
      };
      try {
        const account = await service.update(request.operatorId!, id, body);
        return reply.status(200).send({ account });
      } catch (err) {
        if (err instanceof GlobalAccountValidationError) {
          const status = err.message === 'Account not found' ? 404 : 400;
          return reply.status(status).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  app.delete(
    '/api/admin/global-accounts/:id',
    { preHandler: writeGate },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        await service.delete(request.operatorId!, id);
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof GlobalAccountDependencyError) {
          return reply.status(409).send({
            error: err.message,
            dependencies: err.dependencies,
          });
        }
        if (err instanceof GlobalAccountValidationError) {
          const status = err.message === 'Account not found' ? 404 : 400;
          return reply.status(status).send({ error: err.message });
        }
        throw err;
      }
    },
  );
}
