'use client';

import * as React from 'react';
import type { Photo } from '@/types';
import { cn } from '@/lib/cn';
import { PhotoSurface } from '@/components/ui/Photo';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { uid } from '@/lib/id';
import { haptic } from '@/lib/haptics';

const MAX_PHOTOS = 9;

/**
 * Photo grid with add / reorder / set-primary / remove.
 *
 * Reordering uses explicit move buttons rather than drag-only: drag is
 * unreachable for keyboard and switch users, and on a phone it fights
 * with page scroll. Drag can be layered on top later without changing
 * this contract.
 */
export function PhotoManager({
  photos,
  onChange,
  className,
}: {
  photos: Photo[];
  onChange: (next: Photo[]) => void;
  className?: string;
}) {
  const [selected, setSelected] = React.useState<string | null>(null);

  const normalise = (list: Photo[]): Photo[] =>
    list.map((p, i) => ({ ...p, position: i, isPrimary: i === 0 }));

  const add = () => {
    if (photos.length >= MAX_PHOTOS) return;
    haptic('select');
    // In production this opens the picker and uploads; the prototype
    // mints a placeholder so the whole flow stays exercisable.
    const photo: Photo = {
      id: uid('ph'),
      url: null,
      seed: uid('seed'),
      position: photos.length,
      isPrimary: photos.length === 0,
      moderation: 'pending',
    };
    onChange(normalise([...photos, photo]));
  };

  const remove = (id: string) => {
    haptic('warn');
    setSelected(null);
    onChange(normalise(photos.filter((p) => p.id !== id)));
  };

  const move = (id: string, delta: number) => {
    const i = photos.findIndex((p) => p.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= photos.length) return;
    haptic('select');
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(normalise(next));
  };

  const makePrimary = (id: string) => {
    const i = photos.findIndex((p) => p.id === id);
    if (i <= 0) return;
    haptic('success');
    const next = [...photos];
    const [item] = next.splice(i, 1);
    onChange(normalise([item, ...next]));
  };

  return (
    <div className={className}>
      <ul className="grid grid-cols-3 gap-2.5">
        {photos.map((photo, i) => {
          const isOpen = selected === photo.id;
          return (
            <li key={photo.id} className="relative">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={`photo ${i + 1}${photo.isPrimary ? ', main photo' : ''}`}
                onClick={() => setSelected(isOpen ? null : photo.id)}
                className={cn(
                  'relative block w-full overflow-hidden rounded-md aspect-[3/4]',
                  'border transition-all duration-200 active:scale-[0.97]',
                  photo.isPrimary ? 'border-ultraviolet/60' : 'border-white/[0.08]',
                )}
              >
                <PhotoSurface
                  seed={photo.seed}
                  src={photo.url}
                  className="absolute inset-0 h-full w-full"
                />
                {photo.isPrimary && (
                  <span className="absolute left-1.5 top-1.5">
                    <Badge tone="uv">main</Badge>
                  </span>
                )}
                {photo.moderation === 'pending' && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-obsidian/70 px-2 py-0.5 text-[10px] text-signal-warn backdrop-blur-sm">
                    in review
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="absolute inset-x-0 -bottom-1 z-10 translate-y-full pt-1.5">
                  <div className="flex items-center justify-around rounded-full border border-white/[0.1] bg-obsidian-50 px-1 py-1 shadow-card">
                    <MiniAction icon="chevron-left" label="move earlier" onClick={() => move(photo.id, -1)} disabled={i === 0} />
                    <MiniAction icon="star" label="make main photo" onClick={() => makePrimary(photo.id)} disabled={photo.isPrimary} />
                    <MiniAction icon="chevron-right" label="move later" onClick={() => move(photo.id, 1)} disabled={i === photos.length - 1} />
                    <MiniAction icon="trash" label="remove photo" onClick={() => remove(photo.id)} danger />
                  </div>
                </div>
              )}
            </li>
          );
        })}

        {photos.length < MAX_PHOTOS && (
          <li>
            <button
              type="button"
              onClick={add}
              className={cn(
                'grid w-full place-items-center gap-1.5 rounded-md aspect-[3/4]',
                'border border-dashed border-white/[0.16] bg-white/[0.02] text-bone-faint',
                'transition-colors hover:border-ultraviolet/50 hover:text-ultraviolet active:scale-[0.97]',
              )}
            >
              <Icon name="camera" size={22} />
              <span className="text-2xs lowercase">add</span>
            </button>
          </li>
        )}
      </ul>

      <p className="mt-3 text-sm text-bone-faint text-pretty">
        first photo is your main one. tap any photo to reorder or remove it. everything gets an
        automated check before it goes live.
      </p>
    </div>
  );
}

function MiniAction({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-full transition-colors',
        'disabled:opacity-25',
        danger ? 'text-signal-danger' : 'text-bone-dim hover:text-bone',
      )}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
