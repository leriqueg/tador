/**
 * Admin global accounts US3 integration tests (013 T070–T073).
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
    await prisma.activacionCuentaGlobal.deleteMany({
      where: { globalId: { in: createdIds } },
    });
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

describe('Admin global accounts US3', () => {
  beforeEach(async () => {
    await resetOperators();
  });

  it('T070 create postable child under valid parent', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'admin@localhost');
    const parent = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '61120000' },
    });
    expect(parent).toBeTruthy();
    expect(parent!.esPostable).toBe(false);

    const codigo = `61129${String(Date.now()).slice(-3)}`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/global-accounts',
      headers: { cookie },
      payload: {
        codigo,
        nombre: 'Admin test postable',
        descripcion: 'created by admin test',
        esPostable: true,
        parentId: parent!.id,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.account.codigo).toBe(codigo);
    expect(body.account.esPostable).toBe(true);
    expect(body.account.parentId).toBe(parent!.id);
    createdIds.push(body.account.id);

    const audit = await prisma.adminAuditLog.findFirst({
      where: { action: 'global_account.create', targetId: body.account.id },
    });
    expect(audit).toBeTruthy();
    await app.close();
  });

  it('T071 invalid 8-digit code → 400', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'admin@localhost');
    const parent = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '61120000' },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/global-accounts',
      headers: { cookie },
      payload: {
        codigo: '6112',
        nombre: 'Bad code',
        esPostable: true,
        parentId: parent!.id,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/codigo|code|8/i);
    await app.close();
  });

  it('T072 delete with activaciones → 409 with dependency summary', async () => {
    await seedOperator('admin');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'admin@localhost');
    const parent = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '61120000' },
    });
    const codigo = `61128${String(Date.now()).slice(-3)}`;
    const created = await prisma.cuentaGlobal.create({
      data: {
        codigo,
        nombre: 'Dep test',
        esPostable: true,
        parentId: parent!.id,
      },
    });
    createdIds.push(created.id);

    const user = await prisma.user.create({
      data: {
        email: `dep-${Date.now()}@test.com`,
        passwordHash: 'x',
      },
    });
    await prisma.activacionCuentaGlobal.create({
      data: { userId: user.id, globalId: created.id, activa: true },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/admin/global-accounts/${created.id}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.error).toBeDefined();
    expect(body.dependencies).toBeDefined();
    expect(body.dependencies.activaciones).toBeGreaterThanOrEqual(1);

    await prisma.activacionCuentaGlobal.deleteMany({
      where: { globalId: created.id },
    });
    await prisma.user.delete({ where: { id: user.id } });
    await app.close();
  });

  it('T073 support role denied on create → 403', async () => {
    await seedOperator('support');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'support@localhost');
    const parent = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '61120000' },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/global-accounts',
      headers: { cookie },
      payload: {
        codigo: '61129999',
        nombre: 'Denied',
        esPostable: true,
        parentId: parent!.id,
      },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });
});
