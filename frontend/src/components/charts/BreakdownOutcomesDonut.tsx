import BreakdownDonut, {
  DONUT_OUTCOME_COLORS,
  type BreakdownDonutItem,
  type BreakdownDonutProps,
} from './BreakdownDonut.tsx';

export type BreakdownOutcomesDonutProps = Omit<
  BreakdownDonutProps,
  'segmentColors' | 'accentClassName' | 'title'
> & {
  title?: string;
  items: BreakdownDonutItem[];
};

/** P&G / reports — expense/outcome breakdown with rose semantic palette. */
export default function BreakdownOutcomesDonut({
  title = 'Top egresos',
  emptyMessage = 'Sin egresos en este ejercicio.',
  ...rest
}: BreakdownOutcomesDonutProps) {
  return (
    <BreakdownDonut
      {...rest}
      title={title}
      emptyMessage={emptyMessage}
      segmentColors={DONUT_OUTCOME_COLORS}
      accentClassName="text-expense-rose"
    />
  );
}
