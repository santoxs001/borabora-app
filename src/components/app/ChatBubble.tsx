'use client';

import * as React from 'react';
import type { Message } from '@/types';
import { cn } from '@/lib/cn';
import { clockTime } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { PhotoSurface } from '@/components/ui/Photo';

const REACTIONS = ['💜', '😂', '🔥', '👀', '🥲', '👋'];

export function ChatBubble({
  message,
  replyTo,
  showTail,
  onReact,
  onReply,
}: {
  message: Message;
  replyTo?: Message;
  showTail: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const mine = message.senderId === 'me';

  if (message.kind === 'system') {
    return (
      <p className="py-3 text-center text-2xs uppercase tracking-[0.12em] text-bone-faint">
        {message.body}
      </p>
    );
  }

  return (
    <div
      className={cn('group relative flex flex-col', mine ? 'items-end' : 'items-start')}
      onDoubleClick={() => onReact('💜')}
    >
      {replyTo && (
        <p
          className={cn(
            'mb-1 max-w-[76%] truncate rounded-md border-l-2 border-ultraviolet/60 bg-white/[0.04] px-2.5 py-1.5 text-2xs text-bone-faint',
            mine ? 'text-right' : 'text-left',
          )}
        >
          {replyTo.body}
        </p>
      )}

      <div className={cn('flex max-w-[82%] items-end gap-1.5', mine && 'flex-row-reverse')}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="message options"
          aria-expanded={menuOpen}
          className={cn(
            'relative px-4 py-2.5 text-left text-[15px] leading-snug text-pretty',
            'transition-transform duration-150 active:scale-[0.98]',
            mine
              ? 'uv-gradient text-white rounded-lg rounded-br-xs'
              : 'bg-graphite text-bone rounded-lg rounded-bl-xs border border-white/[0.06]',
            !showTail && (mine ? 'rounded-br-lg' : 'rounded-bl-lg'),
          )}
        >
          {message.kind === 'photo' && (
            <PhotoSurface seed={message.id} src={message.mediaUrl} className="mb-2 h-44 w-52 rounded-sm" />
          )}
          {message.kind === 'audio' && (
            <span className="mb-1 flex items-center gap-2">
              <Icon name="mic" size={16} />
              <span className="flex h-6 items-center gap-0.5">
                {Array.from({ length: 18 }, (_, i) => (
                  <span
                    key={i}
                    className="w-0.5 rounded-full bg-current opacity-70"
                    style={{ height: `${6 + ((i * 7) % 14)}px` }}
                  />
                ))}
              </span>
              <span className="text-2xs tabular-nums">{message.durationS ?? 0}s</span>
            </span>
          )}
          {message.body}
        </button>

        {message.reactions.length > 0 && (
          <span className="-mb-1 flex gap-0.5 rounded-full border border-white/[0.1] bg-obsidian px-1.5 py-0.5 text-[11px]">
            {message.reactions.map((r) => (
              <span key={r.emoji}>{r.emoji}</span>
            ))}
          </span>
        )}
      </div>

      {menuOpen && (
        <div
          className={cn(
            'mt-1.5 flex items-center gap-0.5 rounded-full border border-white/[0.1] bg-obsidian-50 px-1.5 py-1 shadow-card animate-scale-in',
            mine ? 'self-end' : 'self-start',
          )}
        >
          {REACTIONS.map((e) => (
            <button
              key={e}
              type="button"
              aria-label={`react ${e}`}
              onClick={() => {
                onReact(e);
                setMenuOpen(false);
              }}
              className="grid h-8 w-8 place-items-center rounded-full text-base transition-transform active:scale-90 hover:bg-white/[0.07]"
            >
              {e}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-white/10" />
          <button
            type="button"
            aria-label="reply"
            onClick={() => {
              onReply();
              setMenuOpen(false);
            }}
            className="grid h-8 w-8 place-items-center rounded-full text-bone-dim hover:bg-white/[0.07]"
          >
            <Icon name="reply" size={15} />
          </button>
        </div>
      )}

      {showTail && (
        <p
          className={cn(
            'mt-1 flex items-center gap-1 px-1 text-[11px] text-bone-faint',
            mine && 'flex-row-reverse',
          )}
        >
          <span>{clockTime(message.createdAt)}</span>
          {mine && (
            <span className={message.readAt ? 'text-ultraviolet-bright' : 'text-bone-faint'}>
              {message.pending ? '·' : message.readAt ? 'read' : 'sent'}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

export function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <span className="flex items-center gap-1 rounded-lg rounded-bl-xs border border-white/[0.06] bg-graphite px-4 py-3.5">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="h-1.5 w-1.5 rounded-full bg-bone-faint animate-dot-pulse"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </span>
      <span className="sr-only">{name} is typing</span>
    </div>
  );
}
