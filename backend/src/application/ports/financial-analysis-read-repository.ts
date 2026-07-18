/**
 * Port: financial analysis read model (cost/yield SQL).
 */

export interface CostYieldSignedRow {
  codigo: string;
  signedAmount: string;
}

export interface FinancialAnalysisReadRepository {
  listCostYieldRows(
    bookId: string,
    entityId: string,
    year: number,
    costCodes: string[],
    investmentYieldCode: string,
  ): Promise<CostYieldSignedRow[]>;
}
