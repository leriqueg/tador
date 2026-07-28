/**
 * DEPLOYMENT_PROFILE gating (T029 / CC-ADMIN-008).
 */

import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

describe('DEPLOYMENT_PROFILE routing', () => {
  const previous = process.env.DEPLOYMENT_PROFILE;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.DEPLOYMENT_PROFILE;
    } else {
      process.env.DEPLOYMENT_PROFILE = previous;
    }
  });

  it('T029 product does not register /api/admin/*', async () => {
    process.env.DEPLOYMENT_PROFILE = 'product';
    // Dynamic import after env set so buildApp sees the profile.
    const { buildApp } = await import('../../src/server.js');
    const app: FastifyInstance = await buildApp({ logger: false });
    await app.ready();

    const me = await app.inject({ method: 'GET', url: '/api/admin/auth/me' });
    expect(me.statusCode).toBe(404);

    const login = await app.inject({
      method: 'POST',
      url: '/api/admin/auth/login',
      payload: { email: 'a@b.com', password: 'x' },
    });
    expect(login.statusCode).toBe(404);

    // Product health still works
    const health = await app.inject({ method: 'GET', url: '/health' });
    expect(health.statusCode).toBe(200);

    await app.close();
  });

  /** CC-ADMIN-008 — admin profile omits product routes, keeps admin + health. */
  it('CC-ADMIN-008 admin registers /api/admin/* and omits product /auth', async () => {
    process.env.DEPLOYMENT_PROFILE = 'admin';
    const { buildApp } = await import('../../src/server.js');
    const app: FastifyInstance = await buildApp({ logger: false });
    await app.ready();

    const health = await app.inject({ method: 'GET', url: '/health' });
    expect(health.statusCode).toBe(200);

    // Admin surface present (unauthenticated → 401, not 404).
    const adminMe = await app.inject({
      method: 'GET',
      url: '/api/admin/auth/me',
    });
    expect(adminMe.statusCode).toBe(401);

    // Product auth not registered.
    const productLogin = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'a@b.com', password: 'x' },
    });
    expect(productLogin.statusCode).toBe(404);

    const apuntes = await app.inject({ method: 'GET', url: '/api/apuntes' });
    expect(apuntes.statusCode).toBe(404);

    await app.close();
  });
});
