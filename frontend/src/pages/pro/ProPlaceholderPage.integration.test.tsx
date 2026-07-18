import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import ProPlaceholderPage from './ProPlaceholderPage.tsx';
import { renderWithRouter } from '../../test/render.tsx';

const { mockUseAuth, mockUseBookGate } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseBookGate: vi.fn(),
}));

vi.mock('../../lib/auth.tsx', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../lib/use-book-gate.ts', () => ({
  useBookGate: () => mockUseBookGate(),
}));

describe('ProPlaceholderPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the PRO shell with the given title and description for an initialized book', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', email: 'pro@test.com' }, loading: false, logout: vi.fn() });
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { initialized: true },
      redirectTo: null,
      reload: vi.fn(),
    });

    renderWithRouter(
      <ProPlaceholderPage activePath="/pro/entries" title="Apuntes PRO" description="Próximamente: EntryBuilder." />,
      { router: { initialEntries: ['/pro/entries'] } },
    );

    expect(await screen.findByRole('heading', { name: 'Apuntes PRO' })).toBeInTheDocument();
    expect(screen.getByText('Próximamente: EntryBuilder.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Cuentas/i })[0]).toHaveAttribute('href', '/pro/accounts');
  });

  it('redirects to /login when there is no authenticated user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: null,
      redirectTo: null,
      reload: vi.fn(),
    });

    renderWithRouter(
      <ProPlaceholderPage activePath="/pro/dashboard" title="Resumen PRO" description="..." />,
      { router: { initialEntries: ['/pro/dashboard'] }, withAuthRoutes: true },
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects to onboarding when the book is not initialized', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', email: 'pro@test.com' }, loading: false, logout: vi.fn() });
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { initialized: false },
      redirectTo: '/onboarding',
      reload: vi.fn(),
    });

    renderWithRouter(
      <ProPlaceholderPage activePath="/pro/dashboard" title="Resumen PRO" description="..." />,
      { router: { initialEntries: ['/pro/dashboard'] }, withAuthRoutes: true },
    );

    expect(screen.getByText('Onboarding page')).toBeInTheDocument();
  });
});
