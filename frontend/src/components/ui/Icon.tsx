import type { JSX } from 'react';

export interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASS = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-7xl',
} as const;

export default function Icon({ name, filled = false, className = '', size }: IconProps): JSX.Element {
  const sizeClass = size ? SIZE_CLASS[size] : '';
  const fillClass = filled ? 'material-symbols-filled' : 'material-symbols-outlined';

  return (
    <span className={`${fillClass} ${sizeClass} ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  );
}
