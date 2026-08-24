import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * A hand-rolled icon set. No icon dependency: the whole app needs ~30
 * glyphs, and shipping them inline keeps the bundle small and the
 * stroke weight consistent with the wordmark.
 */
export type IconName =
  | 'discover'
  | 'nearby'
  | 'vibes'
  | 'messages'
  | 'profile'
  | 'explore'
  | 'heart'
  | 'heart-fill'
  | 'star'
  | 'bolt'
  | 'close'
  | 'rewind'
  | 'check'
  | 'verified'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'search'
  | 'sliders'
  | 'settings'
  | 'shield'
  | 'bell'
  | 'plus'
  | 'camera'
  | 'image'
  | 'mic'
  | 'send'
  | 'smile'
  | 'reply'
  | 'more'
  | 'block'
  | 'flag'
  | 'trash'
  | 'eye-off'
  | 'pin'
  | 'sparkle'
  | 'grid'
  | 'lock'
  | 'logout'
  | 'edit'
  | 'drag';

const P: Record<IconName, React.ReactNode> = {
  discover: <><rect x="3" y="3" width="18" height="18" rx="6" /><path d="M15 9l-2.2 4.8L8 16l2.2-4.8L15 9z" /></>,
  nearby: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /><circle cx="12" cy="12" r="8" /></>,
  vibes: <><path d="M12 3v18M5 8v8M19 8v8M8.5 5.5v13M15.5 5.5v13" /></>,
  messages: <><path d="M20 12a8 8 0 1 1-3.2-6.4" /><path d="M4 20l1.4-3.6" /><path d="M20 4.5v5h-5" /></>,
  profile: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  explore: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" /></>,
  heart: <path d="M12 20s-7.2-4.4-9-8.4C1.6 8.4 3.3 5 6.7 5c2 0 3.5 1.2 4.3 2.4l1 1.4 1-1.4C13.8 6.2 15.3 5 17.3 5c3.4 0 5.1 3.4 3.7 6.6-1.8 4-9 8.4-9 8.4z" />,
  'heart-fill': <path d="M12 20s-7.2-4.4-9-8.4C1.6 8.4 3.3 5 6.7 5c2 0 3.5 1.2 4.3 2.4l1 1.4 1-1.4C13.8 6.2 15.3 5 17.3 5c3.4 0 5.1 3.4 3.7 6.6-1.8 4-9 8.4-9 8.4z" fill="currentColor" stroke="none" />,
  star: <path d="M12 4l2.3 4.9 5.2.7-3.8 3.7.9 5.3-4.6-2.5-4.6 2.5.9-5.3L4.5 9.6l5.2-.7L12 4z" />,
  bolt: <path d="M13.5 3L6 13h5l-.5 8L18 11h-5l.5-8z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  rewind: <><path d="M4 9h9a5.5 5.5 0 0 1 0 11H8" /><path d="M8 5L4 9l4 4" /></>,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  verified: <><path d="M12 2.6l2.4 1.9 3 .1.9 2.9 2.4 1.9-1.1 2.8 1.1 2.8-2.4 1.9-.9 2.9-3 .1L12 21.6l-2.4-1.9-3-.1-.9-2.9L3.3 15l1.1-2.8L3.3 9.4l2.4-1.9.9-2.9 3-.1L12 2.6z" fill="currentColor" stroke="none" /><path d="M8.6 12.2l2.3 2.3 4.5-5" stroke="#0B0B0D" strokeWidth="2.2" /></>,
  'chevron-left': <path d="M15 5l-7 7 7 7" />,
  'chevron-right': <path d="M9 5l7 7-7 7" />,
  'chevron-down': <path d="M5 9l7 7 7-7" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  settings: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.4M12 18.8v2.4M4.5 7.5l2 1.2M17.5 15.3l2 1.2M4.5 16.5l2-1.2M17.5 8.7l2-1.2" /></>,
  shield: <><path d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6l7-3z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
  bell: <><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  camera: <><path d="M3 8.5h3.5L8 6h8l1.5 2.5H21V19H3z" /><circle cx="12" cy="13.2" r="3.4" /></>,
  image: <><rect x="3" y="4.5" width="18" height="15" rx="3" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M4 17l5-5 4 3.5 3-2.5 4 4" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 12a6.5 6.5 0 0 0 13 0M12 18.5V21" /></>,
  send: <path d="M4 12l16-7-6 16-2.5-6.5L4 12z" />,
  smile: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 13.5a4.2 4.2 0 0 0 7 0" /><path d="M9 9.5v.01M15 9.5v.01" strokeWidth="2.4" /></>,
  reply: <><path d="M10 5L4 11l6 6" /><path d="M4 11h9a7 7 0 0 1 7 7v1" /></>,
  more: <><circle cx="5.5" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none" /></>,
  block: <><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></>,
  flag: <><path d="M6 21V4" /><path d="M6 5h11l-2 3.5L17 12H6" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7M7 7l1 13h8l1-13" /></>,
  'eye-off': <><path d="M4 4l16 16" /><path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c5 0 9 5 9 7a10 10 0 0 1-2.4 3.3M6.4 7.6C4.3 9 3 11.2 3 12c0 2 4 7 9 7a9.4 9.4 0 0 0 3.7-.8" /><path d="M9.9 10.2a3 3 0 0 0 4 4" /></>,
  pin: <><path d="M12 21s6.5-6.2 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.8 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.4" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>,
  lock: <><rect x="4.5" y="10" width="15" height="10.5" rx="3" /><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" /></>,
  logout: <><path d="M15 5H6v14h9" /><path d="M13 12h8M18 9l3 3-3 3" /></>,
  edit: <><path d="M5 19h3l10-10-3-3L5 16v3z" /><path d="M14.5 6.5l3 3" /></>,
  drag: <><path d="M5 9h14M5 15h14" /></>,
};

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  /** Icons are decorative by default; pass a label to expose them. */
  label?: string;
}

export function Icon({ name, size = 22, label, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cn('shrink-0', className)}
      {...rest}
    >
      {P[name]}
    </svg>
  );
}
