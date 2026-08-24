'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Message } from '@/types';
import { useApp } from '@/store/app-store';
import { uid } from '@/lib/id';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { distanceLabel, activityLabel } from '@/lib/format';
import { VIBE_BY_KEY } from '@/data/vibes';

import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Icon } from '@/components/ui/Icon';
import { VerifiedTick } from '@/components/ui/Badge';
import { ChatBubble, TypingBubble } from '@/components/app/ChatBubble';
import { ProfileSafetyMenu } from '@/components/app/SafetySheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Chip } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/Toast';
import { SAY_HEY_OPENERS } from '@/data/icebreakers';

/** Canned replies keep the prototype's threads alive without a backend. */
const REPLIES = [
  'ha. ok that was good.',
  'I was literally thinking the same thing',
  'what are you up to later?',
  'tell me more.',
  'you free thursday?',
  'ok you have my attention',
];

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch, profileById } = useApp();
  const { toast } = useToast();

  const [draft, setDraft] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<Message | null>(null);
  const [safetyOpen, setSafetyOpen] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  const conversation = state.conversations.find((c) => c.id === params.id);
  const profile = conversation ? profileById(conversation.profileId) : undefined;
  const messages = conversation ? (state.messages[conversation.id] ?? []) : [];
  const me = state.me!;

  // Mark read on open and whenever new messages land while we're here.
  React.useEffect(() => {
    if (conversation?.unreadCount) dispatch({ type: 'markRead', conversationId: conversation.id });
  }, [conversation?.id, conversation?.unreadCount, dispatch]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, conversation?.typing]);

  if (!conversation || !profile) {
    return (
      <main id="main" className="min-h-dvh">
        <EmptyState
          icon="messages"
          title="this thread is gone."
          body="it was deleted, or the account is no longer here."
        />
      </main>
    );
  }

  const send = (body: string, kind: Message['kind'] = 'text') => {
    const text = body.trim();
    if (!text) return;

    const message: Message = {
      id: uid('m'),
      conversationId: conversation.id,
      senderId: 'me',
      kind,
      body: text,
      replyToId: replyTo?.id,
      reactions: [],
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    dispatch({ type: 'sendMessage', conversationId: conversation.id, message });
    setDraft('');
    setReplyTo(null);
    haptic('tap');

    // Simulated counterpart: typing indicator, then a reply.
    window.setTimeout(
      () => dispatch({ type: 'setTyping', conversationId: conversation.id, typing: true }),
      700,
    );
    window.setTimeout(
      () =>
        dispatch({
          type: 'receiveMessage',
          conversationId: conversation.id,
          message: {
            id: uid('m'),
            conversationId: conversation.id,
            senderId: profile.id,
            kind: 'text',
            body: REPLIES[Math.floor(Math.random() * REPLIES.length)],
            reactions: [],
            createdAt: new Date().toISOString(),
            readAt: null,
          },
        }),
      2600,
    );
  };

  const vibe = profile.activeVibe ? VIBE_BY_KEY[profile.activeVibe.key] : null;
  const distance = distanceLabel(profile, me.privacy.distancePrecision);

  return (
    <main id="main" className="flex h-dvh flex-col bg-obsidian">
      {/* Header */}
      <header className="sticky top-0 z-40 surface-blur">
        <div className="mx-auto flex h-[60px] max-w-lg items-center gap-2 px-2">
          <IconButton icon="chevron-left" label="back to messages" onClick={() => router.push('/messages')} />
          <Link href={`/u/${profile.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
            <Avatar
              name={profile.name}
              seed={profile.photos[0]?.seed ?? profile.id}
              src={profile.photos[0]?.url}
              size="xs"
              online={profile.state === 'online' && me.privacy.showOnlineStatus}
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-semibold">{profile.name}</span>
                {profile.verified && <VerifiedTick size={13} />}
              </span>
              <span className="block truncate text-[11px] text-bone-faint lowercase">
                {conversation.typing ? 'typing…' : activityLabel(profile.lastActiveAt)}
                {vibe && ` · ${vibe.emoji} ${vibe.label.toLowerCase()}`}
              </span>
            </span>
          </Link>
          <IconButton icon="more" label="safety and options" onClick={() => setSafetyOpen(true)} />
        </div>
      </header>

      {/* Contextual CTA — the thing that turns a thread into a plan. */}
      {distance && messages.length > 0 && (
        <div className="mx-auto w-full max-w-lg px-4 pt-2">
          <p className="flex items-center gap-2 rounded-full border border-ultraviolet/25 bg-ultraviolet-wash px-3.5 py-2 text-sm">
            <Icon name="pin" size={14} className="shrink-0 text-ultraviolet" />
            <span className="text-bone-dim">
              {profile.name} is {distance}.{' '}
              <button
                type="button"
                onClick={() => setDraft(`drinks tonight?`)}
                className="text-ultraviolet-bright underline underline-offset-2"
              >
                ask him out?
              </button>
            </span>
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {messages.length === 0 ? (
          <div className="pt-10">
            <EmptyState
              icon="sparkle"
              title="you said hey."
              body={`now say something. ${profile.name} hasn't heard from you yet.`}
            />
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {SAY_HEY_OPENERS.slice(0, 4).map((o) => (
                <Chip key={o} size="sm" onClick={() => send(o)}>
                  {o}
                </Chip>
              ))}
            </div>
          </div>
        ) : (
          <ol className="space-y-2">
            {messages.map((m, i) => {
              const next = messages[i + 1];
              const showTail = !next || next.senderId !== m.senderId;
              return (
                <li key={m.id}>
                  <ChatBubble
                    message={m}
                    replyTo={messages.find((x) => x.id === m.replyToId)}
                    showTail={showTail}
                    onReact={(emoji) =>
                      dispatch({
                        type: 'react',
                        conversationId: conversation.id,
                        messageId: m.id,
                        emoji,
                      })
                    }
                    onReply={() => setReplyTo(m)}
                  />
                </li>
              );
            })}
          </ol>
        )}
        {conversation.typing && (
          <div className="pt-2">
            <TypingBubble name={profile.name} />
          </div>
        )}
        <div ref={endRef} className="h-2" />
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 surface-blur safe-bottom">
        <div className="mx-auto w-full max-w-lg px-3 py-2.5">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 rounded-md border-l-2 border-ultraviolet bg-white/[0.04] px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm text-bone-faint">
                replying to: {replyTo.body}
              </span>
              <button type="button" aria-label="cancel reply" onClick={() => setReplyTo(null)}>
                <Icon name="close" size={15} className="text-bone-faint" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex items-end gap-1.5"
          >
            <IconButton
              icon="image"
              label="send a photo"
              onClick={() => {
                send('sent a photo', 'photo');
                toast('photo sent', { icon: 'image' });
              }}
            />
            <IconButton
              icon="mic"
              label="send a voice note"
              onClick={() => {
                send('voice note', 'audio');
                toast('voice note sent', { icon: 'mic' });
              }}
            />
            <div
              className={cn(
                'flex flex-1 items-center rounded-xl border border-white/[0.09] bg-graphite/50 px-4',
                'focus-within:border-ultraviolet/60 transition-colors',
              )}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`message ${profile.name.toLowerCase()}`}
                aria-label={`message ${profile.name}`}
                className="h-12 w-full bg-transparent text-bone placeholder:text-bone-faint outline-none"
              />
            </div>
            <IconButton
              icon="send"
              label="send"
              type="submit"
              variant={draft.trim() ? 'primary' : 'ghost'}
              disabled={!draft.trim()}
            />
          </form>
        </div>
      </div>

      <ProfileSafetyMenu
        profile={profile}
        open={safetyOpen}
        onClose={() => setSafetyOpen(false)}
        onBlock={() => {
          dispatch({ type: 'block', profileId: profile.id, name: profile.name });
          toast(`${profile.name.toLowerCase()} blocked`, { icon: 'block', tone: 'danger' });
          router.push('/messages');
        }}
        onReport={(reason, detail, alsoBlock) => {
          dispatch({
            type: 'report',
            report: {
              id: uid('r'),
              targetId: profile.id,
              reason,
              detail,
              blockToo: alsoBlock,
              createdAt: new Date().toISOString(),
            },
          });
          if (alsoBlock) {
            dispatch({ type: 'block', profileId: profile.id, name: profile.name });
            router.push('/messages');
          }
          toast('report sent. we take it from here.', { icon: 'shield' });
        }}
        hideIcon="trash"
        hideLabel="delete this conversation"
        hideDescription="removes it for you only"
        onHide={() => {
          dispatch({ type: 'deleteConversation', conversationId: conversation.id });
          toast('conversation deleted');
          router.push('/messages');
        }}
      />
    </main>
  );
}
