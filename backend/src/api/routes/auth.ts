/**
 * Auth routes: register, login, logout.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware, SESSION_COOKIE_OPTIONS } from '../middleware/auth.js';
import { AUTH_RATE_LIMIT } from '../auth-rate-limit.js';

export function registerAuthRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // POST /auth/register
  app.post('/auth/register', {
    config: { rateLimit: AUTH_RATE_LIMIT },
  }, async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return reply
        .status(400)
        .send({ error: 'Password must be at least 8 characters' });
    }

    try {
      const result = await authService.register({ email, password });

      reply.setCookie('session_token', result.sessionToken, SESSION_COOKIE_OPTIONS);

      return reply.status(201).send({
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          verifiedAt: result.user.verifiedAt,
        },
        verificationToken: result.verificationToken,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message === 'Email already registered') {
        return reply.status(409).send({ error: message });
      }
      request.log.error(err, 'Registration failed');
      return reply.status(500).send({ error: 'Registration failed' });
    }
  });

  // POST /auth/login
  app.post('/auth/login', {
    config: { rateLimit: AUTH_RATE_LIMIT },
  }, async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    try {
      const result = await authService.login({ email, password });

      reply.setCookie('session_token', result.sessionToken, SESSION_COOKIE_OPTIONS);

      return reply.status(200).send({
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          verifiedAt: result.user.verifiedAt,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message === 'Invalid email or password') {
        return reply.status(401).send({ error: message });
      }
      request.log.error(err, 'Login failed');
      return reply.status(500).send({ error: 'Login failed' });
    }
  });

  // POST /auth/logout
  app.post('/auth/logout', { preHandler: requireAuth }, async (request, reply) => {
    const token = request.cookies?.session_token;

    if (token) {
      await authService.logout(token);
      reply.clearCookie('session_token', { path: '/' });
    }

    return reply.status(200).send({ message: 'Logged out successfully' });
  });

  // GET /auth/me — get current user
  app.get('/auth/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = await authService.getAuthenticatedUser(
      request.cookies?.session_token ?? '',
    );

    if (!user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    return reply.status(200).send({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        verifiedAt: user.verifiedAt,
      },
    });
  });

  // PATCH /auth/me — update profile (fullName only in MVP)
  app.patch('/auth/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = await authService.getAuthenticatedUser(
      request.cookies?.session_token ?? '',
    );
    if (!user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const body = request.body as { fullName?: string | null };
    if (body.fullName !== undefined) {
      const trimmed =
        typeof body.fullName === 'string' ? body.fullName.trim() : '';
      user.fullName = trimmed.length > 0 ? trimmed : null;
    }

    try {
      const updated = await authService.updateProfile(user);
      return reply.status(200).send({
        user: {
          id: updated.id,
          email: updated.email,
          fullName: updated.fullName,
          verifiedAt: updated.verifiedAt,
        },
      });
    } catch (err) {
      request.log.error(err, 'Failed to update profile');
      return reply.status(500).send({ error: 'Failed to update profile' });
    }
  });
}
