'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useApp, resetEverything } from '@/store/app-store';
import { PageHeader } from '@/components/app/AppHeader';
import { Row, RowGroup } from '@/components/ui/Row';
import { Modal } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Wordmark } from '@/components/ui/Logo';

export default function SettingsPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const me = state.me!;
  const [confirmOut, setConfirmOut] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <main id="main">
      <PageHeader title="settings" />

      <div className="mx-auto max-w-lg px-4 py-4">
        <RowGroup title="account">
          <Row icon="profile" label="edit profile" href="/profile/edit" />
          <Row
            icon="verified"
            label="verification"
            href="/settings/verification"
            trailing={
              me.verification === 'verified' ? (
                <Badge tone="online">verified</Badge>
              ) : (
                <Badge tone="neutral">not yet</Badge>
              )
            }
          />
          <Row icon="messages" label="email" value={me.email} />
        </RowGroup>

        <RowGroup title="privacy and safety">
          <Row icon="lock" label="privacy" href="/settings/privacy" description="distance, visibility, who can message you" />
          <Row icon="shield" label="hey safe" href="/settings/safe" description="blocking, reporting, content controls" />
          <Row icon="block" label="blocked" href="/settings/blocked" value={`${state.blocks.length}`} />
        </RowGroup>

        <RowGroup title="app">
          <Row icon="bell" label="notifications" href="/settings/notifications" />
          <Row
            icon="sparkle"
            label="hey+"
            href="/plus"
            trailing={me.plus.active ? <Badge tone="plus">active</Badge> : undefined}
          />
          <Row icon="pin" label="hey places" href="/places" />
        </RowGroup>

        <RowGroup title="legal" footnote="HEY is an 18+ platform.">
          <Row icon="shield" label="terms" href="/legal/terms" />
          <Row icon="lock" label="privacy policy" href="/legal/privacy" />
          <Row icon="flag" label="community guidelines" href="/legal/guidelines" />
        </RowGroup>

        <RowGroup>
          <Row icon="logout" label="sign out" onClick={() => setConfirmOut(true)} />
          <Row icon="trash" label="delete account" danger onClick={() => setConfirmDelete(true)} />
        </RowGroup>

        <div className="flex flex-col items-center gap-1 py-8 opacity-40">
          <Wordmark className="text-2xl" />
          <p className="text-2xs lowercase tracking-[0.1em]">version 0.1 · prototype</p>
        </div>
      </div>

      <Modal
        open={confirmOut}
        onClose={() => setConfirmOut(false)}
        title="sign out?"
        description="you can come straight back in."
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setConfirmOut(false)}>
              stay
            </Button>
            <Button
              fullWidth
              onClick={() => {
                dispatch({ type: 'signOut' });
                resetEverything();
                router.replace('/welcome');
              }}
            >
              sign out
            </Button>
          </>
        }
      />

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="delete your account?"
        description="your profile, photos, matches and messages are deleted within 30 days. this cannot be undone."
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>
              cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                dispatch({ type: 'signOut' });
                resetEverything();
                router.replace('/welcome');
              }}
            >
              delete
            </Button>
          </>
        }
      />
    </main>
  );
}
