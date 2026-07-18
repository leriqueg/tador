/**
 * Dashboard Report Service — read-only queries for PYG and Position dashboards.
 *
 * Uses decimal.js for precise monetary computation.
 * Converts to `number` only at the API boundary.
 *
 * Follows the same factory pattern as accounting-service.ts.
 */

import Decimal from 'decimal.js';
import type { DashboardReadRepository } from './ports/dashboard-read-repository.js';
import {
  toDecimal as toMoneyDecimal,
} from '../domain/money.js';

// ---------------------------------------------------------------------------
// DTOs — API response shapes
// ---------------------------------------------------------------------------

export interface PyGMonthlySeriesEntry {
  month: number;     // 1-12
  income: number;    // Decimal as number
  expenses: number;  // Positive value
  balance: number;   // May be negative
}

export interface PyGTopEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  accumulated: number;
}

export interface PyGReportDTO {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  monthlySeries: PyGMonthlySeriesEntry[];
  topIncome: PyGTopEntry[];
  topExpenses: PyGTopEntry[];
}

export interface PositionBreakdownEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: number;
}

export interface PositionBreakdown {
  available: PositionBreakdownEntry[];
  receivables: PositionBreakdownEntry[];
  payables: PositionBreakdownEntry[];
}

export interface PositionReportDTO {
  totalAvailable: number;
  totalReceivables: number;
  totalPayables: number;
  netPosition: number;
  breakdown: PositionBreakdown;
}

export interface PyGReportFilters {
  accountId?: string | null;
  entityId?: string | null;
}

export interface PortfolioEntityEntry {
  entityId: string;
  entityName: string;
  receivables: number;
  payables: number;
  net: number;
}

