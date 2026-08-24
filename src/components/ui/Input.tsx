'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string | null;
  leadingIcon?: IconName;
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leadingIcon, trailing, className, id, ...rest },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="eyebrow mb-2 block">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-sm border bg-graphite/45 px-4',
          'transition-colors duration-200',
          'focus-within:border-ultraviolet/70 focus-within:bg-graphite/70',
          error ? 'border-signal-danger/60' : 'border-white/[0.09]',
        )}
      >
        {leadingIcon && <Icon name={leadingIcon} size={18} className="text-bone-faint" />}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'h-13 min-h-[52px] w-full bg-transparent py-3 text-bone',
            'placeholder:text-bone-faint outline-none',
            className,
          )}
          {...rest}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${inputId}-err`} role="alert" className="mt-2 text-sm text-signal-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-2 text-sm text-bone-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string | null;
  maxChars?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, maxChars, className, id, value, ...rest },
  ref,
) {
  const autoId = React.useId();
  const areaId = id ?? autoId;
  const len = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={areaId} className="eyebrow mb-2 block">
          {label}
        </label>
      )}
      <div
        className={cn(
          'rounded-sm border bg-graphite/45 px-4 py-3 transition-colors duration-200',
          'focus-within:border-ultraviolet/70 focus-within:bg-graphite/70',
          error ? 'border-signal-danger/60' : 'border-white/[0.09]',
        )}
      >
        <textarea
          ref={ref}
          id={areaId}
          value={value}
          maxLength={maxChars}
          aria-invalid={!!error}
          className={cn(
            'w-full resize-none bg-transparent text-bone placeholder:text-bone-faint outline-none',
            className,
          )}
          {...rest}
        />
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <p className={cn('text-sm', error ? 'text-signal-danger' : 'text-bone-faint')}>
          {error ?? hint ?? ''}
        </p>
        {maxChars && (
          <span
            className={cn(
              'text-2xs tabular-nums',
              len > maxChars * 0.9 ? 'text-signal-warn' : 'text-bone-faint',
            )}
          >
            {len}/{maxChars}
          </span>
        )}
      </div>
    </div>
  );
});

export function SearchField({
  value,
  onValueChange,
  placeholder = 'search',
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-full border border-white/[0.09] bg-graphite/50 px-4 h-12',
        'focus-within:border-ultraviolet/60 transition-colors',
        className,
      )}
    >
      <Icon name="search" size={18} className="text-bone-faint" />
      <input
        type="search"
        role="searchbox"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full bg-transparent text-bone placeholder:text-bone-faint outline-none"
      />
      {value && (
        <button
          type="button"
          aria-label="clear search"
          onClick={() => onValueChange('')}
          className="text-bone-faint hover:text-bone"
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
