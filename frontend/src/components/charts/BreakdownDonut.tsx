import { colors } from '../../design/tokens.ts';
import { formatMoney } from '../../lib/finance.ts';

/** Brand palette for breakdown segments (DESIGN.md / Stitch donut look). */
export const DONUT_SEGMENT_COLORS = [
  colors.primary, // #006565
  colors.secondary, // warm brown family via #8d4f11 — use stitch secondary stroke
  '#77574a',
  '#96d0d0',
  '#d8c2be',
  colors.primaryContainer,
  colors.tertiary,
  colors.secondaryContainer,
  colors.outline,
  colors.onSurfaceVariant,
] as const;

export interface BreakdownDonutItem {
  id: string;
  label: string;
  value: number;
}

export interface BreakdownDonutProps {
  title: string;
  items: BreakdownDonutItem[];
  currency?: string;
  emptyMessage?: string;
  /** Max legend rows (default 6). */
  legendLimit?: number;
}

const CIRCUMFERENCE = 2 * Math.PI * 15.9; // r=15.9 in viewBox 0..36

function compactTotal(total: number, currency: string): string {
  const abs = Math.abs(total);
  if (abs >= 1000) {
    const k = total / 1000;
    const rounded = Math.abs(k) >= 10 ? k.toFixed(0) : k.toFixed(1);
    return `${rounded}k`;
  }
  return formatMoney(total, currency);
}

/**
 * Canonical brand donut — data-driven.
 * Visual language from Stitch / former PeriodBreakdownDonut reference.
 */
export default function BreakdownDonut({
  title,
  items,
  currency = 'USD',
  emptyMessage = 'Sin datos todavía.',
  legendLimit = 6,
}: BreakdownDonutProps) {
  const positive = items.filter((i) => i.value > 0);
  const total = positive.reduce((s, i) => s + i.value, 0);

  if (positive.length === 0 || total <= 0) {
    return (
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
        <h3 className="text-label-md font-bold text-primary mb-sm">{title}</h3>
        <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  let offset = 0;
  const segments = positive.map((item, i) => {
    const pct = item.value / total;
    const length = pct * CIRCUMFERENCE;
    const seg = {
      ...item,
      pct,
      dasharray: `${length} ${CIRCUMFERENCE - length}`,
      dashoffset: -offset,
      color: DONUT_SEGMENT_COLORS[i % DONUT_SEGMENT_COLORS.length],
    };
    offset += length;
    return seg;
  });

  const legend = segments.slice(0, legendLimit);

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md flex flex-col">
      <h3 className="text-label-md font-bold text-primary mb-lg">{title}</h3>
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            {segments.map((s) => (
              <circle
                key={s.id}
                cx="18"
                cy="18"
                r="15.9"
                fill="transparent"
                stroke={s.color}
                strokeWidth="4"
                strokeDasharray={s.dasharray}
                strokeDashoffset={s.dashoffset}
              />
            ))}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[9px] text-text-muted uppercase tracking-wide">Total</span>
            <span className="font-bold text-primary tabular-nums">{compactTotal(total, currency)}</span>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 mt-6 w-full">
          {legend.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5 text-[10px] min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="flex-1 truncate text-on-surface">{s.label}</span>
              <span className="font-bold tabular-nums text-on-surface shrink-0">
                {Math.round(s.pct * 100)}%
              </span>
            </li>
          ))}
        </ul>
        {segments.length > legendLimit && (
          <p className="text-[10px] text-text-muted mt-sm self-start">
            +{segments.length - legendLimit} más
          </p>
        )}
      </div>
    </div>
  );
}
