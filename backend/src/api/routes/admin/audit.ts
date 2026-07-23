/**
 * Admin audit log HTTP routes (013 T093).
 */

import type { FastifyInstance } from 'fastify';
import type { OperatorAuthApplicationService } from '../../../application/admin/operator-auth-service.js';
import type { AdminAuditLogRepository } from '../../../application/ports/admin-audit-repository.js';
import { createOperatorAuthMiddleware } from './middleware/require-operator.js';
import { requireRole } from './middleware/require-role.js';
import { requirePasswordChanged } from './middleware/require-password-changed.js';

export function registerAdminAuditRoutes(
  app: FastifyInstance,
  operatorAuth: OperatorAuthApplicationService,
  auditRepo: AdminAuditLogRepository,
): void {
  const requireOperator = createOperatorAuthMiddleware(operatorAuth);

  app.get(
    '/api/admin/audit',
    {
      preHandler: [
        requireOperator,
        requirePasswordChanged,
        requireRole('superadmin'),
      ],
    },
    async (request, reply) => {
      const query = request.query as { page?: string; pageSize?: string };
      const result = await auditRepo.list({
        page: query.page ? Number(query.page) : undefined,
        pageSize: query.pageSize ? Number(query.pageSize) : undefined,
      });
      return reply.status(200).send(result);
    },
  );
}
