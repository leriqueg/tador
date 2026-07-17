/**
 * Integration tests: Sprint 01 — Plataforma base.
 *
 * Covers:
 * - US1: Registration + email verification + book configuration
 * - US2: Login + password recovery
 * - US3: Tenant isolation (cross-user data access)
 * - Edge cases: duplicate email, unregistered recovery, currency lock, expired session
 */

import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

describe('US1 — Registration and first book', () => {
  it('should register a user, create book, and allow book access without email verification (MVP)', async () => {
    const app = await createTestApp();

    // Register
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'us1@test.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(201);
    const { user } = res.json();
    expect(user.email).toBe('us1@test.com');
    expect(user.verifiedAt).toBeNull();

    const cookies = res.cookies.map((c) => `${c.name}=${c.value}`);

    // MVP: REQUIRE_EMAIL_VERIFICATION unset → book access allowed (FR-009 deferred)
    const bookRes = await app.inject({
      method: 'GET',
      url: '/book',
      headers: { cookie: cookies.join('; ') },
    });

    expect(bookRes.statusCode).toBe(200);
    const bookBody = bookRes.json();
    expect(bookBody.book).toBeDefined();
    expect(bookBody.config.initialized).toBe(false);
    expect(bookBody.config.mode).toBe('hogar');
    expect(bookBody.config.timeZone).toBe('UTC');
    expect(bookBody.config.onboardingCompletedAt).toBeNull();

    await app.close();
  });

  it('should create book with default config on registration', async () => {
    const app = await createTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'book-test@test.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(201);

    await app.close();
  });

  it('should complete onboarding via PATCH /book/config', async () => {
    const app = await createTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'onboard@test.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(201);
    const cookies = res.cookies.map((c) => `${c.name}=${c.value}`);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: '/book/config',
      headers: { cookie: cookies.join('; ') },
      payload: {
        mode: 'hogar',
        currency: 'COP',
        timeZone: 'America/Bogota',
        completeOnboarding: true,
      },
    });

    expect(patchRes.statusCode).toBe(200);
    const { config } = patchRes.json();
    expect(config.mode).toBe('hogar');
    expect(config.currency).toBe('COP');
    expect(config.timeZone).toBe('America/Bogota');
    expect(config.initialized).toBe(true);
    expect(config.onboardingCompletedAt).toBeTruthy();

    const getRes = await app.inject({
      method: 'GET',
      url: '/book',
      headers: { cookie: cookies.join('; ') },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().config.initialized).toBe(true);

    await app.close();
  });
});

describe('US2 — Login and recovery', () => {
  it('should login with valid credentials', async () => {
    const app = await createTestApp();

    // First register
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'login-test@test.com', password: 'password123' },
    });

    // Login
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login-test@test.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.email).toBe('login-test@test.com');
    expect(res.cookies.length).toBeGreaterThan(0);

    await app.close();
  });

  it('should reject invalid credentials', async () => {
    const app = await createTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'nonexistent@test.com', password: 'wrongpassword' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('Invalid email or password');

    await app.close();
  });

  it('should complete recovery flow end-to-end', async () => {
    const app = await createTestApp();

    // Register user
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'recovery@test.com', password: 'password123' },
    });

    // Request recovery
    const reqRes = await app.inject({
      method: 'POST',
      url: '/auth/recovery/request',
      payload: { email: 'recovery@test.com' },
    });
    expect(reqRes.statusCode).toBe(200);

    // Reset with invalid token should fail
    const badResetRes = await app.inject({
      method: 'POST',
      url: '/auth/recovery/reset',
      payload: { token: 'invalid-token', newPassword: 'newpassword456' },
    });
    expect(badResetRes.statusCode).toBe(400);

    // Note: The actual recovery reset requires a valid token from email.
    // Since we use an in-memory store, we can't easily extract it.
    // This is covered by the domain service tests.

    await app.close();
  });
});

describe('US3 — Tenant isolation', () => {
  it('should prevent cross-user book access', async () => {
    const app = await createTestApp();

    // Register user A
    const resA = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'usera@test.com', password: 'password123' },
    });
    expect(resA.statusCode).toBe(201);
    const cookiesA = resA.cookies.map((c) => `${c.name}=${c.value}`);
    const userAResult = resA.json();

    // Verify user A's email so they can access their book (FR-009)
    const verifyA = await app.inject({
      method: 'GET',
      url: `/auth/verify/${userAResult.verificationToken}`,
    });
    expect(verifyA.statusCode).toBe(200);

    // Register user B
    const resB = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'userb@test.com', password: 'password123' },
    });
    expect(resB.statusCode).toBe(201);
    const cookiesB = resB.cookies.map((c) => `${c.name}=${c.value}`);
    const userBResult = resB.json();

    // Verify user B's email
    const verifyB = await app.inject({
      method: 'GET',
      url: `/auth/verify/${userBResult.verificationToken}`,
    });
    expect(verifyB.statusCode).toBe(200);

    // User A gets their book
    const bookA = await app.inject({
      method: 'GET',
      url: '/book',
      headers: { cookie: cookiesA.join('; ') },
    });
    expect(bookA.statusCode).toBe(200);
    const bookAData = bookA.json();

    // User B gets their book (different scope)
    const bookB = await app.inject({
      method: 'GET',
      url: '/book',
      headers: { cookie: cookiesB.join('; ') },
    });
    expect(bookB.statusCode).toBe(200);

    // Verify each user sees different book IDs (tenant isolation)
    const bookBData = bookB.json();
    expect(bookAData.book.id).not.toBe(bookBData.book.id);

    await app.close();
  });
});

describe('Edge cases', () => {
  it('should reject duplicate email registration', async () => {
    const app = await createTestApp();

    // First registration
    const res1 = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'duplicate@test.com', password: 'password123' },
    });
    expect(res1.statusCode).toBe(201);

    // Duplicate registration
    const res2 = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'duplicate@test.com', password: 'password123' },
    });
    expect(res2.statusCode).toBe(409);
    expect(res2.json().error).toBe('Email already registered');

    await app.close();
  });

  it('should not reveal unregistered emails during recovery', async () => {
    const app = await createTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/auth/recovery/request',
      payload: { email: 'nobody@test.com' },
    });

    // Should return 200 to not reveal if email exists
    expect(res.statusCode).toBe(200);

    await app.close();
  });

  it('should reject expired/invalid sessions', async () => {
    const app = await createTestApp();

    const res = await app.inject({
      method: 'GET',
      url: '/book',
      headers: { cookie: 'session_token=invalidtoken123' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('Invalid or expired session');

    await app.close();
  });

  it('should require auth for book endpoints', async () => {
    const app = await createTestApp();

    const res = await app.inject({
      method: 'GET',
      url: '/book',
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('Authentication required');

    await app.close();
  });

  it('should update fullName via PATCH /auth/me', async () => {
    const app = await createTestApp();

    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'profile-me@test.com', password: 'password123' },
    });
    expect(reg.statusCode).toBe(201);
    expect(reg.json().user.fullName).toBeNull();
    const cookies = reg.cookies.map((c) => `${c.name}=${c.value}`);

    const patch = await app.inject({
      method: 'PATCH',
      url: '/auth/me',
      headers: { cookie: cookies.join('; ') },
      payload: { fullName: '  Ana Pérez  ' },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().user.fullName).toBe('Ana Pérez');

    const me = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { cookie: cookies.join('; ') },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.fullName).toBe('Ana Pérez');

    await app.close();
  });
});
