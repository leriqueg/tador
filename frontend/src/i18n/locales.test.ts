import { describe, expect, it } from 'vitest';
import { resolveLocale, detectDefaultLocale, DEFAULT_LOCALE } from './locales.ts';

describe('resolveLocale', () => {
  it('keeps supported BCP 47 tags', () => {
    expect(resolveLocale('es-MX')).toBe('es-MX');
    expect(resolveLocale('es-AR')).toBe('es-AR');
    expect(resolveLocale('es-ES')).toBe('es-ES');
    expect(resolveLocale('en-US')).toBe('en-US');
    expect(resolveLocale('es')).toBe('es');
  });

  it('maps browser-style Spanish tags to regional locales', () => {
    expect(resolveLocale('es-mx')).toBe('es-MX');
    expect(resolveLocale('es-AR')).toBe('es-AR');
    expect(resolveLocale('es-CO')).toBe('es');
  });

  it('falls back to neutral Spanish for empty or unknown values', () => {
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('fr-FR')).toBe(DEFAULT_LOCALE);
  });

  it('preserves legacy en-US books for future English UI', () => {
    expect(resolveLocale('en-US')).toBe('en-US');
    expect(resolveLocale('en-GB')).toBe('en-US');
  });
});

describe('detectDefaultLocale', () => {
  it('returns a supported locale', () => {
    const locale = detectDefaultLocale();
    expect(['es', 'es-MX', 'es-AR', 'es-ES', 'en-US']).toContain(locale);
  });
});
