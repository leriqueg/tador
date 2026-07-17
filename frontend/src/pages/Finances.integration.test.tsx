import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import Finances from './Finances.tsx';
import { renderWithRouter } from '../test/render.tsx';

const { logout, mockUseAuth, mockUseBookGate } = vi.hoisted(() => ({
  logout: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseBookGate: vi.fn(),
}));

vi.mock('../lib/auth.tsx', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../lib/use-book-gate.ts', () => ({
  useBookGate: () => mockUseBookGate(),
}));

describe('Finances page (integration)', () => {
  beforeEach(() => {
    logout.mockReset();
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'hogar@test.com' },
      loading: false,
      logout,
    });
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { initialized: true, currency: 'USD' },
      redirectTo: null,
      reload: vi.fn(),
    });
  });

  it('renders Estado landing with three navigation cards', () => {
    renderWithRouter(<Finances />, { router: { initialEntries: ['/hogar/finances'] } });

    expect(screen.getByRole('heading', { name: 'Estado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Estado financiero \(P&G\)/i })).toHaveAttribute(
      'href',
      '/hogar/finances/pyg',
    );
    expect(screen.getByRole('link', { name: /Estado de Balance/i })).toHaveAttribute(
      'href',
      '/hogar/finances/balance',
    );
    expect(screen.getByRole('link', { name: /Revisar apuntes/i })).toHaveAttribute(
      'href',
      '/hogar/finances/apuntes',
    );
  });

  it('redirects guests to login', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      logout,
    });

    renderWithRouter(<Finances />, {
      router: { initialEntries: ['/hogar/finances'] },
      withAuthRoutes: true,
    });

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('redirects uninitialized books to onboarding', async () => {
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { initialized: false, currency: 'USD' },
      redirectTo: '/onboarding',
      reload: vi.fn(),
    });

    renderWithRouter(<Finances />, {
      router: { initialEntries: ['/hogar/finances'] },
      withAuthRoutes: true,
    });

    expect(await screen.findByText('Onboarding page')).toBeInTheDocument();
  });
});
