import type { Meta, StoryObj } from '@storybook/react-vite';
import BreakdownIncomesDonut from '../components/charts/BreakdownIncomesDonut.tsx';
import BreakdownOutcomesDonut from '../components/charts/BreakdownOutcomesDonut.tsx';

const meta = {
  title: 'PRO/FinancesPyg',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const TOP_EXPENSES = [
  { id: 'e1', label: 'Servicios', value: 420 },
  { id: 'e2', label: 'Suministros', value: 180 },
  { id: 'e3', label: 'Comisiones bancarias', value: 42.5 },
];

const TOP_INCOME = [
  { id: 'i1', label: 'Ventas', value: 5400 },
  { id: 'i2', label: 'Honorarios', value: 2100 },
];

/** Same typed chart composition as Hogar; PRO filters live on the page. */
export const TopIncomeAndExpenses: StoryObj = {
  name: 'Top egresos + ingresos (column)',
  render: () => (
    <div className="max-w-3xl mx-auto flex flex-col gap-md">
      <p className="text-label-sm text-on-surface-variant">
        Composición de vista · ruta `/pro/finances/pyg` · Outcomes rose · Incomes green
      </p>
      <BreakdownOutcomesDonut items={TOP_EXPENSES} />
      <BreakdownIncomesDonut items={TOP_INCOME} />
    </div>
  ),
};
