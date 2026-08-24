'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { IconButton } from './IconButton';

/**
 * Bottom sheet. Focus is trapped while open, Escape closes, and the
 * body is locked so the page behind never scrolls under the finger.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  /** Sheets that fill most of the screen (vibe picker, filters). */
  tall,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tall?: boolean;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  useLockBody(open);
  useDismiss(open, onClose, panelRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <button
        aria-label="close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-obsidian/75 backdrop-blur-sm animate-fade-in cursor-default"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'relative w-full max-w-lg animate-sheet-in',
          'rounded-t-2xl border-t border-x border-white/[0.09]',
          'bg-obsidian-50/95 backdrop-blur-2xl shadow-card',
          'flex flex-col',
          tall ? 'max-h-[92dvh]' : 'max-h-[85dvh]',
        )}
      >
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {title && (
          <header className="flex items-start justify-between gap-4 px-6 pb-4 pt-2">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-2xl display-tight lowercase">
                {title}
              </h2>
              {description && (
                <p className="mt-1.5 text-sm text-bone-dim text-pretty">{description}</p>
              )}
            </div>
            <IconButton icon="close" label="close" size="sm" onClick={onClose} />
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 no-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="border-t border-white/[0.07] px-6 py-4 safe-bottom">{footer}</div>
        )}
        {!footer && <div className="h-6 safe-bottom" />}
      </div>
    </div>
  );
}

/** Centred dialog — confirmations and anything that must be decided. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  useLockBody(open);
  useDismiss(open, onClose, panelRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-6">
      <button
        aria-label="close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm animate-fade-in cursor-default"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative w-full max-w-sm animate-scale-in',
          'rounded-xl border border-white/[0.1] bg-obsidian-50/95 backdrop-blur-2xl',
          'p-6 shadow-card',
        )}
      >
        <h2 id={titleId} className="font-display text-2xl display-tight lowercase">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-bone-dim text-pretty">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex gap-2.5">{footer}</div>}
      </div>
    </div>
  );
}

/* ── shared behaviour ─────────────────────────────────────────── */

function useLockBody(open: boolean) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

function useDismiss(
  open: boolean,
  onClose: () => void,
  ref: React.RefObject<HTMLElement | null>,
) {
  React.useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus in without stealing it from an autofocused child.
    const first = ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    if (first && !ref.current?.contains(document.activeElement)) first.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const [head, tail] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, ref]);
}
