/**
 * Integration tests: Sprint 03 — Motor contable.
 *
 * Covers the accounting engine: journal entries, idempotency, voiding,
 * period lifecycle, balances, reports, and direct CuentaGlobal line support.
 *
 * NOTE: The seed creates 100 CuentaGlobal records (27 groups + 73 postable).
 * Each test creates additional postable CuentaGlobal records via prisma
 * directly, then creates CuentaUsuario records linked to them via the
 * /api/accounts endpoint.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { buildApp } from '../src/server.js';
import { prisma } from '../src/infrastructure/database.js';
import type { FastifyInstance } from 'fastify';

// ---------------------------------------------------------------------------
// Test-account lifecycle (create + cleanup)
// ---------------------------------------------------------------------------

let codigoCounter = Date.now();
const createdGlobalIds: string[] = [];

/**
 * Return a unique codigo for CuentaGlobal creation.
 * Uses timestamp prefix to avoid collisions with the 27 seeded accounts.
 */
function nextCodigo(prefix: string): string {
  return `${prefix}${codigoCounter++}`;
}

/**
 * Clean up all CuentaGlobal records created by this test file.
 */
afterAll(async () => {
  if (createdGlobalIds.length > 0) {
    await prisma.cuentaGlobal.deleteMany({
      where: { id: { in: createdGlobalIds } },
    });
  }
});

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

/**
 * Register a user and verify their email, returning auth cookies.
 */
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

/**
 * Test accounts returned by setupTestAccounts.
 */
interface TestAccounts {
  incomeAccountId: string;
  expenseAccountId: string;
  assetAccountId: string;
  liabilityAccountId: string;
}

/**
 * Create one CuentaGlobal + CuentaUsuario for each account type used in tests.
 * - Income (4xxx): credit-natural
 * - Expense (6xxx): debit-natural
 * - Asset (1xxx): debit-natural
 * - Liability (2xxx): credit-natural
 *
 * CuentaGlobal records are created via prisma directly (no API endpoint exists).
 * CuentaUsuario records are created via POST /api/accounts.
 */
async function setupTestAccounts(
  app: FastifyInstance,
  cookies: string[],
): Promise<TestAccounts> {
  // Create postable global accounts
  const globalIncome = await prisma.cuentaGlobal.create({
    data: {
      codigo: nextCodigo('4199'),
      nombre: 'Test Income',
      esPostable: true,
    },
  });
  createdGlobalIds.push(globalIncome.id);

  const globalExpense = await prisma.cuentaGlobal.create({
    data: {
      codigo: nextCodigo('6199'),
      nombre: 'Test Expense',
      esPostable: true,
    },
  });
  createdGlobalIds.push(globalExpense.id);

  const globalAsset = await prisma.cuentaGlobal.create({
    data: {
      codigo: nextCodigo('1199'),
      nombre: 'Test Asset',
      esPostable: true,
    },
  });
  createdGlobalIds.push(globalAsset.id);

  const globalLiability = await prisma.cuentaGlobal.create({
    data: {
      codigo: nextCodigo('2199'),
      nombre: 'Test Liability',
      esPostable: true,
    },
  });
  createdGlobalIds.push(globalLiability.id);

  // Create user accounts linked to global accounts via the API
  const incomeRes = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: {
      tipoCuenta: 'wallet',
      nombre: 'Income Account',
      globalId: globalIncome.id,
    },
  });
  expect(incomeRes.statusCode).toBe(201);
  const incomeAccount = incomeRes.json().account;

  const expenseRes = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: {
      tipoCuenta: 'wallet',
      nombre: 'Expense Account',
      globalId: globalExpense.id,
    },
  });
  expect(expenseRes.statusCode).toBe(201);
  const expenseAccount = expenseRes.json().account;

  const assetRes = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: {
      tipoCuenta: 'wallet',
      nombre: 'Asset Account',
      globalId: globalAsset.id,
    },
  });
  expect(assetRes.statusCode).toBe(201);
  const assetAccount = assetRes.json().account;

  const liabilityRes = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: {
      tipoCuenta: 'wallet',
      nombre: 'Liability Account',
      globalId: globalLiability.id,
    },
  });
  expect(liabilityRes.statusCode).toBe(201);
  const liabilityAccount = liabilityRes.json().account;

  return {
    incomeAccountId: incomeAccount.id,
    expenseAccountId: expenseAccount.id,
    assetAccountId: assetAccount.id,
    liabilityAccountId: liabilityAccount.id,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('US1 — Create balanced entries', () => {
  it('should create a balanced entry → 201, 2+ lines, debito = credito', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us1-balanced@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Compra de insumos',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.entry).toBeDefined();
    expect(body.entry.id).toBeDefined();
    expect(body.entry.concepto).toBe('Compra de insumos');
    expect(body.entry.tipo).toBe('manual');
    expect(body.entry.anulado).toBe(false);
    expect(body.lineas).toHaveLength(2);

    const totalDebito = body.lineas.reduce(
      (s: number, l: { debito: number }) => s + Number(l.debito),
      0,
    );
    const totalCredito = body.lineas.reduce(
      (s: number, l: { credito: number }) => s + Number(l.credito),
      0,
    );
    expect(totalDebito).toBe(totalCredito);
    expect(totalDebito).toBe(100);

    await app.close();
  });

  it('should reject unbalanced entry → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us1-unbalanced@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Unbalanced',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 50 },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('balanced');

    await app.close();
  });

  it('should reject single-line entry → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us1-singleline@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Single line',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
        ],
      },
    });

    expect(res.statusCode).toBe(400);

    await app.close();
  });
});

