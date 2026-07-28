/**
 * Admin template preview / readiness application service (013 US4).
 * Shared catalog + mock asiento logic (no persistence).
 */

import {
  getAllPlantillas,
  getPlantilla,
  type Plantilla,
} from '../../plantillas/index.js';
import {
  enrichPlantilla,
  enrichPlantillas,
  loadChartIndex,
  loadUserAccounts,
  serializePlantillaEnriched,
} from '../plantilla-account-resolver.js';
import { moneyToFixed, quantizeMoney, DEFAULT_CURRENCY } from '../../domain/money.js';
import type { AccountRepository } from '../ports/account-repository.js';
import type { BookApplicationService } from '../book-service.js';

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

export function plantillaKind(code: string): Kind {
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

export function plantillaCategory(code: string): Category {
  return CATEGORY_BY_CODE[code] ?? 'otros';
}

export function buildPlantillaSummary(plantillas: Plantilla[]) {
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

export interface TemplatePreviewInput {
  userId: string;
  amount: number;
  concept?: string;
  lines: Array<{ id: number; accountId: string }>;
}

export interface TemplatePreviewResult {
  templateCode: string;
  concept: string;
  amount: number;
  currency: string;
  balanced: boolean;
  lines: Array<{
    lineId: number;
    label: string;
    side: 'debit' | 'credit';
    accountId: string;
    accountName: string;
    debito: string;
    credito: string;
  }>;
  persisted: false;
}

export interface AdminTemplateApplicationService {
  list(mode?: string): {
    mode: string;
    summary: ReturnType<typeof buildPlantillaSummary>;
    plantillas: Array<{
      code: string;
      name: string;
      modes: string[];
      status: 'active';
      kind: Kind;
      category: Category;
    }>;
  };
  getDetail(
    code: string,
    userId?: string,
  ): Promise<{
    kind: Kind;
    category: Category;
    plantilla: unknown;
    source: Plantilla;
    ready: boolean;
  } | null>;
  getReadiness(
    code: string,
    opts: { mode?: string; userId?: string },
  ): Promise<{
    code: string;
    mode: string;
    ready: boolean;
    lines: Array<{
      id: number;
      label: string;
      side: string;
      availableCount: number;
    }>;
  } | null>;
  preview(
    code: string,
    input: TemplatePreviewInput,
  ): Promise<TemplatePreviewResult>;
}

export function createAdminTemplateApplicationService(
  accounts: AccountRepository,
  bookService: BookApplicationService,
): AdminTemplateApplicationService {
  return {
    list(mode = 'hogar') {
      const list = getAllPlantillas(mode);
      return {
        mode,
        summary: buildPlantillaSummary(list),
        plantillas: list.map((p) => ({
          code: p.code,
          name: p.name,
          modes: p.modes,
          status: 'active' as const,
          kind: plantillaKind(p.code),
          category: plantillaCategory(p.code),
        })),
      };
    },

    async getDetail(code, userId) {
      const plantilla = getPlantilla(code);
      if (!plantilla) return null;

      if (!userId) {
        return {
          kind: plantillaKind(code),
          category: plantillaCategory(code),
          plantilla,
          source: plantilla,
          ready: false,
        };
      }

      const enriched = await enrichPlantilla(accounts, plantilla, userId);
      return {
        kind: plantillaKind(code),
        category: plantillaCategory(code),
        plantilla: serializePlantillaEnriched(enriched),
        source: plantilla,
        ready: enriched.lines.every((l) => l.availableAccounts.length > 0),
      };
    },

    async getReadiness(code, opts) {
      const plantilla = getPlantilla(code);
      if (!plantilla) return null;
      const mode = opts.mode ?? 'hogar';

      if (!opts.userId) {
        return {
          code,
          mode,
          ready: false,
          lines: plantilla.lines.map((l) => ({
            id: l.id,
            label: l.label,
            side: l.side,
            availableCount: 0,
          })),
        };
      }

      const enriched = await enrichPlantilla(accounts, plantilla, opts.userId);
      const lines = enriched.lines.map((l) => ({
        id: l.id,
        label: l.label,
        side: l.side,
        availableCount: l.availableAccounts.length,
      }));
      return {
        code,
        mode,
        ready: lines.every((l) => l.availableCount > 0),
        lines,
      };
    },

    async preview(code, input) {
      const plantilla = getPlantilla(code);
      if (!plantilla) {
        throw new Error(`Plantilla '${code}' not found`);
      }
      if (input.amount === undefined || input.amount === null) {
        throw new Error('amount is required');
      }
      if (!input.lines?.length) {
        throw new Error('lines are required');
      }
      if (!input.userId) {
        throw new Error('userId is required');
      }

      const book = await bookService.getBook(input.userId, input.userId);
      const config = await bookService.getConfig(
        input.userId,
        book.id,
        input.userId,
      );
      const currency = config.currency ?? DEFAULT_CURRENCY;
      const amount = quantizeMoney(input.amount, currency);
      const amountFixed = moneyToFixed(amount, currency);

      const byId = await loadChartIndex(accounts);
      const users = await loadUserAccounts(accounts, input.userId);
      const nameById = new Map<string, string>();
      for (const g of byId.values()) nameById.set(g.id, g.nombre);
      for (const u of users) nameById.set(u.id, u.nombre);

      const journalLines: TemplatePreviewResult['lines'] = [];

      for (const lineInput of input.lines) {
        const tplLine = plantilla.lines.find((l) => l.id === lineInput.id);
        if (!tplLine) {
          throw new Error(`Line id ${lineInput.id} not in template`);
        }
        const isDebit = tplLine.side === 'debit';
        journalLines.push({
          lineId: lineInput.id,
          label: tplLine.label,
          side: tplLine.side,
          accountId: lineInput.accountId,
          accountName: nameById.get(lineInput.accountId) ?? lineInput.accountId,
          debito: isDebit ? amountFixed : moneyToFixed(0, currency),
          credito: isDebit ? moneyToFixed(0, currency) : amountFixed,
        });
      }

      const totalDebito = journalLines.reduce((s, l) => s + Number(l.debito), 0);
      const totalCredito = journalLines.reduce(
        (s, l) => s + Number(l.credito),
        0,
      );

      return {
        templateCode: code,
        concept: input.concept ?? plantilla.name,
        amount: Number(amountFixed),
        currency,
        balanced: totalDebito === totalCredito,
        lines: journalLines,
        persisted: false,
      };
    },
  };
}

/** Legacy-compatible list payload when a sample userId is provided. */
export async function listTemplatesEnrichedForUser(
  accounts: AccountRepository,
  mode: string,
  userId: string,
) {
  const list = getAllPlantillas(mode);
  const enriched = await enrichPlantillas(accounts, list, userId);
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
  return {
    mode,
    summary: buildPlantillaSummary(list),
    plantillas,
  };
}
