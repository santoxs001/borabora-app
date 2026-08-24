import * as React from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

type Tone = 'uv' | 'neutral' | 'online' | 'warn' | 'plus';

const TONES: Record<Tone, string> = {
  uv: 'bg-ultraviolet-wash text-ultraviolet-bright border-ultraviolet/25',
  neutral: 'bg-white/[0.07] text-bone-dim border-white/[0.08]',
  online: 'bg-signal-online/12 text-signal-online border-signal-online/25',
  warn: 'bg-signal-warn/12 text-signal-warn border-signal-warn/25',
  plus: 'uv-gradient text-white border-transparent',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1',
        'text-2xs font-semibold uppercase tracking-[0.1em] whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The ultraviolet tick. Small on purpose — it confirms, it doesn't shout. */
export function VerifiedTick({ size = 15, className }: { size?: number; className?: string }) {
  return (
    <Icon
      name="verified"
      size={size}
      label="verified profile"
      className={cn('text-ultraviolet', className)}
    />
  );
}

/**
 * Presence indicator.
 *
 * The outer span carries no positioning of its own so callers can place
 * it with `absolute`; the ring is anchored to an inner relative span
 * instead. (Putting `relative` on the outer element silently beats an
 * `absolute` passed in via className — Tailwind emits `.relative` after
 * `.absolute`, so the caller's intent loses.)
 */
export function OnlineDot({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex h-2.5 w-2.5', className)}>
      <span className="relative h-2.5 w-2.5">
        <span className="absolute inset-0 rounded-full bg-signal-online/60 animate-ring-out" />
        <span className="absolute inset-0 rounded-full bg-signal-online ring-2 ring-obsidian" />
      </span>
    </span>
  );
}

/** Small count bubble for unread state. */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'min-w-[20px] h-5 px-1.5 rounded-full uv-gradient text-white',
        'text-[11px] font-bold inline-flex items-center justify-center tabular-nums',
        className,
      )}
      aria-label={`${count} unread`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
