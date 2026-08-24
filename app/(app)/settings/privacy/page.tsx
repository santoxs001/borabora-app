'use client';

import * as React from 'react';
import Link from 'next/link';
import type { DistancePrecision } from '@/types';
import { useApp } from '@/store/app-store';
import { PageHeader } from '@/components/app/AppHeader';
import { RowGroup } from '@/components/ui/Row';
import { Toggle } from '@/components/ui/Toggle';
import { Segmented } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

/**
 * Privacy.
 *
 * Everything here is reciprocal by design: hide your distance and you
 * stop seeing exact distances too. Asymmetric privacy is a way to spy,
 * so the product doesn't offer it.
 */
export default function PrivacySettingsPage() {
  const { state, dispatch } = useApp();
  const me = state.me!;
  const p = me.privacy;
  const set = (patch: Partial<typeof p>) => dispatch({ type: 'setPrivacy', patch });

  return (
    <main id="main">
      <PageHeader title="privacy" />

      <div className="mx-auto max-w-lg px-4 py-4">
        <section className="mb-7">
          <h2 className="eyebrow mb-2.5 px-4">distance</h2>
          <div className="rounded-lg border border-white/[0.07] bg-graphite/25 p-4">
            <Segmented
              value={p.distancePrecision}
              onChange={(v) => set({ distancePrecision: v as DistancePrecision })}
              items={[
                { key: 'exact', label: 'exact' },
                { key: 'approximate', label: 'approximate' },
                { key: 'hidden', label: 'hidden' },
              ]}
            />
            <p className="mt-3.5 text-sm text-bone-faint text-pretty">
              {
                {
                  exact: 'shows a rounded distance, like “900 m”. never a location.',
                  approximate: 'shows a wide band, like “a few km”.',
                  hidden: "nobody sees your distance — and you won't see theirs.",
                }[p.distancePrecision]
              }
            </p>
          </div>
          <p className="mt-2.5 flex items-start gap-2 px-4 text-sm text-bone-faint text-pretty">
            <Icon name="shield" size={15} className="mt-0.5 shrink-0 text-ultraviolet" />
            HEY never stores your exact coordinates and has no screen that puts a person on a map.
          </p>
        </section>

        <RowGroup title="visibility">
          <div className="px-4">
            <Toggle
              label="show when I'm online"
              description="turning this off also hides other people's online status from you."
              checked={p.showOnlineStatus}
              onChange={(showOnlineStatus) => set({ showOnlineStatus })}
            />
            <Toggle
              label="browse privately"
              description="you won't appear in grids while you look around."
              checked={p.browsePrivately}
              onChange={(browsePrivately) => set({ browsePrivately })}
            />
            <Toggle
              label="only people I like can see me"
              description="you disappear from discovery until you like someone."
              checked={p.onlyLikedCanSeeMe}
              onChange={(onlyLikedCanSeeMe) => set({ onlyLikedCanSeeMe })}
            />
            <Toggle
              label="hide me from my contacts"
              description="we never show your profile to numbers in your phonebook."
              checked={p.hideFromContacts}
              onChange={(hideFromContacts) => set({ hideFromContacts })}
            />
          </div>
        </RowGroup>

        {!me.plus.active && (
          <Link href="/plus" className="mb-7 block">
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg border border-ultraviolet/30 bg-ultraviolet-wash px-4 py-3.5',
              )}
            >
              <Icon name="eye-off" size={18} className="text-ultraviolet" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] lowercase">full invisible mode</span>
                <span className="block text-sm text-bone-faint">browse with nobody knowing.</span>
              </span>
              <Badge tone="plus">hey+</Badge>
            </div>
          </Link>
        )}

        <RowGroup title="messages and media">
          <div className="px-4">
            <Toggle
              label="blur photos until I tap"
              description="incoming images stay covered until you choose to look."
              checked={p.blurIncomingPhotos}
              onChange={(blurIncomingPhotos) => set({ blurIncomingPhotos })}
            />
            <Toggle
              label="only matches can message me"
              description="strangers can still say hey — you just won't get a thread until you answer."
              checked={p.messagesFrom === 'matches_only'}
              onChange={(v) => set({ messagesFrom: v ? 'matches_only' : 'everyone' })}
            />
          </div>
        </RowGroup>

        <RowGroup title="your data" footnote="LGPD and GDPR requests are answered within 30 days.">
          <div className="space-y-2.5 p-4">
            <Button fullWidth variant="secondary">
              download my data
            </Button>
            <Button fullWidth variant="ghost">
              request deletion
            </Button>
          </div>
        </RowGroup>
      </div>
    </main>
  );
}
