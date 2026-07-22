/**
 * Admin statistics US5 integration tests (013 T082, T084).
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

async function resetOperators(): Promise<void> {
  await prisma.adminAuditLog.deleteMany();
  await prisma.operatorSession.deleteMany();
  await prisma.operator.deleteMany();
}

async function seedOperator() {
  const hasher = createArgon2PasswordHasher();
  await createOperatorRepository().create({
    email: 'support@localhost',
    passwordHash: await hasher.hash('dev-admin-password'),
    role: 'support',
    mustChangePassword: false,
    displayName: 'support',
  });
}

async function loginOperator(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/admin/auth/login',
    payload: { email: 'support@localhost', password: 'dev-admin-password' },
  });
  expect(res.statusCode).toBe(200);
  return res.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

describe('Admin statistics US5', () => {
  beforeEach(async () => {
    await resetOperators();
  });

  it('T082 GET overview returns daily buckets', async () => {
    await seedOperator();
    const app = await createTestApp();
    const cookie = await loginOperator(app);

    const u1 = await prisma.user.create({
      data: {
        email: `stat-u1-${Date.now()}@test.com`,
        passwordHash: 'x',
        createdAt: new Date('2026-07-02T10:00:00.000Z'),
      },
    });
    const u2 = await prisma.user.create({
      data: {
        email: `stat-u2-${Date.now()}@test.com`,
        passwordHash: 'x',
        createdAt: new Date('2026-07-03T10:00:00.000Z'),
      },
    });
    await prisma.session.create({
      data: {
        userId: u1.id,
        token: `tok-${Date.now()}-a`,
        expiresAt: new Date('2027-01-01'),
        createdAt: new Date('2026-07-02T12:00:00.000Z'),
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/statistics/overview?from=2026-07-01&to=2026-07-07&granularity=day',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.granularity).toBe('day');
    expect(body.series).toHaveLength(7);
    expect(body.series[0]).toHaveProperty('key');
    expect(body.series[0]).toHaveProperty('registrations');
    expect(body.series[0]).toHaveProperty('logins');
    expect(body.series[0]).toHaveProperty('apuntesCreated');
    const day2 = body.series.find(
      (b: { key: string }) => b.key === '2026-07-02',
    );
    expect(day2.registrations).toBeGreaterThanOrEqual(1);
    expect(day2.logins).toBeGreaterThanOrEqual(1);

    await prisma.session.deleteMany({ where: { userId: u1.id } });
    await prisma.user.deleteMany({ where: { id: { in: [u1.id, u2.id] } } });
    await app.close();
  });

  it('T084 empty range returns zero-filled series not 500', async () => {
    await seedOperator();
    const app = await createTestApp();
    const cookie = await loginOperator(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/statistics/overview?from=2099-01-01&to=2099-01-03&granularity=day',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.series).toHaveLength(3);
    for (const b of body.series) {
      expect(b.registrations).toBe(0);
      expect(b.logins).toBe(0);
      expect(b.apuntesCreated).toBe(0);
    }
    await app.close();
  });

  /** US5.2 — week/month granularity accepted by HTTP overview (verify PARTIAL fix). */
  it('US5.2 overview accepts granularity=week and month', async () => {
    await seedOperator();
    const app = await createTestApp();
    const cookie = await loginOperator(app);

    const week = await app.inject({
      method: 'GET',
      url: '/api/admin/statistics/overview?from=2026-07-01&to=2026-07-21&granularity=week',
      headers: { cookie },
    });
    expect(week.statusCode).toBe(200);
    const weekBody = week.json();
    expect(weekBody.granularity).toBe('week');
    expect(weekBody.series.length).toBeGreaterThanOrEqual(1);
    expect(weekBody.series[0].key).toMatch(/^\d{4}-W\d{2}$/);

    const month = await app.inject({
      method: 'GET',
      url: '/api/admin/statistics/overview?from=2026-06-01&to=2026-08-31&granularity=month',
      headers: { cookie },
    });
    expect(month.statusCode).toBe(200);
    const monthBody = month.json();
    expect(monthBody.granularity).toBe('month');
    expect(monthBody.series.length).toBeGreaterThanOrEqual(1);
    expect(monthBody.series[0].key).toMatch(/^\d{4}-\d{2}$/);

    await app.close();
  });
});
