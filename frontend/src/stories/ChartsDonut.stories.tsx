import type { Meta, StoryObj } from '@storybook/react-vite';
import BreakdownDonut from '../components/charts/BreakdownDonut.tsx';

const meta = {
  title: 'Charts/Donut',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const EXPENSE_ITEMS = [
  { id: '1', label: 'Vivienda', value: 3735 },
  { id: '2', label: 'Comida', value: 2075 },
  { id: '3', label: 'Transporte', value: 1660 },
  { id: '4', label: 'Otros', value: 830 },
];

const INCOME_ITEMS = [
  { id: 'a', label: 'Sueldo', value: 9200 },
  { id: 'b', label: 'Freelance', value: 2100 },
  { id: 'c', label: 'Otros', value: 400 },
];

export const Default: StoryObj = {
  name: 'BreakdownDonut (canonical)',
  render: () => (
    <div className="max-w-sm">
      <BreakdownDonut title="Desglose" items={EXPENSE_ITEMS} />
    </div>
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <BreakdownDonut title="Sin movimientos" items={[]} />
    </div>
  ),
};

export const IncomeAndExpensesPair: StoryObj = {
  name: 'Pair preview (column) — prefer view stories',
  render: () => (
    <div className="max-w-md flex flex-col gap-md">
      <BreakdownDonut title="Egresos" items={EXPENSE_ITEMS} />
      <BreakdownDonut title="Ingresos" items={INCOME_ITEMS} />
    </div>
  ),
};
