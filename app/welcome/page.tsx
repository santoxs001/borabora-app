'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wordmark } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { MIN_AGE } from '@/lib/age';

/**
 * First screen. One question, then three doors.
 * Nothing is asked here that isn't needed to get started.
 */
export default function Welcome() {
  const router = useRouter();

  return (
    <main id="main" className="relative flex min-h-dvh flex-col overflow-hidden bg-obsidian px-6">
      {/* ultraviolet horizon */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(90% 55% at 78% 8%, rgba(122,60,255,0.36) 0%, transparent 62%), radial-gradient(70% 45% at 12% 96%, rgba(90,34,214,0.22) 0%, transparent 60%)',
        }}
      />

      <div className="relative flex flex-1 flex-col justify-center py-16">
        <Wordmark className="text-[86px] leading-none animate-fade-up" animated />
        <h1
          className="mt-6 max-w-[13ch] font-display text-[34px] display-tight text-balance animate-fade-up"
          style={{ animationDelay: '90ms' }}
        >
          who are you saying hey to?
        </h1>
        <p
          className="mt-4 max-w-[30ch] text-[15px] text-bone-dim text-pretty animate-fade-up"
          style={{ animationDelay: '160ms' }}
        >
          dates, drinks, friends, or nothing in particular. pick a vibe and see who is around.
        </p>
      </div>

      <div className="relative space-y-2.5 pb-6 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <Button fullWidth size="lg" onClick={() => router.push('/join')}>
          create account
        </Button>

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/join?via=apple')}
            leading={<AppleGlyph />}
          >
            Apple
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/join?via=google')}
            leading={<GoogleGlyph />}
          >
            Google
          </Button>
        </div>

        <Button
          variant="ghost"
          fullWidth
          size="lg"
          onClick={() => router.push('/join?via=email')}
          leading={<Icon name="messages" size={18} />}
        >
          phone or email
        </Button>

        <p className="pt-3 text-center text-sm text-bone-faint">
          already here?{' '}
          <Link href="/join?mode=signin" className="text-ultraviolet-bright underline underline-offset-4">
            sign in
          </Link>
        </p>

        <p className="pt-2 text-center text-2xs leading-relaxed text-bone-faint text-pretty">
          {MIN_AGE}+ only. by continuing you agree to our{' '}
          <Link href="/legal/terms" className="underline underline-offset-2">terms</Link> and{' '}
          <Link href="/legal/privacy" className="underline underline-offset-2">privacy policy</Link>.
        </p>
      </div>
    </main>
  );
}

function AppleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.7 12.7c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9s-1.9-.9-3.1-.8c-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.2 1.8 2.4 3 2.4s1.6-.8 3.1-.8 1.9.8 3.1.7c1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.6-3.8zM14.3 5.6c.7-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z" />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" />
    </svg>
  );
}
