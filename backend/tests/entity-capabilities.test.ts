/**
 * Integration tests: Sprint 07 — Entity capabilities (T005).
 *
 * Covers:
 * - POST /api/entities accepts and returns capabilities for organization
 * - PUT /api/entities/:id accepts and returns capabilities
 * - Invalid capability tokens are rejected with 400
 */

import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

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

describe('T005 — POST /api/entities with capabilities', () => {
  it('should create an organization with capabilities and return them', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'caps-create@test.com');

    const res = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: {
        nombre: 'Acme Corp',
        tipo: 'organization',
        capabilities: ['can_be_customer', 'is_employment_dependency'],
      },
    });

    expect(res.statusCode).toBe(201);
    const { entity } = res.json();
    expect(entity.capabilities).toEqual([
      'can_be_customer',
      'is_employment_dependency',
    ]);

    await app.close();
  });

  it('should default capabilities to an empty array when omitted', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'caps-default@test.com');

    const res = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Mariuxi', tipo: 'person' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().entity.capabilities).toEqual([]);

    await app.close();
  });

  it('should reject an invalid capability token with 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'caps-invalid@test.com');

    const res = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: {
        nombre: 'Bad Org',
        tipo: 'organization',
        capabilities: ['client'],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('client');

    await app.close();
  });
});

describe('T005 — PUT /api/entities/:id with capabilities', () => {
  it('should update capabilities on an existing organization', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'caps-update@test.com');

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Beta Org', tipo: 'organization' },
    });
    expect(createRes.statusCode).toBe(201);
    const { entity } = createRes.json();
    expect(entity.capabilities).toEqual([]);

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/entities/${entity.id}`,
      headers: { cookie: cookies.join('; ') },
      payload: { capabilities: ['can_be_supplier'] },
    });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().entity.capabilities).toEqual(['can_be_supplier']);

    await app.close();
  });

  it('should reject an invalid capability token on update with 400', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'caps-update-invalid@test.com');

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: { nombre: 'Gamma Org', tipo: 'organization' },
    });
    expect(createRes.statusCode).toBe(201);
    const { entity } = createRes.json();

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/entities/${entity.id}`,
      headers: { cookie: cookies.join('; ') },
      payload: { capabilities: ['supplier'] },
    });

    expect(updateRes.statusCode).toBe(400);
    expect(updateRes.json().error).toContain('supplier');

    await app.close();
  });
});

describe('T005 — GET /api/entities returns capabilities', () => {
  it('should include capabilities in the entity list', async () => {
    const app = await createTestApp();
    const cookies = await registerAndVerify(app, 'caps-list@test.com');

    await app.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
      payload: {
        nombre: 'Delta Org',
        tipo: 'organization',
        capabilities: ['can_be_customer'],
      },
    });

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/entities',
      headers: { cookie: cookies.join('; ') },
    });

    expect(listRes.statusCode).toBe(200);
    const { entities } = listRes.json();
    expect(entities).toHaveLength(1);
    expect(entities[0].capabilities).toEqual(['can_be_customer']);

    await app.close();
  });
});
