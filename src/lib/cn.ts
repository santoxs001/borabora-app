type ClassValue = string | number | null | undefined | false | ClassValue[] | Record<string, boolean | undefined | null>;

/** Tiny classnames joiner — no dependency needed for what we do here. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v) return;
    if (typeof v === 'string' || typeof v === 'number') return void out.push(String(v));
    if (Array.isArray(v)) return void v.forEach(walk);
    for (const [k, on] of Object.entries(v)) if (on) out.push(k);
  };
  inputs.forEach(walk);
  return out.join(' ');
}
