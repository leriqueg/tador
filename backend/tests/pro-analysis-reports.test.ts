/**
 * Integration tests: Sprint 009 — P&G filters and portfolio report (T008, T009).
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

describe('GET /api/reports/pyg filters (T008)', () => {
  it('filters totals by accountId', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 't008-pyg-account@test.com');

    const globalIncome = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('4198'), nombre: 'Income A', esPostable: true },
    });
    const globalIncomeB = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('4197'), nombre: 'Income B', esPostable: true },
    });
    const globalAsset = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('1198'), nombre: 'Asset', esPostable: true },
    });
    createdGlobalIds.push(globalIncome.id, globalIncomeB.id, globalAsset.id);

    const incomeA = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'wallet', nombre: 'Income A', globalId: globalIncome.id },
    });
    const incomeB = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'wallet', nombre: 'Income B', globalId: globalIncomeB.id },
    });
    const asset = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'wallet', nombre: 'Cash', globalId: globalAsset.id },
    });

    const incomeAId = incomeA.json().account.id;
    const incomeBId = incomeB.json().account.id;
    const assetId = asset.json().account.id;

    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-03-01T00:00:00.000Z',
        concepto: 'Income A',
        lineas: [
          { cuentaId: assetId, debito: 100, credito: 0 },
          { cuentaId: incomeAId, debito: 0, credito: 100 },
        ],
      },
    });
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-03-02T00:00:00.000Z',
        concepto: 'Income B',
        lineas: [
          { cuentaId: assetId, debito: 250, credito: 0 },
          { cuentaId: incomeBId, debito: 0, credito: 250 },
        ],
      },
    });

    const full = await app.inject({
      method: 'GET',
      url: '/api/reports/pyg?year=2026',
      headers: { cookie: cookies.join('; ') },
    });
    expect(Number(full.json().totalIncome)).toBe(350);

    const filtered = await app.inject({
      method: 'GET',
      url: `/api/reports/pyg?year=2026&accountId=${incomeAId}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(filtered.statusCode).toBe(200);
    expect(Number(filtered.json().totalIncome)).toBe(100);
    expect(Number(filtered.json().totalExpenses)).toBe(0);

    await app.close();
  });

  it('filters totals by entityId on apuntes', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 't008-pyg-entity@test.com');

    const globalExpense = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('6198'), nombre: 'Other expense', esPostable: true },
    });
    const globalAsset = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('1197'), nombre: 'Asset', esPostable: true },
    });
    createdGlobalIds.push(globalExpense.id, globalAsset.id);

    const expenseAcc = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'wallet', nombre: 'Misc expense', globalId: globalExpense.id },
    });
    const assetAcc = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'wallet', nombre: 'Cash', globalId: globalAsset.id },
    });

    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-04-01T00:00:00.000Z',
        concepto: 'Manual expense',
        lineas: [
          { cuentaId: expenseAcc.json().account.id, debito: 200, credito: 0 },
          { cuentaId: assetAcc.json().account.id, debito: 0, credito: 200 },
        ],
      },
    });

    const comisionGlobal = await createPostableGlobal(
      nextCodigo('620103'),
      'Comisiones filter test',
      '62010001',
    );
    const bankRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Banco Filter', tipo: 'bank' },
    });
    const bank = bankRes.json().provisionedAccount;
    const policy = await app.inject({
      method: 'PATCH',
      url: `/api/accounts/${bank.id}/balance-policy`,
      headers: { cookie: cookies.join('; ') },
      payload: { enforceNonNegativeBalance: false },
    });
    expect(policy.statusCode).toBe(200);

    const commission = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'comision_bancaria',
        date: '2026-04-10',
        concept: 'Comision',
        amount: 40,
        lines: [
          { id: 1, accountId: comisionGlobal.id },
          { id: 2, accountId: bank.id },
        ],
      },
    });
    expect(commission.statusCode).toBe(201);

    const full = await app.inject({
      method: 'GET',
      url: '/api/reports/pyg?year=2026',
      headers: { cookie: cookies.join('; ') },
    });
    expect(Number(full.json().totalExpenses)).toBe(240);

    const filtered = await app.inject({
      method: 'GET',
      url: `/api/reports/pyg?year=2026&entityId=${bank.entidadId}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(filtered.statusCode).toBe(200);
    expect(Number(filtered.json().totalExpenses)).toBe(40);

    await app.close();
  });
});

describe('GET /api/reports/portfolio (T009)', () => {
  it('groups receivables and payables by entity', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 't009-portfolio@test.com');

    const personRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Cliente Juan', tipo: 'person' },
    });
    expect(personRes.statusCode).toBe(201);
    const person = personRes.json().entity;

    const orgRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Proveedor SA', tipo: 'organization' },
    });
    expect(orgRes.statusCode).toBe(201);
    const org = orgRes.json().entity;

    const globalReceivable = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('1196'), nombre: 'CxC test', esPostable: true },
    });
    const globalPayable = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('2196'), nombre: 'CxP test', esPostable: true },
    });
    const globalAsset = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('1195'), nombre: 'Cash portfolio', esPostable: true },
    });
    createdGlobalIds.push(globalReceivable.id, globalPayable.id, globalAsset.id);

    const cxc = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: {
        tipoCuenta: 'wallet',
        nombre: 'CxC Juan',
        globalId: globalReceivable.id,
        entidadId: person.id,
      },
    });
    const cxp = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: {
        tipoCuenta: 'wallet',
        nombre: 'CxP Proveedor',
        globalId: globalPayable.id,
        entidadId: org.id,
      },
    });
    const cash = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'wallet', nombre: 'Cash', globalId: globalAsset.id },
    });

    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-05-01T00:00:00.000Z',
        concepto: 'Venta a Juan',
        lineas: [
          { cuentaId: cxc.json().account.id, debito: 150, credito: 0 },
          { cuentaId: cash.json().account.id, debito: 0, credito: 150 },
        ],
      },
    });
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-05-02T00:00:00.000Z',
        concepto: 'Compra proveedor',
        lineas: [
          { cuentaId: cash.json().account.id, debito: 80, credito: 0 },
          { cuentaId: cxp.json().account.id, debito: 0, credito: 80 },
        ],
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/reports/portfolio',
      headers: { cookie: cookies.join('; ') },
    });
    expect(res.statusCode).toBe(200);
    const report = res.json();
    expect(report.entities).toHaveLength(2);

    const juan = report.entities.find(
      (e: { entityId: string }) => e.entityId === person.id,
    );
    const proveedor = report.entities.find(
      (e: { entityId: string }) => e.entityId === org.id,
    );
    expect(Number(juan.receivables)).toBe(150);
    expect(Number(juan.payables)).toBe(0);
    expect(Number(proveedor.payables)).toBe(80);
    expect(Number(proveedor.receivables)).toBe(0);

    await app.close();
  });
});
