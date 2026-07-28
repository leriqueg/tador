import HogarIncomeExpenseBars, {
  type HogarIncomeExpenseBarsProps,
  type PeriodFlowPoint,
} from './HogarIncomeExpenseBars.tsx';

export type { PeriodFlowPoint };

export type ProIncomeExpenseBarsProps = HogarIncomeExpenseBarsProps;

/**
 * PRO P&G period chart — separate module from Hogar.
 *
 * Today: same adjacent income/expense bars as Hogar (Recharts).
 * Pending (accounting): cumulative / carried net line for the exercise
 * (“neto arrastrado”). Do not invent that series until defined; keep this
 * wrapper so PRO can add Line/Area without changing the Hogar component.
 */
export default function ProIncomeExpenseBars(props: ProIncomeExpenseBarsProps) {
  return <HogarIncomeExpenseBars {...props} />;
}
