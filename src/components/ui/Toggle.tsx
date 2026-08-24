'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}) {
  const autoId = React.useId();
  const switchId = id ?? autoId;
  const descId = description ? `${switchId}-desc` : undefined;

  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <label htmlFor={switchId} className="block text-[15px] text-bone">
          {label}
        </label>
        {description && (
          <p id={descId} className="mt-1 text-sm text-bone-faint text-pretty">
            {description}
          </p>
        )}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descId}
        disabled={disabled}
        onClick={() => {
          haptic('select');
          onChange(!checked);
        }}
        className={cn(
          'relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ease-hey',
          'disabled:opacity-40',
          checked ? 'uv-gradient' : 'bg-graphite-light',
        )}
      >
        {/* `left` is pinned rather than left to `auto`: Chromium resolves an
            absolutely-positioned child of a <button> to the button's centre,
            which would compound with the transform. */}
        <span
          className={cn(
            'absolute left-1 top-1 h-5 w-5 rounded-full bg-bone shadow-float',
            'transition-transform duration-200 ease-snap',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}
