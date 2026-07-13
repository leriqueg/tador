/**
 * Dev Plantillas Admin — diagnostic JSON/HTML for template readiness.
 *
 * Not linked from product nav. Post-MVP moves to admin frontend.
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

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderHtml(payload: unknown): string {
  const json = escapeHtml(JSON.stringify(payload, null, 2));
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>TADOR — Plantillas Admin (dev)</title>
  <style>
    body { font-family: ui-monospace, monospace; margin: 1.5rem; background: #f7f4f1; color: #1a1a1a; }
    h1 { font-family: system-ui, sans-serif; color: #006a6a; }
    .note { font-family: system-ui, sans-serif; color: #555; margin-bottom: 1rem; max-width: 52rem; }
    pre { background: #fff; border: 1px solid #ddd; padding: 1rem; overflow: auto; border-radius: 8px; }
    a { color: #006a6a; }
  </style>
</head>
<body>
  <h1>Plantillas Admin (dev)</h1>
  <p class="note">
    Herramienta de diagnóstico — no es UI de producto. Post-MVP vivirá en el frontend de administración.
    Endpoints: <code>GET /api/dev/plantillas-admin</code>,
    <code>GET /api/dev/plantillas-admin/:code</code>,
    <code>POST /api/dev/plantillas-admin/:code/preview</code>.
  </p>
  <pre>${json}</pre>
</body>
</html>`;
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

      const payload = {
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
        },
      };

      const wantsHtml =
        query.format === 'html' ||
        (request.headers.accept ?? '').includes('text/html');

      if (wantsHtml) {
        return reply.type('text/html').send(renderHtml(payload));
      }
      return reply.status(200).send(payload);
    },
  );

  app.get(
    '/api/dev/plantillas-admin/:code',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { code } = request.params as { code: string };
      const query = request.query as { format?: string };
      const plantilla = getPlantilla(code);
      if (!plantilla) {
        return reply.status(404).send({ error: `Plantilla '${code}' not found` });
      }

      const enriched = await enrichPlantilla(plantilla, request.userId!);
      const payload = {
        kind: plantillaKind(code),
        category: plantillaCategory(code),
        plantilla: serializePlantillaEnriched(enriched),
        ready: enriched.lines.every((l) => l.availableAccounts.length > 0),
      };

      const wantsHtml =
        query.format === 'html' ||
        (request.headers.accept ?? '').includes('text/html');
      if (wantsHtml) {
        return reply.type('text/html').send(renderHtml(payload));
      }
      return reply.status(200).send(payload);
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
