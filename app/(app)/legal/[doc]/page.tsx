'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/app/AppHeader';
import { MIN_AGE } from '@/lib/age';

const DOCS: Record<string, { title: string; sections: { h: string; p: string }[] }> = {
  terms: {
    title: 'terms',
    sections: [
      { h: 'who can use HEY', p: `HEY is for adults. you must be ${MIN_AGE} or older. we verify age at sign-up and again whenever an account is flagged. accounts we cannot confirm as ${MIN_AGE}+ are removed and cannot be appealed back with the same details.` },
      { h: 'your account', p: 'one account per person. it is yours — do not share it, sell it, or impersonate anyone with it. photos must be of you.' },
      { h: 'what is not allowed', p: 'harassment, hate speech, threats, solicitation, scams, non-consensual images, sexual content involving minors of any kind, and anything illegal where you are. we report the last one to the authorities.' },
      { h: 'moderation', p: 'we review reports, scan uploads automatically, and remove accounts that break these terms. we can suspend an account while a report is investigated.' },
      { h: 'subscriptions', p: 'HEY+ renews until cancelled. cancel any time from settings; access runs to the end of the paid period. store refunds follow the platform’s own rules.' },
      { h: 'liability', p: 'HEY helps people meet. we do not run background checks. meet in public, tell someone where you are, and trust your instincts.' },
    ],
  },
  privacy: {
    title: 'privacy policy',
    sections: [
      { h: 'the short version', p: 'we collect what the app needs to work and nothing extra. we do not sell your data. we do not store your exact location.' },
      { h: 'location', p: 'your device turns your position into a coarse area code (a geohash) before anything is sent. we store that code, not coordinates. the API returns a rounded distance and never a position. no screen in HEY puts a person on a map.' },
      { h: 'what we store', p: 'account details, profile content you provide, photos, messages, interaction history, coarse location, and device/security signals used for spam and fraud prevention.' },
      { h: 'photos and verification', p: 'profile photos are scanned automatically before going live. verification selfies are used only for the comparison and deleted afterwards. they are never shown to other users.' },
      { h: 'your rights', p: 'under LGPD and GDPR you can access, correct, export or delete your data. request it in settings → privacy; we answer within 30 days.' },
      { h: 'retention', p: 'delete your account and your profile, photos, matches and messages are removed within 30 days, except records we must keep for safety and legal reasons.' },
      { h: 'sharing', p: 'processors only — hosting, storage, payments, moderation and identity verification — under contract, for those purposes alone.' },
    ],
  },
  guidelines: {
    title: 'community guidelines',
    sections: [
      { h: 'be a person', p: 'real photos, real age, real intentions. state what you want; nobody has to guess.' },
      { h: 'no means no', p: 'the first time. do not send explicit photos to anyone who has not asked for them.' },
      { h: 'no discrimination', p: 'no racism, transphobia, serophobia, femmephobia, fat-shaming or ageism — including in your bio. "preferences" written as exclusions are not welcome here.' },
      { h: 'privacy is mutual', p: 'do not screenshot and share someone else’s profile or messages. do not out anyone, anywhere, for any reason.' },
      { h: 'meeting up', p: 'first meeting in public. tell a friend where you are going. keep your own transport. leave whenever you want, without explaining.' },
      { h: 'spotting a scam', p: 'anyone who moves you off HEY immediately, refuses a video call, or mentions money, crypto or gift cards is running one. report and block.' },
      { h: 'reporting', p: 'reports are confidential. the other person is never told. we read every one.' },
    ],
  },
};

export default function LegalPage() {
  const { doc } = useParams<{ doc: string }>();
  const content = DOCS[doc] ?? DOCS.terms;

  return (
    <main id="main">
      <PageHeader title={content.title} />
      <article className="mx-auto max-w-lg px-5 py-4">
        <p className="text-sm text-bone-faint">
          plain language on purpose. this is prototype copy, not legal advice.
        </p>
        <div className="mt-7 space-y-7">
          {content.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-xl display-tight lowercase">{s.h}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-bone-dim text-pretty">{s.p}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
