import * as React from 'react';
import { cn } from '@/lib/cn';
import { duotoneStyle } from '@/lib/gradient';
import { initials } from '@/lib/format';
import { OnlineDot } from './Badge';

const SIZES = {
  xs: 'h-8 w-8 text-xs',
  sm: 'h-11 w-11 text-sm',
  md: 'h-14 w-14 text-base',
  lg: 'h-20 w-20 text-2xl',
  xl: 'h-28 w-28 text-4xl',
} as const;

export interface AvatarProps {
  name: string;
  seed: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  online?: boolean;
  /** Ultraviolet ring — used for active-vibe stories on the home rail. */
  ring?: boolean;
  className?: string;
}

export function Avatar({
  name,
  seed,
  src,
  size = 'md',
  online,
  ring,
  className,
}: AvatarProps) {
  return (
    <span className={cn('relative inline-block shrink-0', className)}>
      <span
        className={cn(
          'block rounded-full overflow-hidden grain relative',
          SIZES[size],
          ring && 'ring-2 ring-ultraviolet ring-offset-2 ring-offset-obsidian',
        )}
        style={src ? undefined : duotoneStyle(seed)}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display font-extrabold text-white/85">
            {initials(name)}
          </span>
        )}
      </span>
      {online && <OnlineDot className="absolute bottom-0 right-0" />}
    </span>
  );
}
