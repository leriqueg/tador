/**
 * Prisma admin user query repository (013).
 */

import { prisma } from '../database.js';
import type {
  AdminUserDetail,
  AdminUserListQuery,
  AdminUserQueryRepository,
} from '../../application/ports/admin-user-query-repository.js';

export function createAdminUserQueryRepository(): AdminUserQueryRepository {
  return {
    async list(query: AdminUserListQuery) {
      const page = Math.max(1, query.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
      const where: {
        email?: { contains: string; mode: 'insensitive' };
        blockedAt?: null | { not: null };
      } = {};
      if (query.q?.trim()) {
        where.email = { contains: query.q.trim(), mode: 'insensitive' };
      }
      if (query.blocked === 'true') {
        where.blockedAt = { not: null };
      } else if (query.blocked === 'false') {
        where.blockedAt = null;
      }

      const [total, records] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return {
        total,
        users: records.map((r) => ({
          id: r.id,
          email: r.email,
          fullName: r.fullName,
          verifiedAt: r.verifiedAt,
          blockedAt: r.blockedAt,
          blockedReason: r.blockedReason,
          createdAt: r.createdAt,
        })),
      };
    },

    async getDetail(id: string): Promise<AdminUserDetail | null> {
      const record = await prisma.user.findUnique({
        where: { id },
        include: {
          books: { take: 1, select: { id: true } },
          _count: { select: { sessions: true } },
        },
      });
      if (!record) return null;
      return {
        id: record.id,
        email: record.email,
        fullName: record.fullName,
        verifiedAt: record.verifiedAt,
        blockedAt: record.blockedAt,
        blockedReason: record.blockedReason,
        createdAt: record.createdAt,
        sessionCount: record._count.sessions,
        bookId: record.books[0]?.id ?? null,
      };
    },
  };
}
