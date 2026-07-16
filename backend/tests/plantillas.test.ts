/**
 * Integration tests: Sprint 04 — Plantillas MVP.
 *
 * Covers template loading, GET /api/plantillas, POST /api/apuntes
 * with and without templates, and all validations V1-V9.
 *
 * NOTE: The seed creates ~100 CuentaGlobal records (groups + postable).
 * Tests create additional postable CuentaGlobal records for groups
 * that lack them, and CuentaUsuario records for the test user.
 */

import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../src/server.js';
import { prisma } from '../src/infrastructure/database.js';
import { resetPlantillaCache, loadPlantillas, getPlantilla } from '../src/plantillas/index.js';
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
// Helpers
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
 * Find a CuentaGlobal by its codigo (seeded data).
 */
async function findGlobalByCodigo(codigo: string) {
  return prisma.cuentaGlobal.findUnique({ where: { codigo } });
}

/**
 * Create a postable CuentaGlobal under a parent group (by codigo).
 * Returns the created CuentaGlobal.
 */
async function createPostableGlobal(
  codigo: string,
  nombre: string,
  parentCodigo: string,
) {
  const parent = await findGlobalByCodigo(parentCodigo);
  if (!parent) {
    throw new Error(`Parent group ${parentCodigo} not found in seed`);
  }
  const global = await prisma.cuentaGlobal.create({
    data: {
      codigo,
      nombre,
      esPostable: true,
      parentId: parent.id,
    },
  });
  createdGlobalIds.push(global.id);
  return global;
}

/**
 * Create a CuentaUsuario linked to a CuentaGlobal (by codigo).
 */
async function createUserAccount(
  app: FastifyInstance,
  cookies: string[],
  globalCodigo: string,
  nombre: string,
  tipoCuenta = 'wallet',
) {
  if (tipoCuenta === 'bank' || tipoCuenta === 'card') {
    const tipoEntidad = tipoCuenta === 'bank' ? 'bank' : 'card_issuer';
    const res = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre, tipo: tipoEntidad },
    });
    expect(res.statusCode).toBe(201);
    return res.json().provisionedAccount;
  }

  const global = await findGlobalByCodigo(globalCodigo);
  if (!global) {
    throw new Error(`Global account ${globalCodigo} not found`);
  }
  const res = await app.inject({
    method: 'POST',
    url: '/api/accounts',
    headers: { cookie: cookies.join('; ') },
    payload: {
      tipoCuenta,
      nombre,
      globalId: global.id,
    },
  });
  expect(res.statusCode).toBe(201);
  return res.json().account;
}

/**
 * Structure returned by setupTemplateAccounts.
 */
interface TemplateTestAccounts {
  // pagar_servicios: debit under 61120000, credit under any of 11110000/11120000/21200000
  servicioGlobalId: string;      // postable under 61120000
  servicioUserAccountId: string; // CuentaUsuario linked to servicioGlobal
  bancoUserAccountId: string;    // CuentaUsuario linked to a postable under 11120000
  efectivoGlobalId: string;      // postable under 11110000 (seed has 11110001)
  ingresoGlobalId: string;       // postable under 41010000 (seed has 41010001)
  ingresoUserAccountId: string;  // CuentaUsuario linked
}

/**
 * Set up accounts needed for template tests.
 */
async function setupTemplateAccounts(
  app: FastifyInstance,
  cookies: string[],
): Promise<TemplateTestAccounts> {
  // --- Servicios del hogar (61120000) ---
  // Seed already has 61120001 (Agua), 61120002 (Energia) etc.
  const servicioGlobal = await findGlobalByCodigo('61120002');
  if (!servicioGlobal) throw new Error('61120002 not seeded');
  const servicioUserAccount = await createUserAccount(
    app, cookies, '61120002', 'Mi servicio electricidad',
  );

  // --- Bancos (11120000) — no direct postable child, create one ---
  const bancoPostable = await createPostableGlobal(
    nextCodigo('111210'), 'Mi Cuenta Corriente', '11120000',
  );
  const bancoUserAccount = await createUserAccount(
    app, cookies, bancoPostable.codigo, 'Mi banco',
  );

  // --- Efectivo (11110000) — seed has 11110001 ---
  const efectivoGlobal = await findGlobalByCodigo('11110001');
  if (!efectivoGlobal) throw new Error('11110001 not seeded');

  // --- Ingresos (41010000) — seed has 41010001 ---
  const ingresoGlobal = await findGlobalByCodigo('41010001');
  if (!ingresoGlobal) throw new Error('41010001 not seeded');
  const ingresoUserAccount = await createUserAccount(
    app, cookies, '41010001', 'Mi sueldo',
  );

  return {
    servicioGlobalId: servicioGlobal.id,
    servicioUserAccountId: servicioUserAccount.id,
    bancoUserAccountId: bancoUserAccount.id,
    efectivoGlobalId: efectivoGlobal.id,
    ingresoGlobalId: ingresoGlobal.id,
    ingresoUserAccountId: ingresoUserAccount.id,
  };
}

