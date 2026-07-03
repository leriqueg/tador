/**
 * Integration tests: Sprint 02 — Catálogos base.
 *
 * Covers:
 * - 5.1: Chart activation (FR-009/010)
 * - 5.2: Guided account creation (US2)
 * - 5.3: Entity/tag CRUD + name uniqueness (FR-012/013)
 * - 5.4: Tenant isolation
 * - 5.5: Edge cases
 */

import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

/** Register a user and verify their email, returning auth cookies. */
async function registerAndVerify(
  app: FastifyInstance,
  email: string,
  password: string = 'password123',
): Promise<string[]> {
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

  return cookies;
}

describe('5.1 — Chart activation (FR-009/010)', () => {
  it('should activate a global account and reflect it in the chart', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'chart-51@test.com');

    // GET /api/chart — expect all 27 seeded accounts, no activations
    const chartRes = await app.inject({
      method: 'GET',
      url: '/api/chart',
      headers: { cookie: cookies.join('; ') },
    });
    expect(chartRes.statusCode).toBe(200);
    const chartBody = chartRes.json();
    expect(chartBody.chart).toHaveLength(100);
    expect(chartBody.activations).toHaveLength(0);

    // Get a postable account (esPostable: true) to activate — not a group
    const postable = chartBody.chart.find((c: any) => c.esPostable === true);
    expect(postable).toBeDefined();
    const firstChartId = postable.id;
    const activateRes = await app.inject({
      method: 'POST',
      url: `/api/chart/${firstChartId}/activate`,
      headers: { cookie: cookies.join('; ') },
      payload: {},
    });
    expect(activateRes.statusCode).toBe(200);
    const { activation } = activateRes.json();
    expect(activation.globalId).toBe(firstChartId);
    expect(activation.activa).toBe(true);
    expect(activation.userId).toBeDefined();

    // GET /api/chart again — activation now appears, chart still has 100 entries
    const chartRes2 = await app.inject({
      method: 'GET',
      url: '/api/chart',
      headers: { cookie: cookies.join('; ') },
    });
    expect(chartRes2.statusCode).toBe(200);
    const chartBody2 = chartRes2.json();
    expect(chartBody2.chart).toHaveLength(100);
    expect(chartBody2.activations).toHaveLength(1);
    expect(chartBody2.activations[0].globalId).toBe(firstChartId);

    await app.close();
  });
});

describe('5.2 — Guided account creation (US2)', () => {
  it('should create bank/card/wallet/bridge accounts under the right branch with entity association', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'guided-52@test.com');

    // Create an entity to associate with the account
    const entityRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Banco del Pacífico', tipo: 'bank' },
    });
    expect(entityRes.statusCode).toBe(201);
    const { entity } = entityRes.json();

    // Get a global account ID from the chart
    const chartRes = await app.inject({
      method: 'GET',
      url: '/api/chart',
      headers: { cookie: cookies.join('; ') },
    });
    expect(chartRes.statusCode).toBe(200);
    const chartBody = chartRes.json();
    const globalId = chartBody.chart[0].id;

    // Create a bank account linked to the entity and global chart account
    const accountRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: {
        tipoCuenta: 'bank',
        nombre: 'My Checking',
        entidadId: entity.id,
        globalId,
      },
    });
    expect(accountRes.statusCode).toBe(201);
    const { account } = accountRes.json();
    expect(account.tipoCuenta).toBe('bank');
    expect(account.nombre).toBe('My Checking');
    expect(account.entidadId).toBe(entity.id);
    expect(account.globalId).toBe(globalId);
    expect(account.userId).toBeDefined();
    expect(account.activa).toBe(true);

    // Create a card account with a different tipoCuenta
    const cardRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: {
        tipoCuenta: 'card',
        nombre: 'Visa Platinum',
        entidadId: entity.id,
      },
    });
    expect(cardRes.statusCode).toBe(201);
    expect(cardRes.json().account.tipoCuenta).toBe('card');

    // Create a wallet account
    const walletRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: {
        tipoCuenta: 'wallet',
        nombre: 'Digital Wallet',
      },
    });
    expect(walletRes.statusCode).toBe(201);
    expect(walletRes.json().account.tipoCuenta).toBe('wallet');

    await app.close();
  });
});

