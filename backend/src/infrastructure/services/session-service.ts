/**
 * Session service — DB-backed cookie sessions via Prisma.
 */

import { prisma } from '../database.js';
import { generateSessionToken, tokenExpiresAt } from '../../domain/auth.js';

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface SessionService {
  create(userId: string): Promise<SessionData>;
  findByToken(token: string): Promise<SessionData | null>;
  delete(token: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}

export function createSessionService(): SessionService {
  return {
    async create(userId: string): Promise<SessionData> {
      const token = generateSessionToken();
      const expiresAt = tokenExpiresAt(7);

      const record = await prisma.session.create({
        data: {
          userId,
          token,
          expiresAt,
        },
      });

      return {
        id: record.id,
        userId: record.userId,
        token: record.token,
        expiresAt: record.expiresAt,
      };
    },

    async findByToken(token: string): Promise<SessionData | null> {
      const record = await prisma.session.findUnique({
        where: { token },
      });

      if (!record) return null;

      // Check if session is expired
      if (record.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: record.id } });
        return null;
      }

      return {
        id: record.id,
        userId: record.userId,
        token: record.token,
        expiresAt: record.expiresAt,
      };
    },

    async delete(token: string): Promise<void> {
      await prisma.session.deleteMany({
        where: { token },
      });
    },

    async deleteAllForUser(userId: string): Promise<void> {
      await prisma.session.deleteMany({
        where: { userId },
      });
    },
  };
}
