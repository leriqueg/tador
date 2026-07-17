import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import ProFinances from './ProFinances.tsx';
import ProFinancesPyg from './ProFinancesPyg.tsx';
import ProFinancesBalance from './ProFinancesBalance.tsx';
import ProFinancesApuntes from './ProFinancesApuntes.tsx';
import { renderWithRouter } from '../../test/render.tsx';

const { logout, mockUseAuth, mockUseBookGate, mockedPyg, mockedPosition, mockedApuntesList } =
  vi.hoisted(() => ({
    logout: vi.fn(),
    mockUseAuth: vi.fn(),
    mockUseBookGate: vi.fn(),
    mockedPyg: vi.fn(),
    mockedPosition: vi.fn(),
    mockedApuntesList: vi.fn(),
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
    apuntes: {
      list: mockedApuntesList,
    },
    accounts: {
      list: vi.fn().mockResolvedValue({ accounts: [] }),
    },
  };
});

const year = new Date().getFullYear();
const month = new Date().getMonth() + 1;

describe('PRO finances pages (US5, T025)', () => {
  beforeEach(() => {
    logout.mockReset();
    mockedPyg.mockReset();
    mockedPosition.mockReset();
    mockedApuntesList.mockReset();

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
      totalIncome: 5000,
      totalExpenses: 2000,
      netResult: 3000,
      monthlySeries: [{ month, income: 500, expenses: 200, balance: 300 }],
      topIncome: [],
      topExpenses: [],
    });
    mockedPosition.mockResolvedValue({
      totalAvailable: 1000,
      totalReceivables: 0,
      totalPayables: 200,
      netPosition: 800,
      breakdown: { available: [], receivables: [], payables: [] },
    });
    mockedApuntesList.mockResolvedValue({ apuntes: [], total: 0 });
  });

  afterEach(() => {
    cleanup();
  });

  it('ProFinances landing links to /pro/finances/* panels', () => {
    renderWithRouter(<ProFinances />, { router: { initialEntries: ['/pro/finances'] } });

    expect(screen.getByRole('heading', { name: 'Estado PRO' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Estado financiero \(P&G\)/i })).toHaveAttribute(
      'href',
      '/pro/finances/pyg',
    );
    expect(screen.getByRole('link', { name: /Estado de Balance/i })).toHaveAttribute(
      'href',
      '/pro/finances/balance',
    );
    expect(screen.getByRole('link', { name: /Revisar apuntes/i })).toHaveAttribute(
      'href',
      '/pro/finances/apuntes',
    );
  });

  it('ProFinancesPyg loads P&G report data like Hogar', async () => {
    renderWithRouter(<ProFinancesPyg />, { router: { initialEntries: ['/pro/finances/pyg'] } });

    expect(await screen.findByRole('heading', { name: 'Estado financiero' })).toBeInTheDocument();
    expect(mockedPyg).toHaveBeenCalledWith(year);
    expect(screen.getByRole('link', { name: '← Estado' })).toHaveAttribute('href', '/pro/finances');
  });

  it('ProFinancesBalance loads position report with PRO shell nav', async () => {
    renderWithRouter(<ProFinancesBalance />, {
      router: { initialEntries: ['/pro/finances/balance'] },
    });

    expect(await screen.findByRole('heading', { name: 'Estado de Balance' })).toBeInTheDocument();
    expect(mockedPosition).toHaveBeenCalled();
    expect(screen.getAllByRole('link', { name: 'TADOR' })[0]).toHaveAttribute(
      'href',
      '/pro/dashboard',
    );
  });

  it('ProFinancesApuntes shows searchable apuntes history under /pro/*', async () => {
    renderWithRouter(<ProFinancesApuntes />, {
      router: { initialEntries: ['/pro/finances/apuntes'] },
    });

    expect(await screen.findByRole('heading', { name: 'Todos tus apuntes' })).toBeInTheDocument();
    expect(mockedApuntesList).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: '← Estado' })).toHaveAttribute('href', '/pro/finances');
  });
});