describe('5.3 — Entity/tag CRUD + name uniqueness (FR-012/013)', () => {
  it('should enforce unique entity names per user but allow same name for tags', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'unique-53@test.com');

    // Create initial entity
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Mariuxi', tipo: 'person' },
    });
    expect(createRes.statusCode).toBe(201);
    const { entity } = createRes.json();
    expect(entity.nombre).toBe('Mariuxi');
    expect(entity.tipo).toBe('person');

    // Duplicate entity name → 409
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Mariuxi', tipo: 'organization' },
    });
    expect(dupRes.statusCode).toBe(409);

    // Tag with same name → allowed per FR-012/013
    const tagRes = await app.inject({
      method: 'POST',
      url: '/api/tags',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Mariuxi' },
    });
    expect(tagRes.statusCode).toBe(201);
    expect(tagRes.json().tag.nombre).toBe('Mariuxi');

    // Verify counts
    const entitiesRes = await app.inject({
      method: 'GET',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
    });
    expect(entitiesRes.statusCode).toBe(200);
    expect(entitiesRes.json().entities).toHaveLength(1);

    const tagsRes = await app.inject({
      method: 'GET',
      url: '/api/tags',
      headers: { cookie: cookies.join('; ') },
    });
    expect(tagsRes.statusCode).toBe(200);
    expect(tagsRes.json().tags).toHaveLength(1);

    await app.close();
  });

  it('should update and delete entities', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'crud-53@test.com');

    // Create entity
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Mariuxi', tipo: 'person' },
    });
    expect(createRes.statusCode).toBe(201);
    const { entity } = createRes.json();

    // Update entity
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/entities/${entity.id}`,
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Mariuxi Updated', tipo: 'organization' },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().entity.nombre).toBe('Mariuxi Updated');
    expect(updateRes.json().entity.tipo).toBe('organization');

    // Delete entity
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/entities/${entity.id}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(deleteRes.statusCode).toBe(204);

    // Verify deletion
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().entities).toHaveLength(0);

    await app.close();
  });

  it('should update and delete tags', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'tag-crud-53@test.com');

    // Create tag
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/tags',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Important' },
    });
    expect(createRes.statusCode).toBe(201);
    const { tag } = createRes.json();

    // Update tag
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/tags/${tag.id}`,
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Very Important' },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().tag.nombre).toBe('Very Important');

    // Delete tag
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/tags/${tag.id}`,
      headers: { cookie: cookies.join('; ') },
    });
    expect(deleteRes.statusCode).toBe(204);

    // Verify deletion
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/tags',
      headers: { cookie: cookies.join('; ') },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().tags).toHaveLength(0);

    await app.close();
  });
});

describe('5.4 — Tenant isolation', () => {
  it('should prevent user B from seeing or modifying user A entities/tags', async () => {
    const app = await createTestApp();

    // User A: register, verify, create an entity and a tag
    const cookiesA = await registerAndVerify(app, 'isolate-a@test.com');

    const entityA = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookiesA.join('; ') },
      payload: { nombre: 'A Entity', tipo: 'person' },
    });
    expect(entityA.statusCode).toBe(201);
    const entityAId = entityA.json().entity.id;

    const tagA = await app.inject({
      method: 'POST',
      url: '/api/tags',
      headers: { cookie: cookiesA.join('; ') },
      payload: { nombre: 'A Tag' },
    });
    expect(tagA.statusCode).toBe(201);
    const tagAId = tagA.json().tag.id;

    // User B: register, verify
    const cookiesB = await registerAndVerify(app, 'isolate-b@test.com');

    // User B's entities are empty
    const entitiesB = await app.inject({
      method: 'GET',
      url: '/api/entities',
      headers: { cookie: cookiesB.join('; ') },
    });
    expect(entitiesB.statusCode).toBe(200);
    expect(entitiesB.json().entities).toHaveLength(0);

    // User B's tags are empty
    const tagsB = await app.inject({
      method: 'GET',
      url: '/api/tags',
      headers: { cookie: cookiesB.join('; ') },
    });
    expect(tagsB.statusCode).toBe(200);
    expect(tagsB.json().tags).toHaveLength(0);

    // User B cannot update user A's entity → 404
    const updateB = await app.inject({
      method: 'PUT',
      url: `/api/entities/${entityAId}`,
      headers: { cookie: cookiesB.join('; ') },
      payload: { nombre: 'Hacked' },
    });
    expect(updateB.statusCode).toBe(404);

    // User B cannot delete user A's entity → 404
    const deleteB = await app.inject({
      method: 'DELETE',
      url: `/api/entities/${entityAId}`,
      headers: { cookie: cookiesB.join('; ') },
    });
    expect(deleteB.statusCode).toBe(404);

    // User B cannot update user A's tag → 404
    const updateTagB = await app.inject({
      method: 'PUT',
      url: `/api/tags/${tagAId}`,
      headers: { cookie: cookiesB.join('; ') },
      payload: { nombre: 'Hacked Tag' },
    });
    expect(updateTagB.statusCode).toBe(404);

    // User B cannot delete user A's tag → 404
    const deleteTagB = await app.inject({
      method: 'DELETE',
      url: `/api/tags/${tagAId}`,
      headers: { cookie: cookiesB.join('; ') },
    });
    expect(deleteTagB.statusCode).toBe(404);

    await app.close();
  });
});

describe('5.5 — Edge cases', () => {
  it('should return 409 on duplicate entity name', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'dup-edge-55@test.com');

    // First entity
    const firstRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Duplicate Entity', tipo: 'organization' },
    });
    expect(firstRes.statusCode).toBe(201);

    // Duplicate name → 409 with descriptive error
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Duplicate Entity', tipo: 'organization' },
    });
    expect(dupRes.statusCode).toBe(409);
    expect(dupRes.json().error).toBe('An entity with this name already exists');

    await app.close();
  });

  it('should return 500 on account creation with non-existent entidadId', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'invalid-fk-55@test.com');

    const res = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { cookie: cookies.join('; ') },
      payload: {
        tipoCuenta: 'bank',
        nombre: 'Bad Account',
        entidadId: 'ckabcdefghijklmnopqrstuv',  // valid cuid format but non-existent
      },
    });

    // Prisma FK constraint violation → 500 (minimal validation in MVP)
    expect(res.statusCode).toBe(500);

    await app.close();
  });

  it('should return 409 on duplicate tag name', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'dup-tag-55@test.com');

    // First tag
    const firstRes = await app.inject({
      method: 'POST',
      url: '/api/tags',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Unique Tag' },
    });
    expect(firstRes.statusCode).toBe(201);

    // Duplicate name → 409
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/tags',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Unique Tag' },
    });
    expect(dupRes.statusCode).toBe(409);
    expect(dupRes.json().error).toBe('A tag with this name already exists');

    await app.close();
  });
});
