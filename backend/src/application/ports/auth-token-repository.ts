/**
 * Port: one-time auth tokens (email verification / password recovery).
 */

export type AuthTokenPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RECOVERY';

export interface AuthTokenRecord {
  id: string;
  userId: string;
  purpose: AuthTokenPurpose;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
}

export interface AuthTokenRepository {
  /** Replace active tokens of the same purpose for the user, then create. */
  issue(
    userId: string,
    purpose: AuthTokenPurpose,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<AuthTokenRecord>;

  /**
   * Atomically claim an unused, unexpired token.
   * Returns null if missing, expired, or already consumed.
   */
  consume(
    tokenHash: string,
    purpose: AuthTokenPurpose,
    now?: Date,
  ): Promise<AuthTokenRecord | null>;
}
