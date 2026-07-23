/**
 * Prisma admin statistics read repository (013 US5).
 */

import type { AdminStatisticsReadRepository } from '../../application/ports/admin-statistics-read-repository.js';
import { prisma } from '../database.js';

export function createAdminStatisticsReadRepository(): AdminStatisticsReadRepository {
  return {
    async listUserCreatedAts(from, toExclusive) {
      const rows = await prisma.user.findMany({
        where: { createdAt: { gte: from, lt: toExclusive } },
        select: { createdAt: true },
      });
      return rows.map((r) => r.createdAt);
    },

    async listSessionCreatedAts(from, toExclusive) {
      return prisma.session.findMany({
        where: { createdAt: { gte: from, lt: toExclusive } },
        select: { createdAt: true, userId: true },
      });
    },

    async listApunteCreatedAts(from, toExclusive) {
      const rows = await prisma.apunte.findMany({
        where: { createdAt: { gte: from, lt: toExclusive } },
        select: { createdAt: true },
      });
      return rows.map((r) => r.createdAt);
    },
  };
}
