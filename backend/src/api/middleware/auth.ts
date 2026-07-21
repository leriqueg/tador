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
 *
 * `Secure` must match how the browser reaches the app:
 * - HTTPS production → COOKIE_SECURE=true (or omit; defaults true when NODE_ENV=production)
 * - HTTP demos (e.g. http://tador.nesis.tel) → COOKIE_SECURE=false or browsers drop the cookie
 *   and login/register appear to fail (200 response, no session on the next request).
 */
export function resolveSessionCookieSecure(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.COOKIE_SECURE === 'true') return true;
  if (env.COOKIE_SECURE === 'false') return false;
  return env.NODE_ENV === 'production';
}

export const SESSION_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  get secure() {
    return resolveSessionCookieSecure();
  },
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};
