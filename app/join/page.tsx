'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { GenderIdentity, LookingFor, Me, Photo } from '@/types';
import { useApp, DEFAULT_PRIVACY } from '@/store/app-store';
import { checkAge, MIN_AGE } from '@/lib/age';
import { uid } from '@/lib/id';
import { cn } from '@/lib/cn';
import { requestCoarseLocation } from '@/lib/geo';
import { haptic } from '@/lib/haptics';
import { INTERESTS } from '@/data/interests';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input, Textarea } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { StepProgress } from '@/components/ui/Progress';
import { Wordmark } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { PhotoManager } from '@/components/app/PhotoManager';
import { Loading } from '@/components/ui/Loading';

/* ────────────────────────────────────────────────────────────────
   Onboarding.

   Eleven screens, one question each. The rules that shaped it:
     · never more than one decision per screen
     · progress is always visible, and back always works
     · everything after the age gate is skippable
     · the age gate is not skippable, and it is checked again server-side
   ──────────────────────────────────────────────────────────────── */

const STEPS = [
  'account',
  'name',
  'birthdate',
  'identity',
  'seeking',
  'city',
  'photos',
  'bio',
  'interests',
  'goal',
  'done',
] as const;
type Step = (typeof STEPS)[number];

interface Draft {
  email: string;
  name: string;
  birthdate: string;
  genderIdentity: GenderIdentity | '';
  pronouns: string;
  lookingFor: LookingFor[];
  city: string;
  geohash: string | null;
  photos: Photo[];
  bio: string;
  interests: string[];
  goal: LookingFor | '';
}

const EMPTY_DRAFT: Draft = {
  email: '',
  name: '',
  birthdate: '',
  genderIdentity: '',
  pronouns: '',
  lookingFor: [],
  city: '',
  geohash: null,
  photos: [],
  bio: '',
  interests: [],
  goal: '',
};

export default function JoinPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Join />
    </Suspense>
  );
}

