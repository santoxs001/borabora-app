# HEY · what is built, and what is next

## Built in this prototype

Everything below runs. No stubs, no "coming soon" screens.

**Foundation** — 21 design-system primitives · brand tokens in Tailwind + CSS
vars · custom 40-glyph icon set · deterministic photo placeholder engine ·
strict-mode TypeScript domain model mirroring the SQL schema.

**Flows** — welcome · 11-step onboarding with a three-layer 18+ gate ·
Discover with presence rail and one-card decision · Vibes with live counts ·
Nearby grid with infinite scroll · Explore with search and 13 category rails ·
profile detail with gallery, icebreakers and safety menu · Say Hey sheet ·
the match moment · full chat with reactions, replies, photo/voice, typing and
read state · my profile · profile editor · Likes You · notifications ·
HEY Places · HEY+ · Spotlight · settings · privacy · HEY Safe · blocked list ·
verification flow · legal pages.

**Data** — 489-line Postgres schema, 259 lines of RLS, reference seed data,
24 fixture profiles with bios, interests, vibes, icebreakers and details.

## Not built, and honestly so

| Gap | What it needs |
|---|---|
| Real backend | Implement `SupabaseAdapter` against `DataAdapter`. The interface is the whole contract. |
| Real auth | Supabase Auth OTP + Apple + Google. The onboarding flow already collects everything needed. |
| Photo upload | Storage bucket + signed URLs + moderation webhook. `PhotoManager` mints placeholders today; only its `add()` needs to change. |
| Face matching | `runVerification()` in `settings/verification` is the single seam — swap the stub for a provider call. States and copy already exist. |
| Push | Preferences and copy are written; needs FCM/APNs and a delivery worker. |
| Payments | HEY+ plans and state are modelled; needs StoreKit / Play Billing / Stripe and receipt validation. |
| Real moderation | Schema and queue priority exist; needs a scanner and a reviewer tool. |
| i18n | Copy is centralised but not extracted. pt-BR first, given the launch city. |
| Tests | Priorities in order: `lib/age`, `lib/geo`, `lib/discovery`, the reducer, then the RLS policies against a live Postgres. |

## Where I'd spend the next sprint

1. **`lib/` test suite.** The age gate, the distance coarsener and the block
   predicate are the three places a bug is a safety incident rather than a bug.
2. **`SupabaseAdapter`.** Everything else is downstream of it.
3. **Instrument the real metric.** Not matches — **first replies within 24h**,
   segmented by whether the opener was a Say Hey or a bare like. That number
   either validates the product thesis or kills it, and it is worth knowing
   early.
