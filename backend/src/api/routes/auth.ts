/**
 * Auth routes: register, login, logout.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware, SESSION_COOKIE_OPTIONS } from '../middleware/auth.js';

export function registerAuthRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // POST /auth/register
  app.post('/auth/register', async (request, reply) => {
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
          verifiedAt: result.user.verifiedAt,
        },
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
  app.post('/auth/login', async (request, reply) => {
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
        verifiedAt: user.verifiedAt,
      },
    });
  });
}
