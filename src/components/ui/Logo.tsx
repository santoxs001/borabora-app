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

/** The connection symbol from the brand sheet — two arcs meeting. */
export function ConnectionMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={className}>
      <path
        d="M6 6c10 0 16 7 18 18 2-11 8-18 18-18-10 0-16 7-18 18C22 13 16 6 6 6z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M6 42c10 0 16-7 18-18 2 11 8 18 18 18-10 0-16-7-18-18C22 35 16 42 6 42z"
        fill="currentColor"
        opacity="0.9"
      />
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
