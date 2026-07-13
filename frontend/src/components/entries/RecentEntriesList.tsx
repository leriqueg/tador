export interface RecentEntryItem {
  id: string;
  concept: string;
  date: string;
  amount: number;
  templateCode: string | null;
}

export interface RecentEntriesListProps {
  items: RecentEntryItem[];
  emptyMessage?: string;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Recent apuntes list — no journal lines (FR-005). */
export default function RecentEntriesList({
  items,
  emptyMessage = 'Todavía no hay apuntes.',
}: RecentEntriesListProps) {
  if (items.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-outline-variant/30 rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-md px-md py-sm">
          <div className="min-w-0">
            <p className="text-label-md font-semibold text-on-surface truncate">{item.concept}</p>
            <p className="text-label-sm text-on-surface-variant">{item.date}</p>
          </div>
          <p className="text-label-md font-semibold tabular-nums text-on-surface shrink-0">
            {formatAmount(item.amount)}
          </p>
        </li>
      ))}
    </ul>
  );
}
