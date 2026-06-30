/**
 * Integration tests: Sprint 03 — Motor contable.
 *
 * Covers:
 * - US1: Balanced entry saves, unbalanced rejected, inactive/non-postable account rejected
 * - US2: Balance queries match line sums
 * - US3: Year close/reopen protects entries
 * - Edge cases: single-line entry, audit trail, closed-period reject, edit unbalances
 */

import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/server.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

interface AuthSession {
  cookies: string[];
  userId: string;
}

/** Register a user and verify their email, returning auth cookies and userId. */
async function registerAndVerify(
  app: FastifyInstance,
  email: string,
  password: string = 'password123',
): Promise<AuthSession> {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password },
  });
  expect(res.statusCode).toBe(201);
  const body = res.json();
  const cookies = res.cookies.map((c) => `${c.name}=${c.value}`);

  const verifyRes = await app.inject({
    method: 'GET',
    url: `/auth/verify/${body.verificationToken}`,
  });
  expect(verifyRes.statusCode).toBe(200);

  return { cookies, userId: body.user.id };
}

/** Create a user account (CuentaUsuario) without global reference for testing. */
async function createUserAccount(
  app: FastifyInstance,
  cookies: string[],
  nombre: string,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: {
      tipoCuenta: 'wallet',
      nombre,
    },
  });
  expect(res.statusCode).toBe(201);
  return res.json().account.id;
}

/** Create an inactive user account directly via Prisma. */
async function createInactiveAccount(
  userId: string,
  nombre: string,
): Promise<string> {
  const account = await prisma.cuentaUsuario.create({
    data: {
      userId,
      tipoCuenta: 'wallet',
      nombre,
      activa: false,
    },
  });
  return account.id;
}

