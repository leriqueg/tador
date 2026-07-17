import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Onboarding from './Onboarding.tsx';
import { renderWithRouter } from '../test/render.tsx';

const { mockUseAuth, mockNavigate, mockUpdateConfig, mockEntitiesCreate } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockNavigate: vi.fn(),
  mockUpdateConfig: vi.fn(),
  mockEntitiesCreate: vi.fn(),
}));

vi.mock('../lib/auth.tsx', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return {
    ...actual,
    book: { ...actual.book, updateConfig: mockUpdateConfig },
    entities: { ...actual.entities, create: mockEntitiesCreate },
  };
});

/** Walks the PRO onboarding branch: mode -> currency -> bank -> cards -> employer -> summary. */
async function completeProOnboardingWithEmployer(
  user: ReturnType<typeof userEvent.setup>,
  employerName: string,
) {
  await user.click(screen.getByRole('button', { name: /Modo PRO/i }));
  await user.click(screen.getByRole('button', { name: /Continuar/i }));
  await user.click(screen.getByRole('button', { name: /Continuar/i }));
  await user.click(screen.getByRole('button', { name: /Continuar/i }));
  await user.click(screen.getByRole('button', { name: /Continuar/i }));
  await user.click(screen.getByRole('button', { name: /Sí, tengo empleador/i }));
  await user.type(screen.getByLabelText(/Nombre del empleador/i), employerName);
  await user.click(screen.getByRole('button', { name: /Agregar empleador/i }));
  await user.click(screen.getByRole('button', { name: /Continuar/i }));
  await user.click(screen.getByRole('button', { name: /Empezar/i }));
}

describe('Onboarding page — PRO employer wiring (T010)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', email: 'pro@test.com' }, loading: false });
    mockUpdateConfig.mockResolvedValue({ config: { mode: 'pro' } });
    mockEntitiesCreate.mockResolvedValue({ entity: { id: 'e1' }, provisionedAccount: null });
    mockNavigate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('creates an organization entity with is_employment_dependency for each declared employer', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Onboarding />);

    await completeProOnboardingWithEmployer(user, 'Acme Corp');

    await waitFor(() => {
      expect(mockEntitiesCreate).toHaveBeenCalledWith({
        nombre: 'Acme Corp',
        tipo: 'organization',
        capabilities: ['is_employment_dependency'],
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/pro/dashboard', { replace: true });
  });
});
