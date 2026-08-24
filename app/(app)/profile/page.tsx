'use client';

import * as React from 'react';
import Link from 'next/link';
import { useApp } from '@/store/app-store';
import { countdown } from '@/lib/format';
import { VIBE_BY_KEY } from '@/data/vibes';
import { cn } from '@/lib/cn';

import { PageHeader } from '@/components/app/AppHeader';
import { PhotoSurface } from '@/components/ui/Photo';
import { VibePicker } from '@/components/app/VibePicker';
import { Badge, VerifiedTick } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Row, RowGroup } from '@/components/ui/Row';
import { HeyDot } from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';

export default function MyProfilePage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [vibeOpen, setVibeOpen] = React.useState(false);
  const me = state.me!;

  const vibe = me.activeVibe ? VIBE_BY_KEY[me.activeVibe.key] : null;
  const primary = me.photos.find((p) => p.isPrimary) ?? me.photos[0];
  const boostActive = me.boost && new Date(me.boost.expiresAt) > new Date();

  const likesCount = state.likedMe.length;
  const savedCount = Object.values(state.interactions).filter((k) => k === 'save').length;

  return (
    <main id="main">
      <PageHeader
        title="you"
        back={false}
        right={
          <Link
            href="/settings"
            aria-label="settings"
            className="grid h-11 w-11 place-items-center rounded-full text-bone-dim hover:text-bone"
          >
            <Icon name="settings" size={21} />
          </Link>
        }
      />

      <div className="mx-auto max-w-lg">
        {/* Card */}
        <section className="px-4">
          <div className="relative overflow-hidden rounded-card">
            <PhotoSurface
              seed={primary?.seed ?? 'me-0'}
              src={primary?.url}
              initial={me.name.charAt(0)}
              className="aspect-[4/3] w-full"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 photo-scrim" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h1 className="flex items-center gap-2 font-display text-3xl display-tight">
                {me.name}
                <span className="font-normal text-bone-dim">{me.age}</span>
                {me.verified && <VerifiedTick size={17} />}
              </h1>
              <p className="mt-1 text-sm text-bone-dim">
                {me.city} · {me.pronouns}
              </p>
            </div>
            <div className="absolute right-4 top-4 flex gap-1.5">
              {me.plus.active && <Badge tone="plus">hey+</Badge>}
              {me.privacy.browsePrivately && <Badge tone="neutral">invisible</Badge>}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Link href="/profile/edit">
              <Button fullWidth variant="secondary" leading={<Icon name="edit" size={17} />}>
                edit profile
              </Button>
            </Link>
            <Button
              fullWidth
              variant={vibe ? 'outline' : 'primary'}
              onClick={() => setVibeOpen(true)}
              leading={<span aria-hidden>{vibe?.emoji ?? '⚡'}</span>}
            >
              {vibe ? vibe.label.toLowerCase() : 'set a vibe'}
            </Button>
          </div>

          {vibe && (
            <p className="mt-2.5 text-center text-sm text-bone-faint lowercase">
              {countdown(me.activeVibe!.expiresAt) ?? 'on until you turn it off'}
            </p>
          )}
        </section>

        {/* Stats */}
        <section className="mt-6 grid grid-cols-3 gap-2.5 px-4">
          <Stat label="likes you" value={likesCount} href="/likes" />
          <Stat label="matches" value={state.matches.length} href="/messages" />
          <Stat label="saved" value={savedCount} href="/messages" />
        </section>

        {/* Spotlight */}
        <section className="mt-7 px-4">
          <div
            className={cn(
              'relative overflow-hidden rounded-lg border p-5',
              boostActive
                ? 'border-ultraviolet/50 bg-ultraviolet-wash'
                : 'border-white/[0.08] bg-graphite/25',
            )}
          >
            <div className="flex items-center gap-3.5">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center">
                {boostActive && (
                  <span className="absolute h-11 w-11 rounded-full bg-ultraviolet/30 animate-ring-out" />
                )}
                <HeyDot size={boostActive ? 16 : 12} pulse={!!boostActive} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl display-tight lowercase">
                  {boostActive ? 'you’re lit up.' : 'be seen.'}
                </p>
                <p className="text-sm text-bone-faint text-pretty">
                  {boostActive
                    ? `spotlight ends ${countdown(me.boost!.expiresAt)}`
                    : 'be first in the grid for 30 minutes.'}
                </p>
              </div>
            </div>
            {!boostActive && (
              <Button
                className="mt-4"
                fullWidth
                variant="secondary"
                onClick={() => {
                  dispatch({ type: 'startBoost' });
                  toast('spotlight on. be seen.', { icon: 'sparkle', tone: 'uv' });
                }}
              >
                spotlight me
              </Button>
            )}
          </div>
        </section>

        {/* Quick links */}
        <div className="mt-7 px-4">
          {!me.plus.active && (
            <Link href="/plus" className="mb-6 block">
              <div className="uv-gradient relative overflow-hidden rounded-lg p-5">
                <div className="grain absolute inset-0" />
                <p className="relative font-display text-2xl display-tight lowercase text-white">
                  hey<span className="opacity-70">+</span>
                </p>
                <p className="relative mt-1 max-w-[30ch] text-sm text-white/85 text-pretty">
                  see who likes you, browse invisibly, and filter for exactly what you want.
                </p>
                <span className="relative mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                  have a look <Icon name="chevron-right" size={15} />
                </span>
              </div>
            </Link>
          )}

          <RowGroup title="account">
            <Row
              icon="verified"
              label="get verified"
              href="/settings/verification"
              value={me.verification === 'verified' ? 'done' : 'not yet'}
            />
            <Row icon="shield" label="hey safe" href="/settings/safe" />
            <Row icon="lock" label="privacy" href="/settings/privacy" />
            <Row icon="settings" label="settings" href="/settings" />
          </RowGroup>
        </div>
      </div>

      <VibePicker
        open={vibeOpen}
        onClose={() => setVibeOpen(false)}
        current={me.activeVibe}
        onSet={(v) => dispatch({ type: 'setVibe', vibe: v })}
        onClear={() => dispatch({ type: 'setVibe', vibe: null })}
      />
    </main>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-white/[0.07] bg-graphite/25 px-3 py-4 text-center transition-colors hover:border-white/[0.16]"
    >
      <span className="block font-display text-2xl display-tight tabular-nums">
        {value}
      </span>
      <span className="mt-0.5 block text-2xs uppercase tracking-[0.1em] text-bone-faint">
        {label}
      </span>
    </Link>
  );
}