describe('Idempotency', () => {
  it('should create entry with Idempotency-Key header → 201', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'idem-first@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: {
        cookie: cookies.join('; '),
        'idempotency-key': 'idem-key-001',
      },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Idempotent entry',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.entry.idempotencyKey).toBe('idem-key-001');

    await app.close();
  });

  it('should return existing entry on duplicate Idempotency-Key (no duplicate)', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'idem-second@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // First call — creates the entry
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: {
        cookie: cookies.join('; '),
        'idempotency-key': 'idem-key-002',
      },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Original',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });
    expect(res1.statusCode).toBe(201);
    const firstEntryId = res1.json().entry.id;

    // Second call with same key — returns existing entry
    // The current implementation returns 201 for idempotency hits
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: {
        cookie: cookies.join('; '),
        'idempotency-key': 'idem-key-002',
      },
      payload: {
        fecha: '2026-07-01T00:00:00.000Z',
        concepto: 'Should not create',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 200, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 200 },
        ],
      },
    });

    // Should succeed (return existing) and have same ID as first
    expect(res2.statusCode).toBe(201);
    expect(res2.json().entry.id).toBe(firstEntryId);

    // Verify only one entry exists with that key
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
    });
    expect(listRes.statusCode).toBe(200);
    const matching = listRes.json().entries.filter(
      (e: { idempotencyKey: string | null }) => e.idempotencyKey === 'idem-key-002',
    );
    expect(matching).toHaveLength(1);

    await app.close();
  });

  it('should collapse concurrent requests with the same Idempotency-Key', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'idem-race@test.com');
    const accounts = await setupTestAccounts(app, cookies);
    const request = () =>
      app.inject({
        method: 'POST',
        url: '/api/entries',
        headers: {
          cookie: cookies.join('; '),
          'idempotency-key': 'idem-key-race-003',
        },
        payload: {
          fecha: '2026-06-01T00:00:00.000Z',
          concepto: 'Concurrent idempotent entry',
          lineas: [
            { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
            { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
          ],
        },
      });

    const [first, second] = await Promise.all([request(), request()]);
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(first.json().entry.id).toBe(second.json().entry.id);

    const count = await prisma.asiento.count({
      where: { idempotencyKey: 'idem-key-race-003' },
    });
    expect(count).toBe(1);
    await app.close();
  });
});

