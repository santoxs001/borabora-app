'use client';

import * as React from 'react';
import type { Filters } from '@/types';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { RangeSlider, Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { VibeChip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { VIBES } from '@/data/vibes';
import { DEFAULT_FILTERS } from '@/lib/discovery';
import { MIN_AGE } from '@/lib/age';

/** Advanced filters are marked, not locked — the paywall never blocks a tap. */
export function FilterSheet({
  open,
  onClose,
  filters,
  onApply,
  isPlus,
  onWantPlus,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (f: Filters) => void;
  isPlus: boolean;
  onWantPlus: () => void;
}) {
  const [draft, setDraft] = React.useState(filters);

  React.useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));

  const toggleVibe = (key: Filters['vibes'][number]) =>
    set({
      vibes: draft.vibes.includes(key)
        ? draft.vibes.filter((v) => v !== key)
        : [...draft.vibes, key],
    });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      tall
      title="filters"
      description="narrow it down. or don't."
      footer={
        <div className="flex gap-2.5">
          <Button variant="secondary" size="lg" onClick={() => setDraft(DEFAULT_FILTERS)}>
            reset
          </Button>
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            show me
          </Button>
        </div>
      }
    >
      <RangeSlider
        label="age"
        min={MIN_AGE}
        max={70}
        low={draft.ageMin}
        high={draft.ageMax}
        onChange={(ageMin, ageMax) => set({ ageMin, ageMax })}
      />

      <div className="mt-2 border-t border-white/[0.06] pt-2">
        <Slider
          label="distance"
          min={1}
          max={100}
          value={draft.maxDistanceKm}
          onChange={(v) => set({ maxDistanceKm: v })}
          format={(v) => (v >= 100 ? 'anywhere' : `${v} km`)}
        />
      </div>

      <div className="mt-5 border-t border-white/[0.06] pt-5">
        <p className="eyebrow mb-2.5">vibe</p>
        <div className="flex flex-wrap gap-2">
          {VIBES.map((v) => (
            <VibeChip
              key={v.key}
              vibe={v.key}
              size="sm"
              selected={draft.vibes.includes(v.key)}
              onClick={() => toggleVibe(v.key)}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 divide-y divide-white/[0.05] border-t border-white/[0.06] pt-1">
        <Toggle
          label="online now"
          checked={draft.onlineOnly}
          onChange={(onlineOnly) => set({ onlineOnly })}
        />
        <Toggle
          label="verified only"
          description="profiles that passed the selfie check."
          checked={draft.verifiedOnly}
          onChange={(verifiedOnly) => set({ verifiedOnly })}
        />
        <div className="relative">
          <Toggle
            label="new here"
            description="joined in the last two weeks."
            checked={draft.newHereOnly}
            disabled={!isPlus}
            onChange={(newHereOnly) => set({ newHereOnly })}
          />
          {!isPlus && (
            <button
              type="button"
              onClick={onWantPlus}
              className="absolute right-16 top-4"
              aria-label="unlock with HEY+"
            >
              <Badge tone="plus">hey+</Badge>
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
