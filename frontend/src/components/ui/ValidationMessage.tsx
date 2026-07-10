import type { ReactNode } from 'react';

export type ValidationTone = 'error' | 'warning' | 'info' | 'success';

export interface ValidationMessageProps {
  tone?: ValidationTone;
  title?: string;
  children: ReactNode;
  className?: string;
}

const TONE_CLASS: Record<ValidationTone, string> = {
  error: 'bg-error-container text-on-error-container border-error/20',
  warning: 'bg-warning-amber/10 text-on-surface border-warning-amber/30',
  info: 'bg-primary/5 text-on-surface border-primary/15',
  success: 'bg-success-emerald/10 text-on-surface border-success-emerald/25',
};

/** Everyday-language feedback for forms and API errors (FR-008). */
export default function ValidationMessage({
  tone = 'error',
  title,
  children,
  className = '',
}: ValidationMessageProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border p-md text-body-md ${TONE_CLASS[tone]} ${className}`.trim()}
    >
      {title && <p className="font-semibold mb-xs">{title}</p>}
      <div>{children}</div>
    </div>
  );
}
