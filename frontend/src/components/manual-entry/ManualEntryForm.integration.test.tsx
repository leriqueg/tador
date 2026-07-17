import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManualEntryForm from './ManualEntryForm.tsx';
import type { AccountSummary } from '../../lib/api.ts';

const ACCOUNTS: AccountSummary[] = [
  {
    id: 'exp-1',
    codigo: '61010001',
    nombre: 'Servicios',
    tipoCuenta: 'expenseCategory',
    entidadId: null,
    isEntityProvisioned: false,
    activa: true,
  },
  {
    id: 'inc-1',
    codigo: '41010001',
    nombre: 'Ventas',
    tipoCuenta: 'incomeCategory',
    entidadId: null,
    isEntityProvisioned: false,
    activa: true,
  },
];

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ManualEntryForm
      accounts={ACCOUNTS}
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit };
}

async function fillBalancedEntry(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Concepto'), 'Ajuste de cierre');
  const rows = screen.getAllByRole('row').slice(1);
  const line1 = within(rows[0]);
  const line2 = within(rows[1]);
  await user.selectOptions(line1.getByLabelText('Cuenta'), 'exp-1');
  await user.type(line1.getByLabelText('Débito'), '100');
  await user.selectOptions(line2.getByLabelText('Cuenta'), 'inc-1');
  await user.type(line2.getByLabelText('Crédito'), '100');
}

describe('ManualEntryForm — live difference (US3, T019)', () => {
  afterEach(() => cleanup());

  it('shows zero difference when debits equal credits', async () => {
    const user = userEvent.setup();
    renderForm();
    await fillBalancedEntry(user);
    await waitFor(() => {
      expect(screen.getByTestId('manual-entry-difference')).toHaveTextContent('0.00');
    });
  });

  it('shows a live non-zero difference while editing', async () => {
    const user = userEvent.setup();
    renderForm();
    const rows = screen.getAllByRole('row').slice(1);
    await user.type(within(rows[0]).getByLabelText('Débito'), '75');
    await user.type(within(rows[1]).getByLabelText('Crédito'), '25');
    expect(screen.getByTestId('manual-entry-difference')).toHaveTextContent('50.00');
  });
});

describe('ManualEntryForm — submit validation (US3, T020)', () => {
  afterEach(() => cleanup());

  it('submits a balanced entry to the wire handler', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await fillBalancedEntry(user);
    await user.click(screen.getByRole('button', { name: 'Guardar asiento' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      fecha: expect.any(String),
      concepto: 'Ajuste de cierre',
      lineas: [
        { cuentaId: 'exp-1', debito: 100, credito: 0 },
        { cuentaId: 'inc-1', debito: 0, credito: 100 },
      ],
    });
  });

  it('rejects an unbalanced entry before calling the API', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await user.type(screen.getByLabelText('Concepto'), 'Descuadrado');
    const rows = screen.getAllByRole('row').slice(1);
    await user.selectOptions(within(rows[0]).getByLabelText('Cuenta'), 'exp-1');
    await user.type(within(rows[0]).getByLabelText('Débito'), '100');
    await user.selectOptions(within(rows[1]).getByLabelText('Cuenta'), 'inc-1');
    await user.type(within(rows[1]).getByLabelText('Crédito'), '40');
    await user.click(screen.getByRole('button', { name: 'Guardar asiento' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/descuad/i);
  });
});

describe('ManualEntryForm — API errors (US3, T021)', () => {
  afterEach(() => cleanup());

  it('surfaces closed-period errors via ValidationMessage', () => {
    render(
      <ManualEntryForm
        accounts={ACCOUNTS}
        onSubmit={vi.fn()}
        error="Cannot modify entries in closed period: fiscal year 2026 is closed"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/periodo.*cerrado/i);
  });

  it('surfaces foreign-account errors via ValidationMessage', () => {
    render(
      <ManualEntryForm
        accounts={ACCOUNTS}
        onSubmit={vi.fn()}
        error="Account acc-x not found, not active, not postable, or does not belong to this book"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/cuenta.*pertenece/i);
  });
});
