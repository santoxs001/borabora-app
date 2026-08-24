'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { IcebreakerAnswer, LookingFor, Photo, ProfileDetails } from '@/types';
import { useApp } from '@/store/app-store';
import { INTERESTS } from '@/data/interests';
import { ICEBREAKERS } from '@/data/icebreakers';

import { PageHeader } from '@/components/app/AppHeader';
import { PhotoManager } from '@/components/app/PhotoManager';
import { Input, Textarea } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

const SEEKING: { key: LookingFor; label: string }[] = [
  { key: 'dates', label: 'dates' },
  { key: 'friends', label: 'friends' },
  { key: 'chat', label: 'conversation' },
  { key: 'something_casual', label: 'something casual' },
  { key: 'relationship', label: 'a relationship' },
  { key: 'see_what_happens', label: 'see what happens' },
];

/**
 * Edit profile.
 *
 * Nothing below the photos is required — the whole screen is optional
 * detail. Changes are held in local draft state and committed on save,
 * so backing out never half-applies an edit.
 */
export default function EditProfilePage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const me = state.me!;

  const [photos, setPhotos] = React.useState<Photo[]>(me.photos);
  const [bio, setBio] = React.useState(me.bio);
  const [pronouns, setPronouns] = React.useState(me.pronouns);
  const [city, setCity] = React.useState(me.city);
  const [interests, setInterests] = React.useState<string[]>(me.interests);
  const [lookingFor, setLookingFor] = React.useState<LookingFor[]>(me.lookingFor);
  const [details, setDetails] = React.useState<ProfileDetails>(me.details);
  const [icebreakers, setIcebreakers] = React.useState<IcebreakerAnswer[]>(me.icebreakers);

  const save = () => {
    dispatch({
      type: 'updateMe',
      patch: { photos, bio, pronouns, city, interests, lookingFor, details, icebreakers },
    });
    toast('done.', { icon: 'check' });
    router.push('/profile');
  };

  const toggleInterest = (i: string) =>
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length >= 8 ? prev : [...prev, i],
    );

  const setAnswer = (promptId: string, prompt: string, answer: string) =>
    setIcebreakers((prev) => {
      const rest = prev.filter((a) => a.promptId !== promptId);
      return answer.trim() ? [...rest, { promptId, prompt, answer }] : rest;
    });

  return (
    <main id="main">
      <PageHeader
        title="edit profile"
        right={
          <Button size="sm" onClick={save}>
            save
          </Button>
        }
      />

      <div className="mx-auto max-w-lg space-y-9 px-4 py-5">
        <Section title="photos">
          <PhotoManager photos={photos} onChange={setPhotos} />
        </Section>

        <Section title="about you">
          <Textarea
            label="bio"
            rows={3}
            maxChars={180}
            value={bio}
            placeholder="designer, coffee addict, probably late."
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Input label="pronouns" value={pronouns} onChange={(e) => setPronouns(e.target.value)} />
            <Input label="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </Section>

        <Section title="here for">
          <div className="flex flex-wrap gap-2">
            {SEEKING.map((s) => (
              <Chip
                key={s.key}
                size="sm"
                selected={lookingFor.includes(s.key)}
                onClick={() =>
                  setLookingFor((prev) =>
                    prev.includes(s.key) ? prev.filter((x) => x !== s.key) : [...prev, s.key],
                  )
                }
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="interests" hint={`${interests.length}/8`}>
          {INTERESTS.map((group) => (
            <div key={group.group} className="mb-5">
              <p className="eyebrow mb-2">{group.group}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((i) => (
                  <Chip
                    key={i}
                    size="sm"
                    selected={interests.includes(i)}
                    disabled={!interests.includes(i) && interests.length >= 8}
                    onClick={() => toggleInterest(i)}
                  >
                    {i}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section title="icebreakers" hint="answers show on your profile">
          <ul className="space-y-3">
            {ICEBREAKERS.slice(0, 6).map((prompt) => {
              const current = icebreakers.find((a) => a.promptId === prompt.id)?.answer ?? '';
              return (
                <li
                  key={prompt.id}
                  className={cn(
                    'rounded-lg border p-4 transition-colors',
                    current ? 'border-ultraviolet/35 bg-ultraviolet-wash' : 'border-white/[0.07] bg-graphite/25',
                  )}
                >
                  <p className="text-2xs uppercase tracking-[0.12em] text-ultraviolet-bright">
                    {prompt.prompt}
                  </p>
                  <input
                    value={current}
                    maxLength={90}
                    placeholder={prompt.placeholder || 'your answer'}
                    aria-label={prompt.prompt}
                    onChange={(e) => setAnswer(prompt.id, prompt.prompt, e.target.value)}
                    className="mt-2 w-full bg-transparent text-[16px] text-bone placeholder:text-bone-faint outline-none"
                  />
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="details" hint="all optional">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="height (cm)"
              type="number"
              inputMode="numeric"
              min={120}
              max={230}
              value={details.heightCm ?? ''}
              onChange={(e) =>
                setDetails((d) => ({ ...d, heightCm: e.target.value ? Number(e.target.value) : undefined }))
              }
            />
            <Input
              label="work"
              value={details.work ?? ''}
              onChange={(e) => setDetails((d) => ({ ...d, work: e.target.value }))}
            />
            <Dropdown
              label="drinks"
              value={details.drinks ?? ''}
              options={[
                { value: 'yes', label: 'yes' },
                { value: 'sometimes', label: 'sometimes' },
                { value: 'no', label: 'no' },
              ]}
              onChange={(v) => setDetails((d) => ({ ...d, drinks: v as ProfileDetails['drinks'] }))}
            />
            <Dropdown
              label="smokes"
              value={details.smokes ?? ''}
              options={[
                { value: 'yes', label: 'yes' },
                { value: 'sometimes', label: 'sometimes' },
                { value: 'no', label: 'no' },
              ]}
              onChange={(v) => setDetails((d) => ({ ...d, smokes: v as ProfileDetails['smokes'] }))}
            />
            <Dropdown
              label="gym"
              value={details.gym ?? ''}
              options={[
                { value: 'daily', label: 'daily' },
                { value: 'often', label: 'often' },
                { value: 'sometimes', label: 'sometimes' },
                { value: 'never', label: 'never' },
              ]}
              onChange={(v) => setDetails((d) => ({ ...d, gym: v as ProfileDetails['gym'] }))}
            />
            <Dropdown
              label="relationship"
              value={details.relationship ?? ''}
              options={[
                { value: 'single', label: 'single' },
                { value: 'partnered', label: 'partnered' },
                { value: 'open', label: 'open' },
                { value: 'complicated', label: "it's complicated" },
                { value: 'not_saying', label: 'rather not say' },
              ]}
              onChange={(v) =>
                setDetails((d) => ({ ...d, relationship: v as ProfileDetails['relationship'] }))
              }
            />
          </div>
        </Section>

        <Button fullWidth size="lg" onClick={save}>
          save profile
        </Button>
      </div>
    </main>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xl display-tight lowercase">{title}</h2>
        {hint && <span className="text-2xs text-bone-faint lowercase">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
