/**
 * RBAC gate for admin routes (013).
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  operatorHasAtLeast,
  type OperatorRole,
} from '../../../../domain/operator.js';

/**
 * Require the authenticated operator to satisfy at least one listed role
 * (higher roles satisfy lower requirements via role order).
 */
export function requireRole(...roles: OperatorRole[]) {
  return async function roleGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const actual = request.operatorRole;
    if (!actual) {
      reply.status(401).send({ error: 'Authentication required' });
      return;
    }
    const allowed = roles.some((required) => operatorHasAtLeast(actual, required));
    if (!allowed) {
      reply.status(403).send({ error: 'Insufficient role' });
    }
  };
}
