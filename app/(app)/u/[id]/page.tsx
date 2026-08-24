'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { InteractionKind } from '@/types';
import { useApp } from '@/store/app-store';
import { activityLabel, distanceLabel, heightLabel } from '@/lib/format';
import { uid } from '@/lib/id';
import { cn } from '@/lib/cn';
import { VIBE_BY_KEY } from '@/data/vibes';
import { isNewHere } from '@/data/profiles';

import { ProfileGallery } from '@/components/app/ProfileGallery';
import { DiscoverActions } from '@/components/app/DiscoverActions';
import { SayHeySheet } from '@/components/app/SayHeySheet';
import { ProfileSafetyMenu } from '@/components/app/SafetySheet';
import { IconButton } from '@/components/ui/IconButton';
import { Badge, OnlineDot, VerifiedTick } from '@/components/ui/Badge';
import { VibeChip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch, profileById } = useApp();
  const { toast } = useToast();
  const [sayHeyOpen, setSayHeyOpen] = React.useState(false);
  const [safetyOpen, setSafetyOpen] = React.useState(false);

  const me = state.me!;
  const profile = profileById(id);
  const blocked = state.blocks.some((b) => b.profileId === id);

  if (!profile || blocked) {
    return (
      <main id="main" className="min-h-dvh">
        <EmptyState
          icon="profile"
          title="not here anymore."
          body="this profile was removed, blocked, or never existed."
        />
      </main>
    );
  }

  const act = (kind: InteractionKind, message?: string) => {
    dispatch({ type: 'interact', targetId: profile.id, kind, message });
    if (kind === 'pass') router.back();
    if (kind === 'save') toast('saved for later', { icon: 'star' });
    if (kind === 'like') toast('liked', { icon: 'heart', tone: 'uv' });
    if (kind === 'say_hey') toast('sent.', { icon: 'bolt', tone: 'uv' });
  };

  const distance = distanceLabel(profile, me.privacy.distancePrecision);
  const vibe = profile.activeVibe ? VIBE_BY_KEY[profile.activeVibe.key] : null;

  const facts = [
    profile.details.work && { icon: 'sparkle' as const, text: profile.details.work },
    profile.details.school && { icon: 'sparkle' as const, text: profile.details.school },
    heightLabel(profile.details.heightCm) && {
      icon: 'profile' as const,
      text: heightLabel(profile.details.heightCm)!,
    },
    profile.details.languages?.length && {
      icon: 'messages' as const,
      text: profile.details.languages.join(', '),
    },
    profile.details.starSign && { icon: 'star' as const, text: profile.details.starSign },
    profile.details.pets && { icon: 'heart' as const, text: profile.details.pets },
    profile.details.relationship && {
      icon: 'heart' as const,
      text: relationshipLabel(profile.details.relationship),
    },
  ].filter(Boolean) as { icon: 'sparkle' | 'profile' | 'messages' | 'star' | 'heart'; text: string }[];

  return (
    <main id="main" className="min-h-dvh bg-obsidian pb-[calc(132px+env(safe-area-inset-bottom))]">
      {/* Gallery */}
      <div className="relative">
        <ProfileGallery
          photos={profile.photos}
          alt={`${profile.name}, ${profile.age}`}
          className="aspect-[3/4] w-full"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 photo-scrim" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 pt-[max(12px,env(safe-area-inset-top))]">
          <IconButton icon="chevron-left" label="back" variant="glass" onClick={() => router.back()} />
          <IconButton icon="more" label="safety and options" variant="glass" onClick={() => setSafetyOpen(true)} />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5">
        {/* Identity */}
        <header className="-mt-14 relative">
          {vibe && <VibeChip vibe={vibe.key} size="sm" asStatic selected className="mb-3" />}
          <h1 className="flex items-center gap-2 font-display text-[34px] display-tight">
            {profile.name}
            <span className="font-normal text-bone-dim">{profile.age}</span>
            {profile.verified && <VerifiedTick size={19} />}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-bone-dim">
            <span className="flex items-center gap-1.5">
              <Icon name="pin" size={14} className="text-ultraviolet" />
              {distance ?? profile.city}
            </span>
            <span className="flex items-center gap-1.5">
              {profile.state === 'online' ? (
                <>
                  <OnlineDot /> online
                </>
              ) : (
                activityLabel(profile.lastActiveAt)
              )}
            </span>
            <span>{profile.pronouns}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {isNewHere(profile) && <Badge tone="uv">new here</Badge>}
            {profile.isPlus && <Badge tone="plus">hey+</Badge>}
          </div>
        </header>

        {profile.bio && (
          <p className="mt-6 text-[17px] leading-relaxed text-bone text-pretty">{profile.bio}</p>
        )}

        {/* Looking for */}
        {profile.lookingFor.length > 0 && (
          <Section title="here for">
            <div className="flex flex-wrap gap-2">
              {profile.lookingFor.map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3.5 py-2 text-sm lowercase text-bone-dim"
                >
                  {lookingForLabel(l)}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Icebreakers */}
        {profile.icebreakers.length > 0 && (
          <Section title="a few answers">
            <ul className="space-y-2.5">
              {profile.icebreakers.map((ib) => (
                <li
                  key={ib.promptId}
                  className="rounded-lg border border-white/[0.07] bg-graphite/25 p-4"
                >
                  <p className="text-2xs uppercase tracking-[0.12em] text-ultraviolet-bright">
                    {ib.prompt}
                  </p>
                  <p className="mt-2 text-[17px] leading-snug text-bone text-pretty">
                    {ib.answer}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Interests */}
        {profile.interests.length > 0 && (
          <Section title="into">
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((i) => {
                const shared = me.interests.includes(i);
                return (
                  <span
                    key={i}
                    className={cn(
                      'rounded-full border px-3.5 py-2 text-sm lowercase',
                      shared
                        ? 'border-ultraviolet/45 bg-ultraviolet-wash text-bone'
                        : 'border-white/[0.09] bg-white/[0.04] text-bone-dim',
                    )}
                  >
                    {i}
                    {shared && <span className="ml-1.5 text-ultraviolet">·</span>}
                  </span>
                );
              })}
            </div>
          </Section>
        )}

        {/* Details */}
        {facts.length > 0 && (
          <Section title="details">
            <ul className="grid grid-cols-2 gap-2.5">
              {facts.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-white/[0.07] bg-graphite/25 px-3.5 py-3 text-sm text-bone-dim"
                >
                  <Icon name={f.icon} size={15} className="shrink-0 text-bone-faint" />
                  <span className="truncate lowercase">{f.text}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <button
          type="button"
          onClick={() => setSafetyOpen(true)}
          className="mt-10 flex w-full items-center justify-center gap-2 py-4 text-sm text-bone-faint hover:text-bone"
        >
          <Icon name="flag" size={15} />
          block or report {profile.name}
        </button>
      </div>

      {/* Action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 surface-blur safe-bottom">
        <div className="mx-auto max-w-lg px-4 py-3">
          <DiscoverActions
            showRewind={false}
            canRewind={false}
            onRewind={() => {}}
            onPass={() => act('pass')}
            onSave={() => act('save')}
            onLike={() => act('like')}
            onSayHey={() => setSayHeyOpen(true)}
          />
        </div>
      </div>

      <SayHeySheet
        profile={profile}
        open={sayHeyOpen}
        onClose={() => setSayHeyOpen(false)}
        onSend={(message) => act('say_hey', message)}
      />

      <ProfileSafetyMenu
        profile={profile}
        open={safetyOpen}
        onClose={() => setSafetyOpen(false)}
        onHide={() => {
          dispatch({ type: 'interact', targetId: profile.id, kind: 'pass' });
          toast('hidden');
          router.back();
        }}
        onBlock={() => {
          dispatch({ type: 'block', profileId: profile.id, name: profile.name });
          toast(`${profile.name.toLowerCase()} blocked`, { icon: 'block', tone: 'danger' });
          router.push('/discover');
        }}
        onReport={(reason, detail, alsoBlock) => {
          dispatch({
            type: 'report',
            report: {
              id: uid('r'),
              targetId: profile.id,
              reason,
              detail,
              blockToo: alsoBlock,
              createdAt: new Date().toISOString(),
            },
          });
          if (alsoBlock) {
            dispatch({ type: 'block', profileId: profile.id, name: profile.name });
            router.push('/discover');
          }
          toast('report sent. we take it from here.', { icon: 'shield' });
        }}
      />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="eyebrow mb-3">{title}</h2>
      {children}
    </section>
  );
}

function lookingForLabel(l: string): string {
  return (
    {
      dates: 'dates',
      friends: 'friends',
      chat: 'conversation',
      something_casual: 'something casual',
      relationship: 'a relationship',
      see_what_happens: 'see what happens',
    }[l] ?? l
  );
}

function relationshipLabel(r: string): string {
  return (
    { single: 'single', partnered: 'partnered', open: 'open', complicated: "it's complicated", not_saying: 'not saying' }[
      r
    ] ?? r
  );
}
