/**
 * Idempotent bootstrap of the first superadmin operator (013).
 * See specs/013-admin-platform/auth-bootstrap.md.
 */

import { randomBytes } from 'node:crypto';
import type { PasswordHasher } from '../../src/application/ports/password-hasher.js';
import type { OperatorRepository } from '../../src/application/ports/operator-repository.js';

export interface BootstrapOperatorEnv {
  NODE_ENV?: string;
  APP_ENV?: string;
  ADMIN_INITIAL_EMAIL?: string;
  ADMIN_INITIAL_PASSWORD?: string;
  /** @deprecated alias for ADMIN_INITIAL_EMAIL */
  ADMIN_BOOTSTRAP_EMAIL?: string;
  /** @deprecated alias for ADMIN_INITIAL_PASSWORD */
  ADMIN_BOOTSTRAP_PASSWORD?: string;
}

export interface BootstrapOperatorResult {
  created: boolean;
  email?: string;
  generatedPassword?: string;
  skippedReason?: string;
}

function isProductionLike(env: BootstrapOperatorEnv): boolean {
  const appEnv = (env.APP_ENV ?? '').toLowerCase();
  if (appEnv === 'staging' || appEnv === 'production') return true;
  return env.NODE_ENV === 'production';
}

export async function ensureBootstrapOperator(
  operatorRepo: OperatorRepository,
  passwordHasher: PasswordHasher,
  env: BootstrapOperatorEnv = process.env,
  log: (msg: string) => void = console.log,
): Promise<BootstrapOperatorResult> {
  const existing = await operatorRepo.count();
  if (existing > 0) {
    return { created: false, skippedReason: 'operators_exist' };
  }

  const prodLike = isProductionLike(env);
  const email =
    env.ADMIN_INITIAL_EMAIL ??
    env.ADMIN_BOOTSTRAP_EMAIL ??
    (prodLike ? undefined : 'admin@localhost');

  if (!email) {
    throw new Error(
      'ADMIN_INITIAL_EMAIL is required when bootstrapping operators in staging/production',
    );
  }

  let password =
    env.ADMIN_INITIAL_PASSWORD ?? env.ADMIN_BOOTSTRAP_PASSWORD ?? undefined;
  let generatedPassword: string | undefined;
  if (!password) {
    if (prodLike) {
      generatedPassword = randomBytes(24).toString('base64url');
      password = generatedPassword;
    } else {
      password = 'dev-admin';
    }
  }

  const passwordHash = await passwordHasher.hash(password);
  await operatorRepo.create({
    email,
    passwordHash,
    displayName: 'Bootstrap Superadmin',
    role: 'superadmin',
    mustChangePassword: prodLike,
  });

  if (generatedPassword) {
    log(
      `[admin-bootstrap] Created superadmin ${email}. One-time password: ${generatedPassword}`,
    );
  } else if (!prodLike) {
    log(`[admin-bootstrap] Created superadmin ${email} (dev credentials).`);
  } else {
    log(`[admin-bootstrap] Created superadmin ${email} (password from vault).`);
  }

  return {
    created: true,
    email,
    generatedPassword,
  };
}
