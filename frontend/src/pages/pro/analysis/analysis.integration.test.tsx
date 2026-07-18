import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import ProAnalysis from '../ProAnalysis.tsx';
import AnalysisBanks from './AnalysisBanks.tsx';
import AnalysisCards from './AnalysisCards.tsx';
import AnalysisPortfolio from './AnalysisPortfolio.tsx';
import { renderWithRouter } from '../../../test/render.tsx';

const {
  logout,
  mockUseAuth,
  mockUseBookGate,
  mockedAccountsList,
  mockedBalancesMonthly,
  mockedCostYield,
  mockedApuntesList,
  mockedPortfolio,
} = vi.hoisted(() => ({
  logout: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseBookGate: vi.fn(),
  mockedAccountsList: vi.fn(),
  mockedBalancesMonthly: vi.fn(),
  mockedCostYield: vi.fn(),
  mockedApuntesList: vi.fn(),
  mockedPortfolio: vi.fn(),
}));

vi.mock('../../../lib/auth.tsx', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../lib/use-book-gate.ts', () => ({
  useBookGate: () => mockUseBookGate(),
}));

vi.mock('../../../lib/api.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/api.ts')>();
  return {
    ...actual,
    accounts: { list: mockedAccountsList },
    balances: { get: vi.fn(), monthly: mockedBalancesMonthly },
    apuntes: { list: mockedApuntesList },
    reports: {
      pyg: vi.fn(),
      position: vi.fn(),
      portfolio: mockedPortfolio,
      costYield: mockedCostYield,
    },
  };
});

const bankWithEntity = {
  id: 'bank-1',
  codigo: null,
  nombre: 'Banco Pichincha',
  tipoCuenta: 'bank',
  entidadId: 'ent-bank-1',
  isEntityProvisioned: true,
  activa: true,
};

const bankNoEntity = {
  ...bankWithEntity,
  id: 'bank-2',
  nombre: 'Banco sin entidad',
  entidadId: null,
};

const cardWithEntity = {
  id: 'card-1',
  codigo: null,
  nombre: 'Visa',
  tipoCuenta: 'card',
  entidadId: 'ent-card-1',
  isEntityProvisioned: true,
  activa: true,
};

describe('PRO analysis routes (T018)', () => {
  beforeEach(() => {
    logout.mockReset();
    mockedAccountsList.mockReset();
    mockedBalancesMonthly.mockReset();
    mockedCostYield.mockReset();
    mockedApuntesList.mockReset();
    mockedPortfolio.mockReset();

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

    mockedAccountsList.mockResolvedValue({ accounts: [bankWithEntity, bankNoEntity, cardWithEntity] });
    mockedBalancesMonthly.mockResolvedValue({
      cuentaId: 'bank-1',
      año: 2026,
      mensual: [{ mes: 7, saldo: 1500 }],
    });
    mockedCostYield.mockResolvedValue({
      year: 2026,
      entityId: 'ent-bank-1',
      costs: { comisiones: 12, intereses: 5, multas: 0 },
      investmentYield: 40,
    });
    mockedApuntesList.mockResolvedValue({
      apuntes: [{ id: 'a1', concept: 'Compra', date: '2026-07-01', amount: 50, templateCode: null, asientoId: 's1', createdAt: '' }],
      total: 1,
    });
    mockedPortfolio.mockResolvedValue({
      entities: [
        {
          entityId: 'ent-1',
          entityName: 'Cliente A',
          receivables: 200,
          payables: 50,
          net: 150,
        },
      ],
    });
  });

  afterEach(() => cleanup());

  it('ProAnalysis landing links to banks, cards, and portfolio', () => {
    renderWithRouter(<ProAnalysis />, { router: { initialEntries: ['/pro/analysis'] } });

    expect(screen.getByRole('heading', { name: 'Análisis PRO' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Analizar bancos/i })).toHaveAttribute(
      'href',
      '/pro/analysis/banks',
    );
    expect(screen.getByRole('link', { name: /Analizar tarjetas/i })).toHaveAttribute(
      'href',
      '/pro/analysis/cards',
    );
    expect(screen.getByRole('link', { name: /Analizar cartera/i })).toHaveAttribute(
      'href',
      '/pro/analysis/portfolio',
    );
  });

  it('AnalysisBanks shows monthly chart and separate cost/yield panels', async () => {
    renderWithRouter(<AnalysisBanks />, { router: { initialEntries: ['/pro/analysis/banks'] } });

    expect(await screen.findByRole('heading', { name: 'Analizar bancos' })).toBeInTheDocument();
    await waitFor(() => expect(mockedBalancesMonthly).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedCostYield).toHaveBeenCalledWith('ent-bank-1', expect.any(Number)),
    );
    expect(screen.getByText('Comisiones')).toBeInTheDocument();
    expect(screen.getByText('Ganancias por invertir')).toBeInTheDocument();
    expect(screen.getByText(/no se netean/i)).toBeInTheDocument();
  });

  it('AnalysisBanks shows empty-state CTA when bank lacks entidadId (T019)', async () => {
    mockedAccountsList.mockResolvedValue({ accounts: [bankNoEntity] });

    renderWithRouter(<AnalysisBanks />, { router: { initialEntries: ['/pro/analysis/banks'] } });

    expect(
      await screen.findByText(/no tiene entidad vinculada/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a Entidades' })).toHaveAttribute(
      'href',
      '/pro/entities',
    );
    expect(mockedCostYield).not.toHaveBeenCalled();
  });

  it('AnalysisCards lists apuntes for selected card account', async () => {
    renderWithRouter(<AnalysisCards />, { router: { initialEntries: ['/pro/analysis/cards'] } });

    expect(await screen.findByRole('heading', { name: 'Analizar tarjetas' })).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedApuntesList).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: 'card-1' }),
      ),
    );
    expect(screen.getByText('Compra')).toBeInTheDocument();
  });

  it('AnalysisPortfolio shows receivables vs payables by entity', async () => {
    renderWithRouter(<AnalysisPortfolio />, {
      router: { initialEntries: ['/pro/analysis/portfolio'] },
    });

    expect(await screen.findByRole('heading', { name: 'Analizar cartera' })).toBeInTheDocument();
    expect(await screen.findByText('Cliente A')).toBeInTheDocument();
    await waitFor(() => expect(mockedPortfolio).toHaveBeenCalled());
    expect(screen.getByText('Por cobrar')).toBeInTheDocument();
    expect(screen.getByText('Por pagar')).toBeInTheDocument();
  });
});
