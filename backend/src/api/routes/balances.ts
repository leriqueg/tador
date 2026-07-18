/**
 * Balance routes: account balance queries.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import type { AccountingService } from '../../application/accounting-service.js';
import type { BookApplicationService } from '../../application/book-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function registerBalanceRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  accountingService: AccountingService,
  bookService: BookApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  async function getBookId(userId: string): Promise<string | null> {
    try {
      const book = await bookService.getBook(userId, userId);
      return book.id;
    } catch {
      return null;
    }
  }

  app.get(
    '/api/balances/:cuentaId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { cuentaId } = request.params as { cuentaId: string };
      const query = request.query as { tipo?: string };
      const tipo = query.tipo === 'global' ? 'global' as const : 'usuario' as const;

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const saldo = await accountingService.getBalance(cuentaId, bookId, tipo);

        return reply.status(200).send({ cuentaId, saldo });
      } catch (err) {
        request.log.error(err, 'Failed to get balance');
        return reply.status(500).send({ error: 'Failed to get balance' });
      }
    },
  );

  app.get(
    '/api/balances/:cuentaId/monthly',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { cuentaId } = request.params as { cuentaId: string };
      const query = request.query as { año?: string; tipo?: string };
      const año = query.año ? parseInt(query.año, 10) : new Date().getFullYear();
      const tipo = query.tipo === 'global' ? 'global' as const : 'usuario' as const;

      try {
        const bookId = await getBookId(userId);
        if (!bookId) {
          return reply.status(404).send({ error: 'Book not found' });
        }

        const mensual = await accountingService.getMonthlyBalances(
          cuentaId,
          bookId,
          año,
          tipo,
        );

        return reply.status(200).send({ cuentaId, año, mensual });
      } catch (err) {
        request.log.error(err, 'Failed to get monthly balances');
        return reply.status(500).send({ error: 'Failed to get monthly balances' });
      }
    },
  );
}
