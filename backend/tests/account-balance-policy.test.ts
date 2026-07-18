import { afterAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server.js';
import { prisma } from '../src/infrastructure/database.js';

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
  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password: 'password123' },
  });
  expect(response.statusCode).toBe(201);
  const body = response.json();
  await app.inject({
    method: 'GET',
    url: `/auth/verify/${body.verificationToken}`,
  });
  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`);
}

async function createPostableGlobal(
  codigo: string,
  nombre: string,
  parentCodigo: string,
) {
  const parent = await prisma.cuentaGlobal.findUnique({
    where: { codigo: parentCodigo },
  });
  if (!parent) throw new Error(`Parent ${parentCodigo} not found`);
  const account = await prisma.cuentaGlobal.create({
    data: { codigo, nombre, esPostable: true, parentId: parent.id },
  });
  createdGlobalIds.push(account.id);
  return account;
}

async function createBank(
  app: FastifyInstance,
  cookies: string[],
  name: string,
) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/entities',
    headers: { cookie: cookies.join('; ') },
    payload: { nombre: name, tipo: 'bank' },
  });
  expect(response.statusCode).toBe(201);
  return response.json().provisionedAccount as { id: string };
}

async function fundBank(
  app: FastifyInstance,
  cookies: string[],
  bankId: string,
  amount: number,
) {
  const income = await prisma.cuentaGlobal.findUnique({
    where: { codigo: '41010001' },
  });
  if (!income) throw new Error('Seed account 41010001 missing');
  const response = await app.inject({
    method: 'POST',
    url: '/api/apuntes',
    headers: { cookie: cookies.join('; ') },
    payload: {
      templateCode: 'registrar_sueldo',
      date: '2026-07-18',
      concept: 'Saldo inicial banco',
      amount,
      lines: [
        { id: 1, accountId: bankId },
        { id: 2, accountId: income.id },
      ],
    },
  });
  expect(response.statusCode).toBe(201);
}

describe('V12 — non-negative natural balances', () => {
  it('rejects an overdraft and permits it after the account policy is disabled', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'v12-toggle@test.com');
    const bank = await createBank(app, cookies, 'Banco V12 toggle');
    const expense = await createPostableGlobal(
      nextCodigo('620101'),
      'Comisión V12 toggle',
      '62010001',
    );

    const payload = {
      templateCode: 'comision_bancaria',
      date: '2026-07-18',
      concept: 'Sobregiro bloqueado',
      amount: 10,
      lines: [
        { id: 1, accountId: expense.id },
        { id: 2, accountId: bank.id },
      ],
    };
    const rejected = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload,
    });
    expect(rejected.statusCode).toBe(400);
    expect(rejected.json()).toMatchObject({ code: 'V12' });

    const policy = await app.inject({
      method: 'PATCH',
      url: `/api/accounts/${bank.id}/balance-policy`,
      headers: { cookie: cookies.join('; ') },
      payload: { enforceNonNegativeBalance: false },
    });
    expect(policy.statusCode).toBe(200);

    const accepted = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: { ...payload, concept: 'Sobregiro consciente' },
    });
    expect(accepted.statusCode).toBe(201);
    await app.close();
  });

  it('serializes concurrent withdrawals so only one can spend the balance', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'v12-concurrent@test.com');
    const bank = await createBank(app, cookies, 'Banco V12 concurrente');
    const expense = await createPostableGlobal(
      nextCodigo('620101'),
      'Comisión V12 concurrente',
      '62010001',
    );
    await fundBank(app, cookies, bank.id, 100);

    const withdraw = (suffix: string) =>
      app.inject({
        method: 'POST',
        url: '/api/apuntes',
        headers: { cookie: cookies.join('; ') },
        payload: {
          templateCode: 'comision_bancaria',
          date: '2026-07-18',
          concept: `Retiro concurrente ${suffix}`,
          amount: 80,
          idempotencyKey: `v12-concurrent-${suffix}`,
          lines: [
            { id: 1, accountId: expense.id },
            { id: 2, accountId: bank.id },
          ],
        },
      });

    const responses = await Promise.all([withdraw('a'), withdraw('b')]);
    expect(responses.map((response) => response.statusCode).sort()).toEqual([
      201, 400,
    ]);
    expect(
      responses.find((response) => response.statusCode === 400)?.json(),
    ).toMatchObject({ code: 'V12' });

    const balance = await app.inject({
      method: 'GET',
      url: `/api/balances/${bank.id}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(balance.json().saldo).toBe(20);
    await app.close();
  });

  it('replays a concurrent duplicate before revalidating its protected balance', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'v12-idem-race@test.com');
    const bank = await createBank(app, cookies, 'Banco V12 idem');
    const expense = await createPostableGlobal(
      nextCodigo('620101'),
      'Comisión V12 idem',
      '62010001',
    );
    await fundBank(app, cookies, bank.id, 100);

    const request = () =>
      app.inject({
        method: 'POST',
        url: '/api/apuntes',
        headers: { cookie: cookies.join('; ') },
        payload: {
          templateCode: 'comision_bancaria',
          date: '2026-07-18',
          concept: 'Retiro idempotente concurrente',
          amount: 80,
          idempotencyKey: 'v12-protected-idem-race',
          lines: [
            { id: 1, accountId: expense.id },
            { id: 2, accountId: bank.id },
          ],
        },
      });

    const responses = await Promise.all([request(), request()]);
    expect(responses.map((response) => response.statusCode).sort()).toEqual([
      200, 201,
    ]);
    expect(responses[0].json().apunte.id).toBe(responses[1].json().apunte.id);

    const balance = await app.inject({
      method: 'GET',
      url: `/api/balances/${bank.id}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(balance.json().saldo).toBe(20);
    await app.close();
  });

  it('rejects collecting more than a person owes', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'v12-receivable@test.com');
    const bank = await createBank(app, cookies, 'Banco V12 CxC');
    await fundBank(app, cookies, bank.id, 200);

    const personResponse = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Papá V12', tipo: 'person' },
    });
    expect(personResponse.statusCode).toBe(201);
    const personAccount = personResponse.json().provisionedAccount as {
      id: string;
    };

    const loan = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'prestamo_otorgado',
        date: '2026-07-18',
        concept: 'Préstamo a Papá',
        amount: 100,
        lines: [
          { id: 1, accountId: personAccount.id },
          { id: 2, accountId: bank.id },
        ],
      },
    });
    expect(loan.statusCode).toBe(201);

    const overpayment = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'cobro_prestamo',
        date: '2026-07-18',
        concept: 'Papá paga de más',
        amount: 120,
        lines: [
          { id: 1, accountId: bank.id },
          { id: 2, accountId: personAccount.id },
        ],
      },
    });
    expect(overpayment.statusCode).toBe(400);
    expect(overpayment.json()).toMatchObject({ code: 'V12' });
    await app.close();
  });

  it('applies the default protection and per-user toggle to direct global accounts', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'v12-global@test.com');
    const wallet = await prisma.cuentaGlobal.findUnique({
      where: { codigo: '11110001' },
    });
    const expense = await createPostableGlobal(
      nextCodigo('620101'),
      'Comisión V12 global',
      '62010001',
    );
    if (!wallet) throw new Error('Seed wallet account missing');

    const overdraw = () =>
      app.inject({
        method: 'POST',
        url: '/api/entries',
        headers: { cookie: cookies.join('; ') },
        payload: {
          fecha: '2026-07-18',
          concepto: 'Global wallet overdraft',
          lineas: [
            { cuentaGlobalId: expense.id, debito: 5 },
            { cuentaGlobalId: wallet.id, credito: 5 },
          ],
        },
      });

    const rejected = await overdraw();
    expect(rejected.statusCode).toBe(400);
    expect(rejected.json()).toMatchObject({ code: 'V12' });

    const policy = await app.inject({
      method: 'PATCH',
      url: `/api/chart/${wallet.id}/balance-policy`,
      headers: { cookie: cookies.join('; ') },
      payload: { enforceNonNegativeBalance: false },
    });
    expect(policy.statusCode).toBe(200);

    const accepted = await overdraw();
    expect(accepted.statusCode).toBe(201);
    await app.close();
  });
});
