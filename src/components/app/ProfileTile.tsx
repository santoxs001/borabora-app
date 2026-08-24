'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { DistancePrecision, Profile } from '@/types';
import { PhotoSurface } from '@/components/ui/Photo';
import { VerifiedTick, OnlineDot } from '@/components/ui/Badge';
import { VIBE_BY_KEY } from '@/data/vibes';
import { distanceLabel } from '@/lib/format';

/** Compact grid card used by Nearby, Explore and Vibes. */
export function ProfileTile({
  profile,
  precision,
  className,
}: {
  profile: Profile;
  precision: DistancePrecision;
  className?: string;
}) {
  const primary = profile.photos.find((p) => p.isPrimary) ?? profile.photos[0];
  const distance = distanceLabel(profile, precision);
  const vibe = profile.activeVibe ? VIBE_BY_KEY[profile.activeVibe.key] : null;

  return (
    <Link
      href={`/u/${profile.id}`}
      className={cn(
        'group relative block overflow-hidden rounded-lg',
        'aspect-[3/4] transition-transform duration-200 ease-hey active:scale-[0.975]',
        className,
      )}
    >
      <PhotoSurface
        seed={primary?.seed ?? profile.id}
        src={primary?.url}
        alt={`${profile.name}, ${profile.age}`}
        initial={profile.name.charAt(0)}
        className="absolute inset-0 h-full w-full"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 photo-scrim" />

      {vibe && (
        <span
          className="absolute left-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-obsidian/65 text-sm backdrop-blur-md"
          title={vibe.label}
        >
          <span aria-hidden>{vibe.emoji}</span>
          <span className="sr-only">vibe: {vibe.label}</span>
        </span>
      )}
      {profile.state === 'online' && <OnlineDot className="absolute right-2.5 top-3" />}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="flex items-center gap-1 text-[15px] font-semibold leading-tight">
          <span className="truncate">{profile.name}</span>
          <span className="text-bone-dim font-normal">{profile.age}</span>
          {profile.verified && <VerifiedTick size={13} />}
        </p>
        {distance && (
          <p className="mt-0.5 text-2xs text-bone-faint lowercase">{distance}</p>
        )}
      </div>
    </Link>
  );
}

export function ProfileGrid({
  profiles,
  precision,
  className,
}: {
  profiles: Profile[];
  precision: DistancePrecision;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-2.5 sm:grid-cols-3', className)}>
      {profiles.map((p) => (
        <ProfileTile key={p.id} profile={p} precision={precision} />
      ))}
    </div>
  );
}
