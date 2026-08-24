'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { VIBE_BY_KEY } from '@/data/vibes';
import type { VibeKey } from '@/types';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  size?: 'sm' | 'md';
  leading?: React.ReactNode;
  /** Renders as a static span rather than a button. */
  asStatic?: boolean;
}

export function Chip({
  selected,
  size = 'md',
  leading,
  asStatic,
  className,
  children,
  onClick,
  ...rest
}: ChipProps) {
  const classes = cn(
    'inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap',
    'transition-all duration-200 ease-hey',
    size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2.5 text-sm',
    selected
      ? 'bg-ultraviolet-wash border-ultraviolet/55 text-bone font-semibold'
      : 'bg-white/[0.045] border-white/[0.09] text-bone-dim',
    !asStatic && 'active:scale-95 hover:border-white/20 hover:text-bone',
    className,
  );

  if (asStatic) {
    return (
      <span className={classes}>
        {leading}
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={(e) => {
        haptic('select');
        onClick?.(e);
      }}
      className={classes}
      {...rest}
    >
      {leading}
      {children}
    </button>
  );
}

/**
 * A vibe, rendered. Used on cards, in the picker, and in filters —
 * one component so a vibe always looks like the same thing.
 */
export function VibeChip({
  vibe,
  selected,
  size = 'md',
  onClick,
  asStatic,
  showHint,
  className,
}: {
  vibe: VibeKey;
  selected?: boolean;
  size?: 'sm' | 'md';
  onClick?: () => void;
  asStatic?: boolean;
  showHint?: boolean;
  className?: string;
}) {
  const v = VIBE_BY_KEY[vibe];
  if (!v) return null;
  return (
    <Chip
      selected={selected}
      size={size}
      asStatic={asStatic}
      onClick={onClick}
      className={className}
      leading={
        <span aria-hidden className={size === 'sm' ? 'text-xs' : 'text-sm'}>
          {v.emoji}
        </span>
      }
    >
      <span className="lowercase">{v.label}</span>
      {showHint && <span className="text-bone-faint font-normal"> · {v.hint}</span>}
    </Chip>
  );
}
