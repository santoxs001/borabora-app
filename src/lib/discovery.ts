import type { Filters, Profile, VibeKey } from '@/types';
import { EXPLORE_CATEGORIES } from '@/data/interests';
import { isNewHere } from '@/data/profiles';

export const DEFAULT_FILTERS: Filters = {
  ageMin: 18,
  ageMax: 45,
  maxDistanceKm: 50,
  vibes: [],
  interests: [],
  onlineOnly: false,
  verifiedOnly: false,
  newHereOnly: false,
  lookingFor: [],
};

export function passesFilters(p: Profile, f: Filters): boolean {
  if (p.age < f.ageMin || p.age > f.ageMax) return false;
  if (p.distanceM != null && p.distanceM > f.maxDistanceKm * 1000) return false;
  if (f.onlineOnly && p.state !== 'online') return false;
  if (f.verifiedOnly && !p.verified) return false;
  if (f.newHereOnly && !isNewHere(p)) return false;
  if (f.vibes.length && (!p.activeVibe || !f.vibes.includes(p.activeVibe.key))) return false;
  if (f.interests.length && !f.interests.some((i) => p.interests.includes(i))) return false;
  if (f.lookingFor.length && !f.lookingFor.some((l) => p.lookingFor.includes(l))) return false;
  return true;
}

/**
 * Discovery ranking.
 *
 * The product principle — *less swiping, more saying hey* — is encoded
 * here: relevance is dominated by "is this person reachable right now",
 * not by an opaque attractiveness score. Signals, highest weight first:
 *   1. shared vibe (the whole point of Vibes)
 *   2. presence
 *   3. proximity
 *   4. shared interests
 *   5. a small nudge for new profiles so they aren't buried
 */
export function scoreProfile(
  p: Profile,
  opts: { myVibe: VibeKey | null; myInterests: string[]; boosted?: boolean },
): number {
  let score = 0;

  if (opts.myVibe && p.activeVibe?.key === opts.myVibe) score += 40;
  else if (p.activeVibe) score += 8;
  if (p.activeVibe?.key === 'now') score += 12;

  if (p.state === 'online') score += 24;
  else if (p.state === 'recently_active') score += 10;

  if (p.distanceM != null) {
    // Smooth decay: 20 pts at 0 m, ~10 at 3 km, ~4 at 10 km.
    score += 20 / (1 + p.distanceM / 3000);
  }

  const shared = p.interests.filter((i) => opts.myInterests.includes(i)).length;
  score += Math.min(shared, 4) * 5;

  if (isNewHere(p)) score += 6;
  if (p.verified) score += 4;
  if (opts.boosted) score += 100;

  return score;
}

export function rankProfiles(
  profiles: Profile[],
  opts: { myVibe: VibeKey | null; myInterests: string[] },
): Profile[] {
  return [...profiles].sort((a, b) => scoreProfile(b, opts) - scoreProfile(a, opts));
}

export function profilesForCategory(profiles: Profile[], categoryKey: string): Profile[] {
  const cat = EXPLORE_CATEGORIES.find((c) => c.key === categoryKey);
  if (!cat) return [];
  if (cat.computed === 'tonight') {
    return profiles.filter(
      (p) => p.activeVibe && ['now', 'going_out', 'drinks', 'date'].includes(p.activeVibe.key),
    );
  }
  if (cat.computed === 'new_here') return profiles.filter(isNewHere);
  return profiles.filter((p) => p.interests.some((i) => cat.match.includes(i)));
}
