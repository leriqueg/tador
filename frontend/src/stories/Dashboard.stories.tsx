import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  NetProfitWidget,
  NetResultWidget,
  OperatingExpensesWidget,
  TotalIncomeWidget,
} from '../components/dashboard/DashboardWidgets.tsx';

const meta = {
  title: 'Dashboard/Widgets',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

export const HogarNetResult: StoryObj = {
  render: () => (
    <div className="component-demo max-w-sm">
      <NetResultWidget />
    </div>
  ),
};

export const ProTotalIncome: StoryObj = {
  render: () => (
    <div className="component-demo max-w-sm">
      <TotalIncomeWidget />
    </div>
  ),
};

export const ProOperatingExpenses: StoryObj = {
  render: () => (
    <div className="component-demo max-w-sm">
      <OperatingExpensesWidget />
    </div>
  ),
};

export const ProNetProfit: StoryObj = {
  render: () => (
    <div className="component-demo max-w-sm">
      <NetProfitWidget />
    </div>
  ),
};

export const AllWidgets: StoryObj = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-4xl">
      <div className="component-demo"><NetResultWidget /></div>
      <div className="component-demo"><TotalIncomeWidget /></div>
      <div className="component-demo"><OperatingExpensesWidget /></div>
      <div className="component-demo"><NetProfitWidget /></div>
    </div>
  ),
};
