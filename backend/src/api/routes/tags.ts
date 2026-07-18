/**
 * Tags routes: user-owned tags CRUD.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import {
  TagNotFoundError,
  type TagApplicationService,
} from '../../application/tag-service.js';
import { TagConflictError } from '../../application/ports/tag-repository.js';
import { createAuthMiddleware } from '../middleware/auth.js';

interface CreateTagBody {
  nombre: string;
}

interface UpdateTagBody {
  nombre: string;
}

export function registerTagRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
  tagService: TagApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  app.get('/api/tags', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;

    try {
      const tags = await tagService.list(userId);
      return reply.status(200).send({ tags });
    } catch (err) {
      request.log.error(err, 'Failed to fetch tags');
      return reply.status(500).send({ error: 'Failed to fetch tags' });
    }
  });

  app.post(
    '/api/tags',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { nombre } = request.body as CreateTagBody;

      if (!nombre) {
        return reply.status(400).send({ error: 'nombre is required' });
      }

      try {
        const tag = await tagService.create(userId, nombre);
        return reply.status(201).send({ tag });
      } catch (err: unknown) {
        if (err instanceof TagConflictError) {
          return reply.status(409).send({ error: err.message });
        }
        request.log.error(err, 'Failed to create tag');
        return reply.status(500).send({ error: 'Failed to create tag' });
      }
    },
  );

  app.put(
    '/api/tags/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };
      const { nombre } = request.body as UpdateTagBody;

      if (!nombre) {
        return reply.status(400).send({ error: 'nombre is required' });
      }

      try {
        const tag = await tagService.update(userId, id, nombre);
        return reply.status(200).send({ tag });
      } catch (err: unknown) {
        if (err instanceof TagNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof TagConflictError) {
          return reply.status(409).send({ error: err.message });
        }
        request.log.error(err, 'Failed to update tag');
        return reply.status(500).send({ error: 'Failed to update tag' });
      }
    },
  );

  app.delete(
    '/api/tags/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };

      try {
        await tagService.delete(userId, id);
        return reply.status(204).send();
      } catch (err: unknown) {
        if (err instanceof TagNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        request.log.error(err, 'Failed to delete tag');
        return reply.status(500).send({ error: 'Failed to delete tag' });
      }
    },
  );
}
