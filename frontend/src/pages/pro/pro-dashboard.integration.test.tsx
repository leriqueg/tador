import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProDashboard from './ProDashboard.tsx';
import { renderWithRouter } from '../../test/render.tsx';

const { logout, mockUseAuth, mockUseBookGate, mockedPyg, mockedPosition } = vi.hoisted(() => ({
  logout: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseBookGate: vi.fn(),
  mockedPyg: vi.fn(),
  mockedPosition: vi.fn(),
}));

vi.mock('../../lib/auth.tsx', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../lib/use-book-gate.ts', () => ({
  useBookGate: () => mockUseBookGate(),
}));

vi.mock('../../lib/api.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/api.ts')>();
  return {
    ...actual,
    reports: {
      pyg: mockedPyg,
      position: mockedPosition,
    },
  };
});

const year = new Date().getFullYear();
const month = new Date().getMonth() + 1;

describe('ProDashboard hub parity (US5, T026)', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    logout.mockReset();
    mockedPyg.mockReset();
    mockedPosition.mockReset();

    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'pro@test.com' },
      loading: false,
      logout,
    });
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { initialized: true, currency: 'USD', mode: 'pro' },
      redirectTo: null,
      reload: vi.fn(),
    });

    mockedPyg.mockResolvedValue({
      year,
      totalIncome: 12000,
      totalExpenses: 8000,
      netResult: 4000,
      monthlySeries: [{ month, income: 1000, expenses: 600, balance: 400 }],
      topIncome: [],
      topExpenses: [],
    });
    mockedPosition.mockResolvedValue({
      totalAvailable: 5000,
      totalReceivables: 0,
      totalPayables: 1000,
      netPosition: 4000,
      breakdown: { available: [], receivables: [], payables: [] },
    });
  });

  it('loads hub summary with PRO chrome and links to /pro/finances', async () => {
    renderWithRouter(<ProDashboard />, { router: { initialEntries: ['/pro/dashboard'] } });

    expect(await screen.findByRole('heading', { name: 'Resumen PRO' })).toBeInTheDocument();
    expect(mockedPyg).toHaveBeenCalledWith(year);
    expect(mockedPosition).toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: /Ver Estado financiero y Balance/i }),
    ).toHaveAttribute('href', '/pro/finances');
    expect(screen.getAllByRole('link', { name: 'TADOR' })[0]).toHaveAttribute(
      'href',
      '/pro/dashboard',
    );
  });

  it('switches period toggle to annual P&G view', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProDashboard />, { router: { initialEntries: ['/pro/dashboard'] } });

    await screen.findByText('Cómo vas ahora — el detalle está en Estado.');
    await user.click(screen.getAllByRole('button', { name: 'Este año' })[0]!);

    expect(screen.getByText(`Resultado ${year}`)).toBeInTheDocument();
  });
});
