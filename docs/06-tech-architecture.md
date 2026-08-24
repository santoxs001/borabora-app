# HEY · technical architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript strict | Mobile-first PWA that runs anywhere today; the component layer ports to React Native with the screens intact |
| Styling | Tailwind 3.4 with a token-mirrored config | Every token has a CSS-variable twin, so runtime theming needs no rebuild |
| State | React context + `useReducer`, persisted to `localStorage` | One reducer, one action surface; no store library for state this size |
| Data | `DataAdapter` interface (`src/lib/api/adapter.ts`) | Prototype runs `MockAdapter`; `SupabaseAdapter` drops in without touching a screen |
| Database | PostgreSQL 15 + RLS | See `docs/05-database.md` |
| Auth (prod) | Supabase Auth — OTP email, Apple, Google | No passwords to leak |
| Storage (prod) | Supabase Storage, signed URLs | Photos never publicly addressable |
| Realtime (prod) | Supabase Realtime / WebSocket | Messages, typing, presence |
| Maps | Mapbox — **venues only** | No user is ever placed on a map |

**Why web first.** The brief allowed either. A web prototype is instantly
reviewable on any device with no build pipeline, and the parts that matter — the
domain model, the ranking, the privacy functions, the schema, the copy — are all
platform-agnostic. `src/lib`, `src/data`, `src/types` and `src/store` move to
Expo unchanged; only `src/components` needs re-skinning.

## Layout

```
app/                          routes only — thin, all logic imported
  layout.tsx                  providers, fonts, skip link
  page.tsx                    boot gate
  welcome/  join/             pre-auth
  (app)/                      authenticated shell: tab bar + match overlay
    discover  nearby  vibes  explore  messages/[id]  u/[id]
    profile/edit  likes  notifications  places  plus
    settings/{privacy,safe,blocked,verification,notifications}
    legal/[doc]

src/
  types/                      the domain. mirrors db/schema.sql
  data/                       vibes, interests, icebreakers, fixtures, places
  lib/
    age.ts                    the 18+ gate
    geo.ts                    geohash, haversine, distance coarsening
    discovery.ts              filters + ranking
    format.ts                 distance, fuzzy time, height
    gradient.ts               deterministic photo placeholders
    storage.ts haptics.ts id.ts cn.ts
    api/adapter.ts            the backend seam
  store/app-store.tsx         reducer, persistence, selectors
  components/
    ui/                       design system (21 primitives)
    app/                      feature components
db/                           schema.sql · policies.sql · seed.sql
docs/                         this documentation
```

Rules: routes never touch fixtures or storage directly; `ui/` never imports from
`app/`; anything privacy-relevant lives in `lib/` where it can be unit-tested in
isolation.

## Ranking

`src/lib/discovery.ts`. Weighted, transparent, and deliberately not a beauty
contest:

| Signal | Weight |
|---|---|
| shared active vibe | +40 |
| currently online | +24 |
| proximity | `20 / (1 + metres/3000)` — 20 at 0 m, ~10 at 3 km, ~4 at 10 km |
| any active vibe | +8 |
| vibe is `now` | +12 |
| shared interests | +5 each, capped at 4 |
| new here (<14 days) | +6 |
| verified | +4 |
| Spotlight active | +100 |

The largest single term is *are you up for the same thing right now* — which is
the product thesis, expressed as arithmetic.

## Performance

- Static prerender for every non-parameterised route; ~105 kB shared JS, largest
  route 134 kB first load.
- Photo placeholders are pure CSS gradients — zero network, zero decode.
- `IntersectionObserver` infinite scroll on Nearby, 12 per page.
- Skeletons and shimmer for every async surface.
- Optimistic interaction updates; the reducer applies before any round-trip.
- `localStorage` persistence is snapshot-based and quota-safe — private mode
  degrades to in-memory rather than throwing.

## Accessibility

- Contrast: Bone on Obsidian ≈ 16:1; ultraviolet-bright on obsidian ≈ 5.6:1.
  Ultraviolet is never used for small body text on dark.
- Focus is restyled, never removed — 2px ultraviolet ring, 2px offset.
- Every icon-only control requires a `label` prop; the type system enforces it.
- Sheets and modals trap focus, close on Escape, lock the body, and restore
  focus to the trigger.
- Toggles are real `role="switch"`; tabs are `role="tab"` with `aria-selected`;
  the dual-thumb range is two labelled native inputs.
- Touch targets ≥ 44×44.
- All inputs are 16px to stop iOS zoom-on-focus.
- `prefers-reduced-motion` disables every animation.
- Optional haptics, silently absent where unsupported.
- Skip link to `#main` on every screen.

## Security

| Control | Where |
|---|---|
| 18+ | client (`lib/age.ts`) + API + Postgres `CHECK` |
| Coordinate handling | never stored; geohash only; no column exists |
| Distance | `fn_distance_bucket` server-side, mirrored client-side |
| Row access | RLS on all 20 user tables (`db/policies.sql`) |
| Block symmetry | `fn_is_blocked` — both directions |
| Photo moderation | `photos.moderation` gate; only `approved` is visible to others |
| Duplicate/stock photos | perceptual hash (`photos.phash`) |
| Rate limiting | `rate_limits` table, per user / action / window |
| Reports | write-only from the client; evidence frozen at submit |
| Headers | `nosniff`, `DENY` framing, strict-origin referrer, scoped Permissions-Policy |
| Indexing | `robots: noindex` — profiles must never reach a search engine |

## Migration path to React Native

1. `types/`, `data/`, `lib/`, `store/` — copy unchanged.
2. `components/ui/` — reimplement against the same props; the API is already
   platform-neutral (no DOM types leak through the public interface).
3. `app/` routes → Expo Router screens; the file tree maps almost 1:1.
4. Swap `MockAdapter` for `SupabaseAdapter`. No screen changes.
