/**
 * Integration tests: Sprint 05 — Dashboard PYG y Posición.
 *
 * Covers both PYG and Position report endpoints, including account
 * classification, 12-month series, Top 10, bridge exclusion, empty
 * year, and tenant isolation.
 *
 * Follows the same patterns as motor-contable.test.ts:
 * - buildApp() for test server
 * - registerAndVerify() for user creation
 * - prisma directly for CuentaGlobal records
 * - app.inject() for HTTP assertions
 */

import { describe, it, expect, afterAll } from 'vitest';
import { buildApp } from '../src/server.js';
import { prisma } from '../src/infrastructure/database.js';
import type { FastifyInstance } from 'fastify';

// ---------------------------------------------------------------------------
// Test-account lifecycle
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

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

/**
 * Create the standard test accounts: income (4xxx), expense (6xxx),
 * asset (1xxx), liability (2xxx).
 */
async function setupTestAccounts(
  app: FastifyInstance,
  cookies: string[],
): Promise<{
  incomeAccountId: string;
  expenseAccountId: string;
  assetAccountId: string;
  liabilityAccountId: string;
}> {
  const globalIncome = await prisma.cuentaGlobal.create({
    data: { codigo: nextCodigo('4199'), nombre: 'Test Income', esPostable: true },
  });
  createdGlobalIds.push(globalIncome.id);

  const globalExpense = await prisma.cuentaGlobal.create({
    data: { codigo: nextCodigo('6199'), nombre: 'Test Expense', esPostable: true },
  });
  createdGlobalIds.push(globalExpense.id);

  const globalAsset = await prisma.cuentaGlobal.create({
    data: { codigo: nextCodigo('1199'), nombre: 'Test Asset', esPostable: true },
  });
  createdGlobalIds.push(globalAsset.id);

  const globalLiability = await prisma.cuentaGlobal.create({
    data: { codigo: nextCodigo('2199'), nombre: 'Test Liability', esPostable: true },
  });
  createdGlobalIds.push(globalLiability.id);

  const incomeRes = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: { tipoCuenta: 'wallet', nombre: 'Income Account', globalId: globalIncome.id },
  });
  expect(incomeRes.statusCode).toBe(201);
  const incomeAccount = incomeRes.json().account;

  const expenseRes = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: { tipoCuenta: 'wallet', nombre: 'Expense Account', globalId: globalExpense.id },
  });
  expect(expenseRes.statusCode).toBe(201);
  const expenseAccount = expenseRes.json().account;

  const assetRes = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: { tipoCuenta: 'wallet', nombre: 'Asset Account', globalId: globalAsset.id },
  });
  expect(assetRes.statusCode).toBe(201);
  const assetAccount = assetRes.json().account;

  const liabilityRes = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: { tipoCuenta: 'wallet', nombre: 'Liability Account', globalId: globalLiability.id },
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
// PYG Tests (Task 5.1)
// ---------------------------------------------------------------------------

