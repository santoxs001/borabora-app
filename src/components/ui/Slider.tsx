'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

/** Single-value slider. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = String,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const id = React.useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="py-2">
      <div className="mb-3 flex items-baseline justify-between">
        <label htmlFor={id} className="eyebrow">
          {label}
        </label>
        <span className="text-sm font-semibold text-bone tabular-nums">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hey-range w-full"
        style={{ ['--pct' as string]: `${pct}%` }}
      />
    </div>
  );
}

/** Two-thumb range, implemented as stacked native inputs for a11y. */
export function RangeSlider({
  label,
  min,
  max,
  low,
  high,
  onChange,
  format = String,
}: {
  label: string;
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  format?: (v: number) => string;
}) {
  const lowPct = ((low - min) / (max - min)) * 100;
  const highPct = ((high - min) / (max - min)) * 100;

  return (
    <div className="py-2">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="eyebrow">{label}</span>
        <span className="text-sm font-semibold text-bone tabular-nums">
          {format(low)} – {format(high)}
        </span>
      </div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-graphite-light" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full uv-gradient"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          aria-label={`${label} minimum`}
          min={min}
          max={max}
          value={low}
          onChange={(e) => onChange(Math.min(Number(e.target.value), high - 1), high)}
          className="hey-range-bare absolute inset-0 w-full"
        />
        <input
          type="range"
          aria-label={`${label} maximum`}
          min={min}
          max={max}
          value={high}
          onChange={(e) => onChange(low, Math.max(Number(e.target.value), low + 1))}
          className="hey-range-bare absolute inset-0 w-full"
        />
      </div>
    </div>
  );
}

export const sliderStyles = cn();
