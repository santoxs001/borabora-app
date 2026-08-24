'use client';

import * as React from 'react';
import Link from 'next/link';
import { useApp } from '@/store/app-store';
import { PageHeader } from '@/components/app/AppHeader';
import { ProfileTile } from '@/components/app/ProfileTile';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { pluralise } from '@/lib/format';

/**
 * Who liked you.
 *
 * Free accounts see the count and blurred tiles — the number is real,
 * the faces are not shown. No fake profiles, no inflated counts.
 */
export default function LikesPage() {
  const { state, profileById } = useApp();
  const me = state.me!;
  const likers = state.likedMe.map(profileById).filter(Boolean);
  const locked = !me.plus.active;

  if (!likers.length) {
    return (
      <main id="main">
        <PageHeader title="likes you" />
        <EmptyState
          icon="heart"
          title="nobody yet."
          body="set a vibe — people looking for the same thing find you faster."
          action={
            <Link href="/vibes">
              <Button>pick a vibe</Button>
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main id="main">
      <PageHeader title="likes you" subtitle={`${pluralise(likers.length, 'person', 'people')}`} />

      <div className="mx-auto max-w-lg px-4 py-4">
        {locked && (
          <div className="mb-5 rounded-lg border border-ultraviolet/35 bg-ultraviolet-wash p-5">
            <p className="font-display text-2xl display-tight text-balance">
              {likers.length} {likers.length === 1 ? 'person likes' : 'people like'} you.
            </p>
            <p className="mt-1.5 text-sm text-bone-dim text-pretty">
              hey+ shows you who. no guessing, no fake counts.
            </p>
            <Link href="/plus">
              <Button className="mt-4" size="sm" leading={<Icon name="sparkle" size={15} />}>
                see who
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {likers.map((p) => (
            <div key={p!.id} className="relative">
              <div className={locked ? 'pointer-events-none blur-[14px] saturate-50' : ''}>
                <ProfileTile profile={p!} precision={me.privacy.distancePrecision} />
              </div>
              {locked && (
                <span className="absolute inset-0 grid place-items-center">
                  <Icon name="lock" size={20} className="text-bone-dim" />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
