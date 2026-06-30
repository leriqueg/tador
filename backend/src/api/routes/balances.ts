/**
 * Balances routes: current balance queries.
 *
 * GET /api/balances/:cuentaUsuarioId  — balance for one account (FR-004)
 * GET /api/balances                   — balances for all accounts in the book
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import type { AsientoApplicationService } from '../../application/asiento-service.js';
import type { BookRepository } from '../../infrastructure/repositories/book-repo.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';

export function registerBalanceRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  asientoService: AsientoApplicationService,
  bookRepo: BookRepository,
): void {
  const requireAuth = createAuthMiddleware(authService);

  /** Helper to resolve bookId from the authenticated user's session userId. */
  async function resolveBookId(userId: string): Promise<string> {
    const book = await bookRepo.findByUserId(userId);
    if (!book) {
      throw new Error('Book not found for this user');
    }
    return book.id;
  }

  // GET /api/balances/:cuentaUsuarioId — balance for one account
  app.get(
    '/api/balances/:cuentaUsuarioId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { cuentaUsuarioId } = request.params as { cuentaUsuarioId: string };

      if (!cuentaUsuarioId) {
        return reply.status(400).send({ error: 'cuentaUsuarioId is required' });
      }

      try {
        const bookId = await resolveBookId(userId);
        const saldo = await asientoService.calcularSaldo(cuentaUsuarioId, userId, bookId);

        return reply.status(200).send({ saldo });
      } catch (err) {
        request.log.error(err, 'Failed to get balance');
        return reply.status(500).send({ error: 'Failed to get balance' });
      }
    },
  );

  // GET /api/balances — balances for all of the user's accounts in the book
  app.get(
    '/api/balances',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;

      try {
        const bookId = await resolveBookId(userId);

        // Get all user accounts
        const accounts = await prisma.cuentaUsuario.findMany({
          where: { userId },
          select: { id: true },
        });

        // Get balance for each account
        const saldos = await Promise.all(
          accounts.map((a) =>
            asientoService.calcularSaldo(a.id, userId, bookId),
          ),
        );

        return reply.status(200).send({ saldos });
      } catch (err) {
        request.log.error(err, 'Failed to get balances');
        return reply.status(500).send({ error: 'Failed to get balances' });
      }
    },
  );
}
