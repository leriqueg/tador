/**
 * Integration (DB): EntryBuilder decision-graph salary leaf (specs/012 T012).
 * Mirrors PRO EntryBuilder payload: registrar_sueldo + employer capability gate.
 */

import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../src/server.js';
import { prisma } from '../src/infrastructure/database.js';
import { getPlantilla, resetPlantillaCache } from '../src/plantillas/index.js';
import type { FastifyInstance } from 'fastify';

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

async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

async function registerAndVerify(app: FastifyInstance, email: string): Promise<string[]> {
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
  return cookies;
}

async function findGlobalByCodigo(codigo: string) {
  return prisma.cuentaGlobal.findUnique({ where: { codigo } });
}

async function createPostableGlobal(codigo: string, nombre: string, parentCodigo: string) {
  const parent = await findGlobalByCodigo(parentCodigo);
  if (!parent) throw new Error(`Parent group ${parentCodigo} not found in seed`);
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

async function setupSalaryAccounts(app: FastifyInstance, cookies: string[]) {
  const bancoPostable = await createPostableGlobal(
    nextCodigo('111210'),
    'Banco EntryBuilder',
    '11120000',
  );
  const banco = await createUserAccount(app, cookies, bancoPostable.codigo, 'Mi banco PRO');
  const ingreso = await createUserAccount(app, cookies, '41010001', 'Mi sueldo PRO');
  return { bancoId: banco.id as string, ingresoId: ingreso.id as string };
}

describe('012 — EntryBuilder salary leaf (DB)', () => {
  beforeEach(() => {
    resetPlantillaCache();
  });

  it('registrar_sueldo is available in hogar and pro modes (T011)', () => {
    const tpl = getPlantilla('registrar_sueldo');
    expect(tpl).toBeDefined();
    expect(tpl!.modes).toEqual(expect.arrayContaining(['hogar', 'pro']));
  });

  it('accepts PRO-style salary apunte when employer has is_employment_dependency', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, '012-sueldo-ok@test.com');
    const accounts = await setupSalaryAccounts(app, cookies);

    const cfg = await app.inject({
      method: 'PATCH',
      url: '/book/config',
      headers: { cookie: cookies.join('; ') },
      payload: { mode: 'pro', completeOnboarding: true },
    });
    expect(cfg.statusCode).toBe(200);

    const orgRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: {
        nombre: 'Empleador PRO SA',
        tipo: 'organization',
        capabilities: ['is_employment_dependency'],
      },
    });
    expect(orgRes.statusCode).toBe(201);
    const { entity: org } = orgRes.json();

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'registrar_sueldo',
        date: '2026-07-15',
        concept: 'Sueldo julio PRO',
        amount: 2200,
        entityId: org.id,
        lines: [
          { id: 1, accountId: accounts.bancoId },
          { id: 2, accountId: accounts.ingresoId },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().apunte.templateCode).toBe('registrar_sueldo');
    expect(res.json().apunte.entityId).toBe(org.id);

    await app.close();
  });

  it('rejects salary apunte when org lacks is_employment_dependency', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, '012-sueldo-no-cap@test.com');
    const accounts = await setupSalaryAccounts(app, cookies);

    const orgRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: {
        nombre: 'Cliente SA',
        tipo: 'organization',
        capabilities: ['can_be_customer'],
      },
    });
    expect(orgRes.statusCode).toBe(201);
    const { entity: org } = orgRes.json();

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'registrar_sueldo',
        date: '2026-07-15',
        concept: 'Sueldo sin empleador',
        amount: 1000,
        entityId: org.id,
        lines: [
          { id: 1, accountId: accounts.bancoId },
          { id: 2, accountId: accounts.ingresoId },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('is_employment_dependency');

    await app.close();
  });
});