describe('US3 — Void entry', () => {
  it('should void entry → 200, reversal created, original marked', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us3-void@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create an entry
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Entry to void',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const entryId = createRes.json().entry.id;

    // Void it
    const voidRes = await app.inject({
      method: 'POST',
      url: `/api/entries/${entryId}/void`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(voidRes.statusCode).toBe(200);

    const voidBody = voidRes.json();
    expect(voidBody.reversa).toBeDefined();
    expect(voidBody.reversa.tipo).toBe('reversa');
    expect(voidBody.reversa.asientoOriginalId).toBe(entryId);

    // Original is marked as voided
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/entries/${entryId}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = getRes.json();
    expect(getBody.entry.anulado).toBe(true);
    expect(getBody.entry.anuladoAt).toBeTruthy();

    await app.close();
  });

  it('should reject voiding an already voided entry → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us3-doublevoid@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create an entry
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'To void twice',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const entryId = createRes.json().entry.id;

    // First void — should succeed
    const void1 = await app.inject({
      method: 'POST',
      url: `/api/entries/${entryId}/void`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(void1.statusCode).toBe(200);

    // Second void — should fail
    const void2 = await app.inject({
      method: 'POST',
      url: `/api/entries/${entryId}/void`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(void2.statusCode).toBe(400);
    expect(void2.json().error).toContain('already voided');

    await app.close();
  });

  it('should have zero net P&L effect after void (original + reversal cancel out)', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us3-netzero@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create entry: expense 100 debit, income 100 credit
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Net zero test',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const entryId = createRes.json().entry.id;

    // Check balances before void
    const balExpenseBefore = await app.inject({
      method: 'GET',
      url: `/api/balances/${accounts.expenseAccountId}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(balExpenseBefore.statusCode).toBe(200);
    expect(Number(balExpenseBefore.json().saldo)).toBe(100);

    const balIncomeBefore = await app.inject({
      method: 'GET',
      url: `/api/balances/${accounts.incomeAccountId}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(balIncomeBefore.statusCode).toBe(200);
    expect(Number(balIncomeBefore.json().saldo)).toBe(-100);

    // Void the entry — creates reversal (swapped debito/credito)
    const voidRes = await app.inject({
      method: 'POST',
      url: `/api/entries/${entryId}/void`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(voidRes.statusCode).toBe(200);

    // After void: original and audit reversal are both excluded from effective
    // balances, so each account returns to its prior balance.
    const balExpenseAfter = await app.inject({
      method: 'GET',
      url: `/api/balances/${accounts.expenseAccountId}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(balExpenseAfter.statusCode).toBe(200);
    expect(Number(balExpenseAfter.json().saldo)).toBe(0);

    const balIncomeAfter = await app.inject({
      method: 'GET',
      url: `/api/balances/${accounts.incomeAccountId}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(balIncomeAfter.statusCode).toBe(200);
    expect(Number(balIncomeAfter.json().saldo)).toBe(0);

    await app.close();
  });
});

describe('US4 — Period lifecycle', () => {
  it('should close a period → 200, abierto = false', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us4-close@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create an entry to establish the period
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Period entry',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);

    // Close period 2026
    const closeRes = await app.inject({
      method: 'POST',
      url: '/api/periods/2026/close',
      headers: { cookie: cookies.join('; ') },
    });
    expect(closeRes.statusCode).toBe(200);
    expect(closeRes.json().period.abierto).toBe(false);
    expect(closeRes.json().period.cerradoAt).toBeTruthy();

    await app.close();
  });

  it('should reject entry creation in a closed period → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us4-closed-entry@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create an entry to establish the period
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'First entry',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);

    // Close period
    await app.inject({
      method: 'POST',
      url: '/api/periods/2026/close',
      headers: { cookie: cookies.join('; ') },
    });

    // Try creating an entry in the closed period
    const failRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-07-01T00:00:00.000Z',
        concepto: 'Should fail',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 50, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 50 },
        ],
      },
    });
    expect(failRes.statusCode).toBe(400);
    expect(failRes.json().error).toContain('closed');

    await app.close();
  });

  it('should reopen a closed period → 200, abierto = true', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us4-reopen@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create an entry to establish the period
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Period entry',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);

    // Close period
    await app.inject({
      method: 'POST',
      url: '/api/periods/2026/close',
      headers: { cookie: cookies.join('; ') },
    });

    // Reopen period
    const reopenRes = await app.inject({
      method: 'POST',
      url: '/api/periods/2026/reopen',
      headers: { cookie: cookies.join('; ') },
    });
    expect(reopenRes.statusCode).toBe(200);
    expect(reopenRes.json().period.abierto).toBe(true);
    expect(reopenRes.json().period.reabiertoAt).toBeTruthy();

    await app.close();
  });

  it('should allow entry creation after reopening a closed period → 201', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us4-reopened-entry@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create an entry to establish the period
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'First entry',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);

    // Close and reopen
    await app.inject({
      method: 'POST',
      url: '/api/periods/2026/close',
      headers: { cookie: cookies.join('; ') },
    });
    await app.inject({
      method: 'POST',
      url: '/api/periods/2026/reopen',
      headers: { cookie: cookies.join('; ') },
    });

    // Should succeed now
    const reEntry = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-07-01T00:00:00.000Z',
        concepto: 'After reopen',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 50, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 50 },
        ],
      },
    });
    expect(reEntry.statusCode).toBe(201);

    await app.close();
  });
});

