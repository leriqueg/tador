/**
 * Financial analysis helpers — cost/yield aggregation by entity + category codes.
 *
 * Sprint 009: categories 62010001–03 (costs) and 41120002 (investment yield).
 * Amounts use exact decimal strings; converted to number at API boundary.
 */

import Decimal from 'decimal.js';
import { prisma } from '../infrastructure/database.js';
import { toDecimal as toMoneyDecimal } from '../domain/money.js';

export const FINANCIAL_COST_CODES = {
  comisiones: '62010001',
  intereses: '62010002',
  multas: '62010003',
} as const;

export const INVESTMENT_YIELD_CODE = '41120002';

export interface CostYieldLineRow {
  codigo: string;
  /** Expense: debit minus credit. Income yield: credit minus debit. */
  signedAmount: string;
}

export interface CostYieldTotalsDTO {
  year: number;
  entityId: string;
  costs: {
    comisiones: number;
    intereses: number;
    multas: number;
  };
  investmentYield: number;
}

function toDecimal(value: string): Decimal {
  return toMoneyDecimal(value);
}

/**
 * Pure aggregation from normalized signed amounts by chart codigo.
 */
export function aggregateCostYieldTotals(
  rows: CostYieldLineRow[],
): Omit<CostYieldTotalsDTO, 'year' | 'entityId'> {
  let comisiones = new Decimal(0);
  let intereses = new Decimal(0);
  let multas = new Decimal(0);
  let investmentYield = new Decimal(0);

  for (const row of rows) {
    const amount = toDecimal(row.signedAmount);
    switch (row.codigo) {
      case FINANCIAL_COST_CODES.comisiones:
        comisiones = comisiones.plus(amount);
        break;
      case FINANCIAL_COST_CODES.intereses:
        intereses = intereses.plus(amount);
        break;
      case FINANCIAL_COST_CODES.multas:
        multas = multas.plus(amount);
        break;
      case INVESTMENT_YIELD_CODE:
        investmentYield = investmentYield.plus(amount);
        break;
      default:
        break;
    }
  }

  return {
    costs: {
      comisiones: comisiones.toNumber(),
      intereses: intereses.toNumber(),
      multas: multas.toNumber(),
    },
    investmentYield: investmentYield.toNumber(),
  };
}

export interface FinancialAnalysisService {
  getCostYieldTotals(
    bookId: string,
    entityId: string,
    year: number,
  ): Promise<CostYieldTotalsDTO>;
}

interface CostYieldSqlRow {
  codigo: string;
  signed_amount: string;
}

export function createFinancialAnalysisService(): FinancialAnalysisService {
  return {
    async getCostYieldTotals(bookId, entityId, year) {
      const rows: CostYieldSqlRow[] = await prisma.$queryRaw`
        SELECT
          COALESCE(cg_dir.codigo, cg_via_cu.codigo) AS codigo,
          CASE
            WHEN COALESCE(cg_dir.codigo, cg_via_cu.codigo) LIKE '6%'
              THEN (l.debito - l.credito)::numeric
            ELSE (l.credito - l.debito)::numeric
          END AS signed_amount
        FROM apuntes ap
        INNER JOIN asientos a ON a.id = ap."asientoId"
        INNER JOIN lineas_asiento l ON l."asientoId" = a.id
        LEFT JOIN cuentas_usuario cu ON cu.id = l."cuentaId"
        LEFT JOIN cuentas_globales cg_dir ON cg_dir.id = l."cuentaGlobalId"
        LEFT JOIN cuentas_globales cg_via_cu ON cg_via_cu.id = cu."globalId"
        WHERE a."bookId" = ${bookId}
          AND a.anulado = false
          AND ap."entityId" = ${entityId}
          AND EXTRACT(YEAR FROM ap.date) = ${year}
          AND COALESCE(cg_dir.codigo, cg_via_cu.codigo) IN (
            ${FINANCIAL_COST_CODES.comisiones},
            ${FINANCIAL_COST_CODES.intereses},
            ${FINANCIAL_COST_CODES.multas},
            ${INVESTMENT_YIELD_CODE}
          )
      `;

      const aggregated = aggregateCostYieldTotals(
        rows.map((r) => ({
          codigo: r.codigo,
          signedAmount: r.signed_amount,
        })),
      );

      return {
        year,
        entityId,
        ...aggregated,
      };
    },
  };
}