'use client';

import * as React from 'react';
import Link from 'next/link';
import { useApp } from '@/store/app-store';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';

import { PageHeader } from '@/components/app/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import type { NotificationKind } from '@/types';

const ICONS: Record<NotificationKind, IconName> = {
  like: 'heart',
  say_hey: 'bolt',
  match: 'sparkle',
  message: 'messages',
  vibe_expiring: 'bolt',
  nearby: 'nearby',
  system: 'shield',
};

export default function NotificationsPage() {
  const { state, dispatch, profileById } = useApp();

  // Reading the screen is the acknowledgement.
  React.useEffect(() => {
    const t = window.setTimeout(() => dispatch({ type: 'readNotifications' }), 900);
    return () => window.clearTimeout(t);
  }, [dispatch]);

  if (!state.notifications.length) {
    return (
      <main id="main">
        <PageHeader title="notifications" />
        <EmptyState icon="bell" title="quiet." body="we'll tell you when something happens." />
      </main>
    );
  }

  return (
    <main id="main">
      <PageHeader title="notifications" />
      <ul className="mx-auto max-w-lg divide-y divide-white/[0.05]">
        {state.notifications.map((n) => {
          const p = n.profileId ? profileById(n.profileId) : undefined;
          const href = p ? `/u/${p.id}` : '/discover';
          return (
            <li key={n.id}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-4 transition-colors active:bg-white/[0.04]',
                  !n.read && 'bg-ultraviolet-wash/40',
                )}
              >
                {p ? (
                  <Avatar name={p.name} seed={p.photos[0]?.seed ?? p.id} src={p.photos[0]?.url} size="sm" />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-graphite/50 text-ultraviolet">
                    <Icon name={ICONS[n.kind]} size={18} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{n.title}</span>
                  {n.body && (
                    <span className="block truncate text-sm text-bone-faint">{n.body}</span>
                  )}
                </span>
                <span className="shrink-0 text-[11px] text-bone-faint">
                  {relativeTime(n.createdAt)}
                </span>
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-ultraviolet" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
