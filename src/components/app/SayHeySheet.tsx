'use client';

import * as React from 'react';
import type { Profile } from '@/types';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Textarea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { SAY_HEY_OPENERS } from '@/data/icebreakers';

const MAX = 140;

/**
 * Say Hey — HEY's proprietary opener.
 *
 * A like is a maybe; a Say Hey is a sentence. The presets exist to
 * remove the blank-page problem, not to replace writing something real,
 * so the field is always there and always focusable.
 */
export function SayHeySheet({
  profile,
  open,
  onClose,
  onSend,
}: {
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}) {
  const [text, setText] = React.useState('');
  const [picked, setPicked] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setText('');
      setPicked(null);
    }
  }, [open, profile?.id]);

  if (!profile) return null;

  const message = (picked ?? text).trim();
  const primary = profile.photos[0];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="say hey."
      description={`this goes straight to ${profile.name}. make it count.`}
      footer={
        <Button
          fullWidth
          size="lg"
          disabled={!message}
          onClick={() => {
            onSend(message);
            onClose();
          }}
        >
          send it
        </Button>
      }
    >
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] p-3">
        <Avatar name={profile.name} seed={primary?.seed ?? profile.id} src={primary?.url} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">
            {profile.name} <span className="font-normal text-bone-dim">{profile.age}</span>
          </p>
          <p className="truncate text-sm text-bone-faint">{profile.bio}</p>
        </div>
      </div>

      <p className="eyebrow mb-2.5">pick one</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {SAY_HEY_OPENERS.map((o) => (
          <Chip
            key={o}
            selected={picked === o}
            onClick={() => {
              setPicked(picked === o ? null : o);
              setText('');
            }}
          >
            {o}
          </Chip>
        ))}
      </div>

      <Textarea
        label="or say your own thing"
        rows={3}
        maxChars={MAX}
        value={text}
        placeholder="what are you doing tonight?"
        onChange={(e) => {
          setText(e.target.value);
          setPicked(null);
        }}
      />
    </Sheet>
  );
}
