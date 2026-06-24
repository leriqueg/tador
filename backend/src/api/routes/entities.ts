/**
 * Entities routes: user-owned entities CRUD.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';
import type { TipoEntidad } from '../../domain/entidad.js';

interface CreateEntityBody {
  nombre: string;
  tipo: TipoEntidad;
  notas?: string;
}

interface UpdateEntityBody {
  nombre?: string;
  tipo?: TipoEntidad;
  notas?: string;
}

export function registerEntityRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // GET /api/entities — list user's entities
  app.get(
    '/api/entities',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;

      try {
        const entities = await prisma.entidad.findMany({
          where: { userId },
          orderBy: { nombre: 'asc' },
        });

        return reply.status(200).send({ entities });
      } catch (err) {
        request.log.error(err, 'Failed to fetch entities');
        return reply.status(500).send({ error: 'Failed to fetch entities' });
      }
    },
  );

  // POST /api/entities — create entity
  app.post(
    '/api/entities',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { nombre, tipo, notas } = request.body as CreateEntityBody;

      if (!nombre || !tipo) {
        return reply
          .status(400)
          .send({ error: 'nombre and tipo are required' });
      }

      try {
        const entity = await prisma.entidad.create({
          data: {
            userId,
            nombre,
            tipo,
            notas: notas ?? null,
          },
        });

        return reply.status(201).send({ entity });
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

  // PUT /api/entities/:id — update entity
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

        const entity = await prisma.entidad.update({
          where: { id },
          data: {
            ...(nombre !== undefined && { nombre }),
            ...(tipo !== undefined && { tipo }),
            ...(notas !== undefined && { notas }),
          },
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

  // DELETE /api/entities/:id — delete entity
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
