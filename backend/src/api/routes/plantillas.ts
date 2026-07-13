/**
 * Plantilla routes: listing (light) and detail (enriched accounts).
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import {
  getAllPlantillas,
  getPlantilla,
} from '../../plantillas/index.js';
import {
  enrichPlantilla,
  serializePlantillaEnriched,
  serializePlantillaLight,
} from '../../application/plantilla-account-resolver.js';

export function registerPlantillaRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  // GET /api/plantillas — light catalog (no availableAccounts; use :code for enrichment)
  app.get(
    '/api/plantillas',
    { preHandler: requireAuth },
    async (request, reply) => {
      const query = request.query as { mode?: string };
      const plantillas = getAllPlantillas(query.mode);
      return reply.status(200).send({
        plantillas: plantillas.map(serializePlantillaLight),
      });
    },
  );

  // GET /api/plantillas/:code — enriched with availableAccounts
  app.get(
    '/api/plantillas/:code',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { code } = request.params as { code: string };
      const plantilla = getPlantilla(code);

      if (!plantilla) {
        return reply.status(404).send({ error: `Plantilla '${code}' not found` });
      }

      const userId = request.userId!;
      const enriched = await enrichPlantilla(plantilla, userId);

      return reply.status(200).send({
        plantilla: serializePlantillaEnriched(enriched),
      });
    },
  );
}