// ---------------------------------------------------------------------------
// Unit tests for loader
// ---------------------------------------------------------------------------

describe('Plantilla loader', () => {
  beforeEach(() => {
    resetPlantillaCache();
  });

  it('should load 10 plantillas', () => {
    const all = loadPlantillas();
    expect(all).toHaveLength(10);
  });

  it('should have required fields on each plantilla', () => {
    const all = loadPlantillas();
    for (const p of all) {
      expect(p.code).toBeDefined();
      expect(typeof p.code).toBe('string');
      expect(p.version).toBeGreaterThanOrEqual(1);
      expect(p.name).toBeDefined();
      expect(Array.isArray(p.modes)).toBe(true);
      expect(p.modes.length).toBeGreaterThan(0);
      expect(Array.isArray(p.lines)).toBe(true);
      expect(p.lines.length).toBeGreaterThan(0);

      for (const line of p.lines) {
        expect(typeof line.id).toBe('number');
        expect(['debit', 'credit']).toContain(line.side);
        expect(['from_group', 'from_groups', 'fixed', 'from_entity']).toContain(line.strategy);
        if (line.strategy === 'from_group') {
          expect(typeof line.groupCode).toBe('string');
        }
        if (line.strategy === 'from_groups') {
          expect(Array.isArray(line.groupCodes)).toBe(true);
        }
      }
    }
  });

  it('getPlantilla by code should return the correct plantilla', () => {
    const p = loadPlantillas().find((p) => p.code === 'pagar_servicios');
    expect(p).toBeDefined();
    expect(p!.name).toBe('Pagar servicios básicos');
    expect(p!.lines).toHaveLength(2);
  });

  it('getPlantilla for unknown code should return undefined', () => {
    resetPlantillaCache();
    loadPlantillas();
    const result = getPlantilla('nonexistent');
    expect(result).toBeUndefined();
  });

  it('should have pagar_servicios with correct structure', () => {
    resetPlantillaCache();
    loadPlantillas();
    const p = getPlantilla('pagar_servicios');
    expect(p).toBeDefined();
    expect(p!.lines[0].strategy).toBe('from_group');
    expect(p!.lines[0].groupCode).toBe('61120000');
    expect(p!.lines[1].strategy).toBe('from_groups');
    expect(p!.lines[1].groupCodes).toEqual(['11110000', '11120000', '21200000']);
  });
});

// ---------------------------------------------------------------------------
// US7: GET /api/plantillas
// ---------------------------------------------------------------------------

