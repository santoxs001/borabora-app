'use client';

import * as React from 'react';
import Link from 'next/link';
import { useApp } from '@/store/app-store';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';

import { PageHeader } from '@/components/app/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { CountBadge, VerifiedTick } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { VIBE_BY_KEY } from '@/data/vibes';

type Tab = 'all' | 'unread' | 'new';

/**
 * Messages.
 *
 * New matches sit in a rail at the top rather than in the list —
 * a match with no message yet is a prompt, not a conversation.
 */
export default function MessagesPage() {
  const { state, profileById } = useApp();
  const [tab, setTab] = React.useState<Tab>('all');

  const threads = React.useMemo(
    () =>
      state.conversations
        .filter((c) => c.lastMessage)
        .sort(
          (a, b) =>
            +new Date(b.lastMessage!.createdAt) - +new Date(a.lastMessage!.createdAt),
        ),
    [state.conversations],
  );

  const fresh = React.useMemo(
    () => state.conversations.filter((c) => !c.lastMessage),
    [state.conversations],
  );

  const visible = React.useMemo(() => {
    if (tab === 'unread') return threads.filter((c) => c.unreadCount > 0);
    if (tab === 'new') return [];
    return threads;
  }, [tab, threads]);

  const unreadCount = threads.filter((c) => c.unreadCount > 0).length;

  return (
    <main id="main">
      <PageHeader title="messages" back={false} />

      <div className="mx-auto max-w-lg">
        {/* New matches — nobody has spoken yet */}
        {fresh.length > 0 && (
          <section aria-labelledby="new-matches" className="px-4 pt-1">
            <h2 id="new-matches" className="eyebrow mb-2.5">
              said hey back
            </h2>
            <ul className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1">
              {fresh.map((c) => {
                const p = profileById(c.profileId);
                if (!p) return null;
                return (
                  <li key={c.id} className="shrink-0">
                    <Link
                      href={`/messages/${c.id}`}
                      className="flex w-[62px] flex-col items-center gap-1.5"
                    >
                      <Avatar
                        name={p.name}
                        seed={p.photos[0]?.seed ?? p.id}
                        src={p.photos[0]?.url}
                        size="md"
                        ring
                        online={p.state === 'online'}
                      />
                      <span className="w-full truncate text-center text-2xs text-bone-dim">
                        {p.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="px-4 pt-3">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: 'all', label: 'all', count: threads.length },
              { key: 'unread', label: 'unread', count: unreadCount },
              { key: 'new', label: 'saved' },
            ]}
          />
        </div>

        {tab === 'new' ? (
          <SavedList />
        ) : visible.length ? (
          <ul className="divide-y divide-white/[0.05]">
            {visible.map((c) => {
              const p = profileById(c.profileId);
              if (!p) return null;
              const vibe = p.activeVibe ? VIBE_BY_KEY[p.activeVibe.key] : null;
              const unread = c.unreadCount > 0;
              return (
                <li key={c.id}>
                  <Link
                    href={`/messages/${c.id}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 transition-colors active:bg-white/[0.04]"
                  >
                    <Avatar
                      name={p.name}
                      seed={p.photos[0]?.seed ?? p.id}
                      src={p.photos[0]?.url}
                      size="md"
                      online={p.state === 'online'}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'truncate text-[15px]',
                            unread ? 'font-semibold text-bone' : 'text-bone',
                          )}
                        >
                          {p.name}
                        </span>
                        {p.verified && <VerifiedTick size={13} />}
                        {vibe && (
                          <span aria-hidden className="text-xs">
                            {vibe.emoji}
                          </span>
                        )}
                      </p>
                      <p
                        className={cn(
                          'truncate text-sm',
                          unread ? 'text-bone-dim' : 'text-bone-faint',
                        )}
                      >
                        {c.typing
                          ? 'typing…'
                          : c.lastMessage?.senderId === 'me'
                            ? `you: ${c.lastMessage.body}`
                            : c.lastMessage?.body}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[11px] text-bone-faint">
                        {relativeTime(c.lastMessage!.createdAt)}
                      </span>
                      <CountBadge count={c.unreadCount} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon="messages"
            title={tab === 'unread' ? 'all caught up.' : 'nothing here yet.'}
            body={
              tab === 'unread'
                ? 'no unread messages. suspiciously organised of you.'
                : 'say hey first. it works more often than you think.'
            }
            action={
              tab === 'all' ? (
                <Link href="/discover">
                  <Button>find someone</Button>
                </Link>
              ) : undefined
            }
          />
        )}
      </div>
    </main>
  );
}

function SavedList() {
  const { state, profileById } = useApp();
  const saved = Object.entries(state.interactions)
    .filter(([, kind]) => kind === 'save')
    .map(([id]) => profileById(id))
    .filter(Boolean);

  if (!saved.length) {
    return (
      <EmptyState
        icon="star"
        title="nothing saved."
        body="tap the star on anyone you want to come back to."
      />
    );
  }

  return (
    <ul className="divide-y divide-white/[0.05]">
      {saved.map((p) => (
        <li key={p!.id}>
          <Link
            href={`/u/${p!.id}`}
            className="flex items-center gap-3.5 px-4 py-3.5 active:bg-white/[0.04]"
          >
            <Avatar name={p!.name} seed={p!.photos[0]?.seed ?? p!.id} src={p!.photos[0]?.url} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px]">
                {p!.name} <span className="text-bone-dim">{p!.age}</span>
              </p>
              <p className="truncate text-sm text-bone-faint">{p!.bio}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
