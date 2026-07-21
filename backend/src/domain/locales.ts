/**
 * Supported UI locales (BCP 47). Keep in sync with frontend/src/i18n/locales.ts.
 */

export const SUPPORTED_LOCALES = ['es', 'es-MX', 'es-AR', 'es-ES', 'en-US'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'es';

const SUPPORTED_SET = new Set<string>(SUPPORTED_LOCALES);

export function isSupportedLocale(value: string): value is AppLocale {
  return SUPPORTED_SET.has(value);
}

export function normalizeLocale(raw: string): AppLocale {
  const trimmed = raw.trim();
  if (isSupportedLocale(trimmed)) return trimmed;

  if (trimmed === 'en' || trimmed.startsWith('en-')) return 'en-US';

  const base = trimmed.split('-')[0]?.toLowerCase();
  if (base === 'es') {
    const region = trimmed.split('-')[1]?.toUpperCase();
    if (region === 'MX') return 'es-MX';
    if (region === 'AR') return 'es-AR';
    if (region === 'ES') return 'es-ES';
    return 'es';
  }

  return DEFAULT_LOCALE;
}
