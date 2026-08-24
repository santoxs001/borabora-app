'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

export interface Option<T extends string> {
  value: T;
  label: string;
}

/**
 * Native <select> under a styled shell. Native beats custom here:
 * it gets the platform picker on mobile and full AT support for free.
 */
export function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'choose',
  className,
}: {
  label?: string;
  value: T | '';
  options: Option<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="eyebrow mb-2 block">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={cn(
            'h-13 min-h-[52px] w-full appearance-none rounded-sm border border-white/[0.09]',
            'bg-graphite/45 px-4 pr-11 text-bone outline-none',
            'focus:border-ultraviolet/70 transition-colors',
            !value && 'text-bone-faint',
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-obsidian-50 text-bone">
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-bone-faint"
        />
      </div>
    </div>
  );
}
