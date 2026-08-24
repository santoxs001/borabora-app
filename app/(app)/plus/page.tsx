'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/store/app-store';
import { cn } from '@/lib/cn';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

type Plan = 'monthly' | 'quarterly' | 'yearly';

const PLANS: { key: Plan; label: string; price: string; per: string; note?: string }[] = [
  { key: 'monthly', label: '1 month', price: 'R$ 39,90', per: 'per month' },
  { key: 'quarterly', label: '3 months', price: 'R$ 29,90', per: 'per month', note: 'save 25%' },
  { key: 'yearly', label: '12 months', price: 'R$ 19,90', per: 'per month', note: 'best value' },
];

const BENEFITS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'heart', title: 'unlimited likes', body: 'no daily ceiling, no countdown.' },
  { icon: 'profile', title: 'see who likes you', body: 'the real list, not a blurred grid.' },
  { icon: 'eye-off', title: 'invisible mode', body: 'browse without showing up.' },
  { icon: 'sliders', title: 'every filter', body: 'new here, verified only, exact distance bands.' },
  { icon: 'rewind', title: 'rewind', body: 'undo a pass you regret.' },
  { icon: 'sparkle', title: 'two spotlights a month', body: 'be first in the grid for 30 minutes.' },
  { icon: 'bolt', title: 'more vibes at once', body: 'run two intentions in parallel.' },
];

/**
 * HEY+.
 *
 * Deliberately not a wall. Everything free stays free; this page sells
 * reach and control, and it closes without asking twice.
 */
export default function PlusPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [plan, setPlan] = React.useState<Plan>('quarterly');
  const me = state.me!;

  const subscribe = () => {
    dispatch({
      type: 'updateMe',
      patch: {
        isPlus: true,
        plus: {
          active: true,
          plan,
          renewsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        },
      },
    });
    toast('you’re in. welcome to hey+', { icon: 'sparkle', tone: 'uv' });
    router.push('/profile');
  };

  return (
    <main id="main" className="relative min-h-dvh overflow-hidden bg-obsidian">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 45% at 70% 0%, rgba(122,60,255,0.4) 0%, transparent 62%)',
        }}
      />

      <div className="relative mx-auto max-w-lg px-5 pb-40">
        <div className="flex h-[60px] items-center justify-end">
          <IconButton icon="close" label="close" variant="glass" onClick={() => router.back()} />
        </div>

        <header className="pb-8 pt-4">
          <p className="font-display text-6xl display-tight lowercase">
            hey<span className="text-ultraviolet">+</span>
          </p>
          <h1 className="mt-4 max-w-[16ch] font-display text-[30px] display-tight text-balance">
            more reach. more control. same app.
          </h1>
          <p className="mt-3 max-w-[34ch] text-[15px] text-bone-dim text-pretty">
            we don&apos;t hide the good part behind a paywall. hey+ gives you room to move and the
            switches to disappear when you want.
          </p>
        </header>

        {me.plus.active ? (
          <div className="rounded-lg border border-ultraviolet/40 bg-ultraviolet-wash p-5">
            <p className="font-display text-2xl display-tight lowercase">you already have hey+</p>
            <p className="mt-1.5 text-sm text-bone-dim">
              {me.plus.plan} plan · renews{' '}
              {me.plus.renewsAt ? new Date(me.plus.renewsAt).toLocaleDateString() : '—'}
            </p>
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              onClick={() => {
                dispatch({
                  type: 'updateMe',
                  patch: { isPlus: false, plus: { active: false, plan: null, renewsAt: null } },
                });
                toast('hey+ cancelled. no hard feelings.');
              }}
            >
              cancel
            </Button>
          </div>
        ) : null}

        <ul className="mt-2 space-y-1">
          {BENEFITS.map((b) => (
            <li key={b.title} className="flex items-start gap-3.5 py-3.5">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ultraviolet/30 bg-ultraviolet-wash text-ultraviolet">
                <Icon name={b.icon} size={17} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold lowercase">{b.title}</span>
                <span className="block text-sm text-bone-faint text-pretty">{b.body}</span>
              </span>
            </li>
          ))}
        </ul>

        {!me.plus.active && (
          <>
            <div className="mt-8 space-y-2.5">
              {PLANS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={plan === p.key}
                  onClick={() => setPlan(p.key)}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-lg border px-5 py-4 text-left transition-all active:scale-[0.99]',
                    plan === p.key
                      ? 'border-ultraviolet bg-ultraviolet-wash'
                      : 'border-white/[0.09] bg-white/[0.03]',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                      plan === p.key ? 'border-ultraviolet bg-ultraviolet' : 'border-white/25',
                    )}
                  >
                    {plan === p.key && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold lowercase">{p.label}</span>
                    {p.note && (
                      <span className="block text-2xs uppercase tracking-[0.1em] text-ultraviolet-bright">
                        {p.note}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-display text-lg display-tight">{p.price}</span>
                    <span className="block text-2xs text-bone-faint lowercase">{p.per}</span>
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-5 text-center text-2xs leading-relaxed text-bone-faint text-pretty">
              cancel anytime, from settings, in two taps. no retention flow, no “are you sure”
              carousel.
            </p>
          </>
        )}
      </div>

      {!me.plus.active && (
        <div className="fixed inset-x-0 bottom-0 z-40 surface-blur safe-bottom">
          <div className="mx-auto max-w-lg px-5 py-4">
            <Button fullWidth size="lg" onClick={subscribe}>
              start hey+
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
