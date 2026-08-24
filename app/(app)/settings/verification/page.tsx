'use client';

import * as React from 'react';
import { useApp } from '@/store/app-store';
import { PageHeader } from '@/components/app/AppHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { VerifiedTick } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

/**
 * Profile verification.
 *
 * The flow, the states and the copy are real; the comparison itself is
 * stubbed. `runVerification` is the single seam an identity provider
 * (Persona, Onfido, Veriff) plugs into — everything around it, including
 * the failure path, already exists.
 */
async function runVerification(): Promise<'verified' | 'failed'> {
  // Replace with: POST /verification/session → provider SDK → webhook.
  await new Promise((r) => setTimeout(r, 2600));
  return 'verified';
}

const POSES = ['look straight ahead', 'turn your head left', 'smile'];

export default function VerificationPage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const me = state.me!;
  const [step, setStep] = React.useState<'intro' | 'capture' | 'checking'>('intro');
  const [pose, setPose] = React.useState(0);

  const start = () => {
    setStep('capture');
    setPose(0);
  };

  const nextPose = async () => {
    if (pose < POSES.length - 1) return setPose((p) => p + 1);
    setStep('checking');
    dispatch({ type: 'updateMe', patch: { verification: 'pending' } });
    const result = await runVerification();
    dispatch({
      type: 'updateMe',
      patch: { verification: result, verified: result === 'verified' },
    });
    toast(result === 'verified' ? 'verified.' : "that didn't work. try again.", {
      icon: result === 'verified' ? 'verified' : 'close',
      tone: result === 'verified' ? 'uv' : 'danger',
    });
    setStep('intro');
  };

  if (me.verification === 'verified') {
    return (
      <main id="main">
        <PageHeader title="verification" />
        <div className="mx-auto max-w-lg px-6 py-16 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-ultraviolet/40 bg-ultraviolet-wash">
            <VerifiedTick size={36} />
          </span>
          <h1 className="mt-6 font-display text-3xl display-tight lowercase">you&apos;re verified.</h1>
          <p className="mt-3 text-[15px] text-bone-dim text-pretty">
            the ultraviolet tick shows next to your name. people answer verified profiles more
            often — that&apos;s the whole point.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main id="main">
      <PageHeader title="verification" />

      <div className="mx-auto max-w-lg px-4 py-4">
        {step === 'intro' && (
          <>
            <div className="rounded-lg border border-white/[0.07] bg-graphite/25 p-6">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-ultraviolet/40 bg-ultraviolet-wash">
                <Icon name="verified" size={26} className="text-ultraviolet" />
              </span>
              <h1 className="mt-5 font-display text-[28px] display-tight text-balance">
                prove it&apos;s you. get the tick.
              </h1>
              <p className="mt-3 text-[15px] text-bone-dim text-pretty">
                take three quick selfies. we compare them to your photos, confirm it&apos;s the same
                person, and delete the selfies afterwards. they never appear on your profile.
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                { icon: 'lock' as const, text: 'selfies are never shown to anyone, ever.' },
                { icon: 'trash' as const, text: 'deleted once the check finishes.' },
                { icon: 'shield' as const, text: 'verified profiles get fewer fakes in their inbox.' },
              ].map((f) => (
                <li key={f.text} className="flex items-start gap-3 text-sm text-bone-dim">
                  <Icon name={f.icon} size={16} className="mt-0.5 shrink-0 text-ultraviolet" />
                  <span className="text-pretty">{f.text}</span>
                </li>
              ))}
            </ul>

            <Button className="mt-7" fullWidth size="lg" onClick={start}>
              start verification
            </Button>
          </>
        )}

        {step === 'capture' && (
          <div className="py-4 text-center">
            <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-full border-2 border-dashed border-ultraviolet/50 bg-graphite/40">
              <span className="absolute inset-0 grid place-items-center text-bone-faint">
                <Icon name="camera" size={40} />
              </span>
            </div>
            <p className="mt-7 font-display text-2xl display-tight lowercase">{POSES[pose]}</p>
            <div className="mt-3 flex justify-center gap-1.5">
              {POSES.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 w-8 rounded-full transition-colors',
                    i <= pose ? 'bg-ultraviolet' : 'bg-white/15',
                  )}
                />
              ))}
            </div>
            <Button className="mt-7" fullWidth size="lg" onClick={nextPose}>
              {pose < POSES.length - 1 ? 'capture' : 'finish'}
            </Button>
            <Button className="mt-2" fullWidth variant="ghost" onClick={() => setStep('intro')}>
              cancel
            </Button>
          </div>
        )}

        {step === 'checking' && (
          <div className="py-20 text-center">
            <Loading label="checking" />
            <p className="mt-2 font-display text-2xl display-tight lowercase">checking…</p>
            <p className="mt-2 text-sm text-bone-faint">this takes a few seconds.</p>
          </div>
        )}
      </div>
    </main>
  );
}
