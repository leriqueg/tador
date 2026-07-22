import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { I18nextProvider } from 'react-i18next';
import { book } from '../lib/api.ts';
import { useOptionalAuth } from '../lib/auth.tsx';
import { i18n, setAppLocale } from './index.ts';
import {
  detectDefaultLocale,
  persistLocale,
  resolveLocale,
  DEFAULT_LOCALE,
  type AppLocale,
} from './locales.ts';

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
  /** True while syncing book locale after login. */
  syncing: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function LocaleControllerBase({
  children,
  user,
  bootstrapLocale,
}: {
  children: ReactNode;
  user: { id: string } | null;
  bootstrapLocale?: AppLocale;
}) {
  const detectedLocale = useMemo(() => detectDefaultLocale(), []);
  const initialLocale = bootstrapLocale ?? detectedLocale;
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void setAppLocale(initialLocale).then(() => {
      setLocaleState(initialLocale);
    });
  }, [initialLocale]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setSyncing(true);

    void book
      .get()
      .then((res) => {
        if (cancelled) return;
        const bookLocale = resolveLocale(res.config.locale);
        void setAppLocale(bookLocale).then(() => {
          if (cancelled) return;
          setLocaleState(bookLocale);
          persistLocale(bookLocale);
        });
      })
      .catch(() => {
        // keep browser/stored locale on transient errors
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const setLocale = useCallback(async (next: AppLocale) => {
    await setAppLocale(next);
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, syncing }),
    [locale, setLocale, syncing],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function AuthenticatedLocaleController({ children }: { children: ReactNode }) {
  const auth = useOptionalAuth();
  return <LocaleControllerBase user={auth?.user ?? null}>{children}</LocaleControllerBase>;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthenticatedLocaleController>{children}</AuthenticatedLocaleController>
    </I18nextProvider>
  );
}

/** Test helper: translations without auth/book sync (avoids vi.mock conflicts). */
export function TestI18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LocaleControllerBase user={null} bootstrapLocale={DEFAULT_LOCALE}>
        {children}
      </LocaleControllerBase>
    </I18nextProvider>
  );
}

export function useAppLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useAppLocale must be used within I18nProvider');
  return ctx;
}
