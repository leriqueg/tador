import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountsTreePro from './AccountsTreePro.tsx';
import type { AccountSummary, ChartGlobalNode } from '../../lib/api.ts';

const CHART: ChartGlobalNode[] = [
  {
    id: 'g-exp',
    parentId: null,
    codigo: '61000000',
    nombre: 'Gastos',
    esPostable: false,
  },
  {
    id: 'g-serv',
    parentId: 'g-exp',
    codigo: '61010000',
    nombre: 'Servicios',
    esPostable: false,
  },
  {
    id: 'g-ing',
    parentId: null,
    codigo: '41010000',
    nombre: 'Ingresos',
    esPostable: false,
  },
  {
    id: 'g-wallet',
    parentId: null,
    codigo: '11110001',
    nombre: 'Efectivo',
    esPostable: true,
  },
];

const ACCOUNTS: AccountSummary[] = [
  {
    id: 'u1',
    codigo: '61010001',
    nombre: 'Internet',
    tipoCuenta: 'expenseCategory',
    entidadId: null,
    isEntityProvisioned: false,
    activa: true,
  },
  {
    id: 'bank-1',
    codigo: '11120001',
    nombre: 'Banco Pichincha',
    tipoCuenta: 'bank',
    entidadId: 'ent-1',
    isEntityProvisioned: true,
    activa: true,
    enforceNonNegativeBalance: true,
  },
];

describe('AccountsTreePro — tree display (US4, T022)', () => {
  afterEach(() => cleanup());

  it('renders account codes, names, mothers and saldo when provided', () => {
    render(
      <AccountsTreePro
        chart={CHART}
        accounts={ACCOUNTS}
        balances={{ u1: 120.5, 'bank-1': 500 }}
        onCreateAccount={vi.fn()}
      />,
    );

    expect(screen.getByText('61010001')).toBeInTheDocument();
    expect(screen.getByText('Internet')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
    expect(screen.getByText(/\$120\.50|120,50/)).toBeInTheDocument();
    expect(screen.getByText('11120001')).toBeInTheDocument();
  });

  it('toggles balance protection for user and global accounts', async () => {
    const user = userEvent.setup();
    const onToggleAccountBalancePolicy = vi.fn().mockResolvedValue(undefined);
    const onToggleGlobalBalancePolicy = vi.fn().mockResolvedValue(undefined);
    render(
      <AccountsTreePro
        chart={CHART}
        accounts={ACCOUNTS}
        balances={{}}
        activations={[]}
        onCreateAccount={vi.fn()}
        onToggleAccountBalancePolicy={onToggleAccountBalancePolicy}
        onToggleGlobalBalancePolicy={onToggleGlobalBalancePolicy}
      />,
    );

    const bankRow = screen.getByText('Banco Pichincha').closest('li');
    expect(bankRow).not.toBeNull();
    await user.click(
      within(bankRow as HTMLElement).getByRole('checkbox', {
        name: 'Impedir saldo negativo',
      }),
    );
    expect(onToggleAccountBalancePolicy).toHaveBeenCalledWith('bank-1', false);

    const walletRow = screen.getByText('Efectivo').closest('li');
    expect(walletRow).not.toBeNull();
    await user.click(
      within(walletRow as HTMLElement).getByRole('checkbox', {
        name: 'Impedir negativo',
      }),
    );
    expect(onToggleGlobalBalancePolicy).toHaveBeenCalledWith('g-wallet', false);
  });
});

describe('AccountsTreePro — create under mother (US4, T023)', () => {
  afterEach(() => cleanup());

  it('creates an expense category under a selected mother', async () => {
    const user = userEvent.setup();
    const onCreateAccount = vi.fn().mockResolvedValue(undefined);
    render(
      <AccountsTreePro
        chart={CHART}
        accounts={ACCOUNTS}
        balances={{}}
        onCreateAccount={onCreateAccount}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Cuenta madre'), '61010000');
    await user.selectOptions(screen.getByLabelText('Tipo de cuenta'), 'expenseCategory');
    await user.type(screen.getByLabelText('Nombre'), 'Papelería');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(onCreateAccount).toHaveBeenCalledWith({
      tipoCuenta: 'expenseCategory',
      nombre: 'Papelería',
      parentGroupCodigo: '61010000',
    });
  });

  it('does not offer bank/card in manual create types', () => {
    render(
      <AccountsTreePro
        chart={CHART}
        accounts={ACCOUNTS}
        balances={{}}
        onCreateAccount={vi.fn()}
      />,
    );
    const tipoSelect = screen.getByLabelText('Tipo de cuenta');
    const options = within(tipoSelect).getAllByRole('option');
    const values = options.map((o) => (o as HTMLOptionElement).value);
    expect(values).not.toContain('bank');
    expect(values).not.toContain('card');
  });

  it('surfaces create failures via ValidationMessage', async () => {
    const user = userEvent.setup();
    const onCreateAccount = vi.fn().mockRejectedValue(new Error('Unknown parentGroupCodigo'));
    render(
      <AccountsTreePro
        chart={CHART}
        accounts={ACCOUNTS}
        balances={{}}
        onCreateAccount={onCreateAccount}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Cuenta madre'), '61010000');
    await user.selectOptions(screen.getByLabelText('Tipo de cuenta'), 'expenseCategory');
    await user.type(screen.getByLabelText('Nombre'), 'Papelería');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/madre/i);
  });
});
