/**
 * Dashboard Report Service — read-only queries for PYG and Position dashboards.
 *
 * Uses raw SQL via Prisma for complex aggregations (window functions, LEFT JOIN
 * generate_series) and decimal.js for precise monetary computation.
 * Converts to `number` only at the API boundary.
 *
 * Follows the same factory pattern as accounting-service.ts.
 */

import Decimal from 'decimal.js';
import { prisma } from '../infrastructure/database.js';

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

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface DashboardReportService {
  getPyGReport(bookId: string, year: number): Promise<PyGReportDTO>;
  getPositionReport(bookId: string): Promise<PositionReportDTO>;
}

// ---------------------------------------------------------------------------
// Raw SQL row types
// ---------------------------------------------------------------------------

interface MonthlySeriesRow {
  mes: number;
  income: string;
  expenses: string;
  balance: string;
}

interface TopAccountRow {
  account_id: string;
  account_code: string;
  account_name: string;
  accumulated: string;
}

interface AccountBalanceRow {
  account_id: string;
  account_name: string;
  account_codigo: string | null;
  tipo_cuenta: string;
  entidad_id: string | null;
  global_codigo: string | null;
  total_debito: string;
  total_credito: string;
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

  // Entity-linked accounts: entidadId takes precedence for proper
  // classification of loans/credit extended to third parties.
  if (entidadId && prefix === '1') {
    return 'receivable';
  }
  if (entidadId && prefix === '2') {
    return 'payable';
  }

  // Bank and wallet are liquid assets
  if (tipoCuenta === 'bank' || tipoCuenta === 'wallet') {
    return 'available';
  }

