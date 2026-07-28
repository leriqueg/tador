/**
 * Supported UI locales (BCP 47). Persisted on BookConfig.locale.
 * Base copy lives in `es` (neutral tuteo); regional files override dialect only.
 */

export const SUPPORTED_LOCALES = ['es', 'es-MX', 'es-AR', 'es-ES', 'en-US'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'es';

export interface LocaleOption {
  value: AppLocale;
  /** i18n key under `meta.localeLabels` */
  labelKey: `meta.localeLabels.${AppLocale}`;
}

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { value: 'es', labelKey: 'meta.localeLabels.es' },
  { value: 'es-MX', labelKey: 'meta.localeLabels.es-MX' },
  { value: 'es-AR', labelKey: 'meta.localeLabels.es-AR' },
  { value: 'es-ES', labelKey: 'meta.localeLabels.es-ES' },
  { value: 'en-US', labelKey: 'meta.localeLabels.en-US' },
] as const;

const SUPPORTED_SET = new Set<string>(SUPPORTED_LOCALES);

const LOCALE_STORAGE_KEY = 'tador.locale';

/** Maps legacy or browser tags to a supported app locale. */
export function resolveLocale(raw: string | null | undefined): AppLocale {
  if (!raw) return DEFAULT_LOCALE;

  const normalized = raw.trim();
  if (SUPPORTED_SET.has(normalized)) return normalized as AppLocale;

  // Legacy books defaulted to en-US before UI i18n shipped.
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en-US';

  const base = normalized.split('-')[0]?.toLowerCase();
  if (base === 'es') {
    const region = normalized.split('-')[1]?.toUpperCase();
    if (region === 'MX') return 'es-MX';
    if (region === 'AR') return 'es-AR';
    if (region === 'ES') return 'es-ES';
    return 'es';
  }

  return DEFAULT_LOCALE;
}

export function readStoredLocale(): AppLocale | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored ? resolveLocale(stored) : null;
  } catch {
    return null;
  }
}

export function persistLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore quota / private mode
  }
}

/** Browser hint for marketing/auth screens before book config exists. */
export function detectDefaultLocale(): AppLocale {
  const stored = readStoredLocale();
  if (stored) return stored;

  try {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    for (const tag of languages) {
      const resolved = resolveLocale(tag);
      if (resolved !== DEFAULT_LOCALE || tag.toLowerCase().startsWith('es')) {
        return resolved;
      }
    }
  } catch {
    // ignore
  }

  return DEFAULT_LOCALE;
}

/** BCP 47 tag for Intl (dates, numbers). */
export function intlLocaleTag(locale: AppLocale): string {
  return locale;
}
