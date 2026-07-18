/**
 * Prisma read adapter for financial analysis (cost/yield SQL).
 */

import { prisma } from '../database.js';
import type {
  CostYieldSignedRow,
  FinancialAnalysisReadRepository,
} from '../../application/ports/financial-analysis-read-repository.js';

export type { FinancialAnalysisReadRepository };

interface CostYieldSqlRow {
  codigo: string;
  signed_amount: string;
}

export function createFinancialAnalysisReadRepository(): FinancialAnalysisReadRepository {
  return {
    async listCostYieldRows(
      bookId,
      entityId,
      year,
      costCodes,
      investmentYieldCode,
    ) {
      const rows = await prisma.$queryRaw<CostYieldSqlRow[]>`
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
          AND a."asientoOriginalId" IS NULL
          AND ap."entityId" = ${entityId}
          AND EXTRACT(YEAR FROM ap.date) = ${year}
          AND COALESCE(cg_dir.codigo, cg_via_cu.codigo) IN (
            ${costCodes[0]},
            ${costCodes[1]},
            ${costCodes[2]},
            ${investmentYieldCode}
          )
      `;

      return rows.map(
        (row): CostYieldSignedRow => ({
          codigo: row.codigo,
          signedAmount: row.signed_amount,
        }),
      );
    },
  };
}
