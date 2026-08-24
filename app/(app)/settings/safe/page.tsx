'use client';

import * as React from 'react';
import { useApp } from '@/store/app-store';
import { PageHeader } from '@/components/app/AppHeader';
import { Row, RowGroup } from '@/components/ui/Row';
import { Toggle } from '@/components/ui/Toggle';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

/**
 * HEY Safe — one place for everything protective.
 *
 * Grouped by what a person is actually trying to do (stop someone,
 * control what reaches them, disappear), not by which subsystem
 * implements it.
 */
export default function SafePage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const me = state.me!;
  const p = me.privacy;

  const [paused, setPaused] = React.useState(false);

  return (
    <main id="main">
      <PageHeader title="hey safe" subtitle="your controls, in one place" />

      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="mb-7 rounded-lg border border-ultraviolet/30 bg-ultraviolet-wash p-5">
          <Icon name="shield" size={24} className="text-ultraviolet" />
          <p className="mt-3 font-display text-2xl display-tight text-balance">
            you decide who reaches you.
          </p>
          <p className="mt-2 text-sm text-bone-dim text-pretty">
            blocking is instant and silent — nobody is told. reports go to a human, and we act on
            them.
          </p>
        </div>

        <RowGroup title="people">
          <Row
            icon="block"
            label="blocked users"
            href="/settings/blocked"
            value={`${state.blocks.length}`}
            description="they can't see you, message you or find you"
          />
          <Row
            icon="flag"
            label="reports you've made"
            value={`${state.reports.length}`}
            description="we never tell the other person"
          />
        </RowGroup>

        <RowGroup title="what reaches you">
          <div className="px-4">
            <Toggle
              label="blur incoming photos"
              description="images arrive covered. you choose when to look."
              checked={p.blurIncomingPhotos}
              onChange={(blurIncomingPhotos) => dispatch({ type: 'setPrivacy', patch: { blurIncomingPhotos } })}
            />
            <Toggle
              label="only matches can message me"
              checked={p.messagesFrom === 'matches_only'}
              onChange={(v) =>
                dispatch({ type: 'setPrivacy', patch: { messagesFrom: v ? 'matches_only' : 'everyone' } })
              }
            />
          </div>
        </RowGroup>

        <RowGroup title="disappear">
          <div className="px-4">
            <Toggle
              label="browse privately"
              description="look around without appearing in anyone's grid."
              checked={p.browsePrivately}
              onChange={(browsePrivately) => dispatch({ type: 'setPrivacy', patch: { browsePrivately } })}
            />
            <Toggle
              label="pause my profile"
              description="hides you completely. your matches and messages stay."
              checked={paused}
              onChange={(v) => {
                setPaused(v);
                toast(v ? 'profile paused. you’re invisible.' : 'you’re back.', { icon: 'eye-off' });
              }}
            />
          </div>
        </RowGroup>

        <RowGroup
          title="how we protect the platform"
          footnote="if you're in immediate danger, contact local emergency services first."
        >
          <Row icon="verified" label="photo and profile verification" description="selfie check against your photos" trailing={<Badge tone="neutral">on</Badge>} />
          <Row icon="shield" label="automated content moderation" description="every photo is scanned before it goes live" trailing={<Badge tone="neutral">on</Badge>} />
          <Row icon="block" label="spam and bot detection" description="rate limits, device signals, duplicate-photo checks" trailing={<Badge tone="neutral">on</Badge>} />
          <Row icon="lock" label="18+ age assurance" description="checked at sign-up and re-checked when flagged" trailing={<Badge tone="neutral">on</Badge>} />
        </RowGroup>

        <RowGroup title="get help">
          <Row icon="messages" label="contact safety team" description="answered within 24 hours" />
          <Row icon="flag" label="safety guide" href="/legal/guidelines" description="meeting up, sharing photos, spotting scams" />
        </RowGroup>
      </div>
    </main>
  );
}
