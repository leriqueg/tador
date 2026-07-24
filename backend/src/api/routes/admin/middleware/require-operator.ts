/**
 * Operator session middleware — reads admin_session cookie (013).
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Operator, OperatorRole } from '../../../../domain/operator.js';
import type { OperatorAuthApplicationService } from '../../../../application/admin/operator-auth-service.js';

export const ADMIN_SESSION_COOKIE = 'admin_session';

declare module 'fastify' {
  interface FastifyRequest {
    operatorId?: string;
    operatorRole?: OperatorRole;
    operator?: Operator;
  }
}

export function createOperatorAuthMiddleware(
  operatorAuth: OperatorAuthApplicationService,
) {
  return async function requireOperator(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const token = request.cookies?.[ADMIN_SESSION_COOKIE];

    if (!token) {
      // Product session must not unlock admin — respond 403 if product cookie present.
      if (request.cookies?.session_token) {
        reply.status(403).send({ error: 'Admin authentication required' });
        return;
      }
      reply.status(401).send({ error: 'Authentication required' });
      return;
    }

    const operator = await operatorAuth.me(token);
    if (!operator) {
      reply.status(401).send({ error: 'Invalid or expired session' });
      return;
    }

    request.operatorId = operator.id;
    request.operatorRole = operator.role;
    request.operator = operator;
  };
}

export function resolveAdminSessionCookieSecure(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.COOKIE_SECURE === 'true') return true;
  if (env.COOKIE_SECURE === 'false') return false;
  return env.NODE_ENV === 'production';
}

export const ADMIN_SESSION_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  get secure() {
    return resolveAdminSessionCookieSecure();
  },
  maxAge: 8 * 60 * 60, // 8 hours
};
