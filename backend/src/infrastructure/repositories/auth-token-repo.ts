/**
 * Prisma adapter for AuthTokenRepository.
 */

import { prisma } from '../database.js';
import type {
  AuthTokenPurpose,
  AuthTokenRecord,
  AuthTokenRepository,
} from '../../application/ports/auth-token-repository.js';

export function createAuthTokenRepository(): AuthTokenRepository {
  return {
    async issue(userId, purpose, tokenHash, expiresAt): Promise<AuthTokenRecord> {
      await prisma.authToken.updateMany({
        where: {
          userId,
          purpose,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });

      const record = await prisma.authToken.create({
        data: {
          userId,
          purpose,
          tokenHash,
          expiresAt,
        },
      });

      return mapRecord(record);
    },

    async consume(tokenHash, purpose, now = new Date()): Promise<AuthTokenRecord | null> {
      const existing = await prisma.authToken.findFirst({
        where: {
          tokenHash,
          purpose,
          consumedAt: null,
          expiresAt: { gt: now },
        },
      });

      if (!existing) {
        return null;
      }

      const updated = await prisma.authToken.updateMany({
        where: {
          id: existing.id,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });

      if (updated.count === 0) {
        return null;
      }

      return mapRecord({ ...existing, consumedAt: now });
    },
  };
}

function mapRecord(record: {
  id: string;
  userId: string;
  purpose: AuthTokenPurpose;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
}): AuthTokenRecord {
  return {
    id: record.id,
    userId: record.userId,
    purpose: record.purpose,
    tokenHash: record.tokenHash,
    expiresAt: record.expiresAt,
    consumedAt: record.consumedAt,
  };
}