describe('US2 — Balances', () => {
  it('should get correct accumulated balance for an account', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us2-balance@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create two entries affecting the same asset account
    // Entry 1: asset debito 100, income credito 100
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Entry 1',
        lineas: [
          { cuentaId: accounts.assetAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });

    // Entry 2: asset debito 50, income credito 50
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-15T00:00:00.000Z',
        concepto: 'Entry 2',
        lineas: [
          { cuentaId: accounts.assetAccountId, debito: 50, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 50 },
        ],
      },
    });

    // Asset balance = 100 + 50 = 150 (debit-natural)
    const balAsset = await app.inject({
      method: 'GET',
      url: `/api/balances/${accounts.assetAccountId}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(balAsset.statusCode).toBe(200);
    expect(Number(balAsset.json().saldo)).toBe(150);

    // Income balance = -100 + -50 = -150 (credit-natural)
    const balIncome = await app.inject({
      method: 'GET',
      url: `/api/balances/${accounts.incomeAccountId}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(balIncome.statusCode).toBe(200);
    expect(Number(balIncome.json().saldo)).toBe(-150);

    await app.close();
  });

  it('should get correct monthly balance breakdown', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us2-monthly@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Entry in June 2026
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'June entry',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 200, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 200 },
        ],
      },
    });

    // Entry in July 2026
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-07-15T00:00:00.000Z',
        concepto: 'July entry',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });

    // Get monthly balances for expense account
    const monthlyRes = await app.inject({
      method: 'GET',
      url: `/api/balances/${accounts.expenseAccountId}/monthly?año=2026`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(monthlyRes.statusCode).toBe(200);
    const body = monthlyRes.json();
    expect(body.mensual).toHaveLength(2);

    // June: saldo = 200 (debito)
    const june = body.mensual.find((m: { mes: number }) => m.mes === 6);
    expect(june).toBeDefined();
    expect(Number(june.saldo)).toBe(200);

    // July: saldo = 100 (debito)
    const july = body.mensual.find((m: { mes: number }) => m.mes === 7);
    expect(july).toBeDefined();
    expect(Number(july.saldo)).toBe(100);

    await app.close();
  });
});

describe('US5 — Reports', () => {
  it('should generate correct PyG report from income and expense entries', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us5-pyg@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Income entry: credito 500 in income account
    // Uses asset account as the debit side
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Income',
        lineas: [
          { cuentaId: accounts.assetAccountId, debito: 500, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 500 },
        ],
      },
    });

    // Expense entry: debito 300 in expense account
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-15T00:00:00.000Z',
        concepto: 'Expense',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 300, credito: 0 },
          { cuentaId: accounts.assetAccountId, debito: 0, credito: 300 },
        ],
      },
    });

    // Get PyG
    const pygRes = await app.inject({
      method: 'GET',
      url: '/api/reports/pyg?year=2026',
      headers: { cookie: cookies.join('; ') },
    });
    expect(pygRes.statusCode).toBe(200);
    const report = pygRes.json();

    expect(report.year).toBe(2026);
    expect(Number(report.totalIncome)).toBe(500);
    expect(Number(report.totalExpenses)).toBe(300);
    expect(Number(report.netResult)).toBe(200);

    expect(report.topIncome).toHaveLength(1);
    expect(report.topExpenses).toHaveLength(1);

    await app.close();
  });

  it('should generate correct Balance Sheet from asset and liability entries', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us5-balance-sheet@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Entry: asset debito 1000, liability credito 1000
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Asset/Liability',
        lineas: [
          { cuentaId: accounts.assetAccountId, debito: 1000, credito: 0 },
          { cuentaId: accounts.liabilityAccountId, debito: 0, credito: 1000 },
        ],
      },
    });

    // Get balance sheet
    const bsRes = await app.inject({
      method: 'GET',
      url: '/api/reports/balance?year=2026',
      headers: { cookie: cookies.join('; ') },
    });
    expect(bsRes.statusCode).toBe(200);
    const report = bsRes.json();

    expect(report.año).toBe(2026);
    expect(Number(report.totalAssets)).toBe(1000);
    expect(Number(report.totalLiabilities)).toBe(1000);
    // Equity = assets - liabilities
    expect(Number(report.equity)).toBe(0);

    expect(report.assetsBreakdown).toHaveLength(1);
    expect(report.liabilitiesBreakdown).toHaveLength(1);

    await app.close();
  });
});

