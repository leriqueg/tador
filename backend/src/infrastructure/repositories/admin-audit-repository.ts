/**
 * Prisma AdminAuditLog repository (013).
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../database.js';
import type {
  AdminAuditAppendInput,
  AdminAuditLogEntry,
  AdminAuditLogRepository,
} from '../../application/ports/admin-audit-repository.js';

export type { AdminAuditLogRepository };

function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

export function createAdminAuditRepository(): AdminAuditLogRepository {
  return {
    async append(input: AdminAuditAppendInput): Promise<AdminAuditLogEntry> {
      const record = await prisma.adminAuditLog.create({
        data: {
          operatorId: input.operatorId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId ?? null,
          payloadBefore:
            input.payloadBefore === undefined
              ? undefined
              : toJson(input.payloadBefore),
          payloadAfter:
            input.payloadAfter === undefined
              ? undefined
              : toJson(input.payloadAfter),
          metadata: input.metadata === undefined ? undefined : toJson(input.metadata),
        },
      });
      return {
        id: record.id,
        operatorId: record.operatorId,
        action: record.action,
        targetType: record.targetType,
        targetId: record.targetId,
        payloadBefore: record.payloadBefore,
        payloadAfter: record.payloadAfter,
        metadata: record.metadata,
        createdAt: record.createdAt,
      };
    },

    async list(query) {
      const page = Math.max(1, query.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 50));
      const skip = (page - 1) * pageSize;
      const [total, rows] = await Promise.all([
        prisma.adminAuditLog.count(),
        prisma.adminAuditLog.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      return {
        total,
        entries: rows.map((record) => ({
          id: record.id,
          operatorId: record.operatorId,
          action: record.action,
          targetType: record.targetType,
          targetId: record.targetId,
          payloadBefore: record.payloadBefore,
          payloadAfter: record.payloadAfter,
          metadata: record.metadata,
          createdAt: record.createdAt,
        })),
      };
    },
  };
}
