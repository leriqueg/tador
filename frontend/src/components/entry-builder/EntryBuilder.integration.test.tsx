import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const expenseCategory = account({ id: 'exp-1', tipoCuenta: 'expenseCategory', nombre: 'Servicios' });
const bank = account({ id: 'bank-1', tipoCuenta: 'bank', nombre: 'Banco Pichincha' });
const wallet = account({ id: 'wallet-1', tipoCuenta: 'wallet', nombre: 'Billetera' });
const incomeCategory = account({ id: 'income-1', tipoCuenta: 'incomeCategory', nombre: 'Ventas' });

const BASE_ACCOUNTS: AccountSummary[] = [expenseCategory, bank, wallet, incomeCategory];

function renderBuilder(props: Partial<Parameters<typeof EntryBuilder>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCreateEntity = vi.fn();
  render(
    <EntryBuilder
      accounts={BASE_ACCOUNTS}
      entities={[]}
      onSubmit={onSubmit}
      onCreateEntity={onCreateEntity}
      {...props}
    />,
  );
  return { onSubmit, onCreateEntity };
}

async function completeEgresoUpToConcepto(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Egreso' }));
  await user.selectOptions(screen.getByLabelText('Categoría del gasto'), 'exp-1');
  await user.selectOptions(screen.getByLabelText('¿Con qué pagaste?'), 'bank-1');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  // entidad step is optional for EGRESO — skip it
  await user.click(screen.getByRole('button', { name: 'Omitir' }));
}

describe('EntryBuilder — step reveal (US2.1/US2.2)', () => {
  afterEach(() => cleanup());

  it('shows only the TipoOperacion step first — no QuickAdd template picker', () => {
    renderBuilder();
    expect(screen.getByRole('button', { name: 'Ingreso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Egreso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transferencia' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Concepto')).not.toBeInTheDocument();
  });

  it('reveals the account step after picking a tipo, and moves focus to it', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'Egreso' }));

    const heading = await screen.findByRole('heading', { name: /cuenta/i });
    expect(heading).toHaveFocus();
    expect(screen.getByLabelText('Categoría del gasto')).toBeInTheDocument();
  });

  it('keeps the completed "tipo" step visible and editable once past it', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'Egreso' }));

    expect(screen.getByText(/Egreso/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
  });
});

describe('EntryBuilder — submit a general entry (US2.1, T015)', () => {
  afterEach(() => cleanup());

  it('submits a free-form (no templateCode) apunte with side/amount per line', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderBuilder();

    await completeEgresoUpToConcepto(user);

    await user.type(screen.getByLabelText('Concepto'), 'Pago de internet');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await user.type(screen.getByLabelText('Monto'), '45.90');
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

describe('EntryBuilder — burst entry (US2.4, T016)', () => {
  afterEach(() => cleanup());

  it('"Guardar y registrar otro" keeps tipo + cuenta and clears monto/concepto', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderBuilder();

    await completeEgresoUpToConcepto(user);
    await user.type(screen.getByLabelText('Concepto'), 'Pago de internet');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.type(screen.getByLabelText('Monto'), '45.90');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await user.click(await screen.findByRole('button', { name: 'Guardar y registrar otro' }));

    // Back in the flow at "concepto" with type/account preserved (no re-pick of tipo/cuenta)
    expect(screen.queryByRole('button', { name: 'Ingreso' })).not.toBeInTheDocument();
    const conceptInput = screen.getByLabelText('Concepto') as HTMLInputElement;
    expect(conceptInput.value).toBe('');
    expect(screen.getByText(/Servicios/)).toBeInTheDocument(); // expense category summary retained

    await user.type(conceptInput, 'Pago de agua');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.type(screen.getByLabelText('Monto'), '12');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ concept: 'Pago de agua', amount: 12 }),
    );
  });
});

describe('EntryBuilder — JIT entity creation (US2.3, T017)', () => {
  afterEach(() => cleanup());

  it('creates a counterparty inline and selects it for the current entry', async () => {
    const user = userEvent.setup();
    const created: EntitySummary = { id: 'ent-jit-1', nombre: 'Cliente Nuevo', tipo: 'person', notas: null };
    const onCreateEntity = vi.fn().mockResolvedValue(created);
    renderBuilder({ onCreateEntity });

    await user.click(screen.getByRole('button', { name: 'Egreso' }));
    await user.selectOptions(screen.getByLabelText('Categoría del gasto'), 'exp-1');
    await user.selectOptions(screen.getByLabelText('¿Con qué pagaste?'), 'bank-1');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await user.click(screen.getByRole('button', { name: /nueva entidad/i }));
    const jitForm = screen.getByRole('form', { name: /crear entidad/i });
    await user.type(within(jitForm).getByLabelText('Nombre'), 'Cliente Nuevo');
    await user.click(within(jitForm).getByRole('button', { name: 'Crear entidad' }));

    expect(onCreateEntity).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Cliente Nuevo' }),
    );
    expect(await screen.findByText('Cliente Nuevo')).toBeInTheDocument();
  });
});

describe('EntryBuilder — salary path requires employer capability (US2.5, T018)', () => {
  afterEach(() => cleanup());

  it('blocks advance with a CTA when no organization holds is_employment_dependency', async () => {
    const user = userEvent.setup();
    renderBuilder({ entities: [] });

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));
    await user.click(screen.getByRole('button', { name: 'Sueldo' }));
    await user.selectOptions(screen.getByLabelText('¿Dónde recibiste el dinero?'), 'bank-1');
    await user.selectOptions(screen.getByLabelText('Categoría de ingreso'), 'income-1');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(
      await screen.findByText(/necesitás una organización con la capacidad/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /crear organización empleadora/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Concepto')).not.toBeInTheDocument();
  });

  it('allows advance once an employer entity with the capability is selected', async () => {
    const user = userEvent.setup();
    const employer: EntitySummary = {
      id: 'org-1',
      nombre: 'Acme Corp',
      tipo: 'organization',
      notas: null,
      capabilities: ['is_employment_dependency'],
    };
    renderBuilder({ entities: [employer] });

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));
    await user.click(screen.getByRole('button', { name: 'Sueldo' }));
    await user.selectOptions(screen.getByLabelText('¿Dónde recibiste el dinero?'), 'bank-1');
    await user.selectOptions(screen.getByLabelText('Categoría de ingreso'), 'income-1');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await user.selectOptions(screen.getByLabelText(/organización empleadora/i), 'org-1');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByLabelText('Concepto')).toBeInTheDocument();
  });
});

describe('EntryBuilder — sticky account defaults (T029)', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('preselects last-used debit/credit accounts for the same operation type', async () => {
    const user = userEvent.setup();
    const { writeLastAccountPair } = await import('../../lib/entry-builder-account-memory.ts');
    writeLastAccountPair('EGRESO:general', 'exp-1', 'bank-1');

    renderBuilder();

    await user.click(screen.getByRole('button', { name: 'Egreso' }));

    expect(screen.getByLabelText('Categoría del gasto')).toHaveValue('exp-1');
    expect(screen.getByLabelText('¿Con qué pagaste?')).toHaveValue('bank-1');
  });
});

