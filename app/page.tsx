'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/store/app-store';
import { Wordmark } from '@/components/ui/Logo';

/**
 * Boot gate. Renders the wordmark while the persisted session hydrates,
 * then sends the user to onboarding or into the app.
 */
export default function Boot() {
  const router = useRouter();
  const { state } = useApp();

  React.useEffect(() => {
    if (!state.hydrated) return;
    router.replace(state.me ? '/discover' : '/welcome');
  }, [state.hydrated, state.me, router]);

  return (
    <main className="grid min-h-dvh place-items-center bg-obsidian">
      <Wordmark className="text-6xl animate-fade-up" animated />
    </main>
  );
}
