'use client';

import * as React from 'react';
import Link from 'next/link';
import type { DistancePrecision, Profile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { OnlineDot } from '@/components/ui/Badge';
import { VIBE_BY_KEY } from '@/data/vibes';
import { distanceLabel } from '@/lib/format';

/**
 * "close to you" — the first thing on the home screen.
 * Presence, not content: these are people, live, right now.
 */
export function StoryRail({
  profiles,
  precision,
  onSetVibe,
  myVibeEmoji,
}: {
  profiles: Profile[];
  precision: DistancePrecision;
  onSetVibe: () => void;
  myVibeEmoji: string | null;
}) {
  return (
    <section aria-labelledby="close-to-you" className="pt-1">
      <h2 id="close-to-you" className="eyebrow px-4 pb-2.5">
        close to you
      </h2>
      <ul className="no-scrollbar flex gap-3.5 overflow-x-auto px-4 pb-1">
        <li className="shrink-0">
          <button
            type="button"
            onClick={onSetVibe}
            className="flex w-[64px] flex-col items-center"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full border border-dashed border-ultraviolet/60 bg-ultraviolet-wash text-lg">
              {myVibeEmoji ?? <span className="text-ultraviolet text-2xl leading-none">+</span>}
            </span>
            <span className="mt-3.5 w-full truncate text-center text-2xs leading-4 text-bone-dim lowercase">
              your vibe
            </span>
            <span className="text-[10px] leading-4">&nbsp;</span>
          </button>
        </li>

        {profiles.map((p) => {
          const photo = p.photos[0];
          const vibe = p.activeVibe ? VIBE_BY_KEY[p.activeVibe.key] : null;
          return (
            <li key={p.id} className="shrink-0">
              <Link href={`/u/${p.id}`} className="flex w-[64px] flex-col items-center">
                <span className="relative">
                  <Avatar
                    name={p.name}
                    seed={photo?.seed ?? p.id}
                    src={photo?.url}
                    size="md"
                    ring={!!vibe}
                  />
                  {p.state === 'online' && <OnlineDot className="absolute -right-0.5 top-0" />}
                  {vibe && (
                    <span
                      aria-hidden
                      title={vibe.label}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 grid h-5 min-w-[20px] place-items-center rounded-full bg-obsidian px-1 text-[10px] ring-1 ring-white/10"
                    >
                      {vibe.emoji}
                    </span>
                  )}
                </span>
                <span className="mt-3.5 w-full truncate text-center text-2xs leading-4 text-bone-dim">
                  {p.name}
                </span>
                <span className="w-full truncate text-center text-[10px] leading-4 text-bone-faint lowercase">
                  {distanceLabel(p, precision) ?? '\u00a0'}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
