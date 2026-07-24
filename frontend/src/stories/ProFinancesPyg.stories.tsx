import type { Meta, StoryObj } from '@storybook/react-vite';
import BreakdownDonut from '../components/charts/BreakdownDonut.tsx';

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

/** Same chart composition as Hogar; PRO page may widen chrome later — charts stay column. */
export const TopIncomeAndExpenses: StoryObj = {
  name: 'Top egresos + ingresos (column)',
  render: () => (
    <div className="max-w-3xl mx-auto flex flex-col gap-md">
      <p className="text-label-sm text-on-surface-variant">
        Composición de vista · ruta `/pro/finances/pyg` · filtros PRO viven en la página
      </p>
      <BreakdownDonut title="Top egresos" items={TOP_EXPENSES} />
      <BreakdownDonut title="Top ingresos" items={TOP_INCOME} />
    </div>
  ),
};
