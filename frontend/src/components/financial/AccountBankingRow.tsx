import Button from '../ui/Button.tsx';
import Icon from '../ui/Icon.tsx';

export type AccountStatus = 'reconciled' | 'review';

export interface AccountBankingRowProps {
  icon: string;
  name: string;
  subtitle: string;
  amount: string;
  status: AccountStatus;
  statusLabel: string;
  actionLabel: string;
  accent?: 'default' | 'warning';
}

export default function AccountBankingRow({
  icon,
  name,
  subtitle,
  amount,
  status,
  statusLabel,
  actionLabel,
  accent = 'default',
}: AccountBankingRowProps) {
  const amountColor = status === 'review' ? 'text-expense-rose' : 'text-primary';
  const statusColor = status === 'review' ? 'text-warning-amber' : 'text-success-emerald';

  return (
    <div
      className={`p-md flex items-center justify-between rounded-xl ${
        accent === 'warning' ? 'border-l-4 border-warning-amber' : ''
      }`}
    >
      <div className="flex items-center gap-md">
        <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-primary">
          <Icon name={icon} size="md" />
        </div>
        <div>
          <h4 className="font-label-md text-on-surface font-bold">{name}</h4>
          <p className="text-label-sm text-text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-lg">
        <div className="text-right">
          <p className={`font-headline-md ${amountColor}`}>{amount}</p>
          <p className={`text-label-sm font-medium ${statusColor}`}>{statusLabel}</p>
        </div>
        <Button
          variant={status === 'review' ? 'secondary' : 'primary'}
          size="sm"
          className="rounded-xl font-bold"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
