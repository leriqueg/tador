/**
 * Auth domain service.
 * Handles password hashing, verification, and token generation.
 */

import * as crypto from 'node:crypto';

// Argon2 is imported dynamically to keep domain layer pure.
// The actual hash/verify implementation is in infrastructure,
// but the domain defines the contract.

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateRecoveryToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateSessionToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Calculate token expiration date.
 * Default: 7 days from now.
 */
export function tokenExpiresAt(days: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
