/**
 * Authentication middleware.
 * Extracts session token from cookies and resolves the authenticated user.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userEmail?: string;
  }
}

export function createAuthMiddleware(
  authService: AuthApplicationService,
) {
  return async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const token = request.cookies?.session_token;

    if (!token) {
      reply.status(401).send({ error: 'Authentication required' });
      return;
    }

    const user = await authService.getAuthenticatedUser(token);

    if (!user) {
      reply.status(401).send({ error: 'Invalid or expired session' });
      return;
    }

    request.userId = user.id;
    request.userEmail = user.email;
  };
}

/**
 * Cookie configuration for session token.
 */
export const SESSION_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};
