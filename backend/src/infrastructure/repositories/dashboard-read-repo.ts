/**
 * Prisma read adapter for dashboard reports (PYG / position / portfolio).
 */

import { prisma } from '../database.js';
import type {
  DashboardAccountBalanceRow,
  DashboardMonthlySeriesRow,
  DashboardReadRepository,
  DashboardTopAccountRow,
  PortfolioAccountEntityLink,
} from '../../application/ports/dashboard-read-repository.js';

export type { DashboardReadRepository };

export function createDashboardReadRepository(): DashboardReadRepository {
  return {
    async listPyGMonthlySeries(bookId, year, accountId, entityId) {
      return prisma.$queryRaw<DashboardMonthlySeriesRow[]>`
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
            AND a."asientoOriginalId" IS NULL
            AND EXTRACT(YEAR FROM a.fecha) = ${year}
            AND (cu."tipoCuenta" IS DISTINCT FROM 'bridge')
            AND (
              COALESCE(cg_dir.codigo, cg_via_cu.codigo) LIKE '4%'
              OR COALESCE(cg_dir.codigo, cg_via_cu.codigo) LIKE '6%'
            )
            AND (${accountId}::text IS NULL OR l."cuentaId" = ${accountId} OR l."cuentaGlobalId" = ${accountId})
            AND (${entityId}::text IS NULL OR EXISTS (
              SELECT 1 FROM apuntes ap
              WHERE ap."asientoId" = a.id AND ap."entityId" = ${entityId}
            ))
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
    },

    async listPyGTopIncome(bookId, year, accountId, entityId) {
      return prisma.$queryRaw<DashboardTopAccountRow[]>`
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
          AND a."asientoOriginalId" IS NULL
          AND EXTRACT(YEAR FROM a.fecha) = ${year}
          AND (cu."tipoCuenta" IS DISTINCT FROM 'bridge')
          AND COALESCE(cg_dir.codigo, cg_via_cu.codigo) LIKE '4%'
          AND (${accountId}::text IS NULL OR l."cuentaId" = ${accountId} OR l."cuentaGlobalId" = ${accountId})
          AND (${entityId}::text IS NULL OR EXISTS (
            SELECT 1 FROM apuntes ap
            WHERE ap."asientoId" = a.id AND ap."entityId" = ${entityId}
          ))
        GROUP BY
          COALESCE(l."cuentaId", l."cuentaGlobalId"),
          COALESCE(cg_dir.codigo, cg_via_cu.codigo),
          COALESCE(cg_dir.nombre, cg_via_cu.nombre, cu.nombre)
        HAVING SUM(l.credito - l.debito) > 0
        ORDER BY accumulated DESC, account_name ASC
        LIMIT 10
      `;
    },

    async listPyGTopExpenses(bookId, year, accountId, entityId) {
      return prisma.$queryRaw<DashboardTopAccountRow[]>`
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
          AND a."asientoOriginalId" IS NULL
          AND EXTRACT(YEAR FROM a.fecha) = ${year}
          AND (cu."tipoCuenta" IS DISTINCT FROM 'bridge')
          AND COALESCE(cg_dir.codigo, cg_via_cu.codigo) LIKE '6%'
          AND (${accountId}::text IS NULL OR l."cuentaId" = ${accountId} OR l."cuentaGlobalId" = ${accountId})
          AND (${entityId}::text IS NULL OR EXISTS (
            SELECT 1 FROM apuntes ap
            WHERE ap."asientoId" = a.id AND ap."entityId" = ${entityId}
          ))
        GROUP BY
          COALESCE(l."cuentaId", l."cuentaGlobalId"),
          COALESCE(cg_dir.codigo, cg_via_cu.codigo),
          COALESCE(cg_dir.nombre, cg_via_cu.nombre, cu.nombre)
        HAVING SUM(l.debito - l.credito) > 0
        ORDER BY accumulated DESC, account_name ASC
        LIMIT 10
      `;
    },

    async listPositionAccountBalances(bookId) {
      return prisma.$queryRaw<DashboardAccountBalanceRow[]>`
        WITH book_lines AS (
          SELECT
            l."cuentaId",
            l.debito,
            l.credito
          FROM lineas_asiento l
          INNER JOIN asientos a ON a.id = l."asientoId"
          WHERE a."bookId" = ${bookId}
            AND a.anulado = false
            AND a."asientoOriginalId" IS NULL
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
    },

    async findAccountsWithEntity(accountIds) {
      if (accountIds.length === 0) {
        return [];
      }

      const rows = await prisma.cuentaUsuario.findMany({
        where: { id: { in: accountIds } },
        select: {
          id: true,
          entidadId: true,
          entidad: { select: { nombre: true } },
        },
      });

      return rows.map(
        (row): PortfolioAccountEntityLink => ({
          id: row.id,
          entidadId: row.entidadId,
          entidadNombre: row.entidad?.nombre ?? null,
        }),
      );
    },
  };
}
