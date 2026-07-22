/**
 * ensureBootstrapOperator (T030).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../src/infrastructure/database.js';
import { createOperatorRepository } from '../../src/infrastructure/repositories/operator-repository.js';
import { createArgon2PasswordHasher } from '../../src/infrastructure/services/argon2-password-hasher.js';
import { ensureBootstrapOperator } from '../../prisma/seed/ensure-bootstrap-operator.js';

describe('ensureBootstrapOperator', () => {
  beforeEach(async () => {
    await prisma.adminAuditLog.deleteMany();
    await prisma.operatorSession.deleteMany();
    await prisma.operator.deleteMany();
  });

  it('T030 creates superadmin when empty', async () => {
    const result = await ensureBootstrapOperator(
      createOperatorRepository(),
      createArgon2PasswordHasher(),
      {
        NODE_ENV: 'development',
        ADMIN_INITIAL_EMAIL: 'boot@localhost',
        ADMIN_INITIAL_PASSWORD: 'dev-admin',
      },
      () => undefined,
    );
    expect(result.created).toBe(true);
    expect(result.email).toBe('boot@localhost');
    const op = await createOperatorRepository().findByEmail('boot@localhost');
    expect(op?.role).toBe('superadmin');
    expect(op?.mustChangePassword).toBe(false);
  });

  it('T030 skips when operator exists', async () => {
    const hasher = createArgon2PasswordHasher();
    const repo = createOperatorRepository();
    await repo.create({
      email: 'existing@localhost',
      passwordHash: await hasher.hash('dev-admin'),
      role: 'admin',
      mustChangePassword: false,
    });

    const result = await ensureBootstrapOperator(
      repo,
      hasher,
      { NODE_ENV: 'development', ADMIN_INITIAL_EMAIL: 'other@localhost' },
      () => undefined,
    );
    expect(result.created).toBe(false);
    expect(result.skippedReason).toBe('operators_exist');
    expect(await repo.count()).toBe(1);
  });
});
