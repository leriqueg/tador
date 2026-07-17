/**
 * Report routes: PyG, balance sheet, and position reports.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import type { AccountingService } from '../../application/accounting-service.js';
import type { DashboardReportService } from '../../application/dashboard-report-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';

/** Canonical query is `year`; `año` remains a short-lived deprecated alias. */
function parseYearQuery(query: { year?: string; año?: string }): number {
  const raw = query.year ?? query.año;
  if (raw === undefined || raw === '') {
    return new Date().getFullYear();
  }
  const year = parseInt(raw, 10);
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

export function registerReportRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  accountingService: AccountingService,
  dashboardService?: DashboardReportService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  async function getBookId(userId: string): Promise<string | null> {
    const book = await prisma.book.findFirst({
      where: { userId },
      select: { id: true },
    });
    return book?.id ?? null;
  }

  app.get(
    '/api/reports/pyg',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const year = parseYearQuery(
        request.query as { year?: string; año?: string },
      );

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        if (dashboardService) {
          const report = await dashboardService.getPyGReport(bookId, year);
          return reply.status(200).send(report);
        }

        const report = await accountingService.getPyG(bookId, year);
        return reply.status(200).send(report);
      } catch (err) {
        request.log.error(err, 'Failed to get PyG report');
        return reply.status(500).send({ error: 'Failed to get PyG report' });
      }
    },
  );

  app.get(
    '/api/reports/position',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        if (!dashboardService) {
          return reply.status(501).send({ error: 'Position report not available' });
        }

        const report = await dashboardService.getPositionReport(bookId);
        return reply.status(200).send(report);
      } catch (err) {
        request.log.error(err, 'Failed to get position report');
        return reply.status(500).send({ error: 'Failed to get position report' });
      }
    },
  );

  app.get(
    '/api/reports/balance',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const year = parseYearQuery(
        request.query as { year?: string; año?: string },
      );

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const report = await accountingService.getBalanceSheet(bookId, year);

        return reply.status(200).send(report);
      } catch (err) {
        request.log.error(err, 'Failed to get balance sheet report');
        return reply.status(500).send({ error: 'Failed to get balance sheet report' });
      }
    },
  );
}
