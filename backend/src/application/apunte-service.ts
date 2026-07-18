/**
 * Apunte application service — list, get, create, and update use cases.
 *
 * APUNTE-18: PATCH updates the journal entry via AccountingService.updateEntry,
 * then updates the apunte row in a separate step. Those writes are NOT atomic
 * today; a failure after updateEntry succeeds can leave asiento and apunte out
 * of sync. Do not merge into one transaction without an explicit product decision.
 */

import type { AccountingService } from './accounting-service.js';
import type { AccountRepository } from './ports/account-repository.js';
import type {
  ApunteListItem,
  ApunteRepository,
  IdempotentApunteReplay,
  PersistApunteLineInput,
} from './ports/apunte-repository.js';
import type { BookRepository } from './ports/book-repository.js';
import type { JournalStore } from './ports/journal-store.js';
import {
  buildApunteListFilter,
  parseApunteListPagination,
  type ApunteListQuery,
} from './apunte-list-filters.js';
import {
  isCuentaGlobalUnderGroups,
  isCuentaUsuarioUnderGroups,
} from './plantilla-validator.js';
import {
  loadLineAccountMetaForEntityResolution,
  resolveApunteEntityId,
} from './resolve-apunte-entity-id.js';
import { NegativeBalanceError } from './account-balance-policy.js';
import { assertEntityCapability, EntityCapabilityError } from '../domain/entity-capability-rule.js';
import {
  DEFAULT_CURRENCY,
  moneyEquals,
  moneyToFixed,
  moneyToNumber,
  quantizeMoney,
  sumMoney,
} from '../domain/money.js';
import { getPlantilla } from '../plantillas/index.js';
import type { Plantilla } from '../plantillas/index.js';

export class ApunteValidationError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApunteValidationError';
    this.statusCode = statusCode;
  }
}

export class ApunteNotFoundError extends Error {
  constructor(message = 'Apunte not found') {
    super(message);
    this.name = 'ApunteNotFoundError';
  }
}

export interface ApunteLineInput {
  id: number;
  accountId: string;
  side?: 'debit' | 'credit';
  amount?: number;
}

export interface CreateApunteInput {
  templateCode?: string | null;
  date: string;
  concept: string;
  amount?: number;
  amountMode?: 'single' | 'per_line';
  entityId?: string | null;
  lines: ApunteLineInput[];
  idempotencyKey?: string;
}

export interface ApunteListResult {
  apuntes: Array<{
    id: string;
    templateCode: string | null;
    date: string;
    concept: string;
    amount: number;
    asientoId: string;
    createdAt: string;
  }>;
  total: number;
}

export interface ApunteDetailResult {
  apunte: {
    id: string;
    templateCode: string | null;
    date: string;
    concept: string;
    amount: number;
    asientoId: string;
    createdAt: string;
    lines: ApunteLineInput[];
  };
}

export interface CreateApunteResult {
  statusCode: 200 | 201;
  body: {
    apunte: {
      id: string;
      templateCode: string | null;
      date: string;
      concept: string;
      amount: number;
      asientoId: string;
      entityId: string | null;
    };
    asiento: {
      id: string;
      fecha: string;
      descripcion: string;
      lines: Array<{
        cuentaId: string | null;
        cuentaGlobalId: string | null;
        debito: number;
        credito: number;
      }>;
    };
  };
}

export interface UpdateApunteResult {
  apunte: {
    id: string;
    templateCode: string | null;
    date: string;
    concept: string;
    amount: number;
    asientoId: string;
    createdAt: string;
  };
}

export interface ApunteApplicationService {
  list(
    userId: string,
    query: ApunteListQuery & { limit?: string; offset?: string },
  ): Promise<ApunteListResult>;
  get(userId: string, id: string): Promise<ApunteDetailResult>;
  create(
    userId: string,
    input: CreateApunteInput,
    idempotencyKey?: string,
  ): Promise<CreateApunteResult>;
  update(
    userId: string,
    id: string,
    input: CreateApunteInput,
  ): Promise<UpdateApunteResult>;
}

function formatApunteDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function accountIdFromLinea(linea: {
  cuentaId: string | null;
  cuentaGlobalId: string | null;
}): string {
  return linea.cuentaId ?? linea.cuentaGlobalId ?? '';
}

