import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  DEFAULT_LOCALE,
  detectDefaultLocale,
  type AppLocale,
} from './locales.ts';
import es from './resources/es.json';
import esMx from './resources/es-MX.json';
import esAr from './resources/es-AR.json';
import esEs from './resources/es-ES.json';
import enUs from './resources/en-US.json';

export const i18nReady = i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    'es-MX': { translation: esMx },
    'es-AR': { translation: esAr },
    'es-ES': { translation: esEs },
    'en-US': { translation: enUs },
  },
  lng: detectDefaultLocale(),
  fallbackLng: {
    'es-MX': ['es'],
    'es-AR': ['es'],
    'es-ES': ['es'],
    'en-US': ['es'],
    default: [DEFAULT_LOCALE],
  },
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export async function setAppLocale(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale);
}

export { i18n };