// ---------------------------------------------------------------------------
// US1 — Guardar asiento balanceado
// ---------------------------------------------------------------------------
describe('US1 — Balanced entry creation (FR-001/002/003)', () => {
  it('should save a balanced entry with two lines', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'us1-balanced@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Cash Account');
    const acc2 = await createUserAccount(app, auth.cookies, 'Expense Account');

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: new Date().toISOString().split('T')[0],
        descripcion: 'Test entry',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 100, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 100 },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const { asiento } = res.json();
    expect(asiento.descripcion).toBe('Test entry');
    expect(asiento.lineas).toHaveLength(2);

    await app.close();
  });

  it('should reject an unbalanced entry', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'us1-unbalanced@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Cash');
    const acc2 = await createUserAccount(app, auth.cookies, 'Expense');

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: new Date().toISOString().split('T')[0],
        descripcion: 'Unbalanced entry',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 100, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 50 },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('Unbalanced entry');

    await app.close();
  });

  it('should reject entry with inactive account', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'us1-inactive@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Active Account');

    // Create inactive account directly via Prisma (API doesn't expose activa field)
    const acc2 = await createInactiveAccount(auth.userId, 'Inactive Account');

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: new Date().toISOString().split('T')[0],
        descripcion: 'Entry with inactive account',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 100, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 100 },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('not postable');

    await app.close();
  });

  it('should reject entry with non-existent account', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'us1-nonexistent@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Valid Account');

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: new Date().toISOString().split('T')[0],
        descripcion: 'Entry with non-existent account',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 100, haber: 0 },
          { cuentaUsuarioId: 'ck0000000000000000000000', debe: 0, haber: 100 },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('not postable');

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// US2 — Consultar saldos actuales
// ---------------------------------------------------------------------------
describe('US2 — Balance queries (FR-004)', () => {
  it('should return zero balance for an account with no entries', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'us2-zero@test.com');

    const acc = await createUserAccount(app, auth.cookies, 'Empty Account');

    const res = await app.inject({
      method: 'GET',
      url: `/api/balances/${acc}`,
      headers: { cookie: auth.cookies.join('; ') },
    });

    expect(res.statusCode).toBe(200);
    const { saldo } = res.json();
    expect(saldo.cuentaUsuarioId).toBe(acc);
    expect(saldo.totalDebe).toBe(0);
    expect(saldo.totalHaber).toBe(0);
    expect(saldo.saldo).toBe(0);

    await app.close();
  });

  it('should return correct balance matching all entry lines', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'us2-balance@test.com');

    const accIncome = await createUserAccount(app, auth.cookies, 'Income');
    const accExpense = await createUserAccount(app, auth.cookies, 'Expense');
    const accCash = await createUserAccount(app, auth.cookies, 'Cash');

    // Entry 1: Income 500 → Cash
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2026-01-01',
        descripcion: 'Income',
        lineas: [
          { cuentaUsuarioId: accCash, debe: 500, haber: 0 },
          { cuentaUsuarioId: accIncome, debe: 0, haber: 500 },
        ],
      },
    });

    // Entry 2: Expense 200 from Cash
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2026-01-15',
        descripcion: 'Expense payment',
        lineas: [
          { cuentaUsuarioId: accExpense, debe: 200, haber: 0 },
          { cuentaUsuarioId: accCash, debe: 0, haber: 200 },
        ],
      },
    });

    // Check Cash balance: debe(500) - haber(200) = 300
    const resCash = await app.inject({
      method: 'GET',
      url: `/api/balances/${accCash}`,
      headers: { cookie: auth.cookies.join('; ') },
    });
    expect(resCash.statusCode).toBe(200);
    expect(resCash.json().saldo.saldo).toBe(300);
    expect(resCash.json().saldo.totalDebe).toBe(500);
    expect(resCash.json().saldo.totalHaber).toBe(200);

    // Check Income balance: haber(500) → saldo = -500
    const resIncome = await app.inject({
      method: 'GET',
      url: `/api/balances/${accIncome}`,
      headers: { cookie: auth.cookies.join('; ') },
    });
    expect(resIncome.statusCode).toBe(200);
    expect(resIncome.json().saldo.totalHaber).toBe(500);
    expect(resIncome.json().saldo.saldo).toBe(-500);

    // Check Expense balance: debe(200) → saldo = 200
    const resExpense = await app.inject({
      method: 'GET',
      url: `/api/balances/${accExpense}`,
      headers: { cookie: auth.cookies.join('; ') },
    });
    expect(resExpense.statusCode).toBe(200);
    expect(resExpense.json().saldo.saldo).toBe(200);

    await app.close();
  });

  it('should return balances for all accounts via /api/balances', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'us2-all@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Account 1');
    const acc2 = await createUserAccount(app, auth.cookies, 'Account 2');

    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2026-01-01',
        descripcion: 'Transfer',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 100, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 100 },
        ],
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/balances',
      headers: { cookie: auth.cookies.join('; ') },
    });

    expect(res.statusCode).toBe(200);
    const { saldos } = res.json();
    expect(saldos).toHaveLength(2);

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// US3 — Cierre y reapertura anual
// ---------------------------------------------------------------------------
describe('US3 — Year close/reopen (FR-005/006/007/010)', () => {
  it('should reject entry modification in a closed year', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'us3-closed@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Source');
    const acc2 = await createUserAccount(app, auth.cookies, 'Target');

    // Create an entry in 2025
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2025-06-15',
        descripcion: 'Old entry',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 300, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 300 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const entryId = createRes.json().asiento.id;

    // Close year 2025
    const closeRes = await app.inject({
      method: 'POST',
      url: '/api/periods/2025/close',
      headers: { cookie: auth.cookies.join('; ') },
    });
    expect(closeRes.statusCode).toBe(200);

    // Try to modify the entry → should be rejected
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/entries/${entryId}`,
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        descripcion: 'Attempted edit',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 200, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 200 },
        ],
      },
    });

    expect(updateRes.statusCode).toBe(400);
    expect(updateRes.json().error).toContain('closed');

    await app.close();
  });

  it('should allow entry modification after reopening a closed year', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'us3-reopen@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Source');
    const acc2 = await createUserAccount(app, auth.cookies, 'Target');

    // Create entry
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2025-01-01',
        descripcion: 'Original entry',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 100, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 100 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const entryId = createRes.json().asiento.id;

    // Close year
    await app.inject({
      method: 'POST',
      url: '/api/periods/2025/close',
      headers: { cookie: auth.cookies.join('; ') },
    });

    // Reopen year
    const reopenRes = await app.inject({
      method: 'POST',
      url: '/api/periods/2025/reopen',
      headers: { cookie: auth.cookies.join('; ') },
    });
    expect(reopenRes.statusCode).toBe(200);

    // Modify entry → should succeed
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/entries/${entryId}`,
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        descripcion: 'Corrected entry',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 150, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 150 },
        ],
      },
    });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().asiento.descripcion).toBe('Corrected entry');

    await app.close();
  });

  it('should create entry in open year without period record', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'us3-open@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Src');
    const acc2 = await createUserAccount(app, auth.cookies, 'Dst');

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2026-03-01',
        descripcion: 'New year entry',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 50, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 50 },
        ],
      },
    });

    expect(res.statusCode).toBe(201);

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------
describe('Edge cases — accounting engine', () => {
  it('should reject a single-line entry (not balanced)', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'edge-single@test.com');

    const acc = await createUserAccount(app, auth.cookies, 'Single Account');

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2026-01-01',
        descripcion: 'Single line',
        lineas: [{ cuentaUsuarioId: acc, debe: 100, haber: 0 }],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('Unbalanced entry');

    await app.close();
  });

  it('should preserve edit history (audit trail) when editing in open period', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'edge-audit@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Acc A');
    const acc2 = await createUserAccount(app, auth.cookies, 'Acc B');

    // Create entry
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2026-01-01',
        descripcion: 'Original',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 200, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 200 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const entryId = createRes.json().asiento.id;

    // Edit entry in open period
    const editRes = await app.inject({
      method: 'PUT',
      url: `/api/entries/${entryId}`,
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        descripcion: 'Edited',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 150, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 150 },
        ],
      },
    });

    expect(editRes.statusCode).toBe(200);
    const edited = editRes.json().asiento;
    expect(edited.editHistory).toHaveLength(1);
    expect(edited.editHistory[0].descripcionAnterior).toBe('Original');
    expect(edited.editHistory[0].lineasAnteriores).toHaveLength(2);

    await app.close();
  });

  it('should reject edit that would unbalance an existing entry', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'edge-unbalance@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Acc X');
    const acc2 = await createUserAccount(app, auth.cookies, 'Acc Y');

    // Create a balanced entry
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2026-01-01',
        descripcion: 'Original',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 100, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 100 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const entryId = createRes.json().asiento.id;

    // Edit with unbalanced lines
    const editRes = await app.inject({
      method: 'PUT',
      url: `/api/entries/${entryId}`,
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        descripcion: 'Unbalanced edit',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 100, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 50 },
        ],
      },
    });

    expect(editRes.statusCode).toBe(400);
    expect(editRes.json().error).toContain('Unbalanced entry');

    await app.close();
  });

  it('should list entries with date range filtering', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'edge-list@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Acc 1');
    const acc2 = await createUserAccount(app, auth.cookies, 'Acc 2');

    // Entry in January
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2026-01-15',
        descripcion: 'January entry',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 100, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 100 },
        ],
      },
    });

    // Entry in March
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2026-03-15',
        descripcion: 'March entry',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 200, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 200 },
        ],
      },
    });

    // Filter: only February → empty
    const resFeb = await app.inject({
      method: 'GET',
      url: '/api/entries?desde=2026-02-01&hasta=2026-02-28',
      headers: { cookie: auth.cookies.join('; ') },
    });
    expect(resFeb.statusCode).toBe(200);
    expect(resFeb.json().entries).toHaveLength(0);

    // Filter: Jan-Dec → both
    const resAll = await app.inject({
      method: 'GET',
      url: '/api/entries?desde=2026-01-01&hasta=2026-12-31',
      headers: { cookie: auth.cookies.join('; ') },
    });
    expect(resAll.statusCode).toBe(200);
    expect(resAll.json().entries).toHaveLength(2);

    await app.close();
  });

  it('should get a single entry by id', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'edge-getbyid@test.com');

    const acc1 = await createUserAccount(app, auth.cookies, 'Acc 1');
    const acc2 = await createUserAccount(app, auth.cookies, 'Acc 2');

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: auth.cookies.join('; ') },
      payload: {
        fecha: '2026-05-01',
        descripcion: 'Unique entry',
        lineas: [
          { cuentaUsuarioId: acc1, debe: 75, haber: 0 },
          { cuentaUsuarioId: acc2, debe: 0, haber: 75 },
        ],
      },
    });
    const entryId = createRes.json().asiento.id;

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/entries/${entryId}`,
      headers: { cookie: auth.cookies.join('; ') },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().asiento.descripcion).toBe('Unique entry');
    expect(getRes.json().asiento.lineas).toHaveLength(2);

    await app.close();
  });

  it('should return 404 for non-existent entry', async () => {
    const app = await createTestApp();
    const auth = await registerAndVerify(app, 'edge-404@test.com');

    const res = await app.inject({
      method: 'GET',
      url: '/api/entries/nonexistent-id',
      headers: { cookie: auth.cookies.join('; ') },
    });

    expect(res.statusCode).toBe(404);

    await app.close();
  });

  it('should require auth for all accounting endpoints', async () => {
    const app = await createTestApp();

    const res1 = await app.inject({
      method: 'POST',
      url: '/api/entries',
      payload: { fecha: '2026-01-01', descripcion: 'Test', lineas: [] },
    });
    expect(res1.statusCode).toBe(401);

    const res2 = await app.inject({
      method: 'GET',
      url: '/api/entries',
    });
    expect(res2.statusCode).toBe(401);

    const res3 = await app.inject({
      method: 'POST',
      url: '/api/periods/2026/close',
    });
    expect(res3.statusCode).toBe(401);

    const res4 = await app.inject({
      method: 'GET',
      url: '/api/balances',
    });
    expect(res4.statusCode).toBe(401);

    await app.close();
  });
});
