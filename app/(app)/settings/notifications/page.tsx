'use client';

import * as React from 'react';
import { PageHeader } from '@/components/app/AppHeader';
import { RowGroup } from '@/components/ui/Row';
import { Toggle } from '@/components/ui/Toggle';
import { readStore, writeStore } from '@/lib/storage';

interface Prefs {
  likes: boolean;
  sayHey: boolean;
  matches: boolean;
  messages: boolean;
  vibeExpiring: boolean;
  nearby: boolean;
  product: boolean;
  quietHours: boolean;
}

const DEFAULTS: Prefs = {
  likes: true,
  sayHey: true,
  matches: true,
  messages: true,
  vibeExpiring: true,
  nearby: false,
  product: false,
  quietHours: true,
};

/** Notification copy lives next to the switch, so the tone is testable. */
const SAMPLES: Record<keyof Prefs, string> = {
  likes: 'hey, someone likes you.',
  sayHey: 'Marco said hey.',
  matches: 'well, hey. Rafael said hey back.',
  messages: 'Rafael replied.',
  vibeExpiring: 'your vibe expires soon.',
  nearby: '3 guys nearby share your vibe.',
  product: 'new in hey: two vibes at once.',
  quietHours: 'nothing between 23:00 and 08:00.',
};

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);

  React.useEffect(() => setPrefs(readStore<Prefs>('notif-prefs', DEFAULTS)), []);

  const set = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    writeStore('notif-prefs', next);
  };

  const row = (key: keyof Prefs, label: string) => (
    <Toggle
      key={key}
      label={label}
      description={SAMPLES[key]}
      checked={prefs[key]}
      onChange={(v) => set({ [key]: v } as Partial<Prefs>)}
    />
  );

  return (
    <main id="main">
      <PageHeader title="notifications" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <RowGroup title="people">
          <div className="px-4">
            {row('likes', 'likes')}
            {row('sayHey', 'say hey')}
            {row('matches', 'matches')}
            {row('messages', 'messages')}
          </div>
        </RowGroup>

        <RowGroup title="vibes and nearby">
          <div className="px-4">
            {row('vibeExpiring', 'vibe expiring')}
            {row('nearby', 'people nearby')}
          </div>
        </RowGroup>

        <RowGroup title="from us" footnote="we keep these rare. we mean it.">
          <div className="px-4">
            {row('product', 'product news')}
            {row('quietHours', 'quiet hours')}
          </div>
        </RowGroup>
      </div>
    </main>
  );
}
