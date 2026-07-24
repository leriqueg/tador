/**
 * Admin auth HTTP routes (013).
 */

import type { FastifyInstance } from 'fastify';
import type {
  OperatorAuthApplicationService,
} from '../../../application/admin/operator-auth-service.js';
import { toOperatorPublicProfile } from '../../../application/admin/operator-auth-service.js';
import { AUTH_RATE_LIMIT } from '../../auth-rate-limit.js';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE_OPTIONS,
  createOperatorAuthMiddleware,
} from './middleware/require-operator.js';

/** Stricter than product auth for operator login (T022). */
export const ADMIN_LOGIN_RATE_LIMIT = {
  max: process.env.VITEST === 'true' ? 10_000 : 10,
  timeWindow: '1 minute' as const,
};

export function registerAdminAuthRoutes(
  app: FastifyInstance,
  operatorAuth: OperatorAuthApplicationService,
): void {
  const requireOperator = createOperatorAuthMiddleware(operatorAuth);

  app.post('/api/admin/auth/login', {
    config: { rateLimit: ADMIN_LOGIN_RATE_LIMIT },
  }, async (request, reply) => {
    const { email, password } = (request.body ?? {}) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    try {
      const result = await operatorAuth.login({
        email,
        password,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      });
      reply.setCookie(
        ADMIN_SESSION_COOKIE,
        result.sessionToken,
        ADMIN_SESSION_COOKIE_OPTIONS,
      );
      return reply.status(200).send({
        operator: toOperatorPublicProfile(result.operator),
        mustChangePassword: result.operator.mustChangePassword,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message === 'Invalid email or password') {
        return reply.status(401).send({ error: message });
      }
      if (message === 'Operator blocked') {
        return reply.status(403).send({ error: 'Operator blocked' });
      }
      request.log.error(err, 'Operator login failed');
      return reply.status(500).send({ error: 'Login failed' });
    }
  });

  app.post('/api/admin/auth/logout', { preHandler: requireOperator }, async (request, reply) => {
    const token = request.cookies?.[ADMIN_SESSION_COOKIE];
    if (token) {
      await operatorAuth.logout(token);
      reply.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
    }
    return reply.status(200).send({ message: 'Logged out successfully' });
  });

  app.get('/api/admin/auth/me', { preHandler: requireOperator }, async (request, reply) => {
    const token = request.cookies?.[ADMIN_SESSION_COOKIE] ?? '';
    const operator = await operatorAuth.me(token);
    if (!operator) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }
    return reply.status(200).send({
      operator: toOperatorPublicProfile(operator),
      mustChangePassword: operator.mustChangePassword,
    });
  });

  app.post('/api/admin/auth/change-password', {
    preHandler: requireOperator,
    config: { rateLimit: AUTH_RATE_LIMIT },
  }, async (request, reply) => {
    const { currentPassword, newPassword } = (request.body ?? {}) as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!currentPassword || !newPassword) {
      return reply
        .status(400)
        .send({ error: 'currentPassword and newPassword are required' });
    }
    const token = request.cookies?.[ADMIN_SESSION_COOKIE] ?? '';
    try {
      const result = await operatorAuth.changePassword(
        token,
        currentPassword,
        newPassword,
      );
      reply.setCookie(
        ADMIN_SESSION_COOKIE,
        result.sessionToken,
        ADMIN_SESSION_COOKIE_OPTIONS,
      );
      return reply.status(200).send({
        operator: toOperatorPublicProfile(result.operator),
        mustChangePassword: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Change password failed';
      if (message === 'Invalid current password' || message === 'Not authenticated') {
        return reply.status(401).send({ error: message });
      }
      if (message === 'Password must be at least 12 characters') {
        return reply.status(400).send({ error: message });
      }
      request.log.error(err, 'Operator change password failed');
      return reply.status(500).send({ error: 'Change password failed' });
    }
  });
}
