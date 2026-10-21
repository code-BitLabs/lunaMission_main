import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'active';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs h-7 px-2.5 rounded-[var(--lm-radius-sm)]',
    md: 'text-sm h-9 px-3.5 rounded-[var(--lm-radius-sm)]',
    lg: 'text-sm h-11 px-5 rounded-[var(--lm-radius-md)]',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--lm-color-text-primary)] text-[var(--lm-color-canvas)] hover:bg-white active:bg-slate-200 border border-transparent shadow-sm',
    secondary:
      'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-primary)] hover:bg-[var(--lm-color-surface-strong)] border border-[var(--lm-color-border)] active:border-[var(--lm-color-text-muted)]',
    ghost:
      'bg-transparent text-[var(--lm-color-text-secondary)] hover:text-[var(--lm-color-text-primary)] hover:bg-[var(--lm-color-surface-raised)] border border-transparent',
    active:
      'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      {children}
      {iconRight && <span className="shrink-0 flex items-center justify-center">{iconRight}</span>}
    </button>
  );
}
