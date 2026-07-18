import { describe, it, expect } from 'vitest';
import {
  aggregateCostYieldTotals,
  FINANCIAL_COST_CODES,
  INVESTMENT_YIELD_CODE,
} from '../../src/application/financial-analysis-service.js';

describe('aggregateCostYieldTotals (T010)', () => {
  it('sums each financial cost category separately', () => {
    const result = aggregateCostYieldTotals([
      { codigo: FINANCIAL_COST_CODES.comisiones, signedAmount: '10.50' },
      { codigo: FINANCIAL_COST_CODES.comisiones, signedAmount: '2.25' },
      { codigo: FINANCIAL_COST_CODES.intereses, signedAmount: '15.00' },
      { codigo: FINANCIAL_COST_CODES.multas, signedAmount: '3.00' },
      { codigo: INVESTMENT_YIELD_CODE, signedAmount: '100.00' },
    ]);

    expect(result.costs.comisiones).toBe(12.75);
    expect(result.costs.intereses).toBe(15);
    expect(result.costs.multas).toBe(3);
    expect(result.investmentYield).toBe(100);
  });

  it('ignores unrelated codigos and returns zeros for missing categories', () => {
    const result = aggregateCostYieldTotals([
      { codigo: '61120001', signedAmount: '999' },
      { codigo: INVESTMENT_YIELD_CODE, signedAmount: '5.5' },
    ]);

    expect(result.costs).toEqual({
      comisiones: 0,
      intereses: 0,
      multas: 0,
    });
    expect(result.investmentYield).toBe(5.5);
  });
});
