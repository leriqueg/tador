import type { Meta, StoryObj } from '@storybook/react-vite';
import { MonthlyEvolutionChart, PeriodBreakdownDonut } from '../components/dataviz/DataViz.tsx';

const meta = {
  title: 'DataViz/Advanced',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

export const MonthlyEvolution: StoryObj = {
  render: () => (
    <div className="component-demo max-w-md">
      <MonthlyEvolutionChart />
    </div>
  ),
};

export const PeriodBreakdown: StoryObj = {
  render: () => (
    <div className="component-demo max-w-md">
      <PeriodBreakdownDonut />
    </div>
  ),
};

export const BothCharts: StoryObj = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-4xl">
      <div className="component-demo"><MonthlyEvolutionChart /></div>
      <div className="component-demo"><PeriodBreakdownDonut /></div>
    </div>
  ),
};
