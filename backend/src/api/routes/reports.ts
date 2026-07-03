/**
 * Report routes: PyG and balance sheet reports.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import type { AccountingService } from '../../application/accounting-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';

export function registerReportRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  accountingService: AccountingService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  async function getBookId(userId: string): Promise<string | null> {
    const book = await prisma.book.findFirst({
      where: { userId },
      select: { id: true },
    });
    return book?.id ?? null;
  }

  // ---------------------------------------------------------------------------
  // GET /api/reports/pyg — PyG report
  // ---------------------------------------------------------------------------

  app.get(
    '/api/reports/pyg',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const query = request.query as { año?: string };
      const año = query.año ? parseInt(query.año, 10) : new Date().getFullYear();

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const report = await accountingService.getPyG(bookId, año);

        return reply.status(200).send(report);
      } catch (err) {
        request.log.error(err, 'Failed to get PyG report');
        return reply.status(500).send({ error: 'Failed to get PyG report' });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // GET /api/reports/balance — balance sheet
  // ---------------------------------------------------------------------------

  app.get(
    '/api/reports/balance',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const query = request.query as { año?: string };
      const año = query.año ? parseInt(query.año, 10) : new Date().getFullYear();

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const report = await accountingService.getBalanceSheet(bookId, año);

        return reply.status(200).send(report);
      } catch (err) {
        request.log.error(err, 'Failed to get balance sheet report');
        return reply.status(500).send({ error: 'Failed to get balance sheet report' });
      }
    },
  );
}
