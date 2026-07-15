/**
 * Entities routes: CRUD + atomic account provisioning for provisionable tipos.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';
import { autoAsignarCodigo } from '../../application/account-codigo.js';
import {
  ENTITY_PROVISION_MAP,
  isProvisionableTipo,
  type TipoEntidad,
} from '../../domain/entidad.js';
import type { CuentaUsuarioMetadata } from '../../domain/cuenta-usuario.js';

interface CreateEntityBody {
  nombre: string;
  tipo: TipoEntidad;
  notas?: string;
  /** Optional card metadata when tipo=card_issuer */
  metadata?: CuentaUsuarioMetadata;
}

interface UpdateEntityBody {
  nombre?: string;
  tipo?: TipoEntidad;
  notas?: string;
}

const VALID_TIPOS: TipoEntidad[] = [
  'person',
  'organization',
  'bank',
  'card_issuer',
  'wallet_platform',
];

function sanitizeMetadata(
  input: CuentaUsuarioMetadata | undefined,
): CuentaUsuarioMetadata | undefined {
  if (!input || typeof input !== 'object') return undefined;
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
  return Object.keys(out).length > 0 ? out : undefined;
}

export function registerEntityRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  app.get(
    '/api/entities',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;

      try {
        const rows = await prisma.entidad.findMany({
          where: { userId },
          orderBy: { nombre: 'asc' },
          include: {
            cuentasUsuario: {
              where: { activa: true },
              take: 1,
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        const entities = rows.map((row) => {
          const account = row.cuentasUsuario[0];
          return {
            id: row.id,
            nombre: row.nombre,
            tipo: row.tipo,
            notas: row.notas,
            createdAt: row.createdAt,
            provisionedAccountId: account?.id ?? null,
            provisionedAccount: account
              ? {
                  id: account.id,
                  nombre: account.nombre,
                  tipoCuenta: account.tipoCuenta,
                  codigo: account.codigo,
                }
              : null,
          };
        });

        return reply.status(200).send({ entities });
      } catch (err) {
        request.log.error(err, 'Failed to fetch entities');
        return reply.status(500).send({ error: 'Failed to fetch entities' });
      }
    },
  );

  app.post(
    '/api/entities',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { nombre, tipo, notas, metadata: bodyMeta } =
        request.body as CreateEntityBody;

      if (!nombre?.trim() || !tipo) {
        return reply
          .status(400)
          .send({ error: 'nombre and tipo are required' });
      }
      if (!VALID_TIPOS.includes(tipo)) {
        return reply.status(400).send({ error: `Invalid tipo '${tipo}'` });
      }

      try {
        if (!isProvisionableTipo(tipo)) {
          const entity = await prisma.entidad.create({
            data: {
              userId,
              nombre: nombre.trim(),
              tipo,
              notas: notas ?? null,
            },
          });
          return reply.status(201).send({ entity, provisionedAccount: null });
        }

        const map = ENTITY_PROVISION_MAP[tipo];
        const parent = await prisma.cuentaGlobal.findUnique({
          where: { codigo: map.parentGroupCodigo },
          select: { id: true },
        });
        if (!parent) {
          return reply.status(500).send({
            error: `Chart group ${map.parentGroupCodigo} missing from seed`,
          });
        }

        const codigo = await autoAsignarCodigo(parent.id, userId);
        const metadata =
          tipo === 'card_issuer' ? sanitizeMetadata(bodyMeta) : undefined;

        const result = await prisma.$transaction(async (tx) => {
          const entity = await tx.entidad.create({
            data: {
              userId,
              nombre: nombre.trim(),
              tipo,
              notas: notas ?? null,
            },
          });

          const account = await tx.cuentaUsuario.create({
            data: {
              userId,
              codigo,
              tipoCuenta: map.tipoCuenta,
              nombre: nombre.trim(),
              globalId: parent.id,
              entidadId: entity.id,
              metadata: metadata ?? undefined,
            },
          });

          return { entity, account };
        });

        return reply.status(201).send({
          entity: result.entity,
          provisionedAccount: result.account,
        });
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          'code' in err &&
          (err as { code: string }).code === 'P2002'
        ) {
          return reply
            .status(409)
            .send({ error: 'An entity with this name already exists' });
        }
        request.log.error(err, 'Failed to create entity');
        return reply.status(500).send({ error: 'Failed to create entity' });
      }
    },
  );

  app.put(
    '/api/entities/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };
      const { nombre, tipo, notas } = request.body as UpdateEntityBody;

      try {
        const existing = await prisma.entidad.findFirst({
          where: { id, userId },
        });
        if (!existing) {
          return reply.status(404).send({ error: 'Entity not found' });
        }

        const entity = await prisma.$transaction(async (tx) => {
          const updated = await tx.entidad.update({
            where: { id },
            data: {
              ...(nombre !== undefined && { nombre: nombre.trim() }),
              ...(tipo !== undefined && { tipo }),
              ...(notas !== undefined && { notas }),
            },
          });

          if (nombre !== undefined) {
            await tx.cuentaUsuario.updateMany({
              where: { entidadId: id, userId },
              data: { nombre: nombre.trim() },
            });
          }

          return updated;
        });

        return reply.status(200).send({ entity });
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          'code' in err &&
          (err as { code: string }).code === 'P2002'
        ) {
          return reply
            .status(409)
            .send({ error: 'An entity with this name already exists' });
        }
        request.log.error(err, 'Failed to update entity');
        return reply.status(500).send({ error: 'Failed to update entity' });
      }
    },
  );

  app.delete(
    '/api/entities/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };

      try {
        const existing = await prisma.entidad.findFirst({
          where: { id, userId },
        });
        if (!existing) {
          return reply.status(404).send({ error: 'Entity not found' });
        }

        await prisma.entidad.delete({ where: { id } });
        return reply.status(204).send();
      } catch (err) {
        request.log.error(err, 'Failed to delete entity');
        return reply.status(500).send({ error: 'Failed to delete entity' });
      }
    },
  );
}
