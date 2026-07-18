import type { Meta, StoryObj } from '@storybook/react-vite';
import AccountsTreePro from '../components/accounts-tree/AccountsTreePro.tsx';
import type { AccountSummary, ChartGlobalNode } from '../lib/api.ts';

const meta = {
  title: 'PRO/AccountsTreePro',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const CHART: ChartGlobalNode[] = [
  { id: 'g-exp', parentId: null, codigo: '61000000', nombre: 'Gastos', esPostable: false },
  {
    id: 'g-serv',
    parentId: 'g-exp',
    codigo: '61010000',
    nombre: 'Servicios',
    esPostable: false,
  },
  { id: 'g-ing', parentId: null, codigo: '41010000', nombre: 'Ingresos operacionales', esPostable: false },
];

const ACCOUNTS: AccountSummary[] = [
  {
    id: 'exp-1',
    codigo: '61010001',
    nombre: 'Internet',
    tipoCuenta: 'expenseCategory',
    entidadId: null,
    isEntityProvisioned: false,
    activa: true,
  },
  {
    id: 'exp-2',
    codigo: '61010002',
    nombre: 'Papelería',
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
    entidadId: 'ent-bank',
    isEntityProvisioned: true,
    activa: true,
  },
  {
    id: 'income-1',
    codigo: '41010001',
    nombre: 'Ventas',
    tipoCuenta: 'incomeCategory',
    entidadId: null,
    isEntityProvisioned: false,
    activa: true,
  },
];

export const Default: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <AccountsTreePro
        chart={CHART}
        accounts={ACCOUNTS}
        balances={{ 'exp-1': 45.9, 'bank-1': 1250, 'income-1': 3200 }}
        onCreateAccount={async (input) => {
          // eslint-disable-next-line no-console
          console.log('create account', input);
        }}
      />
    </div>
  ),
};

export const SinSaldos: StoryObj = {
  name: 'Sin saldos disponibles',
  render: () => (
    <div className="max-w-2xl">
      <AccountsTreePro
        chart={CHART}
        accounts={ACCOUNTS}
        balances={{}}
        onCreateAccount={async () => {}}
      />
    </div>
  ),
};
