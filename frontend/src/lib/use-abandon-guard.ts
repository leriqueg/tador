import { useEffect } from 'react';

const DEFAULT_MESSAGE = 'Tenés un apunte en progreso. ¿Salir sin guardar?';

/** Warn before tab close/refresh when capture has unsaved draft (T029). */
export function useAbandonGuard(active: boolean, _message = DEFAULT_MESSAGE): void {
  useEffect(() => {
    if (!active) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
}
