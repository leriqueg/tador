import type { Meta, StoryObj } from '@storybook/react-vite';
import EntryBuilder from '../components/entry-builder/EntryBuilder.tsx';
import type { AccountSummary, EntitySummary } from '../lib/api.ts';

const meta = {
  title: 'PRO/EntryBuilder',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const SAMPLE_ACCOUNTS: AccountSummary[] = [
  { id: 'exp-1', codigo: '61010000', nombre: 'Servicios', tipoCuenta: 'expenseCategory', entidadId: null, isEntityProvisioned: false, activa: true },
  { id: 'exp-2', codigo: '61020000', nombre: 'Suministros de oficina', tipoCuenta: 'expenseCategory', entidadId: null, isEntityProvisioned: false, activa: true },
  { id: 'bank-1', codigo: '11120001', nombre: 'Banco Pichincha', tipoCuenta: 'bank', entidadId: 'ent-bank-1', isEntityProvisioned: true, activa: true },
  { id: 'wallet-1', codigo: '11110000', nombre: 'Billetera', tipoCuenta: 'wallet', entidadId: null, isEntityProvisioned: false, activa: true },
  { id: 'card-1', codigo: '21200001', nombre: 'VISA Bankard', tipoCuenta: 'card', entidadId: 'ent-card-1', isEntityProvisioned: true, activa: true },
  { id: 'income-1', codigo: '41010001', nombre: 'Ventas', tipoCuenta: 'incomeCategory', entidadId: null, isEntityProvisioned: false, activa: true },
];

const SAMPLE_ENTITIES: EntitySummary[] = [
  { id: 'org-1', nombre: 'Acme Corp', tipo: 'organization', notas: null, capabilities: ['is_employment_dependency'] },
  { id: 'org-2', nombre: 'Cliente Frecuente SA', tipo: 'organization', notas: null, capabilities: ['can_be_customer'] },
];

export const Default: StoryObj = {
  name: 'Mobile / quick capture width',
  render: () => (
    <div className="max-w-lg">
      <EntryBuilder
        accounts={SAMPLE_ACCOUNTS}
        entities={SAMPLE_ENTITIES}
        onSubmit={async (payload) => {
          // eslint-disable-next-line no-console
          console.log('submit', payload);
        }}
        onCreateEntity={async (values) => {
          // eslint-disable-next-line no-console
          console.log('create entity', values);
          return { id: `jit-${Date.now()}`, nombre: values.nombre, tipo: values.tipo, notas: null, capabilities: values.capabilities };
        }}
      />
    </div>
  ),
};

export const DesktopCanvas: StoryObj = {
  name: 'Desktop canvas (more path context)',
  render: () => (
    <div className="max-w-3xl">
      <EntryBuilder
        accounts={SAMPLE_ACCOUNTS}
        entities={SAMPLE_ENTITIES}
        onSubmit={async () => {}}
        onCreateEntity={async (values) => ({
          id: `jit-${Date.now()}`,
          nombre: values.nombre,
          tipo: values.tipo,
          notas: null,
          capabilities: values.capabilities,
        })}
      />
    </div>
  ),
};

export const SinEmpleador: StoryObj = {
  name: 'Sin organización empleadora (bloqueo de sueldo)',
  render: () => (
    <div className="max-w-lg">
      <EntryBuilder
        accounts={SAMPLE_ACCOUNTS}
        entities={[]}
        onSubmit={async () => {}}
        onCreateEntity={async (values) => ({
          id: `jit-${Date.now()}`,
          nombre: values.nombre,
          tipo: values.tipo,
          notas: null,
          capabilities: values.capabilities,
        })}
      />
    </div>
  ),
};
