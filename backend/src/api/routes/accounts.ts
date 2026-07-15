/**
 * Accounts routes: list + create non-entity-provisioned accounts.
 * bank/card MUST be created via POST /api/entities.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';
import { autoAsignarCodigo } from '../../application/account-codigo.js';
import type {
  CuentaUsuarioMetadata,
  TipoCuenta,
} from '../../domain/cuenta-usuario.js';

interface CreateAccountBody {
  tipoCuenta: TipoCuenta;
  nombre: string;
  globalId?: string;
  parentGroupCodigo?: string;
  entidadId?: string;
  codigoPersonalizado?: string;
  metadata?: CuentaUsuarioMetadata;
}

const MANUAL_ALLOWED: TipoCuenta[] = [
  'wallet',
  'bridge',
  'incomeCategory',
  'expenseCategory',
];

function sanitizeMetadata(
  input: CuentaUsuarioMetadata | undefined,
): CuentaUsuarioMetadata | null {
  if (!input || typeof input !== 'object') return null;
  const out: CuentaUsuarioMetadata = {};
  if (typeof input.network === 'string' && input.network.trim()) {
    out.network = input.network.trim().toUpperCase();
  }
  if (typeof input.lastFour === 'string') {
    const digits = input.lastFour.replace(/\D/g, '').slice(-4);
    if (digits) out.lastFour = digits;
  }
  if (
    typeof input.cutoffDay === 'number' &&
    Number.isInteger(input.cutoffDay) &&
    input.cutoffDay >= 1 &&
    input.cutoffDay <= 31
  ) {
    out.cutoffDay = input.cutoffDay;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function registerAccountRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  app.get(
    '/api/accounts',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;

      try {
        const rows = await prisma.cuentaUsuario.findMany({
          where: { userId },
          orderBy: [{ tipoCuenta: 'asc' }, { nombre: 'asc' }],
        });

        const accounts = rows.map((row) => ({
          id: row.id,
          codigo: row.codigo,
          nombre: row.nombre,
          tipoCuenta: row.tipoCuenta,
          entidadId: row.entidadId,
          isEntityProvisioned: row.entidadId != null,
          metadata: row.metadata,
          activa: row.activa,
        }));

        return reply.status(200).send({ accounts });
      } catch (err) {
        request.log.error(err, 'Failed to list accounts');
        return reply.status(500).send({ error: 'Failed to list accounts' });
      }
    },
  );

  app.post(
    '/api/accounts',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const {
        tipoCuenta,
        nombre,
        globalId: bodyGlobalId,
        parentGroupCodigo,
        entidadId,
        codigoPersonalizado,
        metadata: bodyMetadata,
      } = request.body as CreateAccountBody;

      if (!tipoCuenta || !nombre) {
        return reply
          .status(400)
          .send({ error: 'tipoCuenta and nombre are required' });
      }

      if (tipoCuenta === 'bank' || tipoCuenta === 'card') {
        return reply.status(422).send({
          error:
            'bank and card accounts must be created via POST /api/entities (FR-004b)',
        });
      }

      if (!MANUAL_ALLOWED.includes(tipoCuenta)) {
        return reply.status(400).send({
          error: `tipoCuenta '${tipoCuenta}' is not allowed for manual create`,
        });
      }

      try {
        let globalId = bodyGlobalId ?? null;

        if (!globalId && parentGroupCodigo) {
          const parent = await prisma.cuentaGlobal.findUnique({
            where: { codigo: parentGroupCodigo },
            select: { id: true },
          });
          if (!parent) {
            return reply.status(400).send({
              error: `Unknown parentGroupCodigo '${parentGroupCodigo}'`,
            });
          }
          globalId = parent.id;
        }

        // Default parents for income/expense when not provided
        if (!globalId && tipoCuenta === 'incomeCategory') {
          const parent = await prisma.cuentaGlobal.findUnique({
            where: { codigo: '41010000' },
            select: { id: true },
          });
          globalId = parent?.id ?? null;
        }
        if (!globalId && tipoCuenta === 'expenseCategory') {
          const parent = await prisma.cuentaGlobal.findUnique({
            where: { codigo: '61000000' },
            select: { id: true },
          });
          // fallback to a common expense group if seed uses different roots
          if (!parent) {
            const alt = await prisma.cuentaGlobal.findFirst({
              where: { codigo: { startsWith: '61' }, esPostable: false },
              select: { id: true },
            });
            globalId = alt?.id ?? null;
          } else {
            globalId = parent.id;
          }
        }

        const codigo = await autoAsignarCodigo(globalId, userId);
        const metadata = sanitizeMetadata(bodyMetadata);

        const account = await prisma.cuentaUsuario.create({
          data: {
            userId,
            codigo,
            tipoCuenta,
            nombre: nombre.trim(),
            globalId,
            entidadId: entidadId ?? null,
            codigoPersonalizado: codigoPersonalizado ?? null,
            metadata: metadata ?? undefined,
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
