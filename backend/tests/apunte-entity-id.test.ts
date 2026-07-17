/**
 * Integration tests: Sprint 009 — auto entityId on POST /api/apuntes (T006).
 */

import { describe, it, expect, afterAll } from 'vitest';
import { buildApp } from '../src/server.js';
import { prisma } from '../src/infrastructure/database.js';
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

async function registerAndVerify(
  app: FastifyInstance,
  email: string,
): Promise<string[]> {
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

async function createPostableGlobal(
  codigo: string,
  nombre: string,
  parentCodigo: string,
) {
  const parent = await findGlobalByCodigo(parentCodigo);
  if (!parent) throw new Error(`Parent ${parentCodigo} not found`);
  const global = await prisma.cuentaGlobal.create({
    data: { codigo, nombre, esPostable: true, parentId: parent.id },
  });
  createdGlobalIds.push(global.id);
  return global;
}

async function createBankAccount(app: FastifyInstance, cookies: string[], nombre: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/entities',
    headers: { cookie: cookies.join('; ') },
    payload: { nombre, tipo: 'bank' },
  });
  expect(res.statusCode).toBe(201);
  return res.json().provisionedAccount as { id: string; entidadId: string };
}

describe('POST /api/apuntes — auto entityId (T006)', () => {
  it('sets entityId from bank account on expense plantilla when omitted', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 't006-auto-bank@test.com');

    const comisionGlobal = await createPostableGlobal(
      nextCodigo('620101'),
      'Comisiones test',
      '62010001',
    );
    const bank = await createBankAccount(app, cookies, 'Banco Pichincha');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'comision_bancaria',
        date: '2026-07-10',
        concept: 'Comision mensual',
        amount: 5.5,
        lines: [
          { id: 1, accountId: comisionGlobal.id },
          { id: 2, accountId: bank.id },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.apunte.entityId).toBe(bank.entidadId);

    const row = await prisma.apunte.findUnique({ where: { id: body.apunte.id } });
    expect(row?.entityId).toBe(bank.entidadId);

    await app.close();
  });

  it('does not auto-set entityId on transferencia', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 't006-transfer@test.com');

    const bankA = await createBankAccount(app, cookies, 'Banco A');
    const bankB = await createBankAccount(app, cookies, 'Banco B');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'transferencia',
        date: '2026-07-10',
        concept: 'Traspaso',
        amount: 100,
        lines: [
          { id: 1, accountId: bankA.id },
          { id: 2, accountId: bankB.id },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().apunte.entityId).toBeNull();

    await app.close();
  });

  it('returns 400 when two bank entities without explicit entityId', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 't006-ambiguous@test.com');

    const bankA = await createBankAccount(app, cookies, 'Banco X');
    const bankB = await createBankAccount(app, cookies, 'Banco Y');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        date: '2026-07-11',
        concept: 'PRO two banks',
        lines: [
          { id: 1, accountId: bankA.id, side: 'debit', amount: 50 },
          { id: 2, accountId: bankB.id, side: 'credit', amount: 50 },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('Ambiguous entityId');

    await app.close();
  });
});