describe('US7 — GET /api/plantillas', () => {
  it('should return 10 plantillas', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us7-list@test.com');

    const res = await app.inject({
      method: 'GET',
      url: '/api/plantillas',
      headers: { cookie: cookies.join('; ') },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.plantillas).toHaveLength(10);
    for (const p of body.plantillas) {
      for (const line of p.lines) {
        expect(line.availableAccounts).toBeUndefined();
      }
    }

    await app.close();
  });

  it('GET /api/plantillas/:code should return enriched plantilla with availableAccounts', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us7-bycode@test.com');

    // Create some accounts so availableAccounts is not empty
    await setupTemplateAccounts(app, cookies);

    const res = await app.inject({
      method: 'GET',
      url: '/api/plantillas/pagar_servicios',
      headers: { cookie: cookies.join('; ') },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.plantilla).toBeDefined();
    expect(body.plantilla.code).toBe('pagar_servicios');
    expect(body.plantilla.lines).toHaveLength(2);

    // Each line should have availableAccounts
    for (const line of body.plantilla.lines) {
      expect(line.availableAccounts).toBeDefined();
      expect(Array.isArray(line.availableAccounts)).toBe(true);
    }

    await app.close();
  });

  it('GET /api/plantillas/nonexistent should return 404', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us7-404@test.com');

    const res = await app.inject({
      method: 'GET',
      url: '/api/plantillas/nonexistent',
      headers: { cookie: cookies.join('; ') },
    });

    expect(res.statusCode).toBe(404);

    await app.close();
  });

  it('should filter by mode', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us7-mode@test.com');

    const res = await app.inject({
      method: 'GET',
      url: '/api/plantillas?mode=hogar',
      headers: { cookie: cookies.join('; ') },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.plantillas.length).toBeGreaterThanOrEqual(1);
    for (const p of body.plantillas) {
      expect(p.modes).toContain('hogar');
    }

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// US1: Register gasto with plantilla (pagar_servicios)
// ---------------------------------------------------------------------------

describe('US1 — Register gasto with plantilla', () => {
  it('should create balanced entry using pagar_servicios template → 201', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us1-pagar-servicios@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'pagar_servicios',
        date: '2026-07-05',
        concept: 'Luz julio',
        amount: 85.50,
        lines: [
          { id: 1, accountId: accounts.servicioUserAccountId },
          { id: 2, accountId: accounts.bancoUserAccountId },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.apunte).toBeDefined();
    expect(body.apunte.templateCode).toBe('pagar_servicios');
    expect(body.apunte.concept).toBe('Luz julio');
    expect(Number(body.apunte.amount)).toBe(85.50);
    expect(body.apunte.asientoId).toBeDefined();

    expect(body.asiento).toBeDefined();
    expect(body.asiento.lines).toHaveLength(2);

    // Verify balance
    const totalDebito = body.asiento.lines.reduce(
      (s: number, l: { debito: number }) => s + Number(l.debito),
      0,
    );
    const totalCredito = body.asiento.lines.reduce(
      (s: number, l: { credito: number }) => s + Number(l.credito),
      0,
    );
    expect(totalDebito).toBe(totalCredito);
    expect(totalDebito).toBe(85.50);

    // Verify Apunte exists in DB
    const apunteDb = await prisma.apunte.findUnique({
      where: { id: body.apunte.id },
    });
    expect(apunteDb).toBeDefined();
    expect(apunteDb!.templateCode).toBe('pagar_servicios');
    expect(apunteDb!.userId).toBeDefined();

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// US2: Register ingreso with plantilla (registrar_sueldo)
// ---------------------------------------------------------------------------

describe('US2 — Register ingreso with plantilla', () => {
  it('should create balanced entry using registrar_sueldo template → 201', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us2-sueldo@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'registrar_sueldo',
        date: '2026-07-01',
        concept: 'Sueldo julio',
        amount: 1500,
        lines: [
          { id: 1, accountId: accounts.bancoUserAccountId },
          { id: 2, accountId: accounts.ingresoUserAccountId },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.apunte.templateCode).toBe('registrar_sueldo');

    // DEBE = banco (debit), HABER = ingreso (credit)
    const debitLine = body.asiento.lines.find(
      (l: { debito: number }) => Number(l.debito) > 0,
    );
    const creditLine = body.asiento.lines.find(
      (l: { credito: number }) => Number(l.credito) > 0,
    );
    expect(debitLine).toBeDefined();
    expect(creditLine).toBeDefined();
    expect(Number(debitLine.debito)).toBe(1500);
    expect(Number(creditLine.credito)).toBe(1500);

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// US3: Register traspaso (deposito_bancario, retiro_bancario, transferencia)
// ---------------------------------------------------------------------------

describe('US3 — Register traspasos', () => {
  it('deposito_bancario → 201, balanced', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us3-deposito@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    // Need two bank-like accounts: one as destino (debit), one as origen (credit)
    // Create a second bank account
    const banco2 = await createPostableGlobal(
      nextCodigo('111211'), 'Otra Cuenta', '11120000',
    );
    const banco2User = await createUserAccount(app, cookies, banco2.codigo, 'Mi otro banco');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'deposito_bancario',
        date: '2026-07-01',
        concept: 'Deposito a cuenta',
        amount: 500,
        lines: [
          { id: 1, accountId: accounts.bancoUserAccountId },
          { id: 2, accountId: banco2User.id },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.apunte.templateCode).toBe('deposito_bancario');

    const totalDebito = body.asiento.lines.reduce(
      (s: number, l: { debito: number }) => s + Number(l.debito),
      0,
    );
    const totalCredito = body.asiento.lines.reduce(
      (s: number, l: { credito: number }) => s + Number(l.credito),
      0,
    );
    expect(totalDebito).toBe(totalCredito);

    await app.close();
  });

  it('retiro_bancario → 201, balanced', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us3-retiro@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    // Create efectivo account (CuentaUsuario) linked to 11110001
    const efectivoUser = await createUserAccount(
      app, cookies, '11110001', 'Mi efectivo',
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'retiro_bancario',
        date: '2026-07-01',
        concept: 'Retiro',
        amount: 200,
        lines: [
          { id: 1, accountId: efectivoUser.id },
          { id: 2, accountId: accounts.bancoUserAccountId },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.apunte.templateCode).toBe('retiro_bancario');

    // retiro_bancario: DEBE = efectivo (id:1), HABER = banco (id:2)
    expect(Number(body.asiento.lines[0].debito)).toBe(200);
    expect(Number(body.asiento.lines[1].credito)).toBe(200);

    await app.close();
  });

  it('transferencia → 201, balanced', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us3-transfer@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    // Create a second bank account for transfer destination
    const banco2 = await createPostableGlobal(
      nextCodigo('111212'), 'Banco Destino', '11120000',
    );
    const banco2User = await createUserAccount(app, cookies, banco2.codigo, 'Cuenta destino');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'transferencia',
        date: '2026-07-01',
        concept: 'Transferencia',
        amount: 300,
        lines: [
          { id: 1, accountId: banco2User.id },
          { id: 2, accountId: accounts.bancoUserAccountId },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.apunte.templateCode).toBe('transferencia');
    expect(Number(body.asiento.lines[0].debito)).toBe(300);
    expect(Number(body.asiento.lines[1].credito)).toBe(300);

    await app.close();
  });

  it('transferencia same account origen=destino → 400 (V10)', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us3-transfer-v10@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'transferencia',
        date: '2026-07-01',
        concept: 'Transferencia inválida',
        amount: 50,
        lines: [
          { id: 1, accountId: accounts.bancoUserAccountId },
          { id: 2, accountId: accounts.bancoUserAccountId },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/V10/);

    await app.close();
  });

  it('transferencia wallet → bank → 201 (groups include billeteras)', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us3-transfer-wallet@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    const walletUser = await createUserAccount(
      app,
      cookies,
      '11110001',
      'PayPal',
      'wallet',
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'transferencia',
        date: '2026-07-01',
        concept: 'Cash out',
        amount: 80,
        lines: [
          { id: 1, accountId: accounts.bancoUserAccountId },
          { id: 2, accountId: walletUser.id },
        ],
      },
    });

    expect(res.statusCode).toBe(201);

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// US4: Pago tarjeta de credito
// ---------------------------------------------------------------------------

describe('US4 — Register pago_tarjeta', () => {
  it('should create balanced entry for pago_tarjeta → 201', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us4-tarjeta@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    // Need a tarjeta account (CuentaUsuario) under 21200000
    const tarjetaPostable = await createPostableGlobal(
      nextCodigo('212010'), 'Mi Tarjeta Visa', '21200000',
    );
    const tarjetaUser = await createUserAccount(app, cookies, tarjetaPostable.codigo, 'Visa');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'pago_tarjeta',
        date: '2026-07-05',
        concept: 'Pago tarjeta',
        amount: 400,
        lines: [
          { id: 1, accountId: tarjetaUser.id },
          { id: 2, accountId: accounts.bancoUserAccountId },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.apunte.templateCode).toBe('pago_tarjeta');

    // DEBE = tarjeta (reduce pasivo), HABER = banco
    const debitLine = body.asiento.lines.find(
      (l: { debito: number }) => Number(l.debito) > 0,
    );
    const creditLine = body.asiento.lines.find(
      (l: { credito: number }) => Number(l.credito) > 0,
    );
    expect(debitLine).toBeDefined();
    expect(creditLine).toBeDefined();
    expect(Number(debitLine.debito)).toBe(400);
    expect(Number(creditLine.credito)).toBe(400);

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// US5: PRO wizard sin template
// ---------------------------------------------------------------------------

describe('US5 — PRO wizard sin template', () => {
  it('should create balanced entry without templateCode → 201', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us5-prowizard@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    // Create a postable global under a generic expense group
    const expenseGlobal = await createPostableGlobal(
      nextCodigo('6199'), 'Gasto test', '61000000',
    );
    const expenseUser = await createUserAccount(app, cookies, expenseGlobal.codigo, 'Gasto test');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        date: '2026-07-10',
        concept: 'Gasto PRO',
        lines: [
          { id: 1, accountId: expenseUser.id, side: 'debit', amount: 75 },
          { id: 2, accountId: accounts.bancoUserAccountId, side: 'credit', amount: 75 },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.apunte.templateCode).toBeNull();

    const totalDebito = body.asiento.lines.reduce(
      (s: number, l: { debito: number }) => s + Number(l.debito),
      0,
    );
    const totalCredito = body.asiento.lines.reduce(
      (s: number, l: { credito: number }) => s + Number(l.credito),
      0,
    );
    expect(totalDebito).toBe(75);
    expect(totalCredito).toBe(75);

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// US6: Errores de validación
// ---------------------------------------------------------------------------

describe('US6 — Errores de validación', () => {
  it('V1: Template inexistente → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-v1@test.com');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'template_inexistente',
        date: '2026-07-05',
        concept: 'Test',
        amount: 100,
        lines: [{ id: 1, accountId: 'fake' }],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('V1');

    await app.close();
  });

  it('V2: Linea con ID inválido en la plantilla → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-v2@test.com');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'pagar_servicios',
        date: '2026-07-05',
        concept: 'Test',
        amount: 100,
        lines: [
          { id: 99, accountId: 'fake' },
          { id: 2, accountId: 'fake2' },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('V2');
    expect(res.json().error).toContain('99');

    await app.close();
  });

  it('V3: Cuenta inexistente → 404', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-v3@test.com');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        date: '2026-07-05',
        concept: 'Test',
        lines: [
          { id: 1, accountId: 'cuenta-inexistente', side: 'debit', amount: 100 },
          { id: 2, accountId: 'otra-inexistente', side: 'credit', amount: 100 },
        ],
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain('not found');

    await app.close();
  });

  it('V9: Cuenta de otro usuario → 403', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-v9@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    // Create another user and steal their account ID
    const cookies2 = await registerAndVerify(app, 'us6-v9-other@test.com');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies2.join('; ') },
      payload: {
        date: '2026-07-05',
        concept: 'Test',
        lines: [
          { id: 1, accountId: accounts.bancoUserAccountId, side: 'debit', amount: 100 },
          { id: 2, accountId: accounts.servicioUserAccountId, side: 'credit', amount: 100 },
        ],
      },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().error).toContain('V9');

    await app.close();
  });

  it('V4: Cuenta no cuelga del grupo declarado → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-v4@test.com');

    // Create an account under a group NOT related to pagar_servicios
    // pagar_servicios line 1 has groupCode 61120000, so we create a user account
    // under a different group like 61130000 (Alimentacion)
    const wrongGlobal = await createPostableGlobal(
      nextCodigo('6198'), 'Wrong group', '61130000',
    );
    const wrongUser = await createUserAccount(app, cookies, wrongGlobal.codigo, 'Cuenta incorrecta');

    // Now also need a credit-side account to pass balance check
    const bancoPostable = await createPostableGlobal(
      nextCodigo('111213'), 'Banco test V4', '11120000',
    );
    const bancoUser = await createUserAccount(app, cookies, bancoPostable.codigo, 'Banco V4');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'pagar_servicios',
        date: '2026-07-05',
        concept: 'Test V4',
        amount: 100,
        lines: [
          { id: 1, accountId: wrongUser.id },
          { id: 2, accountId: bancoUser.id },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('V4');

    await app.close();
  });

  it('V6: Periodo cerrado → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-v6@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    // First create an entry to establish the period
    await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'pagar_servicios',
        date: '2026-07-05',
        concept: 'First entry',
        amount: 50,
        lines: [
          { id: 1, accountId: accounts.servicioUserAccountId },
          { id: 2, accountId: accounts.bancoUserAccountId },
        ],
      },
    });

    // Close period 2026
    const closeRes = await app.inject({
      method: 'POST',
      url: '/api/periods/2026/close',
      headers: { cookie: cookies.join('; ') },
    });
    expect(closeRes.statusCode).toBe(200);

    // Try creating entry in closed period
    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'pagar_servicios',
        date: '2026-07-10',
        concept: 'Should fail',
        amount: 50,
        lines: [
          { id: 1, accountId: accounts.servicioUserAccountId },
          { id: 2, accountId: accounts.bancoUserAccountId },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('V6');

    await app.close();
  });

  it('V8: Asiento descuadrado → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-v8@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        date: '2026-07-05',
        concept: 'Unbalanced',
        lines: [
          { id: 1, accountId: accounts.servicioUserAccountId, side: 'debit', amount: 100 },
          { id: 2, accountId: accounts.bancoUserAccountId, side: 'credit', amount: 50 },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('V8');
    expect(res.json().error).toContain('balanced');

    await app.close();
  });

  it('V8: Sin template + líneas descuadradas → 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us6-v8-pro@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        date: '2026-07-05',
        concept: 'PRO unbalanced',
        lines: [
          { id: 1, accountId: accounts.servicioUserAccountId, side: 'debit', amount: 100 },
          { id: 2, accountId: accounts.bancoUserAccountId, side: 'credit', amount: 30 },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('balanced');

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// Edge case: use CuentaGlobal directly (not CuentaUsuario) in template
// ---------------------------------------------------------------------------

describe('Direct CuentaGlobal in template apuntes', () => {
  it('should accept CuentaGlobal accountId directly → 201', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'us-global-direct@test.com');

    // Use seeded 61120002 (Energia) as a CuentaGlobal directly (postable)
    const energiaGlobal = await findGlobalByCodigo('61120002');
    if (!energiaGlobal) throw new Error('61120002 not seeded');

    // For the credit side, we need a user account under bancos/tarjeta/efectivo
    const bancoPostable = await createPostableGlobal(
      nextCodigo('111214'), 'Banco direct test', '11120000',
    );
    const bancoUser = await createUserAccount(app, cookies, bancoPostable.codigo, 'Banco direct');

    const res = await app.inject({
      method: 'POST',
      url: '/api/apuntes',
      headers: { cookie: cookies.join('; ') },
      payload: {
        templateCode: 'pagar_servicios',
        date: '2026-07-05',
        concept: 'Direct global',
        amount: 60,
        lines: [
          { id: 1, accountId: energiaGlobal.id },
          { id: 2, accountId: bancoUser.id },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.apunte.templateCode).toBe('pagar_servicios');

    const totalDebito = body.asiento.lines.reduce(
      (s: number, l: { debito: number }) => s + Number(l.debito),
      0,
    );
    const totalCredito = body.asiento.lines.reduce(
      (s: number, l: { credito: number }) => s + Number(l.credito),
      0,
    );
    expect(totalDebito).toBe(60);
    expect(totalCredito).toBe(60);

    await app.close();
  });
});

// ---------------------------------------------------------------------------
// Follow-up Sprint 06 ? GET /api/apuntes (SC-008)
// ---------------------------------------------------------------------------

describe('SC-008 ? GET /api/apuntes', () => {
  it('should list only the authenticated user apuntes without journal lines', async () => {
    const app = await createTestApp();
    const cookiesA = await registerAndVerify(app, 'list-apuntes-a@test.com');
    const cookiesB = await registerAndVerify(app, 'list-apuntes-b@test.com');

    const energia = await findGlobalByCodigo("61120002");
    if (!energia) throw new Error("61120002 not seeded");

    async function createGasto(
      cookies: string[],
      concept: string,
      amount: number,
      date: string,
    ) {
      const bancoPostable = await createPostableGlobal(
        nextCodigo("111214"),
        `Banco ${concept}`,
        "11120000",
      );
      const bancoUser = await createUserAccount(
        app,
        cookies,
        bancoPostable.codigo,
        `Banco ${concept}`,
      );
      const res = await app.inject({
        method: "POST",
        url: "/api/apuntes",
        headers: { cookie: cookies.join("; ") },
        payload: {
          templateCode: "pagar_servicios",
          date,
          concept,
          amount,
          lines: [
            { id: 1, accountId: energia.id },
            { id: 2, accountId: bancoUser.id },
          ],
        },
      });
      expect(res.statusCode).toBe(201);
      return res.json().apunte;
    }

    await createGasto(cookiesA, "Luz junio", 80, "2026-06-01");
    await createGasto(cookiesA, "Luz julio", 85.5, "2026-07-05");
    await createGasto(cookiesB, "Luz otro", 10, "2026-07-05");

    const listA = await app.inject({
      method: "GET",
      url: "/api/apuntes",
      headers: { cookie: cookiesA.join("; ") },
    });
    expect(listA.statusCode).toBe(200);
    const bodyA = listA.json();
    expect(bodyA.total).toBe(2);
    expect(bodyA.apuntes).toHaveLength(2);
    expect(bodyA.apuntes[0].concept).toBe("Luz julio");
    expect(bodyA.apuntes[1].concept).toBe("Luz junio");
    expect(bodyA.apuntes[0]).toMatchObject({
      templateCode: "pagar_servicios",
      date: "2026-07-05",
      amount: 85.5,
    });
    expect(bodyA.apuntes[0].asientoId).toBeDefined();
    expect(bodyA.apuntes[0]).not.toHaveProperty("lines");
    expect(bodyA.apuntes[0]).not.toHaveProperty("userId");

    const listB = await app.inject({
      method: "GET",
      url: "/api/apuntes",
      headers: { cookie: cookiesB.join("; ") },
    });
    expect(listB.statusCode).toBe(200);
    expect(listB.json().total).toBe(1);
    expect(listB.json().apuntes[0].concept).toBe("Luz otro");

    const unauth = await app.inject({ method: "GET", url: "/api/apuntes" });
    expect(unauth.statusCode).toBe(401);

    await app.close();
  });

  it("should list apuntes by createdAt desc (not movement date)", async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, "list-apuntes-created@test.com");

    const energia = await findGlobalByCodigo("61120002");
    if (!energia) throw new Error("61120002 not seeded");

    async function createGasto(concept: string, amount: number, date: string) {
      const bancoPostable = await createPostableGlobal(
        nextCodigo("111214"),
        `Banco ${concept}`,
        "11120000",
      );
      const bancoUser = await createUserAccount(
        app,
        cookies,
        bancoPostable.codigo,
        `Banco ${concept}`,
      );
      const res = await app.inject({
        method: "POST",
        url: "/api/apuntes",
        headers: { cookie: cookies.join("; ") },
        payload: {
          templateCode: "pagar_servicios",
          date,
          concept,
          amount,
          lines: [
            { id: 1, accountId: energia.id },
            { id: 2, accountId: bancoUser.id },
          ],
        },
      });
      expect(res.statusCode).toBe(201);
      return res.json().apunte;
    }

    // Newer movement date first, older movement date second (last capture wins)
    await createGasto("Reciente en libro", 90, "2026-07-10");
    await createGasto("Corrección antigua", 40, "2026-06-01");

    const list = await app.inject({
      method: "GET",
      url: "/api/apuntes",
      headers: { cookie: cookies.join("; ") },
    });
    expect(list.statusCode).toBe(200);
    const body = list.json();
    expect(body.apuntes[0].concept).toBe("Corrección antigua");
    expect(body.apuntes[1].concept).toBe("Reciente en libro");

    await app.close();
  });

  it("should filter apuntes by date range, amount, concept and accountId", async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, "list-apuntes-filter@test.com");

    const energia = await findGlobalByCodigo("61120002");
    if (!energia) throw new Error("61120002 not seeded");

    const bancoPostable = await createPostableGlobal(
      nextCodigo("111214"),
      "Banco filtro",
      "11120000",
    );
    const bancoUser = await createUserAccount(
      app,
      cookies,
      bancoPostable.codigo,
      "Banco filtro",
    );

    async function createGasto(concept: string, amount: number, date: string) {
      const res = await app.inject({
        method: "POST",
        url: "/api/apuntes",
        headers: { cookie: cookies.join("; ") },
        payload: {
          templateCode: "pagar_servicios",
          date,
          concept,
          amount,
          lines: [
            { id: 1, accountId: energia.id },
            { id: 2, accountId: bancoUser.id },
          ],
        },
      });
      expect(res.statusCode).toBe(201);
      return res.json().apunte;
    }

    await createGasto("Luz junio", 50, "2026-06-15");
    await createGasto("Luz julio", 80, "2026-07-10");
    await createGasto("Agua julio", 20, "2026-07-12");

    const byConcept = await app.inject({
      method: "GET",
      url: "/api/apuntes?q=luz",
      headers: { cookie: cookies.join("; ") },
    });
    expect(byConcept.statusCode).toBe(200);
    expect(byConcept.json().apuntes.every((a: { concept: string }) =>
      a.concept.toLowerCase().includes("luz"),
    )).toBe(true);
    expect(byConcept.json().total).toBe(2);

    const byAmount = await app.inject({
      method: "GET",
      url: "/api/apuntes?amountMin=40&amountMax=60",
      headers: { cookie: cookies.join("; ") },
    });
    expect(byAmount.statusCode).toBe(200);
    expect(byAmount.json().apuntes).toHaveLength(1);
    expect(byAmount.json().apuntes[0].concept).toBe("Luz junio");

    const byDate = await app.inject({
      method: "GET",
      url: "/api/apuntes?dateFrom=2026-07-01&dateTo=2026-07-31",
      headers: { cookie: cookies.join("; ") },
    });
    expect(byDate.statusCode).toBe(200);
    expect(byDate.json().total).toBe(2);

    const byAccount = await app.inject({
      method: "GET",
      url: `/api/apuntes?accountId=${bancoUser.id}`,
      headers: { cookie: cookies.join("; ") },
    });
    expect(byAccount.statusCode).toBe(200);
    expect(byAccount.json().total).toBe(3);

    await app.close();
  });

  it("should respect limit and offset pagination", async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, "list-apuntes-page@test.com");

    const energia = await findGlobalByCodigo("61120002");
    if (!energia) throw new Error("61120002 not seeded");

    for (let i = 1; i <= 3; i++) {
      const bancoPostable = await createPostableGlobal(
        nextCodigo("111214"),
        `Banco page ${i}`,
        "11120000",
      );
      const bancoUser = await createUserAccount(
        app,
        cookies,
        bancoPostable.codigo,
        `Banco page ${i}`,
      );
      const res = await app.inject({
        method: "POST",
        url: "/api/apuntes",
        headers: { cookie: cookies.join("; ") },
        payload: {
          templateCode: "pagar_servicios",
          date: `2026-07-0${i}`,
          concept: `Apunte ${i}`,
          amount: 10 * i,
          lines: [
            { id: 1, accountId: energia.id },
            { id: 2, accountId: bancoUser.id },
          ],
        },
      });
      expect(res.statusCode).toBe(201);
    }

    const page = await app.inject({
      method: "GET",
      url: "/api/apuntes?limit=1&offset=1",
      headers: { cookie: cookies.join("; ") },
    });
    expect(page.statusCode).toBe(200);
    const body = page.json();
    expect(body.total).toBe(3);
    expect(body.apuntes).toHaveLength(1);
    expect(body.apuntes[0].concept).toBe("Apunte 2");

    await app.close();
  });
});

describe('Plantillas Admin (dev)', () => {
  it('GET /api/dev/plantillas-admin?mode=hogar returns readiness summary', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'admin-plantillas@test.com');
    await setupTemplateAccounts(app, cookies);

    const res = await app.inject({
      method: 'GET',
      url: '/api/dev/plantillas-admin?mode=hogar&format=json',
      headers: { cookie: cookies.join('; ') },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.summary).toBeDefined();
    expect(Array.isArray(body.summary.emptyCategories)).toBe(true);
    expect(body.plantillas.length).toBeGreaterThanOrEqual(1);
    expect(body.plantillas[0]).toHaveProperty('ready');
    expect(body.plantillas[0].lines[0]).toHaveProperty('availableCount');

    await app.close();
  });

  it('GET /api/dev/plantillas-admin serves interactive HTML tool for browsers', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'admin-html@test.com');

    const res = await app.inject({
      method: 'GET',
      url: '/api/dev/plantillas-admin?mode=hogar',
      headers: {
        cookie: cookies.join('; '),
        accept: 'text/html,application/xhtml+xml',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(String(res.headers['content-type'])).toContain('text/html');
    expect(res.body).toContain('Plantillas Admin');
    expect(res.body).toContain('Generar mockup del asiento');
    expect(res.body).toContain('Código fuente');

    await app.close();
  });

  it('POST preview dry-runs without persisting', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'admin-preview@test.com');
    const accounts = await setupTemplateAccounts(app, cookies);
    const user = await prisma.user.findUnique({
      where: { email: 'admin-preview@test.com' },
    });
    expect(user).toBeTruthy();

    const before = await prisma.apunte.count({ where: { userId: user!.id } });

    const res = await app.inject({
      method: 'POST',
      url: '/api/dev/plantillas-admin/pagar_servicios/preview',
      headers: { cookie: cookies.join('; ') },
      payload: {
        amount: 42.5,
        concept: 'Preview only',
        lines: [
          { id: 1, accountId: accounts.servicioUserAccountId },
          { id: 2, accountId: accounts.bancoUserAccountId },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.persisted).toBe(false);
    expect(body.balanced).toBe(true);
    expect(body.lines).toHaveLength(2);

    const after = await prisma.apunte.count({ where: { userId: user!.id } });
    expect(after).toBe(before);

    await app.close();
  });
});
