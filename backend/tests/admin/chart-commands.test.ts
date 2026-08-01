/**
 * Admin chart commands US1–US2 integration tests (014).
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server.js';
import { createOperatorRepository } from '../../src/infrastructure/repositories/operator-repository.js';
import { createArgon2PasswordHasher } from '../../src/infrastructure/services/argon2-password-hasher.js';
import { prisma } from '../../src/infrastructure/database.js';

const createdIds: string[] = [];

afterAll(async () => {
  if (createdIds.length > 0) {
    await prisma.cuentaGlobal.deleteMany({ where: { id: { in: createdIds } } });
  }
});

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

describe('Admin chart commands 014', () => {
  beforeEach(async () => {
    await resetOperators();
  });

  it('CC-CHART-001 reparent dry-run does not change DB', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'admin@localhost');

    const parentA = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '41010000' },
    });
    const parentB = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '41020000' },
    });
    expect(parentA && parentB).toBeTruthy();

    const leaf = await prisma.cuentaGlobal.create({
      data: {
        codigo: '41010901',
        nombre: 'Temp leaf dry',
        esPostable: true,
        parentId: parentA!.id,
      },
    });
    createdIds.push(leaf.id);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/chart/commands/reparent',
      headers: { cookie },
      payload: {
        accountId: leaf.id,
        newParentId: parentB!.id,
        dryRun: true,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().dryRun).toBe(true);
    expect(res.json().accountChanges.length).toBeGreaterThan(0);

    const after = await prisma.cuentaGlobal.findUnique({ where: { id: leaf.id } });
    expect(after?.codigo).toBe('41010901');
    expect(after?.parentId).toBe(parentA!.id);
    await app.close();
  });

  it('CC-CHART-002 reparent apply keeps id and changes codigo', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'admin@localhost');

    const parentA = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '41010000' },
    });
    const parentB = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '41020000' },
    });

    const leaf = await prisma.cuentaGlobal.create({
      data: {
        codigo: '41010902',
        nombre: 'Temp leaf apply',
        esPostable: true,
        parentId: parentA!.id,
      },
    });
    createdIds.push(leaf.id);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/chart/commands/reparent',
      headers: { cookie },
      payload: {
        accountId: leaf.id,
        newParentId: parentB!.id,
        dryRun: false,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().dryRun).toBe(false);

    const after = await prisma.cuentaGlobal.findUnique({ where: { id: leaf.id } });
    expect(after?.id).toBe(leaf.id);
    expect(after?.parentId).toBe(parentB!.id);
    expect(after?.codigo.startsWith('41020')).toBe(true);

    const audit = await prisma.adminAuditLog.findFirst({
      where: { action: 'chart.reparent', targetId: leaf.id },
    });
    expect(audit).not.toBeNull();
    await app.close();
  });

  it('CC-CHART-003 cross-class reparent → 400', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'admin@localhost');

    const income = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '41010001' },
    });
    const expenseGroup = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '61120000' },
    });
    expect(income && expenseGroup).toBeTruthy();

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/chart/commands/reparent',
      headers: { cookie },
      payload: {
        accountId: income!.id,
        newParentId: expenseGroup!.id,
        dryRun: true,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/cross-class/i);
    await app.close();
  });

  it('CC-CHART-004 cycle → 400', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'admin@localhost');

    const root = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '41000000' },
    });
    const child = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '41010000' },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/chart/commands/reparent',
      headers: { cookie },
      payload: {
        accountId: root!.id,
        newParentId: child!.id,
        dryRun: true,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/cycle/i);
    await app.close();
  });

  it('CC-CHART-005 support role → 403', async () => {
    await seedOperator('support');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'support@localhost');
    const parentB = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '41020000' },
    });
    const leaf = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '41010001' },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/chart/commands/reparent',
      headers: { cookie },
      payload: {
        accountId: leaf!.id,
        newParentId: parentB!.id,
        dryRun: true,
      },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('CC-CHART-006 deprecate sets deprecatedAt', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'admin@localhost');

    const parent = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '41010000' },
    });
    const leaf = await prisma.cuentaGlobal.create({
      data: {
        codigo: '41010903',
        nombre: 'Temp deprecate',
        esPostable: true,
        parentId: parent!.id,
      },
    });
    createdIds.push(leaf.id);

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/chart/commands/deprecate',
      headers: { cookie },
      payload: { accountId: leaf.id, dryRun: false },
    });
    expect(res.statusCode).toBe(200);
    const after = await prisma.cuentaGlobal.findUnique({ where: { id: leaf.id } });
    expect(after?.deprecatedAt).not.toBeNull();
    await app.close();
  });
});
