'use client';

import * as React from 'react';
import type { Profile, ReportReason } from '@/types';
import { Sheet, Modal } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { Row } from '@/components/ui/Row';
import { cn } from '@/lib/cn';

const REASONS: { key: ReportReason; label: string; hint: string }[] = [
  { key: 'fake_profile', label: 'fake profile', hint: 'photos or identity look stolen' },
  { key: 'harassment', label: 'harassment', hint: 'abusive, threatening or hateful' },
  { key: 'underage', label: 'may be under 18', hint: 'we review these first' },
  { key: 'nudity', label: 'unwanted explicit content', hint: 'sent without consent' },
  { key: 'spam', label: 'spam or promotion', hint: 'selling, links, bots' },
  { key: 'scam', label: 'scam', hint: 'asking for money, gift cards, crypto' },
  { key: 'offline_behaviour', label: 'something that happened offline', hint: 'we take these seriously' },
  { key: 'other', label: 'something else', hint: '' },
];

/** The per-profile safety menu. Reachable from every profile and thread. */
export function ProfileSafetyMenu({
  profile,
  open,
  onClose,
  onBlock,
  onReport,
  onHide,
  hideLabel = 'hide this profile',
  hideDescription = "you won't see them again",
  hideIcon = 'eye-off',
}: {
  profile: Profile;
  open: boolean;
  onClose: () => void;
  onBlock: () => void;
  onReport: (reason: ReportReason, detail: string, alsoBlock: boolean) => void;
  onHide?: () => void;
  hideLabel?: string;
  hideDescription?: string;
  hideIcon?: React.ComponentProps<typeof Row>['icon'];
}) {
  const [mode, setMode] = React.useState<'menu' | 'report'>('menu');
  const [reason, setReason] = React.useState<ReportReason | null>(null);
  const [detail, setDetail] = React.useState('');
  const [alsoBlock, setAlsoBlock] = React.useState(true);
  const [confirmBlock, setConfirmBlock] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMode('menu');
      setReason(null);
      setDetail('');
      setAlsoBlock(true);
    }
  }, [open]);

  return (
    <>
      <Sheet
        open={open && !confirmBlock}
        onClose={onClose}
        title={mode === 'menu' ? profile.name : 'report'}
        description={
          mode === 'menu'
            ? undefined
            : `what happened? ${profile.name} is never told they were reported.`
        }
        footer={
          mode === 'report' ? (
            <Button
              fullWidth
              size="lg"
              variant="danger"
              disabled={!reason}
              onClick={() => {
                if (!reason) return;
                onReport(reason, detail, alsoBlock);
                onClose();
              }}
            >
              send report
            </Button>
          ) : undefined
        }
      >
        {mode === 'menu' ? (
          <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.02] divide-y divide-white/[0.05]">
            {onHide && (
              <Row icon={hideIcon} label={hideLabel} onClick={onHide} description={hideDescription} />
            )}
            <Row icon="block" label={`block ${profile.name}`} danger onClick={() => setConfirmBlock(true)} description="they can't see you, message you, or find you" />
            <Row icon="flag" label="report" danger onClick={() => setMode('report')} description="goes to the moderation team" />
          </div>
        ) : (
          <div>
            <ul className="space-y-2">
              {REASONS.map((r) => (
                <li key={r.key}>
                  <button
                    type="button"
                    aria-pressed={reason === r.key}
                    onClick={() => setReason(r.key)}
                    className={cn(
                      'w-full rounded-md border px-4 py-3 text-left transition-colors',
                      reason === r.key
                        ? 'border-ultraviolet/55 bg-ultraviolet-wash'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16]',
                    )}
                  >
                    <span className="block text-[15px] lowercase">{r.label}</span>
                    {r.hint && <span className="block text-sm text-bone-faint">{r.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <Textarea
                label="anything else? (optional)"
                rows={3}
                maxChars={500}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="what we should know"
              />
            </div>

            <Toggle
              label={`also block ${profile.name}`}
              description="recommended. you can undo this in settings."
              checked={alsoBlock}
              onChange={setAlsoBlock}
            />
          </div>
        )}
      </Sheet>

      <Modal
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        title={`block ${profile.name}?`}
        description="they disappear from your grids and yours from theirs. any thread you two have is deleted. you can undo this in HEY Safe."
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setConfirmBlock(false)}>
              cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                setConfirmBlock(false);
                onBlock();
                onClose();
              }}
            >
              block
            </Button>
          </>
        }
      />
    </>
  );
}