describe('Edge cases', () => {
  it('should save AsientoVersion when updating an entry', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'edge-version@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create entry
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Original concepto',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 100, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const entryId = createRes.json().entry.id;

    // Update the entry (change concepto)
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/entries/${entryId}`,
      headers: { cookie: cookies.join('; ') },
      payload: {
        concepto: 'Updated concepto',
      },
    });
    expect(updateRes.statusCode).toBe(200);

    // GET the entry and check versiones
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/entries/${entryId}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = getRes.json();

    expect(getBody.versiones).toBeDefined();
    expect(getBody.versiones).toHaveLength(1);
    expect(getBody.versiones[0].version).toBe(1);
    expect(getBody.versiones[0].snapshot).toBeDefined();
    expect(getBody.versiones[0].snapshot.asiento.concepto).toBe('Original concepto');

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// US6 — Direct CuentaGlobal in entry lines
// ---------------------------------------------------------------------------

describe('US6 — Direct CuentaGlobal in entry lines', () => {
  it('should create an entry using cuentaGlobalId directly (no CuentaUsuario wrapper)', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-global@test.com');

    // Create test accounts: one CuentaUsuario (asset) and one CuentaGlobal (expense)
    const accounts = await setupTestAccounts(app, cookies);

    // Create a postable global expense account (used directly)
    const globalExpense = await prisma.cuentaGlobal.create({
      data: {
        codigo: nextCodigo('6199'),
        nombre: 'Global Expense Direct',
        esPostable: true,
      },
    });
    createdGlobalIds.push(globalExpense.id);

    // Entry: CuentaUsuario asset debit 200, CuentaGlobal expense credit 200
    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Global direct entry',
        lineas: [
          { cuentaId: accounts.assetAccountId, debito: 200, credito: 0 },
          { cuentaGlobalId: globalExpense.id, debito: 0, credito: 200 },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.entry).toBeDefined();
    expect(body.lineas).toHaveLength(2);

    // Verify the lines have the correct account references
    const assetLine = body.lineas.find(
      (l: { cuentaId: string | null }) => l.cuentaId === accounts.assetAccountId,
    );
    const globalLine = body.lineas.find(
      (l: { cuentaGlobalId: string | null }) => l.cuentaGlobalId === globalExpense.id,
    );
    expect(assetLine).toBeDefined();
    expect(assetLine.debito).toBe(200);
    expect(globalLine).toBeDefined();
    expect(globalLine.credito).toBe(200);

    await app.close();
  });

  it('should reject lines with both cuentaId and cuentaGlobalId → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-both@test.com');
    const accounts = await setupTestAccounts(app, cookies);
    const globalAcc = await prisma.cuentaGlobal.create({
      data: {
        codigo: nextCodigo('6299'),
        nombre: 'Test Both',
        esPostable: true,
      },
    });
    createdGlobalIds.push(globalAcc.id);

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Both IDs',
        lineas: [
          {
            cuentaId: accounts.expenseAccountId,
            cuentaGlobalId: globalAcc.id,
            debito: 100,
            credito: 0,
          },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('both');
    await app.close();
  });

  it('should reject lines with neither cuentaId nor cuentaGlobalId → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-neither@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    const res = await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Neither ID',
        lineas: [
          { debito: 100, credito: 0 } as any,
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 100 },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('cuentaId');
    await app.close();
  });

  it('should include global-account lines in PyG reports', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-pyg-global@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create a postable global income account
    const globalIncome = await prisma.cuentaGlobal.create({
      data: {
        codigo: nextCodigo('4299'),
        nombre: 'Global Income Direct',
        esPostable: true,
      },
    });
    createdGlobalIds.push(globalIncome.id);

    // Entry: income via CuentaGlobal, expense via CuentaUsuario
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Mixed entry',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 300, credito: 0 },
          { cuentaGlobalId: globalIncome.id, debito: 0, credito: 300 },
        ],
      },
    });

    const pygRes = await app.inject({
      method: 'GET',
      url: '/api/reports/pyg?year=2026',
      headers: { cookie: cookies.join('; ') },
    });
    expect(pygRes.statusCode).toBe(200);
    const report = pygRes.json();

    expect(Number(report.totalExpenses)).toBe(300);
    expect(Number(report.totalIncome)).toBe(300);
    expect(Number(report.netResult)).toBe(0);

    // Should have expense from CuentaUsuario and income from CuentaGlobal
    expect(report.topExpenses.length).toBeGreaterThanOrEqual(1);
    expect(report.topIncome.length).toBeGreaterThanOrEqual(1);

    await app.close();
  });
});