describe('PYG Report — GET /api/reports/pyg', () => {
  it('should return correct annual totals and 12-month series', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'pyg-totals@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Income entry: asset 500 debit, income 500 credit → June
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Income June',
        lineas: [
          { cuentaId: accounts.assetAccountId, debito: 500, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 500 },
        ],
      },
    });

    // Expense entry: expense 300 debit, asset 300 credit → June
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-15T00:00:00.000Z',
        concepto: 'Expense June',
        lineas: [
          { cuentaId: accounts.expenseAccountId, debito: 300, credito: 0 },
          { cuentaId: accounts.assetAccountId, debito: 0, credito: 300 },
        ],
      },
    });

    // Additional income in July: asset 200 debit, income 200 credit
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-07-01T00:00:00.000Z',
        concepto: 'Income July',
        lineas: [
          { cuentaId: accounts.assetAccountId, debito: 200, credito: 0 },
          { cuentaId: accounts.incomeAccountId, debito: 0, credito: 200 },
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

    // Annual totals
    expect(report.year).toBe(2026);
    expect(Number(report.totalIncome)).toBe(700);   // 500 + 200
    expect(Number(report.totalExpenses)).toBe(300);  // 300
    expect(Number(report.netResult)).toBe(400);      // 700 - 300

    // Monthly series: 12 months
    expect(report.monthlySeries).toHaveLength(12);

    // June: income 500, expenses 300
    const june = report.monthlySeries.find((m: { month: number }) => m.month === 6);
    expect(june).toBeDefined();
    expect(Number(june.income)).toBe(500);
    expect(Number(june.expenses)).toBe(300);
    expect(Number(june.balance)).toBe(200);

    // July: income 200, expenses 0
    const july = report.monthlySeries.find((m: { month: number }) => m.month === 7);
    expect(july).toBeDefined();
    expect(Number(july.income)).toBe(200);
    expect(Number(july.expenses)).toBe(0);
    expect(Number(july.balance)).toBe(200);

    // January (no data): all zeros
    const jan = report.monthlySeries.find((m: { month: number }) => m.month === 1);
    expect(jan).toBeDefined();
    expect(Number(jan.income)).toBe(0);
    expect(Number(jan.expenses)).toBe(0);
    expect(Number(jan.balance)).toBe(0);

    // Top 10: 1 income entry, 1 expense entry
    expect(report.topIncome).toHaveLength(1);
    expect(report.topExpenses).toHaveLength(1);

    expect(Number(report.topIncome[0].accumulated)).toBe(700);
    expect(Number(report.topExpenses[0].accumulated)).toBe(300);

    await app.close();
  });

  it('should return correct top 10 ordering with multiple accounts', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'pyg-top10@test.com');

    // Create multiple expense accounts with different amounts
    // We'll reuse setupTestAccounts for the first expense account, then add more
    const base = await setupTestAccounts(app, cookies);

    // Create additional expense accounts
    const extraExpenseCodes = [
      { codigo: nextCodigo('6299'), nombre: 'Big Expense', amount: 800 },
      { codigo: nextCodigo('6399'), nombre: 'Medium Expense', amount: 500 },
    ];

    const extraExpenses: Array<{ accountId: string; amount: number }> = [];

    for (const ec of extraExpenseCodes) {
      const globalE = await prisma.cuentaGlobal.create({
        data: { codigo: ec.codigo, nombre: ec.nombre, esPostable: true },
      });
      createdGlobalIds.push(globalE.id);

      const accRes = await app.inject({
        method: 'POST',
        url: '/api/accounts',
        headers: { cookie: cookies.join('; ') },
        payload: { tipoCuenta: 'wallet', nombre: ec.nombre, globalId: globalE.id },
      });
      expect(accRes.statusCode).toBe(201);
      extraExpenses.push({ accountId: accRes.json().account.id, amount: ec.amount });
    }

    // Create entries for each expense
    for (const ex of extraExpenses) {
      await app.inject({
        method: 'POST',
        url: '/api/entries',
        headers: { cookie: cookies.join('; ') },
        payload: {
          fecha: '2026-06-01T00:00:00.000Z',
          concepto: `Expense ${ex.amount}`,
          lineas: [
            { cuentaId: ex.accountId, debito: ex.amount, credito: 0 },
            { cuentaId: base.assetAccountId, debito: 0, credito: ex.amount },
          ],
        },
      });
    }

    // Also use the base expense account (300 from setup)
    // Add more to it: 200 more
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Base expense extra',
        lineas: [
          { cuentaId: base.expenseAccountId, debito: 200, credito: 0 },
          { cuentaId: base.assetAccountId, debito: 0, credito: 200 },
        ],
      },
    });

    // Add some income entries so the accounts aren't empty
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Income coverage',
        lineas: [
          { cuentaId: base.assetAccountId, debito: 2000, credito: 0 },
          { cuentaId: base.incomeAccountId, debito: 0, credito: 2000 },
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

    // Top expenses should be ordered by accumulated DESC
    expect(report.topExpenses.length).toBeGreaterThanOrEqual(3);
    expect(Number(report.topExpenses[0].accumulated)).toBeGreaterThanOrEqual(
      Number(report.topExpenses[1].accumulated),
    );

    // Big Expense (800) should be first, then Medium Expense (500), then Base Expense Account (200)
    expect(Number(report.topExpenses[0].accumulated)).toBe(800);
    expect(Number(report.topExpenses[1].accumulated)).toBe(500);
    expect(Number(report.topExpenses[2].accumulated)).toBe(200);

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// Position Tests (Task 5.2)
// ---------------------------------------------------------------------------

describe('Position Report — GET /api/reports/position', () => {
  it('should classify bank/wallet as Available, card 1xxx as Available, card 2xxx as Payable', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'pos-classify@test.com');

    // Create global accounts for each type
    const globalBank = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('1111'), nombre: 'Bank Account', esPostable: true },
    });
    createdGlobalIds.push(globalBank.id);

    const globalWallet = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('1122'), nombre: 'Wallet Account', esPostable: true },
    });
    createdGlobalIds.push(globalWallet.id);

    const globalDebitCard = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('1133'), nombre: 'Debit Card', esPostable: true },
    });
    createdGlobalIds.push(globalDebitCard.id);

    const globalCreditCard = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('2144'), nombre: 'Credit Card', esPostable: true },
    });
    createdGlobalIds.push(globalCreditCard.id);

    const globalIncome = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('4199'), nombre: 'Test Income', esPostable: true },
    });
    createdGlobalIds.push(globalIncome.id);

    // Create CuentaUsuario — bank/card via entities; wallet/income via accounts
    const bankRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: `Main Bank ${Date.now()}`, tipo: 'bank' },
    });
    expect(bankRes.statusCode).toBe(201);
    const bankId = bankRes.json().provisionedAccount.id;

    const walletRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'wallet', nombre: 'My Wallet', globalId: globalWallet.id },
    });
    expect(walletRes.statusCode).toBe(201);
    const walletId = walletRes.json().account.id;

    // Asset-like debit card: use wallet under asset-coded global (card create banned)
    const debitRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: {
        tipoCuenta: 'wallet',
        nombre: 'Debit Card',
        globalId: globalDebitCard.id,
      },
    });
    expect(debitRes.statusCode).toBe(201);
    const debitId = debitRes.json().account.id;

    const creditRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: `Credit Card ${Date.now()}`, tipo: 'card_issuer' },
    });
    expect(creditRes.statusCode).toBe(201);
    const creditId = creditRes.json().provisionedAccount.id;

    // Create an income account for counterparty
    const incomeRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'incomeCategory', nombre: 'Counterparty Income', globalId: globalIncome.id },
    });
    expect(incomeRes.statusCode).toBe(201);
    const incomeId = incomeRes.json().account.id;

    // Create entries for each account
    // Bank: 1000 debit (asset)
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Bank deposit',
        lineas: [
          { cuentaId: bankId, debito: 1000, credito: 0 },
          { cuentaId: incomeId, debito: 0, credito: 1000 },
        ],
      },
    });

    // Wallet: 500 debit (asset)
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Wallet top-up',
        lineas: [
          { cuentaId: walletId, debito: 500, credito: 0 },
          { cuentaId: incomeId, debito: 0, credito: 500 },
        ],
      },
    });

    // Debit card: 300 debit (asset)
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Debit card deposit',
        lineas: [
          { cuentaId: debitId, debito: 300, credito: 0 },
          { cuentaId: incomeId, debito: 0, credito: 300 },
        ],
      },
    });

    // Credit card: 200 credit (liability — we owe money)
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Credit card charge',
        lineas: [
          { cuentaId: incomeId, debito: 200, credito: 0 },
          { cuentaId: creditId, debito: 0, credito: 200 },
        ],
      },
    });

    const posRes = await app.inject({
      method: 'GET',
      url: '/api/reports/position',
      headers: { cookie: cookies.join('; ') },
    });
    expect(posRes.statusCode).toBe(200);
    const report = posRes.json();

    // Verify totals
    expect(Number(report.totalAvailable)).toBe(1800); // 1000 + 500 + 300
    expect(Number(report.totalReceivables)).toBe(0);
    expect(Number(report.totalPayables)).toBe(200);
    expect(Number(report.netPosition)).toBe(1600); // 1800 - 200

    // Verify breakdown counts
    expect(report.breakdown.available).toHaveLength(3);
    expect(report.breakdown.receivables).toHaveLength(0);
    expect(report.breakdown.payables).toHaveLength(1);
    expect(Number(report.breakdown.payables[0].balance)).toBe(200);

    await app.close();
  });

  it('should classify entity-linked asset accounts as Receivable', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'pos-receivable@test.com');

    // Person entities auto-provision a CxC wallet under 1132xxxx
    const entityRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Juan Perez', tipo: 'person' },
    });
    expect(entityRes.statusCode).toBe(201);
    const receivableId = entityRes.json().provisionedAccount.id;
    expect(receivableId).toBeTruthy();

    const globalIncome = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('4199'), nombre: 'Loan Income', esPostable: true },
    });
    createdGlobalIds.push(globalIncome.id);

    const incomeAccRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'incomeCategory', nombre: 'Income Counter', globalId: globalIncome.id },
    });
    expect(incomeAccRes.statusCode).toBe(201);
    const incomeId = incomeAccRes.json().account.id;

    // Entry: loan to Juan — 400 debit (receivable)
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Loan to Juan',
        lineas: [
          { cuentaId: receivableId, debito: 400, credito: 0 },
          { cuentaId: incomeId, debito: 0, credito: 400 },
        ],
      },
    });

    const posRes = await app.inject({
      method: 'GET',
      url: '/api/reports/position',
      headers: { cookie: cookies.join('; ') },
    });
    expect(posRes.statusCode).toBe(200);
    const report = posRes.json();

    expect(Number(report.totalReceivables)).toBe(400);
    expect(report.breakdown.receivables).toHaveLength(1);
    expect(report.breakdown.receivables[0].accountName).toBe('Juan Perez');

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// Edge Cases (Task 5.3)
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('should return zeros for empty year — PYG', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'empty-year@test.com');

    const pygRes = await app.inject({
      method: 'GET',
      url: '/api/reports/pyg?year=2025',
      headers: { cookie: cookies.join('; ') },
    });
    expect(pygRes.statusCode).toBe(200);
    const report = pygRes.json();

    expect(report.year).toBe(2025);
    expect(Number(report.totalIncome)).toBe(0);
    expect(Number(report.totalExpenses)).toBe(0);
    expect(Number(report.netResult)).toBe(0);
    expect(report.monthlySeries).toHaveLength(12);
    for (const m of report.monthlySeries) {
      expect(Number(m.income)).toBe(0);
      expect(Number(m.expenses)).toBe(0);
      expect(Number(m.balance)).toBe(0);
    }
    expect(report.topIncome).toHaveLength(0);
    expect(report.topExpenses).toHaveLength(0);

    const aliasRes = await app.inject({
      method: 'GET',
      url: '/api/reports/pyg?año=2025',
      headers: { cookie: cookies.join('; ') },
    });
    expect(aliasRes.statusCode).toBe(200);
    expect(aliasRes.json().year).toBe(2025);

    await app.close();
  });

  it('should exclude bridge accounts from PYG totals', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'bridge-exclude@test.com');
    const accounts = await setupTestAccounts(app, cookies);

    // Create a bridge CuentaGlobal + CuentaUsuario
    const globalBridge = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('1199'), nombre: 'Bridge Transfer', esPostable: true },
    });
    createdGlobalIds.push(globalBridge.id);

    const bridgeRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'bridge', nombre: 'Bridge Account', globalId: globalBridge.id },
    });
    expect(bridgeRes.statusCode).toBe(201);
    const bridgeId = bridgeRes.json().account.id;

    // Create entries: income and bridge
    // Entry 1: income 500
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

    // Entry 2: bridge 300 (should NOT appear in PYG)
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Bridge transfer',
        lineas: [
          { cuentaId: accounts.assetAccountId, debito: 300, credito: 0 },
          { cuentaId: bridgeId, debito: 0, credito: 300 },
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

    // Only income should be reflected; bridge should not appear
    expect(Number(report.totalIncome)).toBe(500);
    expect(Number(report.totalExpenses)).toBe(0);
    expect(Number(report.netResult)).toBe(500);
    expect(report.topIncome).toHaveLength(1);
    expect(report.topExpenses).toHaveLength(0);

    await app.close();
  });

  it('should exclude income/expense accounts from Position totals', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'pos-exclude-inex@test.com');

    // Create global accounts with appropriate codigos
    const globalAsset = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('1199'), nombre: 'Test Asset', esPostable: true },
    });
    createdGlobalIds.push(globalAsset.id);

    const globalIncome = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('4199'), nombre: 'Test Income', esPostable: true },
    });
    createdGlobalIds.push(globalIncome.id);

    const globalExpense = await prisma.cuentaGlobal.create({
      data: { codigo: nextCodigo('6199'), nombre: 'Test Expense', esPostable: true },
    });
    createdGlobalIds.push(globalExpense.id);

    // Create user accounts with proper tipos
    // Asset → wallet (will be 'available' in position)
    // Income → incomeCategory (will be 'excluded' in position)
    // Expense → expenseCategory (will be 'excluded' in position)
    const assetRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: `Asset Account ${Date.now()}`, tipo: 'bank' },
    });
    expect(assetRes.statusCode).toBe(201);
    const assetId = assetRes.json().provisionedAccount.id;

    const incomeRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'incomeCategory', nombre: 'Income Account', globalId: globalIncome.id },
    });
    expect(incomeRes.statusCode).toBe(201);
    const incomeId = incomeRes.json().account.id;

    const expenseRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: { tipoCuenta: 'expenseCategory', nombre: 'Expense Account', globalId: globalExpense.id },
    });
    expect(expenseRes.statusCode).toBe(201);
    const expenseId = expenseRes.json().account.id;

    // Create entries
    // Entry 1: Asset 1000 debit, Income 1000 credit
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Asset + Income',
        lineas: [
          { cuentaId: assetId, debito: 1000, credito: 0 },
          { cuentaId: incomeId, debito: 0, credito: 1000 },
        ],
      },
    });

    // Entry 2: Expense 300 debit, Asset 300 credit
    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookies.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Expense + Asset',
        lineas: [
          { cuentaId: expenseId, debito: 300, credito: 0 },
          { cuentaId: assetId, debito: 0, credito: 300 },
        ],
      },
    });

    const posRes = await app.inject({
      method: 'GET',
      url: '/api/reports/position',
      headers: { cookie: cookies.join('; ') },
    });
    expect(posRes.statusCode).toBe(200);
    const report = posRes.json();

    // Asset account (tipoCuenta=bank, codigo 1xxx) → Available
    // Net: 1000 debit - 300 credit = 700
    expect(Number(report.totalAvailable)).toBe(700);
    // Income and expense accounts should be excluded (incomeCategory, expenseCategory)
    expect(report.breakdown.available).toHaveLength(1);
    expect(report.breakdown.receivables).toHaveLength(0);
    expect(report.breakdown.payables).toHaveLength(0);

    await app.close();
  });

  it('should enforce tenant isolation — user B cannot see user A data', async () => {
    const app = await createTestApp();

    // User A: create data
    const cookiesA = await registerAndVerify(app, 'tenant-a@test.com');
    const accountsA = await setupTestAccounts(app, cookiesA);

    await app.inject({
      method: 'POST',
      url: '/api/entries',
      headers: { cookie: cookiesA.join('; ') },
      payload: {
        fecha: '2026-06-01T00:00:00.000Z',
        concepto: 'Income A',
        lineas: [
          { cuentaId: accountsA.assetAccountId, debito: 1000, credito: 0 },
          { cuentaId: accountsA.incomeAccountId, debito: 0, credito: 1000 },
        ],
      },
    });

    // User B: create with no data
    const cookiesB = await registerAndVerify(app, 'tenant-b@test.com');

    // User B queries PYG for 2026 — should see zeros, not User A's data
    const pygRes = await app.inject({
      method: 'GET',
      url: '/api/reports/pyg?year=2026',
      headers: { cookie: cookiesB.join('; ') },
    });
    expect(pygRes.statusCode).toBe(200);
    const report = pygRes.json();
    expect(Number(report.totalIncome)).toBe(0);
    expect(Number(report.totalExpenses)).toBe(0);

    // User B queries position — should see zeros
    const posRes = await app.inject({
      method: 'GET',
      url: '/api/reports/position',
      headers: { cookie: cookiesB.join('; ') },
    });
    expect(posRes.statusCode).toBe(200);
    const posReport = posRes.json();
    expect(Number(posReport.totalAvailable)).toBe(0);
    expect(Number(posReport.totalPayables)).toBe(0);

    await app.close();
  });
});
