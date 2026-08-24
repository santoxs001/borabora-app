type Pattern = 'tap' | 'select' | 'success' | 'warn';

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  select: 12,
  success: [12, 40, 20],
  warn: [24, 60, 24],
};

/** Opt-in, silently absent where unsupported (all of iOS Safari, today). */
export function haptic(pattern: Pattern = 'tap'): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* ignore */
  }
}
