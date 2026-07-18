import { describe, expect, it } from 'vitest';
import { namespacePaths } from './namespace-paths.ts';

describe('namespacePaths', () => {
  it('maps Hogar finances routes under /hogar/*', () => {
    const paths = namespacePaths('hogar');
    expect(paths.dashboard).toBe('/hogar/dashboard');
    expect(paths.financesPyg).toBe('/hogar/finances/pyg');
    expect(paths.editApunte('abc')).toBe('/hogar/entries/new?edit=abc');
  });

  it('maps PRO analysis routes under /pro/analysis/*', () => {
    const paths = namespacePaths('pro');
    expect(paths.analysis).toBe('/pro/analysis');
    expect(paths.analysisBanks).toBe('/pro/analysis/banks');
    expect(paths.analysisCards).toBe('/pro/analysis/cards');
    expect(paths.analysisPortfolio).toBe('/pro/analysis/portfolio');
  });
});
