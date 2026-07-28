import type { Meta, StoryObj } from '@storybook/react-vite';
import BreakdownDonut from '../components/charts/BreakdownDonut.tsx';
import BreakdownIncomesDonut from '../components/charts/BreakdownIncomesDonut.tsx';
import BreakdownOutcomesDonut from '../components/charts/BreakdownOutcomesDonut.tsx';

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
  name: 'BreakdownDonut (neutral)',
  render: () => (
    <div className="max-w-sm">
      <BreakdownDonut title="Desglose" items={EXPENSE_ITEMS} />
    </div>
  ),
};

export const Incomes: StoryObj = {
  name: 'BreakdownIncomesDonut (green)',
  render: () => (
    <div className="max-w-sm">
      <BreakdownIncomesDonut items={INCOME_ITEMS} />
    </div>
  ),
};

export const Outcomes: StoryObj = {
  name: 'BreakdownOutcomesDonut (rose)',
  render: () => (
    <div className="max-w-sm">
      <BreakdownOutcomesDonut items={EXPENSE_ITEMS} />
    </div>
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <div className="max-w-sm flex flex-col gap-md">
      <BreakdownOutcomesDonut items={[]} />
      <BreakdownIncomesDonut items={[]} />
    </div>
  ),
};

export const IncomeAndExpensesPair: StoryObj = {
  name: 'Pair preview (column) — prefer view stories',
  render: () => (
    <div className="max-w-md flex flex-col gap-md">
      <BreakdownOutcomesDonut items={EXPENSE_ITEMS} />
      <BreakdownIncomesDonut items={INCOME_ITEMS} />
    </div>
  ),
};
