'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/Icon';
import { haptic } from '@/lib/haptics';

/**
 * The action bar under the discovery card.
 *
 * Ordering is intentional: pass and save sit outside, like sits in the
 * centre, and Say Hey — the thing the whole product is named for — is
 * the only ultraviolet control on screen.
 */
export function DiscoverActions({
  onPass,
  onSave,
  onLike,
  onSayHey,
  onRewind,
  canRewind,
  showRewind = true,
  disabled,
}: {
  onPass: () => void;
  onSave: () => void;
  onLike: () => void;
  onSayHey: () => void;
  onRewind: () => void;
  canRewind: boolean;
  showRewind?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      {showRewind && (
        <Action icon="rewind" label="undo last" onClick={onRewind} disabled={!canRewind || disabled} size="sm" />
      )}
      <Action icon="close" label="pass" onClick={onPass} disabled={disabled} />
      <Action icon="star" label="save for later" onClick={onSave} disabled={disabled} />
      <Action icon="heart" label="like" onClick={onLike} disabled={disabled} tone="like" />
      <Action icon="bolt" label="say hey" onClick={onSayHey} disabled={disabled} tone="primary" />
    </div>
  );
}

function Action({
  icon,
  label,
  onClick,
  disabled,
  tone = 'default',
  size = 'md',
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'like' | 'primary';
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => {
        haptic(tone === 'primary' ? 'success' : 'tap');
        onClick();
      }}
      className={cn(
        'grid place-items-center rounded-full border transition-all duration-200 ease-hey',
        'active:scale-90 disabled:opacity-30 disabled:pointer-events-none',
        size === 'sm' ? 'h-11 w-11' : 'h-[58px] w-[58px]',
        tone === 'primary' && 'uv-gradient border-transparent text-white shadow-glow',
        tone === 'like' &&
          'border-ultraviolet/45 bg-ultraviolet-wash text-ultraviolet-bright hover:border-ultraviolet',
        tone === 'default' && 'border-white/[0.1] bg-graphite/60 text-bone-dim hover:text-bone',
      )}
    >
      <Icon name={icon} size={size === 'sm' ? 18 : tone === 'primary' ? 26 : 24} />
    </button>
  );
}
