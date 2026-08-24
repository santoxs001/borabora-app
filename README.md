<div align="center">

# hey.

**say hey.**

A social discovery app for young queer men.
*Less swiping. More saying hey.*

`#0B0B0D` obsidian · `#F4F2EE` bone · `#2A2A2F` graphite · `#7A3CFF` ultraviolet

</div>

---

## What this is

A working prototype of HEY — 23 implemented screens, a 21-component design
system, a full PostgreSQL schema with row-level security, and the product
thinking behind all of it.

It runs entirely on fixtures, so `npm run dev` gives you the real app with no
backend, no keys and no network.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint
```

## The idea

Most apps in this space optimise the *browse*. HEY optimises the *opener*.

Three primitives carry the whole product:

**Vibes** — a temporary, expiring intention (*Date · Drinks · Chat · Friends ·
Now · Looking around · Going out · Staying in*), set for 1h, 3h, today, or until
you turn it off. Shared vibe is the single largest term in discovery ranking.
The expiry is the feature: a vibe describes tonight, not you.

**Say Hey** — an opener carried on the interaction itself. A like is a maybe; a
Say Hey is a sentence. When it matches, it lands as the first message in the
thread, so there is never an empty chat to stare at.

**Distance buckets** — coarsened server-side, per the subject's own privacy
setting. Never a coordinate, never a map.

When two people connect, HEY doesn't say *IT'S A MATCH!* It says:

> ### well, hey.
> *Marco said hey back.*

## Privacy, structurally

These aren't policies written next to the code — they're properties of it:

- **There is no `lat`/`lng` column.** The device coarsens to a 6-character
  geohash (≈1.2 km cell) and discards the raw fix in the same expression that
  encodes it. A column that doesn't exist can't leak.
- **18+ is enforced three times** — in the client for feedback, in the API, and
  as a `CHECK` constraint in Postgres that application code cannot bypass.
- **Blocking is symmetric**, and you can never see who blocked you.
- **Privacy is reciprocal.** Hide your distance and you lose theirs. Asymmetric
  privacy is a surveillance feature; HEY doesn't sell it, even to HEY+.
- **HEY Places has no check-in table.** It cannot show who is at a venue because
  it never records it — only aggregate counts, floored so a small crowd can't
  identify anyone.
- **No user is ever drawn on a map.** Not a setting, not a perk.

## Structure

```
app/          routes (thin — all logic imported)
src/
  types/      the domain, mirroring db/schema.sql
  data/       vibes, interests, icebreakers, 24 fixture profiles, places
  lib/        age gate · geohash · ranking · formatting · placeholders
  store/      one reducer, persisted, behind a server-shaped action surface
  components/ ui/ (design system) · app/ (features)
db/           schema.sql · policies.sql · seed.sql
docs/         product · screens · flows · design system · data · architecture
```

The `DataAdapter` interface in `src/lib/api/adapter.ts` is the only seam between
the app and a backend. The prototype runs `MockAdapter`; a `SupabaseAdapter`
implementing the same surface drops in without touching a screen.

## Documentation

| | |
|---|---|
| [Product architecture](docs/01-product-architecture.md) | positioning, the three primitives, the core loop, non-goals |
| [Screen map](docs/02-screen-map.md) | all 23 routes, screen anatomy, navigation rules |
| [UX flows](docs/03-ux-flows.md) | onboarding, the discovery decision, vibe lifecycle, safety |
| [Design system](docs/04-design-system.md) | tokens, type, motion, all 21 components |
| [Data model](docs/05-database.md) | schema decisions and why each one is defensible |
| [Technical architecture](docs/06-tech-architecture.md) | stack, ranking, performance, a11y, security |
| [Roadmap](docs/07-roadmap.md) | what's built, what isn't, what I'd do next |

## Notes on the prototype

- **No stock photography.** Every photo surface renders a deterministic dark
  duotone plus a large low-contrast initial (`src/lib/gradient.ts`). It works
  offline, ships no images of real people, and doubles as the loading state for
  real photos.
- **Fonts load at runtime**, not build time, so the app builds and renders
  correctly with no network — falling back to the system stack.
- `legacy/` holds the unrelated file this repository previously contained.

---

<sub>18+ only. Designed for connection. Built for us.</sub>
