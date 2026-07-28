/**
 * Admin templates US4 integration tests (013 T059–T061, T065–T066).
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server.js';
import { createOperatorRepository } from '../../src/infrastructure/repositories/operator-repository.js';
import { createArgon2PasswordHasher } from '../../src/infrastructure/services/argon2-password-hasher.js';
import { prisma } from '../../src/infrastructure/database.js';

let codigoCounter = Date.now();
const createdGlobalIds: string[] = [];

function nextCodigo(prefix: string): string {
  return `${prefix}${codigoCounter++}`;
}

afterAll(async () => {
  if (createdGlobalIds.length > 0) {
    await prisma.cuentaGlobal.deleteMany({
      where: { id: { in: createdGlobalIds } },
    });
  }
});

async function createTestApp(
  env?: Record<string, string | undefined>,
): Promise<FastifyInstance> {
  const prev: Record<string, string | undefined> = {};
  if (env) {
    for (const [k, v] of Object.entries(env)) {
      prev[k] = process.env[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
  try {
    const app = await buildApp({ logger: false });
    await app.ready();
    return app;
  } finally {
    if (env) {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  }
}

async function resetOperators(): Promise<void> {
  await prisma.adminAuditLog.deleteMany();
  await prisma.operatorSession.deleteMany();
  await prisma.operator.deleteMany();
}

async function seedOperator(role: 'support' | 'admin' | 'superadmin' = 'support') {
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

async function registerAndVerify(
  app: FastifyInstance,
  email: string,
): Promise<{ cookies: string[]; userId: string }> {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password: 'password123' },
  });
  expect(res.statusCode).toBe(201);
  const body = res.json();
  const cookies = res.cookies.map((c) => `${c.name}=${c.value}`);
  const verifyRes = await app.inject({
    method: 'GET',
    url: `/auth/verify/${body.verificationToken}`,
  });
  expect(verifyRes.statusCode).toBe(200);
  return { cookies, userId: body.user.id as string };
}

async function findGlobalByCodigo(codigo: string) {
  return prisma.cuentaGlobal.findUnique({ where: { codigo } });
}

async function createPostableGlobal(
  codigo: string,
  nombre: string,
  parentCodigo: string,
) {
  const parent = await findGlobalByCodigo(parentCodigo);
  if (!parent) throw new Error(`Parent group ${parentCodigo} not found`);
  const global = await prisma.cuentaGlobal.create({
    data: { codigo, nombre, esPostable: true, parentId: parent.id },
  });
  createdGlobalIds.push(global.id);
  return global;
}

async function createUserAccount(
  app: FastifyInstance,
  cookies: string[],
  globalCodigo: string,
  nombre: string,
) {
  const global = await findGlobalByCodigo(globalCodigo);
  if (!global) throw new Error(`Global account ${globalCodigo} not found`);
  const res = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: { tipoCuenta: 'wallet', nombre, globalId: global.id },
  });
  expect(res.statusCode).toBe(201);
  const account = res.json().account;
  if (globalCodigo.startsWith('1111') || globalCodigo.startsWith('1112')) {
    const policy = await app.inject({
      method: 'PATCH',
      url: `/api/accounts/${account.id}/balance-policy`,
      headers: { cookie: cookies.join('; ') },
      payload: { enforceNonNegativeBalance: false },
    });
    expect(policy.statusCode).toBe(200);
  }
  return account;
}

async function setupTemplateAccounts(
  app: FastifyInstance,
  cookies: string[],
): Promise<{ servicioUserAccountId: string; bancoUserAccountId: string }> {
  const servicioUserAccount = await createUserAccount(
    app,
    cookies,
    '61120002',
    'Mi servicio electricidad',
  );
  const bancoPostable = await createPostableGlobal(
    nextCodigo('111210'),
    'Mi Cuenta Corriente',
    '11120000',
  );
  const bancoUserAccount = await createUserAccount(
    app,
    cookies,
    bancoPostable.codigo,
    'Mi banco',
  );
  return {
    servicioUserAccountId: servicioUserAccount.id,
    bancoUserAccountId: bancoUserAccount.id,
  };
}

describe('Admin templates US4', () => {
  beforeEach(async () => {
    await resetOperators();
  });

  it('T059 GET /api/admin/templates?mode=hogar returns list with modes/status', async () => {
    await seedOperator('support');
    const app = await createTestApp();
    const cookie = await loginOperator(app, 'support@localhost');

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/templates?mode=hogar',
      headers: { cookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.plantillas)).toBe(true);
    expect(body.plantillas.length).toBeGreaterThanOrEqual(1);
    expect(body.mode).toBe('hogar');
    for (const p of body.plantillas) {
      expect(p).toHaveProperty('code');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('modes');
      expect(p.modes).toContain('hogar');
      expect(p).toHaveProperty('status');
    }
    await app.close();
  });

  it('T060 preview parity with legacy for pagar_servicios hogar', async () => {
    await seedOperator('support');
    const app = await createTestApp();
    const { cookies, userId } = await registerAndVerify(
      app,
      'tpl-parity@test.com',
    );
    const accounts = await setupTemplateAccounts(app, cookies);
    const payload = {
      amount: 42.5,
      concept: 'Preview only',
      mode: 'hogar',
      lines: [
        { id: 1, accountId: accounts.servicioUserAccountId },
        { id: 2, accountId: accounts.bancoUserAccountId },
      ],
    };

    const legacy = await app.inject({
      method: 'POST',
      url: '/api/dev/plantillas-admin/pagar_servicios/preview',
      headers: { cookie: cookies.join('; ') },
      payload,
    });
    expect(legacy.statusCode).toBe(200);

    const before = await prisma.apunte.count({ where: { userId } });
    const operatorCookie = await loginOperator(app, 'support@localhost');
    const admin = await app.inject({
      method: 'POST',
      url: '/api/admin/templates/pagar_servicios/preview',
      headers: { cookie: operatorCookie },
      payload: { ...payload, userId },
    });
    expect(admin.statusCode).toBe(200);

    const legacyBody = legacy.json();
    const adminBody = admin.json();
    expect(adminBody.persisted).toBe(false);
    expect(adminBody.balanced).toBe(legacyBody.balanced);
    expect(adminBody.templateCode).toBe(legacyBody.templateCode);
    expect(adminBody.amount).toBe(legacyBody.amount);
    expect(adminBody.currency).toBe(legacyBody.currency);
    expect(adminBody.lines).toHaveLength(legacyBody.lines.length);
    expect(adminBody.lines[0].side).toBe(legacyBody.lines[0].side);
    expect(adminBody.lines[0].accountId).toBe(legacyBody.lines[0].accountId);

    const after = await prisma.apunte.count({ where: { userId } });
    expect(after).toBe(before);
    await app.close();
  });

  it('T061 unauthenticated template preview → 401', async () => {
    const app = await createTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/templates/pagar_servicios/preview',
      payload: {
        userId: 'any',
        amount: 10,
        lines: [{ id: 1, accountId: 'a' }],
      },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('T066 legacy plantillas-admin disabled in production', async () => {
    const app = await createTestApp({ NODE_ENV: 'production' });
    const { cookies } = await registerAndVerify(app, 'tpl-prod@test.com');
    const res = await app.inject({
      method: 'GET',
      url: '/api/dev/plantillas-admin?mode=hogar&format=json',
      headers: { cookie: cookies.join('; ') },
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('GET readiness and detail for template', async () => {
    await seedOperator('support');
    const app = await createTestApp();
    const { cookies, userId } = await registerAndVerify(
      app,
      'tpl-ready@test.com',
    );
    await setupTemplateAccounts(app, cookies);
    const cookie = await loginOperator(app, 'support@localhost');

    const detail = await app.inject({
      method: 'GET',
      url: `/api/admin/templates/pagar_servicios?userId=${userId}`,
      headers: { cookie },
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().plantilla.code).toBe('pagar_servicios');
    expect(detail.json().ready).toBe(true);

    const readiness = await app.inject({
      method: 'GET',
      url: `/api/admin/templates/pagar_servicios/readiness?mode=hogar&userId=${userId}`,
      headers: { cookie },
    });
    expect(readiness.statusCode).toBe(200);
    const body = readiness.json();
    expect(body.code).toBe('pagar_servicios');
    expect(body.ready).toBe(true);
    expect(Array.isArray(body.lines)).toBe(true);
    await app.close();
  });
});
