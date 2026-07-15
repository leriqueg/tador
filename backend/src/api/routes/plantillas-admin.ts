/**
 * Dev Plantillas Admin — interactive try tool + JSON API.
 *
 * Not linked from product nav. Full product admin UI is post-MVP.
 * Gate: ENABLE_PLANTILLAS_ADMIN=true OR NODE_ENV !== 'production'
 */

import type { FastifyInstance } from 'fastify';
import type { AuthApplicationService } from '../../application/auth-service.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import {
  getAllPlantillas,
  getPlantilla,
} from '../../plantillas/index.js';
import type { Plantilla } from '../../plantillas/index.js';
import {
  enrichPlantilla,
  enrichPlantillas,
  loadChartIndex,
  loadUserAccounts,
  serializePlantillaEnriched,
} from '../../application/plantilla-account-resolver.js';
import { moneyToFixed, quantizeMoney, DEFAULT_CURRENCY } from '../../domain/money.js';
import { prisma } from '../../infrastructure/database.js';
import { renderPlantillasAdminTool } from './plantillas-admin-ui.js';

type Kind = 'gasto' | 'ingreso' | 'transferencia';
type Category =
  | 'compras'
  | 'comida'
  | 'hogar'
  | 'transporte'
  | 'salud'
  | 'otros'
  | 'ingresos'
  | 'movimientos';

const CATEGORY_BY_CODE: Record<string, Category> = {
  pagar_supermercado: 'compras',
  pagar_cine: 'otros',
  pagar_servicios: 'hogar',
  pagar_taxi: 'transporte',
  pagar_cita_medica: 'salud',
  pago_tarjeta: 'otros',
  registrar_sueldo: 'ingresos',
  transferencia: 'movimientos',
  deposito_bancario: 'movimientos',
  retiro_bancario: 'movimientos',
};

const CATEGORY_LABELS: Record<Category, string> = {
  compras: 'Compras',
  comida: 'Comida',
  hogar: 'Hogar',
  transporte: 'Transporte',
  salud: 'Salud',
  otros: 'Otros',
  ingresos: 'Ingresos',
  movimientos: 'Movimientos',
};

function plantillaKind(code: string): Kind {
  if (code.startsWith('registrar_')) return 'ingreso';
  if (
    code === 'transferencia' ||
    code.startsWith('deposito_') ||
    code.startsWith('retiro_')
  ) {
    return 'transferencia';
  }
  return 'gasto';
}

function plantillaCategory(code: string): Category {
  return CATEGORY_BY_CODE[code] ?? 'otros';
}

