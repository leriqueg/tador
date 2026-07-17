import Icon from '../ui/Icon.tsx';

export interface RecentEntryItem {
  id: string;
  concept: string;
  date: string;
  amount: number;
  templateCode: string | null;
  createdAt?: string;
}

export interface RecentEntriesListProps {
  items: RecentEntryItem[];
  emptyMessage?: string;
  onEdit?: (item: RecentEntryItem) => void;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Recent apuntes — ordered by createdAt (newest capture first). */
export default function RecentEntriesList({
  items,
  emptyMessage = 'Todavía no hay apuntes.',
  onEdit,
}: RecentEntriesListProps) {
  if (items.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-outline-variant/30 rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-sm px-md py-sm">
          <div className="min-w-0 flex-1">
            <p className="text-label-md font-semibold text-on-surface truncate">{item.concept}</p>
            <p className="text-label-sm text-on-surface-variant">
              Movimiento: {item.date}
            </p>
          </div>
          <p className="text-label-md font-semibold tabular-nums text-on-surface shrink-0">
            {formatAmount(item.amount)}
          </p>
          {onEdit && item.templateCode && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="shrink-0 p-xs rounded-lg text-secondary hover:bg-primary/5 hover:text-primary cursor-pointer"
              aria-label={`Editar ${item.concept}`}
            >
              <Icon name="edit" className="text-xl" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
