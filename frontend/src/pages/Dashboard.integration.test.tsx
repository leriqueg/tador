import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard.tsx';
import { renderWithRouter } from '../test/render.tsx';

const { logout, mockUseAuth, mockUseBookGate, mockedPyg, mockedPosition } = vi.hoisted(() => ({
  logout: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseBookGate: vi.fn(),
  mockedPyg: vi.fn(),
  mockedPosition: vi.fn(),
}));

vi.mock('../lib/auth.tsx', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../lib/use-book-gate.ts', () => ({
  useBookGate: () => mockUseBookGate(),
}));

vi.mock('../lib/api.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api.ts')>();
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

describe('Dashboard page (integration)', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    logout.mockReset();
    mockedPyg.mockReset();
    mockedPosition.mockReset();

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

  it('loads hub summary for the current month', async () => {
    renderWithRouter(<Dashboard />, { router: { initialEntries: ['/hogar/dashboard'] } });

    expect(await screen.findByRole('heading', { name: 'Resumen' })).toBeInTheDocument();
    expect(mockedPyg).toHaveBeenCalledWith(year);
    expect(mockedPosition).toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: /Ver Estado financiero y Balance/i }),
    ).toHaveAttribute('href', '/hogar/finances');
  });

  it('switches period toggle to annual view', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Dashboard />, { router: { initialEntries: ['/hogar/dashboard'] } });

    await screen.findByText('Cómo vas ahora — el detalle está en Estado.');
    const yearButtons = screen.getAllByRole('button', { name: 'Este año' });
    await user.click(yearButtons[0]!);

    expect(screen.getByText(`Resultado ${year}`)).toBeInTheDocument();
  });

  it('shows error when reports fail', async () => {
    mockedPyg.mockRejectedValue(new Error('Servicio no disponible'));

    renderWithRouter(<Dashboard />, { router: { initialEntries: ['/hogar/dashboard'] } });

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument();
  });
});
