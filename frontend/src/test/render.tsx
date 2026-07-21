import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes, type MemoryRouterProps } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';
import { TestI18nProvider } from '../i18n/I18nProvider.tsx';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  router?: MemoryRouterProps;
  /** Placeholder routes for Navigate targets (login, onboarding). */
  withAuthRoutes?: boolean;
}

export function renderWithRouter(ui: ReactElement, { router, withAuthRoutes, ...options }: Options = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    const routed = withAuthRoutes ? (
      <MemoryRouter {...router}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/onboarding" element={<div>Onboarding page</div>} />
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    ) : (
      <MemoryRouter {...router}>{children}</MemoryRouter>
    );

    return <TestI18nProvider>{routed}</TestI18nProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
