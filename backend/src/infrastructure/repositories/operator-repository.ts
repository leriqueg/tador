/**
 * Prisma Operator repository (013).
 */

import { prisma } from '../database.js';
import type { Operator, OperatorRole } from '../../domain/operator.js';
import type {
  CreateOperatorInput,
  OperatorRepository,
  OperatorSessionData,
} from '../../application/ports/operator-repository.js';

export type { OperatorRepository };

function mapOperator(record: {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  role: OperatorRole;
  mustChangePassword: boolean;
  passwordChangedAt: Date | null;
  blockedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Operator {
  return {
    id: record.id,
    email: record.email,
    passwordHash: record.passwordHash,
    displayName: record.displayName,
    role: record.role,
    mustChangePassword: record.mustChangePassword,
    passwordChangedAt: record.passwordChangedAt,
    blockedAt: record.blockedAt,
    lastLoginAt: record.lastLoginAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapSession(record: {
  id: string;
  operatorId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}): OperatorSessionData {
  return {
    id: record.id,
    operatorId: record.operatorId,
    token: record.token,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
  };
}

export function createOperatorRepository(): OperatorRepository {
  return {
    async count(): Promise<number> {
      return prisma.operator.count();
    },

    async findById(id: string): Promise<Operator | null> {
      const record = await prisma.operator.findUnique({ where: { id } });
      return record ? mapOperator(record) : null;
    },

    async findByEmail(email: string): Promise<Operator | null> {
      const record = await prisma.operator.findUnique({ where: { email } });
      return record ? mapOperator(record) : null;
    },

    async create(input: CreateOperatorInput): Promise<Operator> {
      const record = await prisma.operator.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash,
          displayName: input.displayName ?? null,
          role: input.role,
          mustChangePassword: input.mustChangePassword,
        },
      });
      return mapOperator(record);
    },

    async update(operator: Operator): Promise<Operator> {
      const record = await prisma.operator.update({
        where: { id: operator.id },
        data: {
          email: operator.email,
          passwordHash: operator.passwordHash,
          displayName: operator.displayName,
          role: operator.role,
          mustChangePassword: operator.mustChangePassword,
          passwordChangedAt: operator.passwordChangedAt,
          blockedAt: operator.blockedAt,
          lastLoginAt: operator.lastLoginAt,
        },
      });
      return mapOperator(record);
    },

    async createSession(input: {
      operatorId: string;
      token: string;
      expiresAt: Date;
      ipAddress?: string | null;
      userAgent?: string | null;
    }): Promise<OperatorSessionData> {
      const record = await prisma.operatorSession.create({
        data: {
          operatorId: input.operatorId,
          token: input.token,
          expiresAt: input.expiresAt,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
      return mapSession(record);
    },

    async findSessionByToken(token: string): Promise<OperatorSessionData | null> {
      const record = await prisma.operatorSession.findUnique({ where: { token } });
      if (!record) return null;
      if (record.expiresAt < new Date()) {
        await prisma.operatorSession.delete({ where: { id: record.id } });
        return null;
      }
      return mapSession(record);
    },

    async deleteSession(token: string): Promise<void> {
      await prisma.operatorSession.deleteMany({ where: { token } });
    },

    async deleteAllSessionsForOperator(operatorId: string): Promise<void> {
      await prisma.operatorSession.deleteMany({ where: { operatorId } });
    },
  };
}
