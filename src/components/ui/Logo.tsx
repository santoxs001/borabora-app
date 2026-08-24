import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * The wordmark. Always lowercase, always with the full stop —
 * the dot is the brand's load-bearing element and gets reused as a
 * status light, a loading indicator and the Spotlight motif.
 */
export function Wordmark({
  className,
  dotClassName,
  animated = false,
}: {
  className?: string;
  dotClassName?: string;
  animated?: boolean;
}) {
  return (
    <span className={cn('font-display display-tight lowercase select-none', className)}>
      hey
      <span
        className={cn(
          'text-ultraviolet inline-block',
          animated && 'animate-dot-pulse',
          dotClassName,
        )}
      >
        .
      </span>
    </span>
  );
}

/**
 * The connection symbol from the brand sheet: two arcs facing each
 * other and meeting in the middle. Drawn as strokes rather than fills
 * so it stays legible at 24px as well as at 240px.
 */
export function ConnectionMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 8 Q25 24 9 40" />
        <path d="M39 8 Q23 24 39 40" />
      </g>
    </svg>
  );
}

/** The dot, alone. Loading, presence, "we're thinking". */
export function HeyDot({
  size = 10,
  className,
  pulse = true,
  style,
}: {
  size?: number;
  className?: string;
  pulse?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{ width: size, height: size, ...style }}
      className={cn(
        'inline-block rounded-full bg-ultraviolet',
        pulse && 'animate-dot-pulse',
        className,
      )}
    />
  );
}
