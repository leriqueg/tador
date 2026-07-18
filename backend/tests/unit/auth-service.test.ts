/**
 * Unit tests for AuthApplicationService with fakes (no Argon2 / Prisma).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthApplicationService } from '../../src/application/auth-service.js';
import type { UserRepository } from '../../src/application/ports/user-repository.js';
import type { BookRepository } from '../../src/application/ports/book-repository.js';
import type { SessionService } from '../../src/application/ports/session-service.js';
import type { EmailService } from '../../src/application/ports/email-service.js';
import type { PasswordHasher } from '../../src/application/ports/password-hasher.js';
import type { User } from '../../src/domain/user.js';
import type { Book, BookConfig } from '../../src/domain/book.js';

function createFakes() {
  const users = new Map<string, User>();
  const byEmail = new Map<string, string>();
  let userSeq = 0;
  let sessionSeq = 0;
  const sessions = new Map<string, { id: string; userId: string; token: string; expiresAt: Date }>();
  const emails: Array<{ type: string; to: string; token: string }> = [];

  const userRepo: UserRepository = {
    async findById(id) {
      return users.get(id) ?? null;
    },
    async findByEmail(email) {
      const id = byEmail.get(email);
      return id ? (users.get(id) ?? null) : null;
    },
    async create(input) {
      const user: User = {
        id: `u${++userSeq}`,
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: null,
        verifiedAt: null,
        createdAt: new Date(),
      };
      users.set(user.id, user);
      byEmail.set(user.email, user.id);
      return { ...user };
    },
    async update(user) {
      users.set(user.id, { ...user });
      byEmail.set(user.email, user.id);
      return { ...user };
    },
  };

  const bookRepo: BookRepository = {
    async findById() {
      return null;
    },
    async findByUserId() {
      return null;
    },
    async create(userId) {
      const book: Book = { id: `b-${userId}`, userId, createdAt: new Date() };
      return book;
    },
    async getConfig() {
      return null as BookConfig | null;
    },
    async upsertConfig() {
      throw new Error('not used');
    },
  };

  const sessionService: SessionService = {
    async create(userId) {
      const token = `tok-${++sessionSeq}`;
      const data = {
        id: `s${sessionSeq}`,
        userId,
        token,
        expiresAt: new Date(Date.now() + 86400000),
      };
      sessions.set(token, data);
      return data;
    },
    async findByToken(token) {
      return sessions.get(token) ?? null;
    },
    async delete(token) {
      sessions.delete(token);
    },
    async deleteAllForUser(userId) {
      for (const [token, s] of sessions) {
        if (s.userId === userId) sessions.delete(token);
      }
    },
  };

  const emailService: EmailService = {
    async sendVerificationEmail(to, token) {
      emails.push({ type: 'verify', to, token });
    },
    async sendRecoveryEmail(to, token) {
      emails.push({ type: 'recovery', to, token });
    },
  };

  const passwordHasher: PasswordHasher = {
    async hash(password) {
      return `hashed:${password}`;
    },
    async verify(hash, password) {
      return hash === `hashed:${password}`;
    },
  };

  return {
    auth: createAuthApplicationService(
      userRepo,
      bookRepo,
      sessionService,
      emailService,
      passwordHasher,
    ),
    emails,
    users,
  };
}

describe('AuthApplicationService', () => {
  let fakes: ReturnType<typeof createFakes>;

  beforeEach(() => {
    fakes = createFakes();
  });

  it('registers a user, hashes password, and returns a session', async () => {
    const result = await fakes.auth.register({
      email: 'a@example.com',
      password: 'secret',
    });
    expect(result.user.email).toBe('a@example.com');
    expect(result.user.passwordHash).toBe('hashed:secret');
    expect(result.sessionToken).toMatch(/^tok-/);
    expect(result.verificationToken).toBeTruthy();
    expect(fakes.emails).toHaveLength(1);
  });

  it('rejects duplicate registration', async () => {
    await fakes.auth.register({ email: 'a@example.com', password: 'x' });
    await expect(
      fakes.auth.register({ email: 'a@example.com', password: 'y' }),
    ).rejects.toThrow('Email already registered');
  });

  it('logs in with correct password', async () => {
    await fakes.auth.register({ email: 'a@example.com', password: 'secret' });
    const result = await fakes.auth.login({
      email: 'a@example.com',
      password: 'secret',
    });
    expect(result.user.email).toBe('a@example.com');
    expect(result.sessionToken).toBeTruthy();
  });

  it('rejects login with wrong password', async () => {
    await fakes.auth.register({ email: 'a@example.com', password: 'secret' });
    await expect(
      fakes.auth.login({ email: 'a@example.com', password: 'wrong' }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('resets password and invalidates sessions', async () => {
    const reg = await fakes.auth.register({
      email: 'a@example.com',
      password: 'old',
    });
    await fakes.auth.requestRecovery('a@example.com');
    const recovery = fakes.emails.find((e) => e.type === 'recovery');
    expect(recovery).toBeTruthy();

    await fakes.auth.resetPassword(recovery!.token, 'newpass');
    await expect(
      fakes.auth.login({ email: 'a@example.com', password: 'old' }),
    ).rejects.toThrow('Invalid email or password');

    const login = await fakes.auth.login({
      email: 'a@example.com',
      password: 'newpass',
    });
    expect(login.sessionToken).toBeTruthy();
    expect(login.sessionToken).not.toBe(reg.sessionToken);
  });
});
