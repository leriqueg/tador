import type { PyGTopAccount } from '../../lib/api.ts';
import { formatMoney } from '../../lib/finance.ts';

const COLORS = [
  '#10b981',
  '#ef4444',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];

export interface SimplePieProps {
  title: string;
  items: PyGTopAccount[];
  emptyMessage?: string;
}

/** Lightweight SVG pie — names only (no account codes). */
export default function SimplePieChart({
  title,
  items,
  emptyMessage = 'Sin datos todavía.',
}: SimplePieProps) {
  const total = items.reduce((s, i) => s + i.accumulated, 0);
  if (items.length === 0 || total <= 0) {
    return (
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
        <h3 className="text-headline-md font-semibold text-on-surface mb-sm">{title}</h3>
        <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  let angle = -90;
  const slices = items.map((item, i) => {
    const portion = (item.accumulated / total) * 360;
    const start = angle;
    angle += portion;
    return { ...item, start, portion, color: COLORS[i % COLORS.length] };
  });

  function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arc(start: number, portion: number) {
    if (portion >= 359.9) {
      return `M 50 50 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0`;
    }
    const end = start + portion;
    const s = polar(50, 50, 40, start);
    const e = polar(50, 50, 40, end);
    const large = portion > 180 ? 1 : 0;
    return `M 50 50 L ${s.x} ${s.y} A 40 40 0 ${large} 1 ${e.x} ${e.y} Z`;
  }

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md">
      <h3 className="text-headline-md font-semibold text-on-surface mb-md">{title}</h3>
      <div className="flex flex-col sm:flex-row gap-md items-center">
        <svg viewBox="0 0 100 100" className="w-40 h-40 shrink-0" aria-hidden>
          {slices.map((s) => (
            <path key={s.accountId} d={arc(s.start, s.portion)} fill={s.color} />
          ))}
        </svg>
        <ul className="flex-1 space-y-xs w-full min-w-0">
          {slices.map((s) => (
            <li key={s.accountId} className="flex items-center gap-sm text-label-md">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="truncate flex-1 text-on-surface">{s.accountName}</span>
              <span className="tabular-nums text-on-surface-variant shrink-0">
                {formatMoney(s.accumulated)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