function templateLinesFromAsiento(
  template: Plantilla,
  lineas: Array<{
    cuentaId: string | null;
    cuentaGlobalId: string | null;
    debito: { toString(): string };
    credito: { toString(): string };
  }>,
): ApunteLineInput[] {
  const debits = lineas.filter((l) => Number(l.debito.toString()) > 0);
  const credits = lineas.filter((l) => Number(l.credito.toString()) > 0);
  const tplDebits = template.lines.filter((l) => l.side === 'debit');
  const tplCredits = template.lines.filter((l) => l.side === 'credit');
  const out: ApunteLineInput[] = [];

  tplDebits.forEach((tl, i) => {
    const row = debits[i];
    if (row) out.push({ id: tl.id, accountId: accountIdFromLinea(row) });
  });
  tplCredits.forEach((tl, i) => {
    const row = credits[i];
    if (row) out.push({ id: tl.id, accountId: accountIdFromLinea(row) });
  });

  return out;
}

function mapListItem(row: ApunteListItem, currency: string) {
  return {
    id: row.id,
    templateCode: row.templateCode,
    date: formatApunteDate(row.date),
    concept: row.concept,
    amount: moneyToNumber(row.amount, currency),
    asientoId: row.asientoId,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeCreateResult(
  replay: IdempotentApunteReplay,
  currency: string,
): CreateApunteResult['body'] {
  return {
    apunte: {
      id: replay.apunte.id,
      templateCode: replay.apunte.templateCode,
      date: replay.apunte.date.toISOString(),
      concept: replay.apunte.concept,
      amount: moneyToNumber(replay.apunte.amount.toString(), currency),
      asientoId: replay.apunte.asientoId,
      entityId: replay.apunte.entityId,
    },
    asiento: {
      id: replay.asiento.id,
      fecha: replay.asiento.fecha.toISOString(),
      descripcion: replay.asiento.concepto,
      lines: replay.lineas.map((l) => ({
        cuentaId: l.cuentaId,
        cuentaGlobalId: l.cuentaGlobalId,
        debito: moneyToNumber(l.debito.toString(), currency),
        credito: moneyToNumber(l.credito.toString(), currency),
      })),
    },
  };
}

async function resolveAccount(
  accounts: AccountRepository,
  accountId: string,
  userId: string,
): Promise<
  { tipo: 'global'; id: string } | { tipo: 'usuario'; id: string }
> {
  const global = await accounts.findPostableGlobalAccount(accountId);
  if (global) {
    return { tipo: 'global', id: global.id };
  }

  if (await accounts.globalExists(accountId)) {
    throw new ApunteValidationError(
      `Account ${accountId} is not postable`,
      400,
    );
  }

  const userAccount = await accounts.findUserAccountById(accountId);
  if (userAccount) {
    if (userAccount.userId !== userId) {
      throw new ApunteValidationError(
        `Account ${accountId} does not belong to this user (V9)`,
        403,
      );
    }
    if (!userAccount.activa) {
      throw new ApunteValidationError(
        `Account ${accountId} is not active (V7)`,
        400,
      );
    }
    return { tipo: 'usuario', id: accountId };
  }

  throw new ApunteValidationError(`Account ${accountId} not found (V3)`, 404);
}

async function validateLineAgainstTemplate(
  accounts: AccountRepository,
  line: ApunteLineInput,
  templateLine: Plantilla['lines'][number],
): Promise<void> {
  const groupCodes: string[] =
    templateLine.strategy === 'from_group' && templateLine.groupCode
      ? [templateLine.groupCode]
      : templateLine.strategy === 'from_groups' && templateLine.groupCodes
        ? templateLine.groupCodes
        : [];

  if (groupCodes.length === 0) return;

  if (await accounts.globalExists(line.accountId)) {
    const ok = await isCuentaGlobalUnderGroups(
      accounts,
      line.accountId,
      groupCodes,
    );
    if (!ok) {
      throw new ApunteValidationError(
        `Account ${line.accountId} is not under group(s) ${groupCodes.join(', ')} for line ${line.id} (V4)`,
        400,
      );
    }
  } else {
    const ok = await isCuentaUsuarioUnderGroups(
      accounts,
      line.accountId,
      groupCodes,
    );
    if (!ok) {
      throw new ApunteValidationError(
        `Account ${line.accountId} is not under group(s) ${groupCodes.join(', ')} for line ${line.id} (V4)`,
        400,
      );
    }
  }
}

async function requireEntityCapability(
  apuntes: ApunteRepository,
  entityId: string,
  userId: string,
  requiredCapability: string,
): Promise<void> {
  const entity = await apuntes.findEntityForUser(userId, entityId);
  if (!entity) {
    throw new ApunteValidationError(`Entity ${entityId} not found (V11)`, 404);
  }
  try {
    assertEntityCapability(
      { tipo: entity.tipo, capabilities: entity.capabilities },
      requiredCapability,
    );
  } catch (err) {
    if (err instanceof EntityCapabilityError) {
      throw new ApunteValidationError(`${err.message} (V11)`, 400);
    }
    throw err;
  }
}

async function resolveBookId(
  books: BookRepository,
  userId: string,
): Promise<string> {
  const book = await books.findByUserId(userId);
  if (!book) {
    throw new ApunteValidationError('Book not found', 404);
  }
  return book.id;
}

async function resolveCurrency(
  journalStore: JournalStore,
  bookId: string,
): Promise<string> {
  return (await journalStore.getBookCurrency(bookId)) ?? DEFAULT_CURRENCY;
}

function assertRequiredFields(input: CreateApunteInput): void {
  if (!input.date || !input.concept || !input.lines?.length) {
    throw new ApunteValidationError(
      'date, concept, and lines are required',
      400,
    );
  }
}

async function buildEntryLines(
  accounts: AccountRepository,
  input: CreateApunteInput,
  template: Plantilla | undefined,
  amount: number,
  currency: string,
  userId: string,
): Promise<PersistApunteLineInput[]> {
  const entryLines: PersistApunteLineInput[] = [];

  for (const line of input.lines) {
    const resolved = await resolveAccount(accounts, line.accountId, userId);

    if (template) {
      const templateLine = template.lines.find((l) => l.id === line.id)!;
      await validateLineAgainstTemplate(accounts, line, templateLine);

      const isDebit = templateLine.side === 'debit';
      const lineAmount = quantizeMoney(amount, currency).toFixed();
      entryLines.push({
        ...(resolved.tipo === 'global'
          ? { cuentaGlobalId: resolved.id }
          : { cuentaId: resolved.id }),
        debito: isDebit ? lineAmount : moneyToFixed(0, currency),
        credito: isDebit ? moneyToFixed(0, currency) : lineAmount,
      });
    } else {
      if (!line.side || line.amount === undefined || line.amount === null) {
        throw new ApunteValidationError(
          `Line ${line.id}: side and amount required when no template`,
          400,
        );
      }

      const isDebit = line.side === 'debit';
      const lineAmount = quantizeMoney(line.amount, currency).toFixed();
      entryLines.push({
        ...(resolved.tipo === 'global'
          ? { cuentaGlobalId: resolved.id }
          : { cuentaId: resolved.id }),
        debito: isDebit ? lineAmount : moneyToFixed(0, currency),
        credito: isDebit ? moneyToFixed(0, currency) : lineAmount,
      });
    }
  }

  return entryLines;
}

function validateDistinctAccounts(
  input: CreateApunteInput,
  template: Plantilla | undefined,
): void {
  const debitIds = new Set<string>();
  const creditIds = new Set<string>();

  for (const line of input.lines) {
    if (template) {
      const templateLine = template.lines.find((l) => l.id === line.id);
      if (!templateLine) continue;
      if (templateLine.side === 'debit') debitIds.add(line.accountId);
      else creditIds.add(line.accountId);
    } else if (line.side === 'debit') {
      debitIds.add(line.accountId);
    } else if (line.side === 'credit') {
      creditIds.add(line.accountId);
    }
  }

  for (const accountId of debitIds) {
    if (creditIds.has(accountId)) {
      throw new ApunteValidationError(
        'Origin and destination must be different accounts (V10)',
        400,
      );
    }
  }
}

function validateBalance(
  entryLines: PersistApunteLineInput[],
  currency: string,
): void {
  const totalDebito = sumMoney(
    entryLines.map((l) => l.debito),
    currency,
  );
  const totalCredito = sumMoney(
    entryLines.map((l) => l.credito),
    currency,
  );
  if (!moneyEquals(totalDebito, totalCredito, currency)) {
    throw new ApunteValidationError(
      `Entry not balanced: debito ${moneyToFixed(totalDebito, currency)} ≠ credito ${moneyToFixed(totalCredito, currency)} (V8)`,
      400,
    );
  }
  if (entryLines.length < 2) {
    throw new ApunteValidationError(
      'Entry must have at least two lines (V8)',
      400,
    );
  }
}

async function resolveTemplateAndAmount(
  input: CreateApunteInput,
  existingTemplateCode: string | null | undefined,
  currency: string,
): Promise<{ template: Plantilla | undefined; amount: number }> {
  let template: Plantilla | undefined;
  const amountD = quantizeMoney(input.amount ?? 0, currency);
  let amount = moneyToNumber(amountD, currency);
  const templateCode = input.templateCode ?? existingTemplateCode ?? undefined;

  if (templateCode) {
    template = getPlantilla(templateCode);
    if (!template) {
      throw new ApunteValidationError(
        `Template '${templateCode}' not found (V1)`,
        400,
      );
    }

    const templateLineIds = new Set(template.lines.map((l) => l.id));
    for (const line of input.lines) {
      if (!templateLineIds.has(line.id)) {
        throw new ApunteValidationError(
          `Line id ${line.id} not found in template (V2)`,
          400,
        );
      }
    }

    if (template.amountMode === 'single') {
      if (input.amount === undefined || input.amount === null) {
        throw new ApunteValidationError(
          'amount is required when template has amountMode single (V5)',
          400,
        );
      }
      amount = moneyToNumber(quantizeMoney(input.amount, currency), currency);
    }
  }

  return { template, amount };
}

export function createApunteApplicationService(deps: {
  apuntes: ApunteRepository;
  accounts: AccountRepository;
  books: BookRepository;
  journalStore: JournalStore;
  accountingService: AccountingService;
}): ApunteApplicationService {
  const { apuntes, accounts, books, journalStore, accountingService } = deps;

  return {
    async list(userId, query) {
      const pagination = parseApunteListPagination(query);
      const filter = buildApunteListFilter(userId, query);
      const { total, rows } = await apuntes.list(filter, pagination);
      const bookId = await resolveBookId(books, userId);
      const currency = await resolveCurrency(journalStore, bookId);

      return {
        apuntes: rows.map((row) => mapListItem(row, currency)),
        total,
      };
    },

    async get(userId, id) {
      const row = await apuntes.findDetailById(userId, id);
      if (!row) throw new ApunteNotFoundError();

      const bookId = await resolveBookId(books, userId);
      const currency = await resolveCurrency(journalStore, bookId);

      let lines: ApunteLineInput[] = [];
      if (row.templateCode) {
        const template = getPlantilla(row.templateCode);
        if (template) {
          lines = templateLinesFromAsiento(template, row.asiento.lineas);
        }
      }

      return {
        apunte: {
          id: row.id,
          templateCode: row.templateCode,
          date: formatApunteDate(row.date),
          concept: row.concept,
          amount: moneyToNumber(row.amount.toString(), currency),
          asientoId: row.asientoId,
          createdAt: row.createdAt.toISOString(),
          lines,
        },
      };
    },

    async create(userId, input, idempotencyKey) {
      assertRequiredFields(input);

      const bookId = await resolveBookId(books, userId);
      const currency = await resolveCurrency(journalStore, bookId);

      if (idempotencyKey) {
        const existing = await apuntes.findIdempotentReplay(idempotencyKey);
        if (existing) {
          return {
            statusCode: 200,
            body: serializeCreateResult(existing, currency),
          };
        }
      }

      const { template, amount } = await resolveTemplateAndAmount(
        input,
        null,
        currency,
      );

      const lineAccountIds = input.lines.map((l) => l.accountId);
      const lineAccountMeta = await loadLineAccountMetaForEntityResolution(
        accounts,
        lineAccountIds,
        userId,
      );
      const entityResolution = resolveApunteEntityId({
        templateCode: input.templateCode ?? null,
        explicitEntityId: input.entityId ?? null,
        lineAccounts: lineAccountMeta,
        skipBankAutoFill: Boolean(template?.entity?.requiresCapability),
      });
      if (!entityResolution.ok) {
        throw new ApunteValidationError(
          entityResolution.error,
          entityResolution.statusCode,
        );
      }
      const resolvedEntityId = entityResolution.entityId;

      if (resolvedEntityId) {
        const exists = await apuntes.entityExistsForUser(
          userId,
          resolvedEntityId,
        );
        if (!exists) {
          throw new ApunteValidationError(
            `Entity ${resolvedEntityId} not found (V11)`,
            404,
          );
        }
        if (template?.entity?.requiresCapability) {
          await requireEntityCapability(
            apuntes,
            resolvedEntityId,
            userId,
            template.entity.requiresCapability,
          );
        }
      }

      const fecha = new Date(input.date);
      const año = fecha.getFullYear();
      const period = await journalStore.ensurePeriod(bookId, año);
      if (!period.abierto) {
        throw new ApunteValidationError(`Period ${año} is closed (V6)`, 400);
      }

      const entryLines = await buildEntryLines(
        accounts,
        input,
        template,
        amount,
        currency,
        userId,
      );
      validateDistinctAccounts(input, template);
      validateBalance(entryLines, currency);

      try {
        const result = await apuntes.persistCreate({
          bookId,
          userId,
          fecha,
          concept: input.concept,
          templateCode: input.templateCode ?? null,
          amount: quantizeMoney(amount, currency).toFixed(),
          entityId: resolvedEntityId,
          idempotencyKey,
          entryLines,
        });

        return {
          statusCode: result.replayed ? 200 : 201,
          body: serializeCreateResult(result, currency),
        };
      } catch (err) {
        if (idempotencyKey && journalStore.isUniqueConstraintError(err)) {
          const existing = await apuntes.findIdempotentReplay(idempotencyKey);
          if (existing) {
            return {
              statusCode: 200,
              body: serializeCreateResult(existing, currency),
            };
          }
        }
        throw err;
      }
    },

    async update(userId, id, input) {
      const existing = await apuntes.findByIdForUser(userId, id);
      if (!existing) throw new ApunteNotFoundError();

      assertRequiredFields(input);

      const bookId = await resolveBookId(books, userId);
      const currency = await resolveCurrency(journalStore, bookId);

      const { template, amount } = await resolveTemplateAndAmount(
        input,
        existing.templateCode,
        currency,
      );
      const templateCode =
        input.templateCode ?? existing.templateCode ?? undefined;

      const fecha = new Date(input.date);
      const año = fecha.getFullYear();
      const period = await journalStore.findPeriod(bookId, año);
      if (period && !period.abierto) {
        throw new ApunteValidationError(`Period ${año} is closed (V6)`, 400);
      }

      const entryLines = await buildEntryLines(
        accounts,
        input,
        template,
        amount,
        currency,
        userId,
      );

      if (template) {
        validateDistinctAccounts(input, template);
      }
      validateBalance(entryLines, currency);

      await accountingService.updateEntry(
        existing.asientoId,
        bookId,
        {
          fecha,
          concepto: input.concept,
          lineas: entryLines.map((l) => ({
            cuentaId: l.cuentaId,
            cuentaGlobalId: l.cuentaGlobalId,
            debito: moneyToNumber(l.debito, currency),
            credito: moneyToNumber(l.credito, currency),
          })),
        },
        userId,
      );

      const updated = await apuntes.updateForUser(userId, id, {
        templateCode: templateCode ?? null,
        date: fecha,
        concept: input.concept,
        amount: quantizeMoney(amount, currency).toFixed(),
      });
      if (!updated) throw new ApunteNotFoundError();

      return {
        apunte: {
          id: updated.id,
          templateCode: updated.templateCode,
          date: formatApunteDate(updated.date),
          concept: updated.concept,
          amount: moneyToNumber(updated.amount.toString(), currency),
          asientoId: updated.asientoId,
          createdAt: updated.createdAt.toISOString(),
        },
      };
    },
  };
}

export { NegativeBalanceError };
