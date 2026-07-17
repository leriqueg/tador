import { describe, expect, it } from 'vitest';
import { namespacePaths } from './namespace-paths.ts';

describe('namespacePaths', () => {
  it('maps Hogar finances routes under /hogar/*', () => {
    const paths = namespacePaths('hogar');
    expect(paths.dashboard).toBe('/hogar/dashboard');
    expect(paths.financesPyg).toBe('/hogar/finances/pyg');
    expect(paths.editApunte('abc')).toBe('/hogar/entries/new?edit=abc');
  });

  it('maps PRO finances routes under /pro/*', () => {
    const paths = namespacePaths('pro');
    expect(paths.dashboard).toBe('/pro/dashboard');
    expect(paths.financesApuntes).toBe('/pro/finances/apuntes');
    expect(paths.entriesManual).toBe('/pro/entries/manual');
  });
});
