import type { Meta, StoryObj } from '@storybook/react-vite';
import { MonthlyEvolutionChart, PeriodBreakdownDonut } from '../components/dataviz/DataViz.tsx';

const meta = {
  title: 'Charts/Reference',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

/** Hardcoded Stitch mock — do not wire. Prefer Charts/Donut → BreakdownDonut. */
export const MonthlyEvolutionMock: StoryObj = {
  name: 'MonthlyEvolution (reference mock)',
  render: () => (
    <div className="component-demo max-w-md">
      <MonthlyEvolutionChart />
    </div>
  ),
};

/** Hardcoded Stitch mock with Ingresos/Gastos toggle — do not wire. */
export const PeriodBreakdownMock: StoryObj = {
  name: 'PeriodBreakdownDonut (reference mock)',
  render: () => (
    <div className="component-demo max-w-md">
      <PeriodBreakdownDonut />
    </div>
  ),
};

export const BothMocks: StoryObj = {
  name: 'Both reference mocks',
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-4xl">
      <div className="component-demo"><MonthlyEvolutionChart /></div>
      <div className="component-demo"><PeriodBreakdownDonut /></div>
    </div>
  ),
};
