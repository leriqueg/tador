import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { semanticColors } from '../../design/tokens.ts';
import { formatMoney, MONTH_LABELS } from '../../lib/finance.ts';

export interface PeriodFlowPoint {
  month: number;
  income: number;
  expenses: number;
}

export interface HogarIncomeExpenseBarsProps {
  series: PeriodFlowPoint[];
  title?: string;
  caption?: string;
  currency?: string;
  height?: number;
  emptyMessage?: string;
  /** When false, render plot only (for embedding in another card). Default true. */
  framed?: boolean;
}

type ChartRow = {
  label: string;
  income: number;
  expenses: number;
};

function toRows(series: PeriodFlowPoint[]): ChartRow[] {
  return series.map((p) => ({
    label: series.length === 1 ? 'Mes' : (MONTH_LABELS[p.month] ?? String(p.month)),
    income: p.income,
    expenses: p.expenses,
  }));
}

/**
 * Hogar P&G period chart — adjacent income/expense bars (Recharts).
 * No cumulative net line (Hogar clarity). Green / rose from brand semantic palette.
 */
export default function HogarIncomeExpenseBars({
  series,
  title = 'Ingresos vs egresos',
  caption,
  currency = 'USD',
  height = 280,
  emptyMessage = 'Sin datos del período.',
  framed = true,
}: HogarIncomeExpenseBarsProps) {
  const data = toRows(series);
  const hasValues = data.some((d) => d.income > 0 || d.expenses > 0);

  const body = !hasValues ? (
    <p className="text-body-md text-on-surface-variant py-lg">{emptyMessage}</p>
  ) : (
    <div style={{ width: '100%', height }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
          barCategoryGap="18%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#bdc9c8" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#7c6a68' }}
            axisLine={{ stroke: '#bdc9c8' }}
            tickLine={false}
          />
          <YAxis
            tick={false}
            axisLine={false}
            tickLine={false}
            width={8}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0, 101, 101, 0.06)' }}
            formatter={(value, name) => [
              formatMoney(typeof value === 'number' ? value : Number(value), currency),
              name === 'income' ? 'Ingresos' : 'Egresos',
            ]}
            labelFormatter={(label) => String(label)}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #bdc9c8',
              fontSize: 12,
            }}
          />
          <Legend
            formatter={(value) => (value === 'income' ? 'Ingresos' : 'Egresos')}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="income"
            name="income"
            fill={semanticColors.successEmerald}
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={700}
            animationBegin={0}
          />
          <Bar
            dataKey="expenses"
            name="expenses"
            fill={semanticColors.expenseRose}
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={700}
            animationBegin={80}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  if (!framed) {
    return (
      <div className="w-full min-w-0">
        {body}
        {caption && (
          <p className="text-label-sm text-on-surface-variant mt-sm">{caption}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
      {title ? (
        <h3 className="text-headline-md font-semibold mb-md text-on-surface">{title}</h3>
      ) : null}
      {body}
      {caption && (
        <p className="text-label-sm text-on-surface-variant mt-sm">{caption}</p>
      )}
    </div>
  );
}
