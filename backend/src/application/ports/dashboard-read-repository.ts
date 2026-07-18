/**
 * Port: dashboard report read model (PYG / position / portfolio).
 */

export interface DashboardMonthlySeriesRow {
  mes: number;
  income: string;
  expenses: string;
  balance: string;
}

export interface DashboardTopAccountRow {
  account_id: string;
  account_code: string;
  account_name: string;
  accumulated: string;
}

export interface DashboardAccountBalanceRow {
  account_id: string;
  account_name: string;
  account_codigo: string | null;
  tipo_cuenta: string;
  entidad_id: string | null;
  global_codigo: string | null;
  total_debito: string;
  total_credito: string;
}

export interface PortfolioAccountEntityLink {
  id: string;
  entidadId: string | null;
  entidadNombre: string | null;
}

export interface DashboardReadRepository {
  listPyGMonthlySeries(
    bookId: string,
    year: number,
    accountId: string | null,
    entityId: string | null,
  ): Promise<DashboardMonthlySeriesRow[]>;
  listPyGTopIncome(
    bookId: string,
    year: number,
    accountId: string | null,
    entityId: string | null,
  ): Promise<DashboardTopAccountRow[]>;
  listPyGTopExpenses(
    bookId: string,
    year: number,
    accountId: string | null,
    entityId: string | null,
  ): Promise<DashboardTopAccountRow[]>;
  listPositionAccountBalances(
    bookId: string,
  ): Promise<DashboardAccountBalanceRow[]>;
  findAccountsWithEntity(
    accountIds: string[],
  ): Promise<PortfolioAccountEntityLink[]>;
}
