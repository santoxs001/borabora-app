import type { Vibe, VibeDuration, VibeKey } from '@/types';

/**
 * Vibes are HEY's core primitive: a temporary, self-declared intention.
 * They expire on purpose — a vibe describes *tonight*, not who you are.
 */
export const VIBES: Vibe[] = [
  { key: 'date', label: 'Date', emoji: '❤️', hint: 'something that could go somewhere' },
  { key: 'drinks', label: 'Drinks', emoji: '🍸', hint: 'one drink. maybe two.' },
  { key: 'chat', label: 'Chat', emoji: '💬', hint: 'just talking, no pressure' },
  { key: 'friends', label: 'Friends', emoji: '🫂', hint: 'people, not plans' },
  { key: 'now', label: 'Now', emoji: '⚡', hint: 'free right this minute', urgent: true },
  { key: 'looking', label: 'Looking around', emoji: '👀', hint: 'seeing who is out there' },
  { key: 'going_out', label: 'Going out', emoji: '🪩', hint: 'heading somewhere tonight' },
  { key: 'staying_in', label: 'Staying in', emoji: '🏠', hint: 'home, but sociable' },
];

export const VIBE_BY_KEY: Record<VibeKey, Vibe> = VIBES.reduce(
  (acc, v) => ({ ...acc, [v.key]: v }),
  {} as Record<VibeKey, Vibe>,
);

export const VIBE_DURATIONS: { key: VibeDuration; label: string; hours: number | null }[] = [
  { key: '1h', label: '1 hour', hours: 1 },
  { key: '3h', label: '3 hours', hours: 3 },
  { key: 'today', label: 'today', hours: 12 },
  { key: 'until_off', label: 'until I turn it off', hours: null },
];

export function vibeLabel(key: VibeKey): string {
  return VIBE_BY_KEY[key]?.label ?? key;
}
