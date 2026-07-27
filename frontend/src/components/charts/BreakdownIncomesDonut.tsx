import BreakdownDonut, {
  DONUT_INCOME_COLORS,
  type BreakdownDonutItem,
  type BreakdownDonutProps,
} from './BreakdownDonut.tsx';

export type BreakdownIncomesDonutProps = Omit<
  BreakdownDonutProps,
  'segmentColors' | 'accentClassName' | 'title'
> & {
  title?: string;
  items: BreakdownDonutItem[];
};

/** P&G / reports — income breakdown with green semantic palette. */
export default function BreakdownIncomesDonut({
  title = 'Top ingresos',
  emptyMessage = 'Sin ingresos en este ejercicio.',
  ...rest
}: BreakdownIncomesDonutProps) {
  return (
    <BreakdownDonut
      {...rest}
      title={title}
      emptyMessage={emptyMessage}
      segmentColors={DONUT_INCOME_COLORS}
      accentClassName="text-success-emerald"
    />
  );
}
