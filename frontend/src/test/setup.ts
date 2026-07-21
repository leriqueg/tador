import '@testing-library/jest-dom/vitest';
import { i18n } from '../i18n/index.ts';
import { DEFAULT_LOCALE, persistLocale } from '../i18n/locales.ts';

persistLocale(DEFAULT_LOCALE);
void i18n.changeLanguage(DEFAULT_LOCALE);
