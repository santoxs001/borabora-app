'use client';

import * as React from 'react';
import type { VibeKey } from '@/types';
import { useApp } from '@/store/app-store';
import { VIBES, VIBE_BY_KEY } from '@/data/vibes';
import { countdown } from '@/lib/format';
import { cn } from '@/lib/cn';

import { PageHeader } from '@/components/app/AppHeader';
import { ProfileGrid } from '@/components/app/ProfileTile';
import { VibePicker } from '@/components/app/VibePicker';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';

/**
 * Vibes — the screen that makes intention the filter.
 *
 * Everything here answers one question: who else is up for the same
 * thing, right now. Counts are live, so an empty vibe reads as empty
 * rather than pretending.
 */
export default function VibesPage() {
  const { state, dispatch, visibleProfiles } = useApp();
  const me = state.me!;
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [focus, setFocus] = React.useState<VibeKey | null>(me.activeVibe?.key ?? null);

  const counts = React.useMemo(() => {
    const map = new Map<VibeKey, number>();
    for (const p of visibleProfiles) {
      if (!p.activeVibe) continue;
      map.set(p.activeVibe.key, (map.get(p.activeVibe.key) ?? 0) + 1);
    }
    return map;
  }, [visibleProfiles]);

  const matches = React.useMemo(
    () =>
      focus
        ? visibleProfiles
            .filter((p) => p.activeVibe?.key === focus)
            .sort((a, b) => (a.distanceM ?? 1e9) - (b.distanceM ?? 1e9))
        : [],
    [visibleProfiles, focus],
  );

  const myVibe = me.activeVibe ? VIBE_BY_KEY[me.activeVibe.key] : null;

  return (
    <main id="main">
      <PageHeader title="vibes" back={false} subtitle="what people are up for tonight" />

      <div className="mx-auto max-w-lg px-4">
        {/* Your vibe */}
        <section
          className={cn(
            'mt-1 rounded-lg border p-5',
            myVibe ? 'border-ultraviolet/40 bg-ultraviolet-wash' : 'border-white/[0.08] bg-white/[0.03]',
          )}
        >
          <p className="eyebrow">your vibe</p>
          {myVibe ? (
            <>
              <p className="mt-2 flex items-center gap-2.5 font-display text-3xl display-tight lowercase">
                <span aria-hidden>{myVibe.emoji}</span>
                {myVibe.label}
              </p>
              <p className="mt-1.5 text-sm text-bone-dim">
                {countdown(me.activeVibe!.expiresAt) ?? 'on until you turn it off'}
              </p>
              <div className="mt-4 flex gap-2.5">
                <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>
                  change
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dispatch({ type: 'setVibe', vibe: null })}
                >
                  turn off
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 font-display text-3xl display-tight text-balance">
                what&apos;s your vibe tonight?
              </p>
              <p className="mt-2 text-sm text-bone-dim text-pretty">
                pick one and you&apos;ll show up for everyone looking for the same thing.
              </p>
              <Button className="mt-4" size="sm" onClick={() => setPickerOpen(true)}>
                pick your vibe
              </Button>
            </>
          )}
        </section>

        {/* All vibes */}
        <section aria-labelledby="all-vibes" className="mt-7">
          <h2 id="all-vibes" className="eyebrow mb-3">
            who&apos;s up for what
          </h2>
          <ul className="grid grid-cols-2 gap-2.5">
            {VIBES.map((v) => {
              const n = counts.get(v.key) ?? 0;
              const selected = focus === v.key;
              return (
                <li key={v.key}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFocus(selected ? null : v.key)}
                    className={cn(
                      'flex w-full flex-col items-start gap-1 rounded-lg border p-4 text-left',
                      'transition-all duration-200 active:scale-[0.98]',
                      selected
                        ? 'border-ultraviolet/55 bg-ultraviolet-wash'
                        : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.18]',
                    )}
                  >
                    <span aria-hidden className="text-xl">{v.emoji}</span>
                    <span className="text-[15px] font-semibold lowercase">{v.label}</span>
                    <span className="text-sm text-bone-faint tabular-nums">
                      {n === 0 ? 'nobody yet' : `${n} nearby`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Focused results */}
        <section aria-live="polite" className="mt-8 pb-6">
          {focus ? (
            matches.length ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-xl display-tight lowercase">
                    {VIBE_BY_KEY[focus].emoji} {VIBE_BY_KEY[focus].label}
                  </h2>
                  {me.activeVibe?.key === focus && <Badge tone="uv">same as you</Badge>}
                </div>
                <ProfileGrid profiles={matches} precision={me.privacy.distancePrecision} />
              </>
            ) : (
              <EmptyState
                icon="bolt"
                title="nobody on this one yet."
                body="set it yourself and you'll be the first. people looking for the same thing will see you."
                action={<Button onClick={() => setPickerOpen(true)}>set this vibe</Button>}
              />
            )
          ) : (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-bone-faint">
              <Icon name="chevron-down" size={15} />
              tap a vibe to see who&apos;s on it
            </p>
          )}
        </section>
      </div>

      <VibePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        current={me.activeVibe}
        onSet={(vibe) => {
          dispatch({ type: 'setVibe', vibe });
          setFocus(vibe.key);
        }}
        onClear={() => dispatch({ type: 'setVibe', vibe: null })}
      />
    </main>
  );
}
