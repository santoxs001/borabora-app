/** Namespaced, SSR-safe, quota-safe localStorage wrapper. */
const NS = 'hey:v1:';

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(NS + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* private mode / quota — the app must keep working without persistence */
  }
}

export function clearStore(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
