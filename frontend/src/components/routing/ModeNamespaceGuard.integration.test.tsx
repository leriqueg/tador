import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ModeNamespaceGuard from './ModeNamespaceGuard.tsx';
import ProDashboard from '../../pages/pro/ProDashboard.tsx';
import ProEntries from '../../pages/pro/ProEntries.tsx';

const { mockUseBookGate, mockUseAuth } = vi.hoisted(() => ({
  mockUseBookGate: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('../../lib/use-book-gate.ts', () => ({
  useBookGate: () => mockUseBookGate(),
}));

vi.mock('../../lib/auth.tsx', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../lib/api.ts', () => ({
  accounts: { list: vi.fn().mockResolvedValue({ accounts: [] }) },
  entities: { list: vi.fn().mockResolvedValue({ entities: [] }) },
  apuntes: { list: vi.fn().mockResolvedValue({ apuntes: [], total: 0 }), create: vi.fn() },
  reports: {
    pyg: vi.fn().mockResolvedValue({
      year: new Date().getFullYear(),
      totalIncome: 0,
      totalExpenses: 0,
      netResult: 0,
      monthlySeries: [{ month: new Date().getMonth() + 1, income: 0, expenses: 0, balance: 0 }],
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

function renderGuardedRoutes(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ModeNamespaceGuard />}>
          <Route path="/dashboard" element={<div>Legacy dashboard placeholder</div>} />
          <Route path="/hogar/dashboard" element={<div>Hogar dashboard</div>} />
          <Route path="/pro/dashboard" element={<div>Pro dashboard</div>} />
          <Route path="/hogar/finances/pyg" element={<div>Hogar PyG</div>} />
          <Route path="/pro/finances/pyg" element={<div>Pro PyG</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ModeNamespaceGuard', () => {
  beforeEach(() => {
    mockUseBookGate.mockReset();
    mockUseAuth.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects mode=pro visiting /hogar/dashboard to /pro/dashboard (US0.1)', async () => {
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { mode: 'pro' },
      redirectTo: null,
      reload: vi.fn(),
    });

    renderGuardedRoutes('/hogar/dashboard');

    expect(await screen.findByText('Pro dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Hogar dashboard')).not.toBeInTheDocument();
  });

  it('redirects mode=hogar visiting /pro/finances/pyg to /hogar/finances/pyg (US0.2)', async () => {
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { mode: 'hogar' },
      redirectTo: null,
      reload: vi.fn(),
    });

    renderGuardedRoutes('/pro/finances/pyg');

    expect(await screen.findByText('Hogar PyG')).toBeInTheDocument();
  });

  it('redirects legacy unprefixed /dashboard to the mode namespace', async () => {
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { mode: 'pro' },
      redirectTo: null,
      reload: vi.fn(),
    });

    renderGuardedRoutes('/dashboard');

    expect(await screen.findByText('Pro dashboard')).toBeInTheDocument();
  });

  it('renders the matching route without redirecting when already in the right namespace', () => {
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { mode: 'hogar' },
      redirectTo: null,
      reload: vi.fn(),
    });

    renderGuardedRoutes('/hogar/dashboard');

    expect(screen.getByText('Hogar dashboard')).toBeInTheDocument();
  });

  it('does not render routes while the book config is still loading', () => {
    mockUseBookGate.mockReturnValue({
      loading: true,
      config: null,
      redirectTo: null,
      reload: vi.fn(),
    });

    renderGuardedRoutes('/hogar/dashboard');

    expect(screen.queryByText('Hogar dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Pro dashboard')).not.toBeInTheDocument();
  });
});

/**
 * T009 — proves the guard's redirect targets are real, rendering PRO
 * screens (not 404s). Uses the actual `/pro/*` shell components rather than
 * placeholder divs, so a missing page registration would fail here.
 */
function renderWithRealProDestinations(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ModeNamespaceGuard />}>
          <Route path="/hogar/dashboard" element={<div>Hogar dashboard</div>} />
          <Route path="/hogar/entries" element={<div>Hogar entries</div>} />
          <Route path="/pro/dashboard" element={<ProDashboard />} />
          <Route path="/pro/entries" element={<ProEntries />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ModeNamespaceGuard — PRO destinations exist (T009)', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ user: { id: 'u1', email: 'pro@test.com' }, loading: false, logout: vi.fn() });
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects /hogar/dashboard to a real, rendering /pro/dashboard for a PRO book', async () => {
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { mode: 'pro', initialized: true },
      redirectTo: null,
      reload: vi.fn(),
    });

    renderWithRealProDestinations('/hogar/dashboard');

    expect(await screen.findByRole('heading', { name: 'Resumen PRO' })).toBeInTheDocument();
  });

  it('redirects /hogar/entries to a real, rendering /pro/entries for a PRO book', async () => {
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { mode: 'pro', initialized: true },
      redirectTo: null,
      reload: vi.fn(),
    });

    renderWithRealProDestinations('/hogar/entries');

    expect(await screen.findByRole('heading', { name: 'Apuntes PRO' })).toBeInTheDocument();
  });
});
