import type { Meta, StoryObj } from '@storybook/react-vite';
import BreakdownIncomesDonut from '../components/charts/BreakdownIncomesDonut.tsx';
import BreakdownOutcomesDonut from '../components/charts/BreakdownOutcomesDonut.tsx';

const meta = {
  title: 'Hogar/FinancesPyg',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const TOP_EXPENSES = [
  { id: 'e1', label: 'Taxi', value: 20 },
  { id: 'e2', label: 'Supermercado / Tiendas', value: 19 },
  { id: 'e3', label: 'Servicios', value: 12 },
  { id: 'e4', label: 'Ocio', value: 8 },
];

const TOP_INCOME = [
  { id: 'i1', label: 'Sueldo', value: 1200 },
  { id: 'i2', label: 'Reembolso', value: 45 },
];

/**
 * View composition for `/hogar/finances/pyg` chart block.
 * Two typed charts (Outcomes rose | Incomes green), stacked in a column.
 */
export const TopIncomeAndExpenses: StoryObj = {
  name: 'Top egresos + ingresos (column)',
  render: () => (
    <div className="max-w-2xl mx-auto flex flex-col gap-md">
      <p className="text-label-sm text-on-surface-variant">
        Composición de vista · ruta `/hogar/finances/pyg` · charts tipados en columna
      </p>
      <BreakdownOutcomesDonut items={TOP_EXPENSES} />
      <BreakdownIncomesDonut items={TOP_INCOME} />
    </div>
  ),
};

export const EmptyCharts: StoryObj = {
  render: () => (
    <div className="max-w-2xl mx-auto flex flex-col gap-md">
      <BreakdownOutcomesDonut items={[]} />
      <BreakdownIncomesDonut items={[]} />
    </div>
  ),
};