  // Cards: codigo determines classification
  if (tipoCuenta === 'card') {
    if (prefix === '1') return 'available';
    if (prefix === '2') return 'payable';
    return 'excluded'; // Unknown card type
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

/** Safely convert a string or number to Decimal. */
function toDecimal(value: string | number | { toString: () => string }): Decimal {
  if (typeof value === 'number') return new Decimal(value);
  return new Decimal(value.toString());
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createDashboardReportService(): DashboardReportService {
  return {
    // -----------------------------------------------------------------------
    // getPyGReport
    // -----------------------------------------------------------------------
    async getPyGReport(bookId: string, year: number): Promise<PyGReportDTO> {
      // 1. Monthly series — 12 months via generate_series LEFT JOIN
      const monthlyRows: MonthlySeriesRow[] = await prisma.$queryRaw`
        WITH line_details AS (
          SELECT
            l.debito,
            l.credito,
            EXTRACT(MONTH FROM a.fecha)::int AS mes,
            COALESCE(cg_dir.codigo, cg_via_cu.codigo) AS codigo
          FROM lineas_asiento l
          INNER JOIN asientos a ON a.id = l."asientoId"
          LEFT JOIN cuentas_usuario cu ON cu.id = l."cuentaId"
          LEFT JOIN cuentas_globales cg_dir ON cg_dir.id = l."cuentaGlobalId"
          LEFT JOIN cuentas_globales cg_via_cu ON cg_via_cu.id = cu."globalId"
          WHERE a."bookId" = ${bookId}
            AND a.anulado = false
            AND EXTRACT(YEAR FROM a.fecha) = ${year}
            AND (cu."tipoCuenta" IS DISTINCT FROM 'bridge')
            AND (
              COALESCE(cg_dir.codigo, cg_via_cu.codigo) LIKE '4%'
              OR COALESCE(cg_dir.codigo, cg_via_cu.codigo) LIKE '6%'
            )
        ),
        monthly_agg AS (
          SELECT
            mes,
            COALESCE(SUM(CASE WHEN codigo LIKE '4%' THEN credito - debito ELSE 0 END), 0) AS income_amount,
            COALESCE(SUM(CASE WHEN codigo LIKE '6%' THEN debito - credito ELSE 0 END), 0) AS expense_amount
          FROM line_details
          GROUP BY mes
        )
        SELECT
          m.mes,
          COALESCE(ma.income_amount, 0)::numeric AS income,
          COALESCE(ma.expense_amount, 0)::numeric AS expenses,
          (COALESCE(ma.income_amount, 0) - COALESCE(ma.expense_amount, 0))::numeric AS balance
        FROM generate_series(1, 12) AS m(mes)
        LEFT JOIN monthly_agg ma ON ma.mes = m.mes
        ORDER BY m.mes
      `;

      // 2. Top 10 income — codigo LIKE '4%', credit-natural (credito - debito)
      const topIncomeRows: TopAccountRow[] = await prisma.$queryRaw`
        SELECT
          COALESCE(l."cuentaId", l."cuentaGlobalId") AS account_id,
          COALESCE(cg_dir.codigo, cg_via_cu.codigo) AS account_code,
          COALESCE(cg_dir.nombre, cg_via_cu.nombre, cu.nombre) AS account_name,
          SUM(l.credito - l.debito)::numeric AS accumulated
        FROM lineas_asiento l
        INNER JOIN asientos a ON a.id = l."asientoId"
        LEFT JOIN cuentas_usuario cu ON cu.id = l."cuentaId"
        LEFT JOIN cuentas_globales cg_dir ON cg_dir.id = l."cuentaGlobalId"
        LEFT JOIN cuentas_globales cg_via_cu ON cg_via_cu.id = cu."globalId"
        WHERE a."bookId" = ${bookId}
          AND a.anulado = false
          AND EXTRACT(YEAR FROM a.fecha) = ${year}
          AND (cu."tipoCuenta" IS DISTINCT FROM 'bridge')
          AND COALESCE(cg_dir.codigo, cg_via_cu.codigo) LIKE '4%'
        GROUP BY
          COALESCE(l."cuentaId", l."cuentaGlobalId"),
          COALESCE(cg_dir.codigo, cg_via_cu.codigo),
          COALESCE(cg_dir.nombre, cg_via_cu.nombre, cu.nombre)
        HAVING SUM(l.credito - l.debito) > 0
        ORDER BY accumulated DESC, account_name ASC
        LIMIT 10
      `;

      // 3. Top 10 expenses — codigo LIKE '6%', debit-natural (debito - credito)
      const topExpenseRows: TopAccountRow[] = await prisma.$queryRaw`
        SELECT
          COALESCE(l."cuentaId", l."cuentaGlobalId") AS account_id,
          COALESCE(cg_dir.codigo, cg_via_cu.codigo) AS account_code,
          COALESCE(cg_dir.nombre, cg_via_cu.nombre, cu.nombre) AS account_name,
          SUM(l.debito - l.credito)::numeric AS accumulated
        FROM lineas_asiento l
        INNER JOIN asientos a ON a.id = l."asientoId"
        LEFT JOIN cuentas_usuario cu ON cu.id = l."cuentaId"
        LEFT JOIN cuentas_globales cg_dir ON cg_dir.id = l."cuentaGlobalId"
        LEFT JOIN cuentas_globales cg_via_cu ON cg_via_cu.id = cu."globalId"
        WHERE a."bookId" = ${bookId}
          AND a.anulado = false
          AND EXTRACT(YEAR FROM a.fecha) = ${year}
          AND (cu."tipoCuenta" IS DISTINCT FROM 'bridge')
          AND COALESCE(cg_dir.codigo, cg_via_cu.codigo) LIKE '6%'
        GROUP BY
          COALESCE(l."cuentaId", l."cuentaGlobalId"),
          COALESCE(cg_dir.codigo, cg_via_cu.codigo),
          COALESCE(cg_dir.nombre, cg_via_cu.nombre, cu.nombre)
        HAVING SUM(l.debito - l.credito) > 0
        ORDER BY accumulated DESC, account_name ASC
        LIMIT 10
      `;

      // 4. Compute totals with Decimal.js
      const totalIncomeD = monthlyRows.reduce(
        (acc, row) => acc.plus(toDecimal(row.income)),
        new Decimal(0),
      );
      const totalExpensesD = monthlyRows.reduce(
        (acc, row) => acc.plus(toDecimal(row.expenses)),
        new Decimal(0),
      );
      const netResultD = totalIncomeD.minus(totalExpensesD);

      // Build response — convert Decimal to number at API boundary
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
      // Get all CuentaUsuario accounts with their aggregated balances
      const accountRows: AccountBalanceRow[] = await prisma.$queryRaw`
        WITH book_lines AS (
          SELECT
            l."cuentaId",
            l.debito,
            l.credito
          FROM lineas_asiento l
          INNER JOIN asientos a ON a.id = l."asientoId"
          WHERE a."bookId" = ${bookId}
            AND a.anulado = false
        )
        SELECT
          cu.id AS account_id,
          cu.nombre AS account_name,
          cu.codigo AS account_codigo,
          cu."tipoCuenta"::text AS tipo_cuenta,
          cu."entidadId" AS entidad_id,
          cg.codigo AS global_codigo,
          COALESCE(SUM(bl.debito), 0)::numeric AS total_debito,
          COALESCE(SUM(bl.credito), 0)::numeric AS total_credito
        FROM cuentas_usuario cu
        LEFT JOIN cuentas_globales cg ON cg.id = cu."globalId"
        LEFT JOIN book_lines bl ON bl."cuentaId" = cu.id
        WHERE cu."userId" = (SELECT "userId" FROM "books" WHERE id = ${bookId})
          AND cu.activa = true
        GROUP BY
          cu.id,
          cu.nombre,
          cu.codigo,
          cu."tipoCuenta",
          cu."entidadId",
          cg.codigo
      `;

      // Classify each account and compute balances
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

        // For asset-type accounts (1xxx): balance = debito - credito
        // For liability-type accounts (2xxx): balance = credito - debito
        const prefix = row.global_codigo ? row.global_codigo.charAt(0) : '';
        let balance: Decimal;

        if (prefix === '2') {
          // Liability credit-natural
          balance = creditoD.minus(debitoD);
        } else {
          // Asset debit-natural
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

      // Compute totals with Decimal.js
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
  };
}
