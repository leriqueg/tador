import { useEffect, useState } from 'react';
import { book, type BookConfig } from './api';

interface BookGateState {
  loading: boolean;
  config: BookConfig | null;
  /** When set, navigate here (e.g. uninitialized → /onboarding) */
  redirectTo: '/onboarding' | null;
}

/**
 * Loads book config for authenticated screens.
 * Uninitialized books are redirected to onboarding (FR-009).
 */
export function useBookGate(): BookGateState {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<BookConfig | null>(null);
  const [redirectTo, setRedirectTo] = useState<'/onboarding' | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await book.get();
        if (cancelled) return;
        setConfig(res.config);
        setRedirectTo(res.config.initialized ? null : '/onboarding');
      } catch {
        if (cancelled) return;
        setConfig(null);
        setRedirectTo(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, config, redirectTo };
}
