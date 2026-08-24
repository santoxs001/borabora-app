'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types';
import { Button } from '@/components/ui/Button';
import { PhotoSurface } from '@/components/ui/Photo';
import { ConnectionMark } from '@/components/ui/Logo';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/store/app-store';

/**
 * The match moment.
 *
 * Not "IT'S A MATCH!" — the copy is the brand's own: `well, hey.`
 * The two photos slide in from opposite edges and meet at the
 * connection mark; the ultraviolet dot lands last.
 */
export function MatchOverlay() {
  const router = useRouter();
  const { state, dispatch, profileById } = useApp();
  const match = state.pendingMatch;
  const profile = match ? profileById(match.profileId) : undefined;

  React.useEffect(() => {
    if (match) haptic('success');
  }, [match]);

  if (!match || !profile || !state.me) return null;

  const close = () => dispatch({ type: 'dismissMatch' });
  const conversation = state.conversations.find((c) => c.profileId === profile.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`you matched with ${profile.name}`}
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-obsidian/96 backdrop-blur-xl px-6 animate-fade-in"
    >
      {/* ultraviolet bloom behind everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60% 40% at 50% 42%, rgba(122,60,255,0.35) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex items-center justify-center">
        <MatchPhoto profile={me(state.me)} side="left" />
        <span className="relative z-10 -mx-4 grid h-16 w-16 place-items-center rounded-full border border-ultraviolet/40 bg-obsidian text-ultraviolet shadow-glow animate-scale-in">
          <ConnectionMark size={30} className="text-ultraviolet" />
        </span>
        <MatchPhoto profile={profile} side="right" />
      </div>

      <div className="relative mt-12 text-center animate-fade-up" style={{ animationDelay: '160ms' }}>
        <p className="font-display text-[54px] display-tight lowercase">
          well, hey<span className="text-ultraviolet">.</span>
        </p>
        <p className="mt-3 text-[15px] text-bone-dim">{profile.name} said hey back.</p>
      </div>

      <div
        className="relative mt-10 w-full max-w-xs space-y-2.5 animate-fade-up"
        style={{ animationDelay: '280ms' }}
      >
        <Button
          fullWidth
          size="lg"
          onClick={() => {
            close();
            if (conversation) router.push(`/messages/${conversation.id}`);
          }}
        >
          say something
        </Button>
        <Button fullWidth size="lg" variant="ghost" onClick={close}>
          keep looking
        </Button>
      </div>
    </div>
  );
}

/** Narrow the Me type down to the Profile shape the photo needs. */
function me(m: Profile): Profile {
  return m;
}

function MatchPhoto({ profile, side }: { profile: Profile; side: 'left' | 'right' }) {
  const photo = profile.photos.find((p) => p.isPrimary) ?? profile.photos[0];
  return (
    <div
      style={{ animation: `match-slide-${side} 620ms cubic-bezier(0.22,1,0.36,1) both` }}
      className="relative"
    >
      <PhotoSurface
        seed={photo?.seed ?? profile.id}
        src={photo?.url}
        alt=""
        initial={profile.name.charAt(0)}
        className="h-40 w-32 rounded-lg border border-white/10 shadow-card"
      />
    </div>
  );
}
