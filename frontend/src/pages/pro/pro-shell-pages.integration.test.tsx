import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import ProDashboard from './ProDashboard.tsx';
import ProEntries from './ProEntries.tsx';
import ProAccounts from './ProAccounts.tsx';
import ProEntities from './ProEntities.tsx';
import ProSettings from './ProSettings.tsx';
import ProFinances from './ProFinances.tsx';
import ProFinancesPyg from './ProFinancesPyg.tsx';
import ProFinancesBalance from './ProFinancesBalance.tsx';
import ProFinancesApuntes from './ProFinancesApuntes.tsx';
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

vi.mock('../../lib/api.ts', () => ({
  accounts: { list: vi.fn().mockResolvedValue({ accounts: [] }), create: vi.fn() },
  entities: { list: vi.fn().mockResolvedValue({ entities: [] }) },
  apuntes: { list: vi.fn().mockResolvedValue({ apuntes: [], total: 0 }), create: vi.fn() },
  chart: { list: vi.fn().mockResolvedValue({ chart: [], activations: [] }) },
  balances: { get: vi.fn().mockResolvedValue({ saldo: 0 }) },
  reports: {
    pyg: vi.fn().mockResolvedValue({
      year: new Date().getFullYear(),
      totalIncome: 0,
      totalExpenses: 0,
      netResult: 0,
      monthlySeries: [],
      topIncome: [],
      topExpenses: [],
    }),
    position: vi.fn().mockResolvedValue({
      totalAvailable: 0,
      totalReceivables: 0,
      totalPayables: 0,
      netPosition: 0,
      breakdown: { available: [], receivables: [], payables: [] },
    }),
  },
}));

const PAGES = [
  { Component: ProDashboard, path: '/pro/dashboard', heading: 'Resumen PRO' },
  { Component: ProEntries, path: '/pro/entries', heading: 'Apuntes PRO' },
  { Component: ProAccounts, path: '/pro/accounts', heading: 'Cuentas PRO' },
  { Component: ProEntities, path: '/pro/entities', heading: 'Entidades PRO' },
  { Component: ProSettings, path: '/pro/settings', heading: 'Ajustes PRO' },
  { Component: ProFinances, path: '/pro/finances', heading: 'Estado PRO' },
  { Component: ProFinancesPyg, path: '/pro/finances/pyg', heading: 'Estado financiero' },
  { Component: ProFinancesBalance, path: '/pro/finances/balance', heading: 'Estado de Balance' },
  { Component: ProFinancesApuntes, path: '/pro/finances/apuntes', heading: 'Todos tus apuntes' },
] as const;

describe('PRO route shells (T009 — no-404 destinations)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', email: 'pro@test.com' }, loading: false, logout: vi.fn() });
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { initialized: true },
      redirectTo: null,
      reload: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  for (const { Component, path, heading } of PAGES) {
    it(`renders "${heading}" for ${path} with active PRO nav highlighting`, async () => {
      renderWithRouter(<Component />, { router: { initialEntries: [path] } });

      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: 'TADOR' })[0]).toHaveAttribute('href', '/pro/dashboard');
    });
  }
});
