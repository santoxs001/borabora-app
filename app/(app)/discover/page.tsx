'use client';

import * as React from 'react';
import type { InteractionKind, Profile } from '@/types';
import { useApp } from '@/store/app-store';
import { passesFilters, rankProfiles } from '@/lib/discovery';
import { countdown } from '@/lib/format';
import { VIBE_BY_KEY } from '@/data/vibes';

import { HomeHeader } from '@/components/app/AppHeader';
import { StoryRail } from '@/components/app/StoryRail';
import { ProfileCard } from '@/components/app/ProfileCard';
import { DiscoverActions } from '@/components/app/DiscoverActions';
import { SayHeySheet } from '@/components/app/SayHeySheet';
import { VibePicker } from '@/components/app/VibePicker';
import { FilterSheet } from '@/components/app/FilterSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { useRouter } from 'next/navigation';

/**
 * Discover — the home screen.
 *
 * Structure: presence rail ("close to you"), your vibe, then one card
 * at a time. One card, not a stack of swipes: the product bet is that
 * a considered hey beats a hundred swipes.
 */
export default function DiscoverPage() {
  const router = useRouter();
  const { state, dispatch, visibleProfiles } = useApp();
  const { toast } = useToast();

  const [vibeOpen, setVibeOpen] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [sayHeyTarget, setSayHeyTarget] = React.useState<Profile | null>(null);
  const [lastAction, setLastAction] = React.useState<{ id: string; kind: InteractionKind } | null>(null);

  const me = state.me!;
  const precision = me.privacy.distancePrecision;

  const queue = React.useMemo(() => {
    const seen = new Set(Object.keys(state.interactions));
    const pool = visibleProfiles.filter((p) => !seen.has(p.id) && passesFilters(p, state.filters));
    return rankProfiles(pool, {
      myVibe: me.activeVibe?.key ?? null,
      myInterests: me.interests,
    });
  }, [visibleProfiles, state.interactions, state.filters, me.activeVibe, me.interests]);

  const nearby = React.useMemo(
    () =>
      [...visibleProfiles]
        .filter((p) => p.state === 'online' || p.activeVibe)
        .sort((a, b) => (a.distanceM ?? 1e9) - (b.distanceM ?? 1e9))
        .slice(0, 12),
    [visibleProfiles],
  );

  const current = queue[0];

  const act = (kind: InteractionKind, message?: string) => {
    if (!current) return;
    dispatch({ type: 'interact', targetId: current.id, kind, message });
    setLastAction({ id: current.id, kind });
    if (kind === 'save') toast('saved for later', { icon: 'star' });
    if (kind === 'like') toast('liked', { icon: 'heart', tone: 'uv' });
    if (kind === 'say_hey') toast('sent.', { icon: 'bolt', tone: 'uv' });
  };

  const rewind = () => {
    if (!lastAction) return;
    if (!me.plus.active) {
      toast('rewind is a hey+ thing', { icon: 'sparkle', tone: 'uv' });
      router.push('/plus');
      return;
    }
    dispatch({ type: 'undoInteraction', targetId: lastAction.id });
    setLastAction(null);
    toast('back it is', { icon: 'rewind' });
  };

  const myVibe = me.activeVibe ? VIBE_BY_KEY[me.activeVibe.key] : null;

  return (
    <main id="main">
      <HomeHeader
        right={
          <button
            type="button"
            aria-label="filters"
            onClick={() => setFiltersOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full text-bone-dim transition-colors hover:text-bone"
          >
            <Icon name="sliders" size={21} />
          </button>
        }
      />

      <div className="mx-auto flex h-[calc(100dvh-60px-68px-env(safe-area-inset-bottom))] max-w-lg flex-col overflow-hidden">
        <StoryRail
          profiles={nearby}
          precision={precision}
          onSetVibe={() => setVibeOpen(true)}
          myVibeEmoji={myVibe?.emoji ?? null}
        />

        <VibeBanner
          label={myVibe ? `${myVibe.emoji} ${myVibe.label.toLowerCase()}` : null}
          expiry={me.activeVibe ? countdown(me.activeVibe.expiresAt) : null}
          onClick={() => setVibeOpen(true)}
        />

        <section aria-label="discover" className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          {current ? (
            <>
              <ProfileCard
                profile={current}
                precision={precision}
                priority
                className="min-h-0 flex-1"
              />
              <div className="mt-4 shrink-0">
                <DiscoverActions
                  canRewind={!!lastAction}
                  onRewind={rewind}
                  onPass={() => act('pass')}
                  onSave={() => act('save')}
                  onLike={() => act('like')}
                  onSayHey={() => setSayHeyTarget(current)}
                />
              </div>
              <p className="mt-3 shrink-0 text-center text-2xs text-bone-faint">
                {queue.length - 1 > 0
                  ? `${queue.length - 1} more with your filters`
                  : 'last one for now'}
              </p>
            </>
          ) : (
            <EmptyState
              icon="sparkle"
              title="nothing here yet."
              body="you've seen everyone that matches. widen your filters, or set a vibe and see who turns up."
              action={
                <div className="flex flex-col gap-2.5">
                  <Button onClick={() => setFiltersOpen(true)}>open filters</Button>
                  <Button variant="ghost" onClick={() => setVibeOpen(true)}>
                    change my vibe
                  </Button>
                </div>
              }
            />
          )}
        </section>
      </div>

      <SayHeySheet
        profile={sayHeyTarget}
        open={!!sayHeyTarget}
        onClose={() => setSayHeyTarget(null)}
        onSend={(message) => act('say_hey', message)}
      />

      <VibePicker
        open={vibeOpen}
        onClose={() => setVibeOpen(false)}
        current={me.activeVibe}
        onSet={(vibe) => dispatch({ type: 'setVibe', vibe })}
        onClear={() => dispatch({ type: 'setVibe', vibe: null })}
      />

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={state.filters}
        onApply={(filters) => dispatch({ type: 'setFilters', filters })}
        isPlus={me.plus.active}
        onWantPlus={() => router.push('/plus')}
      />
    </main>
  );
}

function VibeBanner({
  label,
  expiry,
  onClick,
}: {
  label: string | null;
  expiry: string | null;
  onClick: () => void;
}) {
  return (
    <div className="shrink-0 px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-3 rounded-full border px-4 py-2.5 text-left transition-colors',
          label
            ? 'border-ultraviolet/40 bg-ultraviolet-wash'
            : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16]',
        )}
      >
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="truncate text-sm lowercase">
            {label ?? "what's your vibe tonight?"}
          </span>
          <span className="shrink-0 text-2xs text-bone-faint lowercase">
            {label ? (expiry ?? 'until you turn it off') : ''}
          </span>
        </span>
        <Icon name="chevron-right" size={18} className="text-bone-faint" />
      </button>
    </div>
  );
}
