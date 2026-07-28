import type { Meta, StoryObj } from '@storybook/react-vite';
import HogarIncomeExpenseBars from '../components/charts/HogarIncomeExpenseBars.tsx';
import ProIncomeExpenseBars from '../components/charts/ProIncomeExpenseBars.tsx';

const meta = {
  title: 'Charts/Bars',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const YEAR_SERIES = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  income: 800 + i * 40 + (i === 2 ? 400 : 0),
  expenses: 500 + (i % 3) * 80 + (i === 2 ? 600 : 0),
}));

export const HogarAdjacentBars: StoryObj = {
  name: 'HogarIncomeExpenseBars',
  render: () => (
    <div className="max-w-2xl">
      <HogarIncomeExpenseBars
        series={YEAR_SERIES}
        caption="Hogar · barras adyacentes · tooltip (Recharts)"
      />
    </div>
  ),
};

export const ProSameAsHogarPendingLine: StoryObj = {
  name: 'ProIncomeExpenseBars (same as Hogar until net line defined)',
  render: () => (
    <div className="max-w-3xl">
      <ProIncomeExpenseBars
        series={YEAR_SERIES}
        caption="PRO · wrapper aparte · línea de neto arrastrado pendiente de definición contable"
      />
    </div>
  ),
};

export const EmbeddedUnframed: StoryObj = {
  render: () => (
    <div className="max-w-2xl rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-lg">
      <p className="text-label-sm text-text-muted mb-md">Embebido en PygPanelHogar</p>
      <HogarIncomeExpenseBars series={YEAR_SERIES} framed={false} height={180} />
    </div>
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <HogarIncomeExpenseBars series={[]} />
    </div>
  ),
};
