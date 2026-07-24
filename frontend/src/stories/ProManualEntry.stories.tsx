import type { Meta, StoryObj } from '@storybook/react-vite';
import ManualEntryForm from '../components/manual-entry/ManualEntryForm.tsx';
import type { AccountSummary } from '../lib/api.ts';

const meta = {
  title: 'PRO/ManualEntry',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const SAMPLE_ACCOUNTS: AccountSummary[] = [
  {
    id: 'exp-1',
    codigo: '61010000',
    nombre: 'Servicios',
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
    entidadId: 'ent-bank-1',
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
      <ManualEntryForm
        accounts={SAMPLE_ACCOUNTS}
        onSubmit={async (payload) => {
          console.log('manual entry', payload);
        }}
      />
    </div>
  ),
};

export const WithError: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <ManualEntryForm
        accounts={SAMPLE_ACCOUNTS}
        error="El asiento no cuadra. Revisá débitos y créditos."
        onSubmit={async () => {}}
      />
    </div>
  ),
};
