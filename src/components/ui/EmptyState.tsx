import * as React from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

/**
 * Empty states carry the voice more than any other surface —
 * short, lowercase, never apologetic.
 */
export function EmptyState({
  icon = 'sparkle',
  title,
  body,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-8 py-16 text-center', className)}>
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-full border border-white/[0.08] bg-graphite/40 text-ultraviolet">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="font-display text-2xl display-tight lowercase">{title}</h3>
      {body && <p className="mt-2 max-w-[26ch] text-sm text-bone-faint text-pretty">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
