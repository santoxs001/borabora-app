/**
 * Deterministic placeholder generator.
 *
 * The app ships no stock photography, so every photo surface without a
 * real image renders a generated one. It is deliberately dark and
 * low-contrast: a placeholder should read as a *portrait card waiting
 * for its photo*, not as a coloured screen, and it doubles as the
 * loading state once real images are wired up.
 */
type Palette = {
  /** Deep base, near-obsidian. */
  base: string;
  /** Soft key light. Kept low-chroma on purpose. */
  key: string;
};

const PALETTES: Palette[] = [
  { base: '#141118', key: 'rgba(122,60,255,0.30)' },
  { base: '#101014', key: 'rgba(148,99,255,0.22)' },
  { base: '#17131C', key: 'rgba(90,34,214,0.34)' },
  { base: '#121317', key: 'rgba(122,60,255,0.18)' },
  { base: '#1A151F', key: 'rgba(168,130,255,0.20)' },
  { base: '#0F1014', key: 'rgba(122,60,255,0.26)' },
  { base: '#151219', key: 'rgba(70,30,170,0.38)' },
  { base: '#131218', key: 'rgba(148,99,255,0.16)' },
];

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface Duotone {
  base: string;
  key: string;
  /** Key-light position, in percent. */
  x: number;
  y: number;
  /** Secondary rim light, bottom-opposite the key. */
  rimX: number;
  angle: number;
}

export function duotone(seed: string): Duotone {
  const h = hash(seed);
  const p = PALETTES[h % PALETTES.length];
  const x = 26 + ((h >> 5) % 48);
  return {
    base: p.base,
    key: p.key,
    x,
    y: 12 + ((h >> 9) % 34),
    rimX: 100 - x,
    angle: 150 + ((h >> 13) % 60),
  };
}

export function duotoneStyle(seed: string): React.CSSProperties {
  const d = duotone(seed);
  return {
    backgroundColor: d.base,
    backgroundImage: [
      // key light
      `radial-gradient(78% 52% at ${d.x}% ${d.y}%, ${d.key} 0%, transparent 68%)`,
      // rim light, much fainter
      `radial-gradient(60% 40% at ${d.rimX}% 88%, rgba(244,242,238,0.045) 0%, transparent 70%)`,
      // depth
      `linear-gradient(${d.angle}deg, rgba(0,0,0,0.55) 0%, transparent 45%, rgba(0,0,0,0.35) 100%)`,
    ].join(', '),
  };
}
