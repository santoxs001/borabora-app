import type { DistancePrecision, Profile } from '@/types';

/* ── Distance ──────────────────────────────────────────────────────
   Distance is coarsened on the server per the subject's privacy
   choice; this module only *renders* what already arrived.
   ─────────────────────────────────────────────────────────────── */

export function formatDistance(
  metres: number | null,
  precision: DistancePrecision = 'exact',
): string | null {
  if (metres == null || precision === 'hidden') return null;

  if (precision === 'approximate') {
    if (metres < 1000) return 'under 1 km';
    if (metres < 3000) return 'a few km';
    if (metres < 10_000) return 'under 10 km';
    if (metres < 30_000) return 'across town';
    return 'far';
  }

  if (metres < 100) return 'right here';
  if (metres < 1000) return `${Math.round(metres / 50) * 50} m`;
  const km = metres / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function distanceLabel(p: Profile, precision: DistancePrecision): string | null {
  const d = formatDistance(p.distanceM, precision);
  if (!d) return null;
  return precision === 'exact' && p.distanceM != null && p.distanceM >= 100 ? `${d} away` : d;
}

/* ── Time ─────────────────────────────────────────────────────────
   Deliberately fuzzy. Exact "last seen 14:32" timestamps are a
   safety problem, not a feature.
   ─────────────────────────────────────────────────────────────── */

export function activityLabel(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 5) return 'online';
  if (mins < 60) return 'recently active';
  if (mins < 60 * 24) return 'active today';
  if (mins < 60 * 24 * 7) return 'active this week';
  return 'away for a while';
}

export function relativeTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function countdown(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m left`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`;
}

/* ── Misc ─────────────────────────────────────────────────────── */

export function heightLabel(cm?: number): string | null {
  if (!cm) return null;
  const totalIn = Math.round(cm / 2.54);
  return `${cm} cm · ${Math.floor(totalIn / 12)}'${totalIn % 12}"`;
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function pluralise(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
