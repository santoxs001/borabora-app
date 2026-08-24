'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Wordmark } from '@/components/ui/Logo';
import { IconButton } from '@/components/ui/IconButton';
import { Icon } from '@/components/ui/Icon';
import { useApp } from '@/store/app-store';

/** Home header: the wordmark, plus the two things you reach for most. */
export function HomeHeader({ right }: { right?: React.ReactNode }) {
  const { state } = useApp();
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 surface-blur">
      <div className="mx-auto flex h-[60px] max-w-lg items-center justify-between px-4">
        <Link href="/discover" aria-label="hey. home">
          <Wordmark className="text-[27px]" />
        </Link>
        <div className="flex items-center gap-1">
          {right}
          <Link
            href="/explore"
            aria-label="explore"
            className="grid h-11 w-11 place-items-center rounded-full text-bone-dim transition-colors hover:text-bone"
          >
            <Icon name="search" size={21} />
          </Link>
          <Link
            href="/notifications"
            aria-label={unread ? `notifications, ${unread} new` : 'notifications'}
            className="relative grid h-11 w-11 place-items-center rounded-full text-bone-dim transition-colors hover:text-bone"
          >
            <Icon name="bell" size={21} />
            {unread > 0 && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-ultraviolet ring-2 ring-obsidian" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Secondary header with a back affordance and a title. */
export function PageHeader({
  title,
  back = true,
  onBack,
  right,
  subtitle,
  className,
}: {
  title: React.ReactNode;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn('sticky top-0 z-40 surface-blur', className)}>
      <div className="mx-auto flex min-h-[60px] max-w-lg items-center gap-2 px-2 py-2">
        {back && (
          <IconButton
            icon="chevron-left"
            label="back"
            onClick={() => (onBack ? onBack() : history.back())}
          />
        )}
        <div className={cn('min-w-0 flex-1', !back && 'pl-2')}>
          <h1 className="truncate font-display text-xl leading-tight display-tight lowercase">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-2xs leading-tight text-bone-faint">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1 pr-2">{right}</div>
      </div>
    </header>
  );
}
