import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProEntities from './ProEntities.tsx';
import { renderWithRouter } from '../../test/render.tsx';

const { mockUseAuth, mockUseBookGate, mockList, mockCreate } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseBookGate: vi.fn(),
  mockList: vi.fn(),
  mockCreate: vi.fn(),
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
    entities: {
      ...actual.entities,
      list: mockList,
      create: mockCreate,
    },
  };
});

describe('ProEntities — real page (not placeholder)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'pro@test.com' },
      loading: false,
      logout: vi.fn(),
    });
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { initialized: true, mode: 'pro' },
      redirectTo: null,
      reload: vi.fn(),
    });
    mockList.mockResolvedValue({ entities: [] });
    mockCreate.mockResolvedValue({
      entity: {
        id: 'org-1',
        nombre: 'Acme',
        tipo: 'organization',
        capabilities: ['is_employment_dependency'],
      },
      provisionedAccount: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('creates an organization with employment capability', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProEntities />, { router: { initialEntries: ['/pro/entities'] } });

    expect(await screen.findByRole('heading', { name: 'Entidades PRO' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Tipo'), 'organization');
    await user.type(screen.getByLabelText('Nombre'), 'Acme');
    await user.click(screen.getByLabelText(/Relación de dependencia/i));
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        nombre: 'Acme',
        tipo: 'organization',
        capabilities: ['is_employment_dependency'],
      });
    });
  });

  it('offers organization in the type filter for PRO', async () => {
    renderWithRouter(<ProEntities />, { router: { initialEntries: ['/pro/entities'] } });
    expect(await screen.findByRole('button', { name: 'Organización' })).toBeInTheDocument();
  });
});
