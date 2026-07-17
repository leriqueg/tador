import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes, type MemoryRouterProps } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  router?: MemoryRouterProps;
  /** Placeholder routes for Navigate targets (login, onboarding). */
  withAuthRoutes?: boolean;
}

export function renderWithRouter(ui: ReactElement, { router, withAuthRoutes, ...options }: Options = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    if (withAuthRoutes) {
      return (
        <MemoryRouter {...router}>
          <Routes>
            <Route path="/login" element={<div>Login page</div>} />
            <Route path="/onboarding" element={<div>Onboarding page</div>} />
            <Route path="*" element={children} />
          </Routes>
        </MemoryRouter>
      );
    }

    return <MemoryRouter {...router}>{children}</MemoryRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
