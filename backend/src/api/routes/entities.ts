/**
 * Entities routes: CRUD + atomic account provisioning for provisionable tipos.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import {
  ChartGroupMissingError,
  EntityConflictError,
  EntityNotFoundError,
  InvalidCapabilityError,
  InvalidEntityTipoError,
  type EntityApplicationService,
} from '../../application/entity-service.js';
import type { CuentaUsuarioMetadata } from '../../domain/cuenta-usuario.js';
import type { TipoEntidad } from '../../domain/entidad.js';
import { createAuthMiddleware } from '../middleware/auth.js';

interface CreateEntityBody {
  nombre: string;
  tipo: TipoEntidad;
  notas?: string;
  capabilities?: string[];
  metadata?: CuentaUsuarioMetadata;
}

interface UpdateEntityBody {
  nombre?: string;
  tipo?: TipoEntidad;
  notas?: string;
  capabilities?: string[];
}

export function registerEntityRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  entityService: EntityApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  app.get(
    '/api/entities',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;

      try {
        const entities = await entityService.list(userId);
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
      const body = request.body as CreateEntityBody;
      const { nombre, tipo } = body;

      if (!nombre?.trim() || !tipo) {
        return reply
          .status(400)
          .send({ error: 'nombre and tipo are required' });
      }

      try {
        const result = await entityService.create(userId, body);
        return reply.status(201).send(result);
      } catch (err: unknown) {
        if (err instanceof InvalidCapabilityError) {
          return reply.status(400).send({ error: err.message });
        }
        if (err instanceof InvalidEntityTipoError) {
          return reply.status(400).send({ error: err.message });
        }
        if (err instanceof EntityConflictError) {
          return reply.status(409).send({ error: err.message });
        }
        if (err instanceof ChartGroupMissingError) {
          return reply.status(500).send({ error: err.message });
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
      const body = request.body as UpdateEntityBody;

      try {
        const entity = await entityService.update(userId, id, body);
        return reply.status(200).send({ entity });
      } catch (err: unknown) {
        if (err instanceof InvalidCapabilityError) {
          return reply.status(400).send({ error: err.message });
        }
        if (err instanceof EntityNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof EntityConflictError) {
          return reply.status(409).send({ error: err.message });
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
        await entityService.delete(userId, id);
        return reply.status(204).send();
      } catch (err: unknown) {
        if (err instanceof EntityNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        request.log.error(err, 'Failed to delete entity');
        return reply.status(500).send({ error: 'Failed to delete entity' });
      }
    },
  );
}
