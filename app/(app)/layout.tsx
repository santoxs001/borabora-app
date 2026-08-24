'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/store/app-store';
import { BottomNavigation } from '@/components/app/BottomNavigation';
import { MatchOverlay } from '@/components/app/MatchOverlay';
import { FullScreenLoading } from '@/components/ui/Loading';

/** Routes that own the full screen (chat, paywall) hide the tab bar. */
const IMMERSIVE = [/^\/messages\/[^/]+$/, /^\/plus$/, /^\/u\/[^/]+$/];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useApp();

  React.useEffect(() => {
    if (state.hydrated && !state.me) router.replace('/welcome');
  }, [state.hydrated, state.me, router]);

  if (!state.hydrated) return <FullScreenLoading />;
  if (!state.me) return <FullScreenLoading />;

  const immersive = IMMERSIVE.some((r) => r.test(pathname));

  return (
    <div className="min-h-dvh bg-obsidian">
      <div className={immersive ? '' : 'pb-[calc(68px+env(safe-area-inset-bottom))]'}>
        {children}
      </div>
      {!immersive && <BottomNavigation />}
      <MatchOverlay />
    </div>
  );
}
