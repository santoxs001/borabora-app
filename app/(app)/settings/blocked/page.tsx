'use client';

import * as React from 'react';
import { useApp } from '@/store/app-store';
import { PageHeader } from '@/components/app/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { relativeTime } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';

export default function BlockedPage() {
  const { state, dispatch, profileById } = useApp();
  const { toast } = useToast();

  if (!state.blocks.length) {
    return (
      <main id="main">
        <PageHeader title="blocked" />
        <EmptyState icon="block" title="nobody blocked." body="that's a good sign." />
      </main>
    );
  }

  return (
    <main id="main">
      <PageHeader title="blocked" subtitle={`${state.blocks.length} blocked`} />
      <ul className="mx-auto max-w-lg divide-y divide-white/[0.05]">
        {state.blocks.map((b) => {
          const p = profileById(b.profileId);
          return (
            <li key={b.profileId} className="flex items-center gap-3.5 px-4 py-3.5">
              <Avatar name={b.name} seed={p?.photos[0]?.seed ?? b.profileId} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">{b.name}</p>
                <p className="text-sm text-bone-faint">blocked {relativeTime(b.createdAt)} ago</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  dispatch({ type: 'unblock', profileId: b.profileId });
                  toast(`${b.name.toLowerCase()} unblocked`);
                }}
              >
                unblock
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="mx-auto max-w-lg px-4 py-5 text-sm text-bone-faint text-pretty">
        unblocking does not restore old conversations — those were deleted when you blocked.
      </p>
    </main>
  );
}
