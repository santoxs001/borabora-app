'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { Icon, type IconName } from './Icon';

type Variant = 'solid' | 'glass' | 'ghost' | 'primary';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const VARIANTS: Record<Variant, string> = {
  solid: 'bg-graphite text-bone border border-white/[0.08] hover:bg-graphite-light',
  glass: 'surface-blur text-bone border border-white/[0.1] hover:border-white/20',
  ghost: 'bg-transparent text-bone-dim hover:text-bone hover:bg-white/[0.06]',
  primary: 'uv-gradient text-white shadow-glow-sm hover:brightness-110',
};

const SIZES: Record<Size, { box: string; icon: number }> = {
  sm: { box: 'h-9 w-9', icon: 18 },
  md: { box: 'h-11 w-11', icon: 20 },
  lg: { box: 'h-14 w-14', icon: 24 },
  xl: { box: 'h-[68px] w-[68px]', icon: 30 },
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Required — icon-only controls must always be named for AT. */
  label: string;
  variant?: Variant;
  size?: Size;
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, label, variant = 'ghost', size = 'md', active, className, onClick, ...rest },
    ref,
  ) {
    const s = SIZES[size];
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={active}
        title={label}
        onClick={(e) => {
          haptic('tap');
          onClick?.(e);
        }}
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'transition-all duration-200 ease-hey active:scale-90',
          'disabled:opacity-35 disabled:pointer-events-none',
          VARIANTS[variant],
          s.box,
          active && variant !== 'primary' && 'text-ultraviolet border-ultraviolet/40',
          className,
        )}
        {...rest}
      >
        <Icon name={icon} size={s.icon} />
      </button>
    );
  },
);
