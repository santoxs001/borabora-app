'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'uv-gradient text-white shadow-glow-sm hover:brightness-110 active:brightness-95 disabled:shadow-none',
  secondary:
    'bg-graphite/80 text-bone hover:bg-graphite-light/80 active:bg-graphite border border-white/[0.07]',
  ghost: 'bg-transparent text-bone-dim hover:text-bone hover:bg-white/[0.05]',
  outline:
    'bg-transparent text-bone border border-white/15 hover:border-white/30 hover:bg-white/[0.04]',
  danger: 'bg-signal-danger/15 text-signal-danger border border-signal-danger/30 hover:bg-signal-danger/25',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-xs gap-1.5',
  md: 'h-12 px-5 text-[15px] rounded-sm gap-2',
  lg: 'h-14 px-6 text-base rounded-md gap-2.5',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  /** Renders before the label. */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leading,
    trailing,
    className,
    children,
    disabled,
    onClick,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (!isDisabled) haptic('tap');
        onClick?.(e);
      }}
      className={cn(
        'relative inline-flex items-center justify-center font-semibold tracking-[-0.01em]',
        'transition-all duration-200 ease-hey active:scale-[0.97]',
        'disabled:opacity-40 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-1.5" aria-hidden>
          <Dot delay={0} />
          <Dot delay={140} />
          <Dot delay={280} />
        </span>
      ) : (
        <>
          {leading}
          {children}
          {trailing}
        </>
      )}
      {loading && <span className="sr-only">loading</span>}
    </button>
  );
});

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-current animate-dot-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
