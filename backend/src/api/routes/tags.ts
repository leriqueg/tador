/**
 * Tags routes: user-owned tags CRUD.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { prisma } from '../../infrastructure/database.js';

interface CreateTagBody {
  nombre: string;
}

interface UpdateTagBody {
  nombre: string;
}

export function registerTagRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // GET /api/tags — list user's tags
  app.get('/api/tags', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId!;

    try {
      const tags = await prisma.tag.findMany({
        where: { userId },
        orderBy: { nombre: 'asc' },
      });

      return reply.status(200).send({ tags });
    } catch (err) {
      request.log.error(err, 'Failed to fetch tags');
      return reply.status(500).send({ error: 'Failed to fetch tags' });
    }
  });

  // POST /api/tags — create tag
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
        const tag = await prisma.tag.create({
          data: { userId, nombre },
        });

        return reply.status(201).send({ tag });
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          'code' in err &&
          (err as { code: string }).code === 'P2002'
        ) {
          return reply
            .status(409)
            .send({ error: 'A tag with this name already exists' });
        }
        request.log.error(err, 'Failed to create tag');
        return reply.status(500).send({ error: 'Failed to create tag' });
      }
    },
  );

  // PUT /api/tags/:id — update tag
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
        const existing = await prisma.tag.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          return reply.status(404).send({ error: 'Tag not found' });
        }

        const tag = await prisma.tag.update({
          where: { id },
          data: { nombre },
        });

        return reply.status(200).send({ tag });
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          'code' in err &&
          (err as { code: string }).code === 'P2002'
        ) {
          return reply
            .status(409)
            .send({ error: 'A tag with this name already exists' });
        }
        request.log.error(err, 'Failed to update tag');
        return reply.status(500).send({ error: 'Failed to update tag' });
      }
    },
  );

  // DELETE /api/tags/:id — delete tag
  app.delete(
    '/api/tags/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const userId = request.userId!;
      const { id } = request.params as { id: string };

      try {
        const existing = await prisma.tag.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          return reply.status(404).send({ error: 'Tag not found' });
        }

        await prisma.tag.delete({ where: { id } });

        return reply.status(204).send();
      } catch (err) {
        request.log.error(err, 'Failed to delete tag');
        return reply.status(500).send({ error: 'Failed to delete tag' });
      }
    },
  );
}