export interface PortfolioReportDTO {
  entities: PortfolioEntityEntry[];
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface DashboardReportService {
  getPyGReport(
    bookId: string,
    year: number,
    filters?: PyGReportFilters,
  ): Promise<PyGReportDTO>;
  getPositionReport(bookId: string): Promise<PositionReportDTO>;
  getPortfolioReport(bookId: string): Promise<PortfolioReportDTO>;
}

// ---------------------------------------------------------------------------
// Account classification helpers
// ---------------------------------------------------------------------------

type AccountClass =
  | 'available'
  | 'receivable'
  | 'payable'
  | 'excluded';

/** Classify a CuentaUsuario account for the Position report. */
function classifyPositionAccount(
  tipoCuenta: string,
  globalCodigo: string | null,
  entidadId: string | null,
): AccountClass {
  // Excluded account types
  if (
    tipoCuenta === 'bridge' ||
    tipoCuenta === 'incomeCategory' ||
    tipoCuenta === 'expenseCategory'
  ) {
    return 'excluded';
  }

  const prefix = globalCodigo ? globalCodigo.charAt(0) : '';

  // Liquid medios: bank/wallet/card from institution entities still carry
  // entidadId (the bank/issuer), but they are Available/Payable by tipo —
  // not counterparty receivables. Check tipoCuenta before entidadId.
  if (tipoCuenta === 'bank') {
    return 'available';
  }

  if (tipoCuenta === 'card') {
    if (prefix === '1') return 'available';
    if (prefix === '2') return 'payable';
    return 'excluded';
  }

  // Counterparty links (person/org CxC-CxP): wallet (or other) + entidadId
  if (entidadId && prefix === '1') {
    return 'receivable';
  }
  if (entidadId && prefix === '2') {
    return 'payable';
  }

  if (tipoCuenta === 'wallet') {
    return 'available';
  }

  // Asset codigo → available
  if (prefix === '1') {
    return 'available';
  }

  // Liability codigo → payable
  if (prefix === '2') {
    return 'payable';
  }

  // Everything else (equity 3xxx, income 4xxx, expense 6xxx, unknown)
  return 'excluded';
}

// ---------------------------------------------------------------------------
// Decimal helpers
// ---------------------------------------------------------------------------

/** Safely convert a string or number to Decimal via domain money helpers. */
function toDecimal(value: string | number | { toString: () => string }): Decimal {
  if (typeof value === 'number') return toMoneyDecimal(value);
  return toMoneyDecimal(value.toString());
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createDashboardReportService(
  reads: DashboardReadRepository,
): DashboardReportService {
  return {
    // -----------------------------------------------------------------------
    // getPyGReport
    // -----------------------------------------------------------------------
    async getPyGReport(
      bookId: string,
      year: number,
      filters: PyGReportFilters = {},
    ): Promise<PyGReportDTO> {
      const accountId = filters.accountId ?? null;
      const entityId = filters.entityId ?? null;

      const [monthlyRows, topIncomeRows, topExpenseRows] = await Promise.all([
        reads.listPyGMonthlySeries(bookId, year, accountId, entityId),
        reads.listPyGTopIncome(bookId, year, accountId, entityId),
        reads.listPyGTopExpenses(bookId, year, accountId, entityId),
      ]);

      const totalIncomeD = monthlyRows.reduce(
        (acc, row) => acc.plus(toDecimal(row.income)),
        new Decimal(0),
      );
      const totalExpensesD = monthlyRows.reduce(
        (acc, row) => acc.plus(toDecimal(row.expenses)),
        new Decimal(0),
      );
      const netResultD = totalIncomeD.minus(totalExpensesD);

      return {
        year,
        totalIncome: totalIncomeD.toNumber(),
        totalExpenses: totalExpensesD.toNumber(),
        netResult: netResultD.toNumber(),
        monthlySeries: monthlyRows.map((row) => ({
          month: row.mes,
          income: toDecimal(row.income).toNumber(),
          expenses: toDecimal(row.expenses).toNumber(),
          balance: toDecimal(row.balance).toNumber(),
        })),
        topIncome: topIncomeRows.map((row) => ({
          accountId: row.account_id,
          accountCode: row.account_code,
          accountName: row.account_name,
          accumulated: toDecimal(row.accumulated).toNumber(),
        })),
        topExpenses: topExpenseRows.map((row) => ({
          accountId: row.account_id,
          accountCode: row.account_code,
          accountName: row.account_name,
          accumulated: toDecimal(row.accumulated).toNumber(),
        })),
      };
    },

    // -----------------------------------------------------------------------
    // getPositionReport
    // -----------------------------------------------------------------------
    async getPositionReport(bookId: string): Promise<PositionReportDTO> {
      const accountRows = await reads.listPositionAccountBalances(bookId);

      const available: PositionBreakdownEntry[] = [];
      const receivables: PositionBreakdownEntry[] = [];
      const payables: PositionBreakdownEntry[] = [];

      for (const row of accountRows) {
        const classification = classifyPositionAccount(
          row.tipo_cuenta,
          row.global_codigo,
          row.entidad_id,
        );

        if (classification === 'excluded') continue;

        const debitoD = toDecimal(row.total_debito);
        const creditoD = toDecimal(row.total_credito);

        const prefix = row.global_codigo ? row.global_codigo.charAt(0) : '';
        let balance: Decimal;

        if (prefix === '2') {
          balance = creditoD.minus(debitoD);
        } else {
          balance = debitoD.minus(creditoD);
        }

        const entry: PositionBreakdownEntry = {
          accountId: row.account_id,
          accountCode: row.global_codigo ?? row.account_codigo ?? '',
          accountName: row.account_name,
          balance: balance.toNumber(),
        };

        switch (classification) {
          case 'available':
            available.push(entry);
            break;
          case 'receivable':
            receivables.push(entry);
            break;
          case 'payable':
            payables.push(entry);
            break;
        }
      }

      const totalAvailableD = available.reduce(
        (acc, e) => acc.plus(toDecimal(e.balance)),
        new Decimal(0),
      );
      const totalReceivablesD = receivables.reduce(
        (acc, e) => acc.plus(toDecimal(e.balance)),
        new Decimal(0),
      );
      const totalPayablesD = payables.reduce(
        (acc, e) => acc.plus(toDecimal(e.balance)),
        new Decimal(0),
      );
      const netPositionD = totalAvailableD
        .plus(totalReceivablesD)
        .minus(totalPayablesD);

      return {
        totalAvailable: totalAvailableD.toNumber(),
        totalReceivables: totalReceivablesD.toNumber(),
        totalPayables: totalPayablesD.toNumber(),
        netPosition: netPositionD.toNumber(),
        breakdown: {
          available,
          receivables,
          payables,
        },
      };
    },

    async getPortfolioReport(bookId: string): Promise<PortfolioReportDTO> {
      const position = await this.getPositionReport(bookId);
      const entityMap = new Map<
        string,
        { entityName: string; receivables: Decimal; payables: Decimal }
      >();

      const accountIds = [
        ...position.breakdown.receivables.map((e) => e.accountId),
        ...position.breakdown.payables.map((e) => e.accountId),
      ];
      const accounts = await reads.findAccountsWithEntity(accountIds);
      const accountById = new Map(accounts.map((a) => [a.id, a]));

      for (const entry of position.breakdown.receivables) {
        const account = accountById.get(entry.accountId);
        if (!account?.entidadId) continue;
        const current = entityMap.get(account.entidadId) ?? {
          entityName: account.entidadNombre ?? 'Unknown',
          receivables: new Decimal(0),
          payables: new Decimal(0),
        };
        current.receivables = current.receivables.plus(toDecimal(entry.balance));
        entityMap.set(account.entidadId, current);
      }

      for (const entry of position.breakdown.payables) {
        const account = accountById.get(entry.accountId);
        if (!account?.entidadId) continue;
        const current = entityMap.get(account.entidadId) ?? {
          entityName: account.entidadNombre ?? 'Unknown',
          receivables: new Decimal(0),
          payables: new Decimal(0),
        };
        current.payables = current.payables.plus(toDecimal(entry.balance));
        entityMap.set(account.entidadId, current);
      }

      const entities: PortfolioEntityEntry[] = [...entityMap.entries()]
        .map(([entityId, data]) => ({
          entityId,
          entityName: data.entityName,
          receivables: data.receivables.toNumber(),
          payables: data.payables.toNumber(),
          net: data.receivables.minus(data.payables).toNumber(),
        }))
        .sort((a, b) => a.entityName.localeCompare(b.entityName));

      return { entities };
    },
  };
}
