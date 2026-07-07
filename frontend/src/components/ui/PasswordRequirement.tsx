import Icon from './Icon.tsx';

export interface PasswordRequirementProps {
  label: string;
  met: boolean;
}

export default function PasswordRequirement({ label, met }: PasswordRequirementProps) {
  return (
    <span
      className={[
        'flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors',
        met
          ? 'text-success-emerald bg-success-emerald/10 border-success-emerald/20'
          : 'text-on-surface-variant bg-surface-container-high border-outline-variant/20',
      ].join(' ')}
    >
      <Icon name="check_circle" className="text-[14px]" />
      {label}
    </span>
  );
}
