/**
 * Admin auth foundation + US1 integration tests (013).
 * T027–T028 foundational; T031–T034 US1.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server.js';
import { createOperatorRepository } from '../../src/infrastructure/repositories/operator-repository.js';
import { createArgon2PasswordHasher } from '../../src/infrastructure/services/argon2-password-hasher.js';
import { prisma } from '../../src/infrastructure/database.js';

async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

async function resetAdminTables(): Promise<void> {
  await prisma.adminAuditLog.deleteMany();
  await prisma.operatorSession.deleteMany();
  await prisma.operator.deleteMany();
}

async function seedOperator(opts?: {
  email?: string;
  password?: string;
  role?: 'support' | 'admin' | 'superadmin';
  mustChangePassword?: boolean;
  blockedAt?: Date | null;
}): Promise<void> {
  const hasher = createArgon2PasswordHasher();
  const repo = createOperatorRepository();
  await repo.create({
    email: opts?.email ?? 'admin@localhost',
    passwordHash: await hasher.hash(opts?.password ?? 'dev-admin'),
    role: opts?.role ?? 'superadmin',
    mustChangePassword: opts?.mustChangePassword ?? false,
    displayName: 'Test Op',
  });
  if (opts?.blockedAt) {
    const op = await repo.findByEmail(opts.email ?? 'admin@localhost');
    if (op) {
      op.blockedAt = opts.blockedAt;
      await repo.update(op);
    }
  }
}

describe('Admin auth foundation (T027–T028)', () => {
  beforeEach(async () => {
    await resetAdminTables();
  });

  it('T027 anonymous GET /api/admin/auth/me → 401', async () => {
    const app = await createTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/admin/auth/me' });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('T028 product user session cannot access /api/admin/auth/me → 403', async () => {
    const app = await createTestApp();
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: `product-${Date.now()}@test.com`, password: 'password123' },
    });
    expect(reg.statusCode).toBe(201);
    const cookie = reg.cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/auth/me',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });
});

describe('Admin auth US1 (T031–T034)', () => {
  beforeEach(async () => {
    await resetAdminTables();
  });

  it('T031 operator login sets admin_session cookie', async () => {
    await seedOperator();
    const app = await createTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/auth/login',
      payload: { email: 'admin@localhost', password: 'dev-admin' },
    });
    expect(res.statusCode).toBe(200);
    const adminCookie = res.cookies.find((c) => c.name === 'admin_session');
    expect(adminCookie?.value).toBeTruthy();
    expect(adminCookie?.httpOnly).toBe(true);
    expect(res.json().operator.email).toBe('admin@localhost');
    expect(res.json().operator.passwordHash).toBeUndefined();
    await app.close();
  });

  it('T032 operator logout clears session', async () => {
    await seedOperator();
    const app = await createTestApp();
    const login = await app.inject({
      method: 'POST',
      url: '/api/admin/auth/login',
      payload: { email: 'admin@localhost', password: 'dev-admin' },
    });
    const cookie = login.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const logout = await app.inject({
      method: 'POST',
      url: '/api/admin/auth/logout',
      headers: { cookie },
    });
    expect(logout.statusCode).toBe(200);
    const me = await app.inject({
      method: 'GET',
      url: '/api/admin/auth/me',
      headers: { cookie },
    });
    expect(me.statusCode).toBe(401);
    await app.close();
  });

  it('T033 blocked operator login → 403', async () => {
    await seedOperator({ blockedAt: new Date() });
    const app = await createTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/auth/login',
      payload: { email: 'admin@localhost', password: 'dev-admin' },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('T034 mustChangePassword blocks /api/admin/users until password changed', async () => {
    await seedOperator({ mustChangePassword: true });
    const app = await createTestApp();
    const login = await app.inject({
      method: 'POST',
      url: '/api/admin/auth/login',
      payload: { email: 'admin@localhost', password: 'dev-admin' },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().mustChangePassword).toBe(true);
    const cookie = login.cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const users = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { cookie },
    });
    expect(users.statusCode).toBe(403);

    const change = await app.inject({
      method: 'POST',
      url: '/api/admin/auth/change-password',
      headers: { cookie },
      payload: {
        currentPassword: 'dev-admin',
        newPassword: 'new-password-12',
      },
    });
    expect(change.statusCode).toBe(200);
    const newCookie = change.cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const usersAfter = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { cookie: newCookie },
    });
    expect(usersAfter.statusCode).toBe(200);
    await app.close();
  });
});
