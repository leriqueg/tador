import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ModeNamespaceGuard from '../../components/routing/ModeNamespaceGuard.tsx';
import EntryBuilder from '../../components/entry-builder/EntryBuilder.tsx';
import ManualEntryForm from '../../components/manual-entry/ManualEntryForm.tsx';
import type { AccountSummary } from '../../lib/api.ts';

/**
 * Quickstart smoke (T028) — integration coverage when Playwright stack is unavailable.
 * Run: cd frontend && npm run test -- --run src/pages/pro/quickstart-smoke.integration.test.tsx
 * E2E equivalent (requires auth setup + stack): cd frontend && npm run test:e2e -- e2e/pro-quickstart.spec.ts
 */

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

const bank = {
  id: 'bank-1',
  codigo: '11120001',
  nombre: 'Banco',
  tipoCuenta: 'bank',
  entidadId: null,
  isEntityProvisioned: false,
  activa: true,
} satisfies AccountSummary;

const income = {
  id: 'income-1',
  codigo: '41100001',
  nombre: 'Otros ingresos',
  tipoCuenta: 'incomeCategory',
  entidadId: null,
  isEntityProvisioned: false,
  activa: true,
} satisfies AccountSummary;

describe('Quickstart smoke (T028)', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('redirects PRO book from /hogar/entries to /pro/entries destination', async () => {
    mockUseBookGate.mockReturnValue({
      loading: false,
      config: { mode: 'pro', initialized: true },
      redirectTo: null,
      reload: vi.fn(),
    });
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'pro@test.com' },
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/hogar/entries']}>
        <Routes>
          <Route element={<ModeNamespaceGuard />}>
            <Route path="/hogar/entries" element={<div>Hogar entries</div>} />
            <Route path="/pro/entries" element={<div>Pro entries landing</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Pro entries landing')).toBeInTheDocument();
  });

  it(
    'EntryBuilder otro-ingreso flow reaches guardar with amount',
    async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <MemoryRouter>
          <EntryBuilder
            accounts={[bank, income]}
            entities={[]}
            onSubmit={onSubmit}
            onCreateEntity={vi.fn()}
          />
        </MemoryRouter>,
      );

      await user.click(screen.getByRole('button', { name: 'Ingreso' }));
      await user.click(screen.getByRole('button', { name: 'Otro ingreso' }));
      await user.selectOptions(screen.getByLabelText('¿Dónde recibiste el dinero?'), 'bank-1');
      await user.click(screen.getByRole('button', { name: 'Continuar' }));
      await user.selectOptions(screen.getByLabelText('Categoría de ingreso'), 'income-1');
      await user.click(screen.getByRole('button', { name: 'Continuar' }));
      await user.type(screen.getByLabelText('Concepto'), 'Venta julio');
      await user.click(screen.getByRole('button', { name: 'Continuar' }));
      await user.type(screen.getByLabelText('Monto'), '150');
      await user.click(screen.getByRole('button', { name: 'Continuar' }));
      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ concept: 'Venta julio', amount: 150 }),
      );
      expect(await screen.findByText(/apunte guardado/i)).toBeInTheDocument();
    },
    30_000,
  );

  it('ManualEntryForm rejects unbalanced lines before calling onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ManualEntryForm accounts={[bank, income]} onSubmit={onSubmit} submitting={false} />,
    );

    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1]!;
    const secondDataRow = rows[2]!;
    await user.selectOptions(within(firstDataRow).getByLabelText('Cuenta'), 'bank-1');
    await user.type(within(firstDataRow).getByLabelText('Débito'), '100');
    await user.selectOptions(within(secondDataRow).getByLabelText('Cuenta'), 'income-1');
    await user.type(within(secondDataRow).getByLabelText('Crédito'), '50');
    await user.type(screen.getByLabelText('Concepto'), 'Descuadre');
    await user.click(screen.getByRole('button', { name: 'Guardar asiento' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/descuadrado/i);
  });
});
