/**
 * Admin users US2 integration tests (013 T045–T049).
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

async function reset(): Promise<void> {
  await prisma.adminAuditLog.deleteMany();
  await prisma.operatorSession.deleteMany();
  await prisma.operator.deleteMany();
}

async function seedOperator(role: 'support' | 'admin' | 'superadmin' = 'admin') {
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

describe('Admin users US2', () => {
  beforeEach(async () => {
    await reset();
  });

  it('T045 GET /api/admin/users search by email', async () => {
    await seedOperator('support');
    const app = await createTestApp();
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'findme@test.com', password: 'password123' },
    });
    expect(reg.statusCode).toBe(201);
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'other@test.com', password: 'password123' },
    });

    const cookie = await loginOperator(app, 'support@localhost');
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/users?q=findme',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.users.length).toBe(1);
    expect(body.users[0].email).toBe('findme@test.com');
    await app.close();
  });

  it('T046 block revokes sessions + sets blockedAt', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'blockme@test.com', password: 'password123' },
    });
    expect(reg.statusCode).toBe(201);
    const userId = reg.json().user.id;
    const productCookie = reg.cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const meBefore = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { cookie: productCookie },
    });
    expect(meBefore.statusCode).toBe(200);

    const cookie = await loginOperator(app, 'admin@localhost');
    const block = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${userId}/block`,
      headers: { cookie },
      payload: { reason: 'abuse' },
    });
    expect(block.statusCode).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.blockedAt).not.toBeNull();
    expect(user?.blockedReason).toBe('abuse');

    const sessions = await prisma.session.count({ where: { userId } });
    expect(sessions).toBe(0);

    const meAfter = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { cookie: productCookie },
    });
    expect(meAfter.statusCode).toBe(401);
    await app.close();
  });

  it('T047 blocked user product login fails generically', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'blocked-login@test.com', password: 'password123' },
    });
    const userId = reg.json().user.id;
    const cookie = await loginOperator(app, 'admin@localhost');
    await app.inject({
      method: 'POST',
      url: `/api/admin/users/${userId}/block`,
      headers: { cookie },
      payload: { reason: 'spam' },
    });

    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'blocked-login@test.com', password: 'password123' },
    });
    expect(login.statusCode).toBe(401);
    expect(login.json().error).toBe('Invalid email or password');
    await app.close();
  });

  it('T048 support role denied on block → 403', async () => {
    await seedOperator('support');
    const app = await createTestApp();
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'support-block@test.com', password: 'password123' },
    });
    const userId = reg.json().user.id;
    const cookie = await loginOperator(app, 'support@localhost');
    const block = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${userId}/block`,
      headers: { cookie },
      payload: { reason: 'nope' },
    });
    expect(block.statusCode).toBe(403);
    await app.close();
  });

  it('T049 force recovery creates AuthToken + revokes sessions + audit', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'recover@test.com', password: 'password123' },
    });
    const userId = reg.json().user.id;
    expect(await prisma.session.count({ where: { userId } })).toBe(1);

    const cookie = await loginOperator(app, 'admin@localhost');
    const res = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${userId}/force-password-recovery`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().password).toBeUndefined();
    expect(res.json().token).toBeUndefined();

    expect(await prisma.session.count({ where: { userId } })).toBe(0);
    const tokens = await prisma.authToken.count({
      where: { userId, purpose: 'PASSWORD_RECOVERY', consumedAt: null },
    });
    expect(tokens).toBeGreaterThanOrEqual(1);

    const audit = await prisma.adminAuditLog.findFirst({
      where: { action: 'user.force_password_recovery', targetId: userId },
    });
    expect(audit).not.toBeNull();
    await app.close();
  });

  /** US2.2 — unblock clears lockout, restores product login, audits (verify gap fix). */
  it('US2.2 unblock clears blockedAt and allows product login again', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const email = 'unblock-me@test.com';
    const password = 'password123';
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password },
    });
    expect(reg.statusCode).toBe(201);
    const userId = reg.json().user.id;

    const cookie = await loginOperator(app, 'admin@localhost');
    const block = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${userId}/block`,
      headers: { cookie },
      payload: { reason: 'temporary hold' },
    });
    expect(block.statusCode).toBe(200);

    const blockedLogin = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(blockedLogin.statusCode).toBe(401);

    const unblock = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${userId}/unblock`,
      headers: { cookie },
    });
    expect(unblock.statusCode).toBe(200);
    expect(unblock.json().user.blockedAt).toBeNull();
    expect(unblock.json().user.blockedReason).toBeNull();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.blockedAt).toBeNull();
    expect(user?.blockedReason).toBeNull();

    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().user.id).toBe(userId);

    const audit = await prisma.adminAuditLog.findFirst({
      where: { action: 'user.unblock', targetId: userId },
    });
    expect(audit).not.toBeNull();
    expect(audit?.targetType).toBe('User');
    await app.close();
  });

  /** Triangulation: support cannot unblock (mutate requires admin). */
  it('US2.2 support role denied on unblock → 403', async () => {
    await seedOperator('admin');
    await seedOperator('support');
    const app = await createTestApp();
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'support-unblock@test.com', password: 'password123' },
    });
    const userId = reg.json().user.id;
    const adminCookie = await loginOperator(app, 'admin@localhost');
    await app.inject({
      method: 'POST',
      url: `/api/admin/users/${userId}/block`,
      headers: { cookie: adminCookie },
      payload: { reason: 'hold' },
    });

    const supportCookie = await loginOperator(app, 'support@localhost');
    const unblock = await app.inject({
      method: 'POST',
      url: `/api/admin/users/${userId}/unblock`,
      headers: { cookie: supportCookie },
    });
    expect(unblock.statusCode).toBe(403);

    const stillBlocked = await prisma.user.findUnique({ where: { id: userId } });
    expect(stillBlocked?.blockedAt).not.toBeNull();
    await app.close();
  });
});
