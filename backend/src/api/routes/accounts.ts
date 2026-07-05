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

/**
 * Auto-assign a codigo for a user account based on its parent CuentaGlobal.
 *
 * The scheme follows the pattern [A][BBB][1][DDD] (8 digits):
 *   A   = first digit of parent (class: 1=Activo, 2=Pasivo, 4=Ingreso, 6=Gasto)
 *   BBB = digits 2-4 of parent (group identifier)
 *   1   = N3 always 1 for user accounts
 *   DDD = auto-incrementing sequence (001-999)
 *
 * Example: parent 11120000 → base "11121" → "11121001", "11121002", ...
 */
async function autoAsignarCodigo(globalId: string | null, userId: string): Promise<string | null> {
  if (!globalId) return null;

  const parent = await prisma.cuentaGlobal.findUnique({
    where: { id: globalId },
    select: { codigo: true },
  });
  if (!parent) return null;

  const n1 = parent.codigo[0];
  const n2 = parent.codigo.substring(1, 4);
  const base = `${n1}${n2}1`; // N3 always 1 for user accounts

  // Find highest existing N4 for this base
  const existing = await prisma.cuentaUsuario.findFirst({
    where: {
      codigo: { startsWith: base },
      userId,
    },
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  let nextN4 = 1;
  if (existing?.codigo) {
    const lastN4 = parseInt(existing.codigo.substring(7), 10);
    nextN4 = lastN4 + 1;
  }

  return `${base}${nextN4.toString().padStart(3, '0')}`;
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
        const codigo = await autoAsignarCodigo(globalId ?? null, userId);

        const account = await prisma.cuentaUsuario.create({
          data: {
            userId,
            codigo,
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