function adminEnabled(): boolean {
  if (process.env.ENABLE_PLANTILLAS_ADMIN === 'true') return true;
  if (process.env.ENABLE_PLANTILLAS_ADMIN === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

function buildSummary(plantillas: Plantilla[]) {
  const byKind: Record<Kind, number> = {
    gasto: 0,
    ingreso: 0,
    transferencia: 0,
  };
  const byCategory: Record<string, number> = {};
  for (const c of Object.keys(CATEGORY_LABELS) as Category[]) {
    byCategory[c] = 0;
  }
  for (const p of plantillas) {
    byKind[plantillaKind(p.code)] += 1;
    byCategory[plantillaCategory(p.code)] =
      (byCategory[plantillaCategory(p.code)] ?? 0) + 1;
  }
  const emptyCategories = (Object.keys(CATEGORY_LABELS) as Category[]).filter(
    (c) => (byCategory[c] ?? 0) === 0,
  );
  return { byKind, byCategory, emptyCategories };
}

function wantsJson(query: { format?: string }, accept: string | undefined): boolean {
  if (query.format === 'json') return true;
  if (query.format === 'html') return false;
  // Browsers navigate with Accept: text/html → interactive tool.
  // API clients / inject without HTML preference → JSON.
  return !(accept ?? '').includes('text/html');
}

export function registerPlantillasAdminRoutes(
  app: FastifyInstance,
  authService: AuthApplicationService,
): void {
  const requireAuth = createAuthMiddleware(authService);

  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/api/dev/plantillas-admin')) return;
    if (!adminEnabled()) {
      return reply.status(404).send({ error: 'Not found' });
    }
  });

  app.get(
    '/api/dev/plantillas-admin',
    { preHandler: requireAuth },
    async (request, reply) => {
      const query = request.query as { mode?: string; format?: string };
      const mode = query.mode ?? 'hogar';

      if (!wantsJson(query, request.headers.accept)) {
        return reply
          .type('text/html; charset=utf-8')
          .send(renderPlantillasAdminTool(mode));
      }

      const userId = request.userId!;
      const list = getAllPlantillas(mode);
      const enriched = await enrichPlantillas(list, userId);

      const plantillas = enriched.map((p) => {
        const lines = p.lines.map((line) => ({
          id: line.id,
          label: line.label,
          side: line.side,
          strategy: line.strategy,
          groupCode: line.groupCode ?? null,
          groupCodes: line.groupCodes ?? null,
          availableCount: line.availableAccounts.length,
          sample: line.availableAccounts.slice(0, 5).map((a) => ({
            id: a.id,
            nombre: a.nombre,
            tipo: a.tipo,
          })),
        }));
        const ready = lines.every((l) => l.availableCount > 0);
        return {
          code: p.code,
          name: p.name,
          kind: plantillaKind(p.code),
          category: plantillaCategory(p.code),
          ready,
          lines,
        };
      });

      return reply.status(200).send({
        mode,
        summary: buildSummary(list),
        plantillas,
        notes: {
          emptyCategories:
            'UI Hogar MUST hide category chips with zero plantillas (emptyCategories).',
          ready:
            'ready=false means at least one line has no matching accounts for this user.',
          productSplit:
            'GET /api/plantillas is light; GET /api/plantillas/:code is enriched.',
          tool:
            'Browser GET without format=json serves the interactive Admin tool HTML.',
        },
      });
    },
  );

  app.get(
    '/api/dev/plantillas-admin/:code',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { code } = request.params as { code: string };
      const plantilla = getPlantilla(code);
      if (!plantilla) {
        return reply.status(404).send({ error: `Plantilla '${code}' not found` });
      }

      const enriched = await enrichPlantilla(plantilla, request.userId!);
      return reply.status(200).send({
        kind: plantillaKind(code),
        category: plantillaCategory(code),
        plantilla: serializePlantillaEnriched(enriched),
        // Raw catalog JSON for the "Código fuente" tab (no availableAccounts)
        source: plantilla,
        ready: enriched.lines.every((l) => l.availableAccounts.length > 0),
      });
    },
  );

  app.post(
    '/api/dev/plantillas-admin/:code/preview',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { code } = request.params as { code: string };
      const plantilla = getPlantilla(code);
      if (!plantilla) {
        return reply.status(404).send({ error: `Plantilla '${code}' not found` });
      }

      const body = request.body as {
        amount?: number;
        concept?: string;
        lines?: Array<{ id: number; accountId: string }>;
      };

      if (body.amount === undefined || body.amount === null) {
        return reply.status(400).send({ error: 'amount is required' });
      }
      if (!body.lines?.length) {
        return reply.status(400).send({ error: 'lines are required' });
      }

      const book = await prisma.book.findFirst({
        where: { userId: request.userId! },
        include: { config: { select: { currency: true } } },
      });
      const currency = book?.config?.currency ?? DEFAULT_CURRENCY;
      const amount = quantizeMoney(body.amount, currency);
      const amountFixed = moneyToFixed(amount, currency);

      const byId = await loadChartIndex();
      const users = await loadUserAccounts(request.userId!);
      const nameById = new Map<string, string>();
      for (const g of byId.values()) nameById.set(g.id, g.nombre);
      for (const u of users) nameById.set(u.id, u.nombre);

      const journalLines: Array<{
        lineId: number;
        label: string;
        side: 'debit' | 'credit';
        accountId: string;
        accountName: string;
        debito: string;
        credito: string;
      }> = [];

      for (const input of body.lines) {
        const tplLine = plantilla.lines.find((l) => l.id === input.id);
        if (!tplLine) {
          return reply
            .status(400)
            .send({ error: `Line id ${input.id} not in template` });
        }
        const isDebit = tplLine.side === 'debit';
        journalLines.push({
          lineId: input.id,
          label: tplLine.label,
          side: tplLine.side,
          accountId: input.accountId,
          accountName: nameById.get(input.accountId) ?? input.accountId,
          debito: isDebit ? amountFixed : moneyToFixed(0, currency),
          credito: isDebit ? moneyToFixed(0, currency) : amountFixed,
        });
      }

      const totalDebito = journalLines.reduce(
        (s, l) => s + Number(l.debito),
        0,
      );
      const totalCredito = journalLines.reduce(
        (s, l) => s + Number(l.credito),
        0,
      );

      return reply.status(200).send({
        templateCode: code,
        concept: body.concept ?? plantilla.name,
        amount: Number(amountFixed),
        currency,
        balanced: totalDebito === totalCredito,
        lines: journalLines,
        persisted: false,
      });
    },
  );
}
