'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

export interface TabItem<T extends string> {
  key: T;
  label: string;
  count?: number;
}

/** Underline tabs with a sliding ultraviolet indicator. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const index = Math.max(0, items.findIndex((i) => i.key === value));

  return (
    <div role="tablist" className={cn('relative flex gap-1', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          role="tab"
          aria-selected={item.key === value}
          onClick={() => {
            haptic('select');
            onChange(item.key);
          }}
          className={cn(
            'relative flex-1 py-3 text-sm font-semibold lowercase transition-colors',
            item.key === value ? 'text-bone' : 'text-bone-faint hover:text-bone-dim',
          )}
        >
          {item.label}
          {item.count ? (
            <span className="ml-1.5 text-2xs text-ultraviolet-bright tabular-nums">
              {item.count}
            </span>
          ) : null}
        </button>
      ))}
      <span
        aria-hidden
        className="absolute bottom-0 h-0.5 rounded-full uv-gradient transition-transform duration-300 ease-hey"
        style={{
          width: `${100 / items.length}%`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
    </div>
  );
}

/** Pill segmented control, for short mutually-exclusive choices. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const index = Math.max(0, items.findIndex((i) => i.key === value));
  return (
    <div
      role="tablist"
      className={cn(
        'relative flex rounded-full border border-white/[0.08] bg-graphite/40 p-1',
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 rounded-full bg-white/[0.08] transition-transform duration-300 ease-hey"
        style={{
          width: `calc((100% - 8px) / ${items.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {items.map((item) => (
        <button
          key={item.key}
          role="tab"
          aria-selected={item.key === value}
          onClick={() => {
            haptic('select');
            onChange(item.key);
          }}
          className={cn(
            'relative flex-1 rounded-full py-2 text-[13px] font-semibold lowercase transition-colors',
            item.key === value ? 'text-bone' : 'text-bone-faint',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
