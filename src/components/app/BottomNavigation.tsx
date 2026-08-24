'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CountBadge } from '@/components/ui/Badge';
import { useApp } from '@/store/app-store';
import { haptic } from '@/lib/haptics';

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const ITEMS: NavItem[] = [
  { href: '/discover', label: 'discover', icon: 'discover' },
  { href: '/nearby', label: 'nearby', icon: 'nearby' },
  { href: '/vibes', label: 'vibes', icon: 'bolt' },
  { href: '/messages', label: 'messages', icon: 'messages' },
  { href: '/profile', label: 'profile', icon: 'profile' },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { state } = useApp();
  const unread = state.conversations.reduce((n, c) => n + c.unreadCount, 0);

  return (
    <nav
      aria-label="primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] surface-blur safe-bottom"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => haptic('tap')}
                className={cn(
                  'relative flex h-[68px] flex-col items-center justify-center gap-1',
                  'transition-colors duration-200',
                  active ? 'text-bone' : 'text-bone-faint hover:text-bone-dim',
                )}
              >
                <span className="relative">
                  <Icon name={item.icon} size={23} />
                  {item.href === '/messages' && unread > 0 && (
                    <CountBadge
                      count={unread}
                      className="absolute -right-3 -top-2 scale-[0.8] origin-top-right"
                    />
                  )}
                </span>
                <span className="text-[10px] font-semibold lowercase tracking-[0.06em]">
                  {item.label}
                </span>
                {active && (
                  <span className="absolute top-1 h-1 w-1 rounded-full bg-ultraviolet" aria-hidden />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
