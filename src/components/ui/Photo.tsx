import * as React from 'react';
import { cn } from '@/lib/cn';
import { duotoneStyle } from '@/lib/gradient';

/**
 * Photo surface. When `src` is absent we render the deterministic
 * duotone — which is also exactly what a real photo's placeholder looks
 * like while it decodes, so there is never a layout or colour jump.
 */
export function PhotoSurface({
  seed,
  src,
  alt = '',
  className,
  children,
  priority,
  /** Draws a large, low-contrast initial into the placeholder. */
  initial,
}: {
  seed: string;
  src?: string | null;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
  priority?: boolean;
  initial?: string;
}) {
  return (
    <div
      className={cn('relative overflow-hidden grain bg-graphite-dark [container-type:size]', className)}
      style={duotoneStyle(seed)}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      {!src && initial && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center font-display font-black leading-none text-bone/[0.055]"
          style={{ fontSize: 'min(46cqw, 42cqh, 220px)' }}
        >
          {initial}
        </span>
      )}
      {children}
    </div>
  );
}
