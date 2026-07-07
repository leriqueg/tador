import type { InputHTMLAttributes, ReactNode } from 'react';
import Icon from './Icon.tsx';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: boolean;
  trailing?: ReactNode;
  labelAction?: ReactNode;
}

export default function TextInput({
  label,
  icon,
  error = false,
  trailing,
  labelAction,
  id,
  className = '',
  ...props
}: TextInputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-base">
      {(label || labelAction) && (
        <div className="flex justify-between items-center px-base">
          {label && (
            <label className="text-label-md text-on-surface-variant" htmlFor={inputId}>
              {label}
            </label>
          )}
          {labelAction}
        </div>
      )}
      <div className="relative group">
        {icon && (
          <Icon
            name={icon}
            className="absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
          />
        )}
        <input
          id={inputId}
          className={[
            'w-full h-12 bg-surface-container-low border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-body-md placeholder:text-outline',
            icon ? 'pl-11 pr-md' : 'px-md',
            trailing ? 'pr-11' : '',
            error ? 'border-error' : 'border-outline-variant',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {trailing && (
          <div className="absolute right-md top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
    </div>
  );
}
