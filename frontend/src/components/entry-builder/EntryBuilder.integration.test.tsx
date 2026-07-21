import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EntryBuilder from './EntryBuilder.tsx';
import type { AccountSummary, EntitySummary } from '../../lib/api.ts';

function account(overrides: Partial<AccountSummary>): AccountSummary {
  return {
    id: 'acc',
    codigo: null,
    nombre: 'Cuenta',
    tipoCuenta: 'wallet',
    entidadId: null,
    isEntityProvisioned: false,
    activa: true,
    ...overrides,
  };
}

const expenseCategory = account({
  id: 'exp-1',
  codigo: '61010001',
  tipoCuenta: 'expenseCategory',
  nombre: 'Servicios',
});
const bank = account({
  id: 'bank-1',
  codigo: '11120001',
  tipoCuenta: 'bank',
  nombre: 'Banco Pichincha',
});
const wallet = account({
  id: 'wallet-1',
  codigo: '11110001',
  tipoCuenta: 'wallet',
  nombre: 'Billetera',
});
const incomeCategory = account({
  id: 'income-1',
  codigo: '41010001',
  tipoCuenta: 'incomeCategory',
  nombre: 'Sueldo',
});
const otherIncome = account({
  id: 'income-2',
  codigo: '41100001',
  tipoCuenta: 'incomeCategory',
  nombre: 'Otros ingresos',
});

const BASE_ACCOUNTS: AccountSummary[] = [
  expenseCategory,
  bank,
  wallet,
  incomeCategory,
  otherIncome,
];

function renderBuilder(props: Partial<Parameters<typeof EntryBuilder>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCreateEntity = vi.fn();
  render(
    <MemoryRouter>
      <EntryBuilder
        accounts={BASE_ACCOUNTS}
        entities={[]}
        onSubmit={onSubmit}
        onCreateEntity={onCreateEntity}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onSubmit, onCreateEntity };
}

async function completeEgresoToLeaf(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Egreso' }));
  await user.selectOptions(screen.getByLabelText('Categoría del gasto'), 'exp-1');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await user.selectOptions(screen.getByLabelText('¿Con qué pagaste?'), 'bank-1');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await user.type(screen.getByLabelText('Concepto'), 'Pago de internet');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await user.type(screen.getByLabelText('Monto'), '45.90');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
}

describe('EntryBuilder — decision graph (012)', () => {
  afterEach(() => cleanup());

  it('shows only the root choice first — no plantilla catalog', () => {
    renderBuilder();
    expect(screen.getByRole('heading', { name: /qué tipo de movimiento/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingreso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Egreso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transferencia' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Concepto')).not.toBeInTheDocument();
  });

  it('reveals the next question after picking a tipo, and moves focus to it', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));

    const heading = await screen.findByRole('heading', { name: /de dónde viene el dinero/i });
    expect(heading).toHaveFocus();
  });

  it('keeps completed steps as affirmations with values', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));

    expect(screen.getByText(/Registrar:/i)).toBeInTheDocument();
    expect(screen.getByText('Ingreso')).toBeInTheDocument();
  });

  it('can go back to tipo de movimiento without refreshing', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));
    expect(screen.getByRole('heading', { name: /de dónde viene el dinero/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('heading', { name: /qué tipo de movimiento/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Egreso' })).toBeInTheDocument();
  });

  it('Limpiar todo resets to root', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));
    await user.click(screen.getByRole('button', { name: /limpiar todo/i }));

    expect(screen.getByRole('heading', { name: /qué tipo de movimiento/i })).toBeInTheDocument();
    expect(screen.queryByText(/Registrar:/i)).not.toBeInTheDocument();
  });
});

describe('EntryBuilder — submit free-form egreso (012)', () => {
  afterEach(() => cleanup());

  it('submits a free-form (no templateCode) apunte with side/amount per line', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderBuilder();

    await completeEgresoToLeaf(user);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      date: expect.any(String),
      concept: 'Pago de internet',
      amount: 45.9,
      lines: [
        { id: 1, accountId: 'exp-1', side: 'debit', amount: 45.9 },
        { id: 2, accountId: 'bank-1', side: 'credit', amount: 45.9 },
      ],
      entityId: undefined,
    });

    expect(await screen.findByText(/apunte guardado/i)).toBeInTheDocument();
  });
});

