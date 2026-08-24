'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { DistancePrecision, Profile } from '@/types';
import { PhotoSurface } from '@/components/ui/Photo';
import { VerifiedTick, Badge, OnlineDot } from '@/components/ui/Badge';
import { VibeChip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { distanceLabel } from '@/lib/format';
import { isNewHere } from '@/data/profiles';

/**
 * The hero discovery card. Photo-led, type over a scrim, and every
 * signal that helps someone decide *whether to say hey* — vibe first,
 * then presence, then distance.
 */
export function ProfileCard({
  profile,
  precision,
  onOpen,
  priority,
  className,
}: {
  profile: Profile;
  precision: DistancePrecision;
  onOpen?: () => void;
  priority?: boolean;
  className?: string;
}) {
  const primary = profile.photos.find((p) => p.isPrimary) ?? profile.photos[0];
  const distance = distanceLabel(profile, precision);
  const isNew = isNewHere(profile);

  return (
    <article
      className={cn(
        'relative w-full overflow-hidden rounded-card shadow-card select-none',
        // Height is driven by the parent on Discover; the aspect ratio is
        // the fallback anywhere the card is placed in normal flow.
        'aspect-[3/4]',
        className,
      )}
    >
      <PhotoSurface
        seed={primary?.seed ?? profile.id}
        src={primary?.url}
        alt={`${profile.name}, ${profile.age}`}
        priority={priority}
        initial={profile.name.charAt(0)}
        className="absolute inset-0 h-full w-full"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 photo-scrim" />

      {/* Top-left status cluster */}
      <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {profile.state === 'online' && (
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-obsidian/60 px-2.5 py-1 backdrop-blur-md">
              <OnlineDot />
              <span className="text-2xs font-semibold uppercase tracking-[0.1em] text-signal-online">
                online
              </span>
            </span>
          )}
          {isNew && <Badge tone="uv">new here</Badge>}
        </div>
        {profile.photos.length > 1 && (
          <span className="flex items-center gap-1 rounded-full bg-obsidian/55 px-2 py-1 text-2xs text-bone-dim backdrop-blur-md">
            <Icon name="image" size={12} />
            {profile.photos.length}
          </span>
        )}
      </div>

      {/* Bottom identity block */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        {profile.activeVibe && (
          <VibeChip vibe={profile.activeVibe.key} size="sm" asStatic selected className="mb-3" />
        )}

        <h3 className="flex items-center gap-2 font-display text-[30px] display-tight">
          <Link
            href={`/u/${profile.id}`}
            onClick={onOpen}
            className="after:absolute after:inset-0"
          >
            {profile.name}
            <span className="ml-1.5 font-normal text-bone-dim">{profile.age}</span>
          </Link>
          {profile.verified && <VerifiedTick size={17} />}
        </h3>

        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-bone-dim">
          {distance && (
            <>
              <Icon name="pin" size={14} className="text-ultraviolet" />
              <span>{distance}</span>
            </>
          )}
          {!distance && <span>{profile.city}</span>}
        </p>

        {profile.bio && (
          <p className="mt-2.5 line-clamp-2 text-[15px] text-bone/90 text-pretty">{profile.bio}</p>
        )}

        {profile.interests.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 3).map((i) => (
              <li
                key={i}
                className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-2xs lowercase text-bone-dim backdrop-blur-sm"
              >
                {i}
              </li>
            ))}
            {profile.interests.length > 3 && (
              <li className="px-1 py-1 text-2xs text-bone-faint">
                +{profile.interests.length - 3}
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
