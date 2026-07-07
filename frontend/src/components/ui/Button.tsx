import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.tsx';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'surface';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconRight?: string;
  iconLeft?: string;
  href?: string;
  to?: string;
  children: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90 shadow-md',
  secondary: 'bg-secondary-fixed text-on-secondary-fixed hover:opacity-90',
  outline: 'border-2 border-primary text-primary hover:bg-primary/5',
  ghost: 'text-secondary hover:text-primary',
  surface: 'bg-surface text-primary hover:bg-surface-bright shadow-lg',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-10 px-6 py-2 text-label-md rounded-xl',
  md: 'h-12 px-lg py-sm text-label-md rounded-full',
  lg: 'h-14 px-xl py-md text-headline-md rounded-full',
};

function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className: string,
): string {
  return [
    'squishy-btn inline-flex items-center justify-center gap-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed no-underline',
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconRight,
  iconLeft,
  href,
  to,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = buttonClassName(variant, size, fullWidth, className);

  if (to) {
    return (
      <Link to={to} className={classes}>
        {iconLeft && <Icon name={iconLeft} />}
        {children}
        {iconRight && <Icon name={iconRight} />}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {iconLeft && <Icon name={iconLeft} />}
        {children}
        {iconRight && <Icon name={iconRight} />}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {iconLeft && <Icon name={iconLeft} />}
      {children}
      {iconRight && <Icon name={iconRight} />}
    </button>
  );
}