function Join() {
  const router = useRouter();
  const params = useSearchParams();
  const { dispatch } = useApp();
  const via = params.get('via');
  const signingIn = params.get('mode') === 'signin';

  const [index, setIndex] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = React.useState<string | null>(null);

  const step = STEPS[index];
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const back = () => {
    setError(null);
    if (index === 0) router.push('/welcome');
    else setIndex((i) => i - 1);
  };

  const next = () => {
    setError(null);
    haptic('tap');
    setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const finish = () => {
    const age = checkAge(draft.birthdate).age ?? MIN_AGE;
    const me: Me = {
      id: 'me',
      email: draft.email || 'you@hey.app',
      birthdate: draft.birthdate,
      name: draft.name.trim() || 'you',
      age,
      city: draft.city || 'São Paulo',
      country: 'BR',
      bio: draft.bio,
      pronouns: draft.pronouns || 'he/him',
      genderIdentity: (draft.genderIdentity || 'man') as GenderIdentity,
      lookingFor: draft.goal ? [draft.goal, ...draft.lookingFor] : draft.lookingFor,
      interests: draft.interests,
      photos: draft.photos.length
        ? draft.photos
        : [{ id: uid('ph'), url: null, seed: 'me-0', position: 0, isPrimary: true, moderation: 'approved' }],
      details: {},
      icebreakers: [],
      verified: false,
      isPlus: false,
      activeVibe: null,
      distanceM: null,
      state: 'new_here',
      lastActiveAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
      verification: 'unverified',
      privacy: DEFAULT_PRIVACY,
      plus: { active: false, plan: null, renewsAt: null },
      boost: null,
      likesUsedToday: 0,
    };
    dispatch({ type: 'signIn', me });
    haptic('success');
    router.replace('/discover');
  };

  /* Signing in short-circuits the whole flow. */
  React.useEffect(() => {
    if (!signingIn) return;
    setIndex(0);
  }, [signingIn]);

  const canAdvance = validate(step, draft);

  return (
    <main id="main" className="flex min-h-dvh flex-col bg-obsidian">
      <header className="sticky top-0 z-30 surface-blur">
        <div className="mx-auto flex h-[60px] max-w-lg items-center gap-2 px-2">
          <IconButton icon="chevron-left" label="back" onClick={back} />
          <div className="flex-1 px-2">
            <StepProgress step={index + 1} total={STEPS.length} />
          </div>
          {index > 0 && index < STEPS.length - 1 && isSkippable(step) && (
            <button
              type="button"
              onClick={next}
              className="px-3 text-sm text-bone-faint hover:text-bone lowercase"
            >
              skip
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-6 pb-6">
        <div key={step} className="animate-fade-up">
          {step === 'account' && (
            <AccountStep via={via} signingIn={signingIn} draft={draft} set={set} />
          )}
          {step === 'name' && <NameStep draft={draft} set={set} />}
          {step === 'birthdate' && <BirthdateStep draft={draft} set={set} error={error} />}
          {step === 'identity' && <IdentityStep draft={draft} set={set} />}
          {step === 'seeking' && <SeekingStep draft={draft} set={set} />}
          {step === 'city' && <CityStep draft={draft} set={set} />}
          {step === 'photos' && <PhotosStep draft={draft} set={set} />}
          {step === 'bio' && <BioStep draft={draft} set={set} />}
          {step === 'interests' && <InterestsStep draft={draft} set={set} />}
          {step === 'goal' && <GoalStep draft={draft} set={set} />}
          {step === 'done' && <DoneStep name={draft.name} />}
        </div>
      </div>

      <div className="sticky bottom-0 mx-auto w-full max-w-lg surface-blur px-6 pb-6 pt-3 safe-bottom">
        <Button
          fullWidth
          size="lg"
          disabled={!canAdvance}
          onClick={() => {
            if (step === 'birthdate') {
              const check = checkAge(draft.birthdate);
              if (!check.ok) {
                haptic('warn');
                return setError(check.reason ?? 'check that date.');
              }
            }
            if (step === 'done') return finish();
            next();
          }}
        >
          {step === 'done' ? 'start saying hey' : step === 'account' ? 'continue' : 'next'}
        </Button>
      </div>
    </main>
  );
}

/* ── validation ────────────────────────────────────────────────── */

function validate(step: Step, d: Draft): boolean {
  switch (step) {
    case 'account':
      return /.+@.+\..+/.test(d.email);
    case 'name':
      return d.name.trim().length >= 2;
    case 'birthdate':
      return /^\d{4}-\d{2}-\d{2}$/.test(d.birthdate);
    case 'identity':
      return !!d.genderIdentity;
    case 'seeking':
      return d.lookingFor.length > 0;
    case 'city':
      return d.city.trim().length > 1;
    default:
      return true;
  }
}

function isSkippable(step: Step): boolean {
  return ['photos', 'bio', 'interests', 'goal'].includes(step);
}

/* ── step title ────────────────────────────────────────────────── */

function StepTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="pb-7 pt-8">
      <h1 className="font-display text-[32px] display-tight text-balance">{title}</h1>
      {hint && <p className="mt-2.5 text-[15px] text-bone-dim text-pretty">{hint}</p>}
    </div>
  );
}

/* ── steps ─────────────────────────────────────────────────────── */

function AccountStep({
  via,
  signingIn,
  draft,
  set,
}: {
  via: string | null;
  signingIn: boolean;
  draft: Draft;
  set: (p: Partial<Draft>) => void;
}) {
  return (
    <>
      <Wordmark className="mt-6 text-5xl" />
      <StepTitle
        title={signingIn ? 'welcome back.' : "let's get you in."}
        hint={
          via === 'apple'
            ? 'continuing with Apple. we only ever see your relay address.'
            : via === 'google'
              ? 'continuing with Google.'
              : 'we use this to keep your account yours. it never shows on your profile.'
        }
      />
      <Input
        label="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus
        leadingIcon="messages"
        placeholder="you@somewhere.com"
        value={draft.email}
        onChange={(e) => set({ email: e.target.value })}
      />
      <p className="mt-5 flex items-start gap-2 text-sm text-bone-faint text-pretty">
        <Icon name="lock" size={15} className="mt-0.5 shrink-0 text-ultraviolet" />
        we send a one-time code. no password to forget, nothing to leak.
      </p>
    </>
  );
}

function NameStep({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  return (
    <>
      <StepTitle title="what should we call you?" hint="a first name is enough." />
      <Input
        label="name"
        autoFocus
        autoComplete="given-name"
        maxLength={24}
        placeholder="Marco"
        value={draft.name}
        onChange={(e) => set({ name: e.target.value })}
      />
    </>
  );
}

function BirthdateStep({
  draft,
  set,
  error,
}: {
  draft: Draft;
  set: (p: Partial<Draft>) => void;
  error: string | null;
}) {
  const check = draft.birthdate ? checkAge(draft.birthdate) : null;
  return (
    <>
      <StepTitle
        title="when's your birthday?"
        hint={`HEY is ${MIN_AGE}+. we show your age, never the date.`}
      />
      <Input
        label="date of birth"
        type="date"
        autoFocus
        max={new Date().toISOString().slice(0, 10)}
        value={draft.birthdate}
        error={error}
        onChange={(e) => set({ birthdate: e.target.value })}
      />
      {check?.ok && (
        <p className="mt-4 flex items-center gap-2 text-sm text-signal-online">
          <Icon name="check" size={15} /> {check.age} — you&apos;re in.
        </p>
      )}
      <p className="mt-6 text-sm text-bone-faint text-pretty">
        we verify age at sign-up and again if anything looks off. accounts we can&apos;t confirm as{' '}
        {MIN_AGE}+ get removed.
      </p>
    </>
  );
}

const GENDERS: { key: GenderIdentity; label: string }[] = [
  { key: 'man', label: 'man' },
  { key: 'trans_man', label: 'trans man' },
  { key: 'non_binary', label: 'non-binary' },
  { key: 'genderqueer', label: 'genderqueer' },
  { key: 'agender', label: 'agender' },
  { key: 'questioning', label: 'questioning' },
  { key: 'self_describe', label: 'let me write it' },
  { key: 'prefer_not_to_say', label: 'rather not say' },
];

const PRONOUNS = ['he/him', 'they/them', 'he/they', 'she/her'];

function IdentityStep({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  return (
    <>
      <StepTitle title="how do you describe yourself?" hint="you can change any of this later." />
      <p className="eyebrow mb-2.5">identity</p>
      <div className="flex flex-wrap gap-2">
        {GENDERS.map((g) => (
          <Chip
            key={g.key}
            selected={draft.genderIdentity === g.key}
            onClick={() => set({ genderIdentity: g.key })}
          >
            {g.label}
          </Chip>
        ))}
      </div>

      <p className="eyebrow mb-2.5 mt-7">pronouns</p>
      <div className="flex flex-wrap gap-2">
        {PRONOUNS.map((p) => (
          <Chip key={p} selected={draft.pronouns === p} onClick={() => set({ pronouns: p })}>
            {p}
          </Chip>
        ))}
      </div>
      <div className="mt-3">
        <Input
          placeholder="or type your own"
          maxLength={20}
          value={PRONOUNS.includes(draft.pronouns) ? '' : draft.pronouns}
          onChange={(e) => set({ pronouns: e.target.value })}
        />
      </div>
    </>
  );
}

const SEEKING: { key: LookingFor; label: string; emoji: string }[] = [
  { key: 'dates', label: 'dates', emoji: '❤️' },
  { key: 'friends', label: 'friends', emoji: '🫂' },
  { key: 'chat', label: 'conversation', emoji: '💬' },
  { key: 'something_casual', label: 'something casual', emoji: '⚡' },
  { key: 'relationship', label: 'a relationship', emoji: '💍' },
  { key: 'see_what_happens', label: 'see what happens', emoji: '🪩' },
];

function SeekingStep({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  const toggle = (k: LookingFor) =>
    set({
      lookingFor: draft.lookingFor.includes(k)
        ? draft.lookingFor.filter((x) => x !== k)
        : [...draft.lookingFor, k],
    });
  return (
    <>
      <StepTitle title="who are you here to meet?" hint="pick as many as you like." />
      <div className="flex flex-wrap gap-2">
        {SEEKING.map((s) => (
          <Chip
            key={s.key}
            selected={draft.lookingFor.includes(s.key)}
            onClick={() => toggle(s.key)}
            leading={<span aria-hidden>{s.emoji}</span>}
          >
            {s.label}
          </Chip>
        ))}
      </div>
    </>
  );
}

function CityStep({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  const [asking, setAsking] = React.useState(false);
  const [granted, setGranted] = React.useState(false);

  const ask = async () => {
    setAsking(true);
    const res = await requestCoarseLocation();
    setAsking(false);
    if (res) {
      setGranted(true);
      set({ geohash: res.geohash, city: draft.city || 'São Paulo' });
      haptic('success');
    }
  };

  return (
    <>
      <StepTitle
        title="where are you?"
        hint="we use this to show who's nearby — never to put you on a map."
      />
      <Input
        label="city"
        autoFocus
        placeholder="São Paulo"
        value={draft.city}
        onChange={(e) => set({ city: e.target.value })}
      />

      <button
        type="button"
        onClick={ask}
        disabled={asking || granted}
        className={cn(
          'mt-4 flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition-colors',
          granted
            ? 'border-signal-online/40 bg-signal-online/10'
            : 'border-white/[0.09] bg-white/[0.03] hover:border-ultraviolet/50',
        )}
      >
        <Icon
          name={granted ? 'check' : 'pin'}
          size={20}
          className={granted ? 'text-signal-online' : 'text-ultraviolet'}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px]">
            {granted ? 'location on' : asking ? 'asking…' : 'use my location'}
          </span>
          <span className="block text-sm text-bone-faint text-pretty">
            {granted
              ? 'stored as an approximate area, not a point.'
              : 'more accurate distances. you can turn it off anytime.'}
          </span>
        </span>
      </button>

      <p className="mt-6 flex items-start gap-2 text-sm text-bone-faint text-pretty">
        <Icon name="shield" size={15} className="mt-0.5 shrink-0 text-ultraviolet" />
        your exact coordinates never leave your device. we store a coarse area code and turn it
        into a distance — that&apos;s all anyone else ever sees.
      </p>
    </>
  );
}

function PhotosStep({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  return (
    <>
      <StepTitle title="add a few photos." hint="faces do better. so does daylight." />
      <PhotoManager photos={draft.photos} onChange={(photos) => set({ photos })} />
    </>
  );
}

function BioStep({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  return (
    <>
      <StepTitle title="say something." hint="one line is plenty. be specific, not impressive." />
      <Textarea
        rows={4}
        autoFocus
        maxChars={180}
        value={draft.bio}
        placeholder="designer, coffee addict, probably late."
        onChange={(e) => set({ bio: e.target.value })}
      />
    </>
  );
}

function InterestsStep({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  const toggle = (i: string) =>
    set({
      interests: draft.interests.includes(i)
        ? draft.interests.filter((x) => x !== i)
        : draft.interests.length >= 8
          ? draft.interests
          : [...draft.interests, i],
    });

  return (
    <>
      <StepTitle
        title="what are you into?"
        hint={`pick up to 8. ${draft.interests.length}/8 so far.`}
      />
      {INTERESTS.map((group) => (
        <div key={group.group} className="mb-6">
          <p className="eyebrow mb-2.5">{group.group}</p>
          <div className="flex flex-wrap gap-2">
            {group.items.map((i) => (
              <Chip
                key={i}
                size="sm"
                selected={draft.interests.includes(i)}
                onClick={() => toggle(i)}
                disabled={!draft.interests.includes(i) && draft.interests.length >= 8}
              >
                {i}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function GoalStep({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  return (
    <>
      <StepTitle
        title="what would make this worth it?"
        hint="shown on your profile. change it whenever."
      />
      <div className="space-y-2">
        {SEEKING.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={draft.goal === s.key}
            onClick={() => set({ goal: s.key })}
            className={cn(
              'flex w-full items-center gap-3.5 rounded-lg border px-4 py-4 text-left transition-all active:scale-[0.985]',
              draft.goal === s.key
                ? 'border-ultraviolet/55 bg-ultraviolet-wash'
                : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16]',
            )}
          >
            <span aria-hidden className="text-xl">{s.emoji}</span>
            <span className="flex-1 text-[15px] lowercase">{s.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function DoneStep({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <Wordmark className="text-7xl" animated />
      <h1 className="mt-6 font-display text-[32px] display-tight">
        alright, {name.trim() || 'you'}.
      </h1>
      <p className="mt-3 max-w-[28ch] text-[15px] text-bone-dim text-pretty">
        pick a vibe when you&apos;re ready. it tells people what you&apos;re actually up for
        tonight — and it disappears on its own.
      </p>
    </div>
  );
}