describe('EntryBuilder — burst entry (012)', () => {
  afterEach(() => cleanup());

  it('"Guardar y registrar otro" returns to concept and clears monto/concepto', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderBuilder();

    await completeEgresoToLeaf(user);
    await user.click(screen.getByRole('button', { name: 'Guardar y registrar otro' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Ingreso' })).not.toBeInTheDocument();
    const conceptInput = screen.getByLabelText('Concepto') as HTMLInputElement;
    expect(conceptInput.value).toBe('');
    expect(screen.getByText(/Servicios/)).toBeInTheDocument();

    await user.type(conceptInput, 'Pago de agua');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.type(screen.getByLabelText('Monto'), '12');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ concept: 'Pago de agua', amount: 12 }),
    );
  });
});

describe('EntryBuilder — JIT entity on cliente path (012)', () => {
  afterEach(() => cleanup());

  it('creates a customer inline and selects it', async () => {
    const user = userEvent.setup();
    const created: EntitySummary = {
      id: 'ent-jit-1',
      nombre: 'Cliente Nuevo',
      tipo: 'person',
      notas: null,
      capabilities: ['can_be_customer'],
    };
    const onCreateEntity = vi.fn().mockResolvedValue(created);
    renderBuilder({ onCreateEntity });

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));
    await user.click(screen.getByRole('button', { name: 'Me pagó un cliente / trabajo' }));
    await user.click(screen.getByRole('button', { name: /crear entidad/i }));

    const jitForm = screen.getByRole('form', { name: /crear entidad/i });
    await user.type(within(jitForm).getByLabelText('Nombre'), 'Cliente Nuevo');
    await user.click(within(jitForm).getByRole('button', { name: /crear/i }));

    expect(onCreateEntity).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Cliente Nuevo' }),
    );
    expect(await screen.findByDisplayValue('Cliente Nuevo')).toBeInTheDocument();
  });
});

describe('EntryBuilder — salary path requires employer (012 T010)', () => {
  afterEach(() => cleanup());

  it('blocks continue when no employer entity is available', async () => {
    const user = userEvent.setup();
    renderBuilder({ entities: [] });

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));
    await user.click(screen.getByRole('button', { name: 'Cobré un sueldo' }));

    expect(await screen.findByText(/no hay entidades aptas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    expect(screen.queryByLabelText('Concepto')).not.toBeInTheDocument();
  });

  it('submits registrar_sueldo when employer + accounts are chosen', async () => {
    const user = userEvent.setup();
    const employer: EntitySummary = {
      id: 'org-1',
      nombre: 'Acme Corp',
      tipo: 'organization',
      notas: null,
      capabilities: ['is_employment_dependency'],
    };
    const { onSubmit } = renderBuilder({ entities: [employer] });

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));
    await user.click(screen.getByRole('button', { name: 'Cobré un sueldo' }));
    await user.selectOptions(screen.getByLabelText(/organización empleadora/i), 'org-1');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await user.selectOptions(screen.getByLabelText('¿Dónde recibiste el dinero?'), 'bank-1');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.selectOptions(screen.getByLabelText('Categoría de ingreso'), 'income-1');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.type(screen.getByLabelText('Concepto'), 'Sueldo julio');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.type(screen.getByLabelText('Monto'), '1500');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      templateCode: 'registrar_sueldo',
      date: expect.any(String),
      concept: 'Sueldo julio',
      amount: 1500,
      lines: [
        { id: 1, accountId: 'bank-1' },
        { id: 2, accountId: 'income-1' },
      ],
      entityId: 'org-1',
    });
  });
});

describe('EntryBuilder — empty account options (012)', () => {
  afterEach(() => cleanup());

  it('shows a CTA when income categories are missing for Otro ingreso', async () => {
    const user = userEvent.setup();
    renderBuilder({ accounts: [bank, wallet] });

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));
    await user.click(screen.getByRole('button', { name: 'Otro ingreso' }));
    await user.selectOptions(screen.getByLabelText('¿Dónde recibiste el dinero?'), 'bank-1');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByText(/no hay cuentas para este paso/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cuentas' })).toHaveAttribute('href', '/pro/accounts');
  });
});
