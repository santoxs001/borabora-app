# HEY · product architecture

> **hey.** — *say hey.*
> Less swiping. More saying hey.

---

## 1. What HEY is

A social discovery app for young queer men, built around a single idea:
**the hard part isn't finding people, it's starting.**

Most apps in this space optimise the *browse*. HEY optimises the *opener*. Every
structural decision follows from that:

| Conventional pattern | What HEY does instead | Why |
|---|---|---|
| Infinite swipe stack | One card at a time, Say Hey as the primary action | A considered opener converts better than volume |
| Static "looking for" field | **Vibes** — a temporary, expiring intention | What you want tonight ≠ who you are |
| A grid of faces, ranked by attractiveness | Ranking dominated by *reachability* — shared vibe, presence, proximity | Removes the beauty-contest dynamic |
| Map of nearby users | Coarsened distance only, no map anywhere | Location precision is a safety problem, not a feature |
| "IT'S A MATCH!" | **well, hey.** | Own the language or borrow someone else's |

## 2. Positioning

Not only dating. A user opens HEY looking for any of:

dates · friendship · conversation · drinks · people nearby · something casual ·
something now · nothing in particular

The product must feel **social and alive**, not like a catalogue of profiles.
That is why the home screen opens on presence (who is around, right now) before
it opens on profiles.

## 3. The three primitives

Everything in HEY is built from three objects. If a feature can't be expressed
in terms of them, it doesn't ship.

### Vibe
A temporary, self-declared intention with an expiry.
`{ key, duration, startedAt, expiresAt }`

Eight vibes: Date · Drinks · Chat · Friends · Now · Looking around · Going out ·
Staying in. Durations: 1h, 3h, today, until I turn it off.

The expiry is the feature. A vibe that never expired would just be another
profile field, and would go stale the way "looking for" always does.

### Say Hey
An opener carried on the interaction itself — a preset or up to 140 characters
of your own. A like is a maybe; a Say Hey is a sentence.

Crucially, a Say Hey that matches lands **as the first message in the thread**.
There is no empty chat to stare at.

### Distance bucket
A coarsened number, produced server-side, per the *subject's* privacy setting.
Never a coordinate, never a position, never a map.

## 4. Information architecture

```
                       ┌─────────────┐
                       │   welcome   │  who are you saying hey to?
                       └──────┬──────┘
                              │
                       ┌──────┴──────┐
                       │  onboarding │  11 short steps · 18+ gate
                       └──────┬──────┘
                              │
   ┌──────────┬───────────────┼───────────────┬──────────┐
   │          │               │               │          │
┌──┴───┐  ┌───┴────┐     ┌────┴───┐     ┌─────┴────┐ ┌───┴────┐
│discover│ │ nearby │     │ vibes  │     │ messages │ │ profile│   ← tab bar
└──┬───┘  └───┬────┘     └────┬───┘     └─────┬────┘ └───┬────┘
   │          │               │               │          │
   │       places          (focus)          thread    edit · plus
   │                                                   settings
   ├── explore ── category ─┐                            ├── privacy
   ├── notifications        │                            ├── hey safe
   └── u/[id] ──────────────┴──── say hey · match        ├── blocked
                                                         ├── verification
                                                         └── notifications
```

**Five tabs.** Explore, Places, Likes and Notifications hang off Discover's
header rather than taking a tab — they are destinations you go to with intent,
not places you live.

## 5. The core loop

```
   open app
      │
      ▼
  see presence ──────► set a vibe ──────► discovery re-ranks around it
   (close to you)                              │
      │                                        ▼
      └──────────────────────────────►  one profile at a time
                                               │
                    ┌──────────┬───────────────┼──────────┐
                    ▼          ▼               ▼          ▼
                  pass       save            like     ⚡ SAY HEY
                                               │          │
                                               └────┬─────┘
                                                    ▼
                                             reciprocated?
                                                    │
                                          ┌─────────┴─────────┐
                                         no                  yes
                                          │                   │
                                     (they see it        ┌────▼─────┐
                                      in likes)          │ well, hey│
                                                         └────┬─────┘
                                                              ▼
                                              thread — pre-loaded with the opener
```

The loop's success metric is **first replies**, not matches. A match with no
message is a failure that looks like a success, which is why new matches sit in
a rail marked *said hey back* rather than in the conversation list.

## 6. Monetisation

**HEY+** sells reach and control, never access:

- unlimited likes · see who likes you · invisible mode · every filter · rewind ·
  two Spotlights a month · two vibes at once

**Spotlight** (boost) — 30 minutes at the front of the grid. Visual: the `hey.`
dot growing and pulsing. Copy: *be seen.*

Rules we hold ourselves to:
- everything free stays free
- the paywall never blocks a tap — locked controls are marked, not disabled
- cancel is two taps, from settings, with no retention carousel
- like counts shown to free users are **real**; we blur faces, not numbers

## 7. Non-goals

- **No map of users.** Not a setting, not a HEY+ perk. It doesn't exist.
- **No check-ins.** HEY Places shows the city, never who is in it.
- **No read-receipt asymmetry.** Turn yours off, you lose theirs.
- **No one-way invisibility.** Blocking hides both directions.
- **No rainbow-washing.** The palette is obsidian and one ultraviolet.
