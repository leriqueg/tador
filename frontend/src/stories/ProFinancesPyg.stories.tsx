import type { Meta, StoryObj } from '@storybook/react-vite';
import BreakdownIncomesDonut from '../components/charts/BreakdownIncomesDonut.tsx';
import BreakdownOutcomesDonut from '../components/charts/BreakdownOutcomesDonut.tsx';
import ProIncomeExpenseBars from '../components/charts/ProIncomeExpenseBars.tsx';

const meta = {
  title: 'PRO/FinancesPyg',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const YEAR_SERIES = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  income: 2200 + i * 60,
  expenses: 1400 + (i % 4) * 120,
}));

/**
 * PRO P&G period chart — same Recharts bars as Hogar until cumulative net line is defined.
 * Component is separate (`ProIncomeExpenseBars`) for a clean extension point.
 */
export const PeriodFlowPendingNetLine: StoryObj = {
  name: 'Barras (igual Hogar · línea neto pendiente)',
  render: () => (
    <div className="max-w-3xl mx-auto flex flex-col gap-md">
      <p className="text-label-sm text-on-surface-variant">
        Composición · `/pro/finances/pyg` · sin línea de estado financiero neto arrastrado aún
      </p>
      <ProIncomeExpenseBars
        series={YEAR_SERIES}
        caption="Hasta definir neto arrastrado: mismas barras adyacentes que Hogar"
      />
      <BreakdownOutcomesDonut items={[{ id: '1', label: 'Nómina', value: 40 }]} />
      <BreakdownIncomesDonut items={[{ id: '1', label: 'Ventas', value: 80 }]} />
    </div>
  ),
};
