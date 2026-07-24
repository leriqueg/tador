/**
 * Admin security matrix — anon / product session / wrong role (013 T096).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server.js';
import { createOperatorRepository } from '../../src/infrastructure/repositories/operator-repository.js';
import { createArgon2PasswordHasher } from '../../src/infrastructure/services/argon2-password-hasher.js';
import { prisma } from '../../src/infrastructure/database.js';

const PROBES: Array<{ method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; url: string }> = [
  { method: 'GET', url: '/api/admin/auth/me' },
  { method: 'GET', url: '/api/admin/users' },
  { method: 'GET', url: '/api/admin/templates' },
  { method: 'GET', url: '/api/admin/global-accounts' },
  { method: 'GET', url: '/api/admin/statistics/overview?from=2026-07-01&to=2026-07-02&granularity=day' },
  { method: 'GET', url: '/api/admin/audit' },
];

async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

async function resetOperators(): Promise<void> {
  await prisma.adminAuditLog.deleteMany();
  await prisma.operatorSession.deleteMany();
  await prisma.operator.deleteMany();
}

async function seedOperator(role: 'support' | 'admin' | 'superadmin') {
  const hasher = createArgon2PasswordHasher();
  await createOperatorRepository().create({
    email: `${role}@localhost`,
    passwordHash: await hasher.hash('dev-admin-password'),
    role,
    mustChangePassword: false,
    displayName: role,
  });
}

async function loginOperator(
  app: FastifyInstance,
  email: string,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/admin/auth/login',
    payload: { email, password: 'dev-admin-password' },
  });
  expect(res.statusCode).toBe(200);
  return res.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

describe('Admin security matrix T096', () => {
  beforeEach(async () => {
    await resetOperators();
  });

  it('anonymous requests are denied (401)', async () => {
    const app = await createTestApp();
    for (const probe of PROBES) {
      const res = await app.inject({ method: probe.method, url: probe.url });
      expect(res.statusCode, probe.url).toBe(401);
    }
    await app.close();
  });

  it('product session cannot access admin routes (403)', async () => {
    const app = await createTestApp();
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: `prod-${Date.now()}@test.com`, password: 'password123' },
    });
    expect(reg.statusCode).toBe(201);
    const cookie = reg.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    for (const probe of PROBES) {
      const res = await app.inject({
        method: probe.method,
        url: probe.url,
        headers: { cookie },
      });
      expect([401, 403], probe.url).toContain(res.statusCode);
      expect(res.statusCode).not.toBe(200);
    }
    await app.close();
  });

  it('support denied on admin-only and superadmin-only routes', async () => {
    await seedOperator('support');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'support@localhost');

    const users = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { cookie },
    });
    expect(users.statusCode).toBe(200);

    const chart = await app.inject({
      method: 'POST',
      url: '/api/admin/global-accounts',
      headers: { cookie },
      payload: {
        codigo: '61129998',
        nombre: 'x',
        esPostable: true,
        parentId: null,
      },
    });
    expect(chart.statusCode).toBe(403);

    const audit = await app.inject({
      method: 'GET',
      url: '/api/admin/audit',
      headers: { cookie },
    });
    expect(audit.statusCode).toBe(403);
    await app.close();
  });
});
