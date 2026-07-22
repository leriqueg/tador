import { describe, expect, it } from 'vitest';
import { isSupportedLocale, normalizeLocale } from '../../src/domain/locales.js';

describe('locales', () => {
  it('accepts supported locale tags', () => {
    expect(isSupportedLocale('es')).toBe(true);
    expect(isSupportedLocale('es-MX')).toBe(true);
    expect(isSupportedLocale('es-AR')).toBe(true);
    expect(isSupportedLocale('es-ES')).toBe(true);
    expect(isSupportedLocale('en-US')).toBe(true);
    expect(isSupportedLocale('fr-FR')).toBe(false);
  });

  it('normalizes browser tags to supported locales', () => {
    expect(normalizeLocale('es-mx')).toBe('es-MX');
    expect(normalizeLocale('es-CO')).toBe('es');
    expect(normalizeLocale('en-GB')).toBe('en-US');
    expect(normalizeLocale('unknown')).toBe('es');
  });
});
