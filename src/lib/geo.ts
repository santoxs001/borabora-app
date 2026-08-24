import type { DistancePrecision } from '@/types';

/* ────────────────────────────────────────────────────────────────
   Location handling.

   Rules, enforced by construction rather than by convention:
     1. Raw coordinates never leave the device except to be turned
        into a geohash.
     2. The server stores the geohash, not the lat/lng.
     3. The API returns a *distance bucket*, never a position.
     4. No screen in the app renders a user on a map.
   ──────────────────────────────────────────────────────────────── */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Precision 6 ≈ 1.2 km × 0.6 km cells — enough to rank "nearby"
 * meaningfully while making trilateration of an individual useless.
 */
export const GEOHASH_PRECISION = 6;

export function encodeGeohash(lat: number, lng: number, precision = GEOHASH_PRECISION): string {
  let latMin = -90,
    latMax = 90,
    lngMin = -180,
    lngMax = 180;
  let hash = '';
  let bits = 0;
  let bit = 0;
  let even = true;

  while (hash.length < precision) {
    if (even) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        bit = (bit << 1) + 1;
        lngMin = mid;
      } else {
        bit = bit << 1;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        bit = (bit << 1) + 1;
        latMin = mid;
      } else {
        bit = bit << 1;
        latMax = mid;
      }
    }
    even = !even;
    if (++bits === 5) {
      hash += BASE32[bit];
      bits = 0;
      bit = 0;
    }
  }
  return hash;
}

const EARTH_R = 6_371_000;

export function haversineM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(s));
}

/**
 * Snap a true distance to the coarsest bucket the subject allows.
 * Called server-side before serialisation; exported here so the mock
 * adapter behaves identically to the real one.
 */
export function coarsenDistance(
  metres: number,
  precision: DistancePrecision,
): number | null {
  if (precision === 'hidden') return null;
  if (precision === 'approximate') {
    // Wide, deliberately lossy buckets.
    const buckets = [1000, 3000, 10_000, 30_000, 100_000];
    return buckets.find((b) => metres < b) ?? 100_000;
  }
  // Even "exact" is rounded — 50 m below 1 km, 100 m above.
  return metres < 1000 ? Math.round(metres / 50) * 50 : Math.round(metres / 100) * 100;
}

export interface CoarseLocation {
  geohash: string;
  city: string;
  country: string;
}

/** Requests browser geolocation and immediately discards the raw fix. */
export async function requestCoarseLocation(): Promise<{ geohash: string } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geohash = encodeGeohash(pos.coords.latitude, pos.coords.longitude);
        resolve({ geohash }); // raw coords go out of scope here and are never stored
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
  });
}
