'use client';

import * as React from 'react';
import type { ActiveVibe, VibeDuration, VibeKey } from '@/types';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Tabs';
import { cn } from '@/lib/cn';
import { VIBES, VIBE_DURATIONS } from '@/data/vibes';
import { haptic } from '@/lib/haptics';

/**
 * "what's your vibe tonight?"
 *
 * Vibes are deliberately temporary. The duration control is not a
 * setting buried in a menu — it is on the same screen as the choice,
 * because the expiry *is* the feature.
 */
export function VibePicker({
  open,
  onClose,
  current,
  onSet,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  current: ActiveVibe | null;
  onSet: (vibe: ActiveVibe) => void;
  onClear: () => void;
}) {
  const [key, setKey] = React.useState<VibeKey | null>(current?.key ?? null);
  const [duration, setDuration] = React.useState<VibeDuration>(current?.duration ?? '3h');

  React.useEffect(() => {
    if (open) {
      setKey(current?.key ?? null);
      setDuration(current?.duration ?? '3h');
    }
  }, [open, current]);

  const commit = () => {
    if (!key) return;
    const hours = VIBE_DURATIONS.find((d) => d.key === duration)?.hours ?? null;
    haptic('success');
    onSet({
      key,
      duration,
      startedAt: new Date().toISOString(),
      expiresAt: hours ? new Date(Date.now() + hours * 3_600_000).toISOString() : null,
    });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      tall
      title="what's your vibe tonight?"
      description="you can change it anytime. it fades on its own."
      footer={
        <div className="flex gap-2.5">
          {current && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                onClear();
                onClose();
              }}
            >
              turn off
            </Button>
          )}
          <Button fullWidth size="lg" disabled={!key} onClick={commit}>
            {current ? 'update vibe' : 'set vibe'}
          </Button>
        </div>
      }
    >
      <ul className="space-y-2">
        {VIBES.map((v) => {
          const selected = key === v.key;
          return (
            <li key={v.key}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  haptic('select');
                  setKey(selected ? null : v.key);
                }}
                className={cn(
                  'flex w-full items-center gap-3.5 rounded-lg border px-4 py-3.5 text-left',
                  'transition-all duration-200 ease-hey active:scale-[0.985]',
                  selected
                    ? 'border-ultraviolet/55 bg-ultraviolet-wash'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16]',
                )}
              >
                <span aria-hidden className="text-xl">
                  {v.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold lowercase">{v.label}</span>
                  <span className="block truncate text-sm text-bone-faint">{v.hint}</span>
                </span>
                <span
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors',
                    selected ? 'border-ultraviolet bg-ultraviolet' : 'border-white/20',
                  )}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className={cn(
          'mt-6 transition-opacity duration-300',
          key ? 'opacity-100' : 'pointer-events-none opacity-35',
        )}
      >
        <p className="eyebrow mb-2.5">how long</p>
        <Segmented
          items={VIBE_DURATIONS.map((d) => ({
            key: d.key,
            label: d.key === 'until_off' ? 'until off' : d.label,
          }))}
          value={duration}
          onChange={setDuration}
        />
      </div>
    </Sheet>
  );
}
