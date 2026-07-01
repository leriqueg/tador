/**
 * Accounts routes: user account creation.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';
import type { TipoCuenta } from '../../domain/cuenta-usuario.js';

interface CreateAccountBody {
  tipoCuenta: TipoCuenta;
  nombre: string;
  globalId?: string;
  entidadId?: string;
  codigoPersonalizado?: string;
}

export function registerAccountRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // POST /api/accounts — create a user account
  app.post(
    '/api/accounts',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { tipoCuenta, nombre, globalId, entidadId, codigoPersonalizado } =
        request.body as CreateAccountBody;

      if (!tipoCuenta || !nombre) {
        return reply
          .status(400)
          .send({ error: 'tipoCuenta and nombre are required' });
      }

      try {
        const account = await prisma.cuentaUsuario.create({
          data: {
            userId,
            tipoCuenta,
            nombre,
            globalId: globalId ?? null,
            entidadId: entidadId ?? null,
            codigoPersonalizado: codigoPersonalizado ?? null,
          },
        });

        return reply.status(201).send({ account });
      } catch (err) {
        request.log.error(err, 'Failed to create account');
        return reply.status(500).send({ error: 'Failed to create account' });
      }
    },
  );
}
