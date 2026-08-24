'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

/** Settings row. Renders as a link, a button, or a static container. */
export function Row({
  icon,
  label,
  value,
  description,
  href,
  onClick,
  danger,
  trailing,
  children,
}: {
  icon?: IconName;
  label: string;
  value?: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const inner = (
    <>
      {icon && (
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/[0.07] bg-white/[0.04]',
            danger ? 'text-signal-danger' : 'text-bone-dim',
          )}
        >
          <Icon name={icon} size={17} />
        </span>
      )}
      <span className="min-w-0 flex-1 text-left">
        <span className={cn('block text-[15px]', danger ? 'text-signal-danger' : 'text-bone')}>
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-sm text-bone-faint text-pretty">{description}</span>
        )}
      </span>
      {value && <span className="shrink-0 text-sm text-bone-faint lowercase">{value}</span>}
      {trailing}
      {(href || onClick) && !trailing && (
        <Icon name="chevron-right" size={17} className="shrink-0 text-bone-faint" />
      )}
    </>
  );

  const base =
    'flex w-full items-center gap-3.5 px-4 py-3.5 transition-colors active:bg-white/[0.04]';

  if (href) {
    return (
      <Link href={href} className={cn(base, 'hover:bg-white/[0.03]')}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, 'hover:bg-white/[0.03]')}>
        {inner}
      </button>
    );
  }
  return (
    <div className={base}>
      {inner}
      {children}
    </div>
  );
}

export function RowGroup({
  title,
  footnote,
  children,
}: {
  title?: string;
  footnote?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      {title && <h2 className="eyebrow mb-2.5 px-4">{title}</h2>}
      <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-graphite/25 divide-y divide-white/[0.05]">
        {children}
      </div>
      {footnote && <p className="mt-2.5 px-4 text-sm text-bone-faint text-pretty">{footnote}</p>}
    </section>
  );
}
