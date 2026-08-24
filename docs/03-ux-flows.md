# HEY · UX flows

## 1. Onboarding (11 steps)

```
welcome ──► account ──► name ──► birthdate ──► identity ──► seeking
   │                                  │
   │                            ┌─────┴─────┐
   │                        under 18     18 or over
   │                            │             │
   │                            ▼             ▼
   │                    "HEY is 18+.     ──► city ──► photos ──► bio
   │                     we'll be here          │        │        │
   │                     when you are."      skippable from here on
   │                            │                                 │
   └────────────────────────────┘                    interests ──► goal ──► done
```

**Rules the flow obeys**
1. One decision per screen. Never a form.
2. Progress bar always visible; back always works and never loses input.
3. Everything after the age gate is skippable — the *skip* affordance appears
   only on those steps, so its absence is meaningful.
4. The 18+ gate is the one hard stop. It is checked in the client for
   instant feedback (`src/lib/age.ts`), in the API, and by a `CHECK`
   constraint in Postgres. Three layers, because one is a promise and three
   is a control.
5. Location asks for permission with the reason attached, and the copy states
   what is stored — a coarse area, never a point.

## 2. The discovery decision

```
                    profile card
                         │
    ┌────────┬───────────┼───────────┬──────────┐
    ▼        ▼           ▼           ▼          ▼
   ↺ undo  ✕ pass    ☆ save      ♡ like    ⚡ SAY HEY
  (HEY+)     │          │           │           │
             │      to "saved"      │       opens sheet
             │                      │           │
             ▼                      │      preset or 140 chars
        next profile                │           │
                                    └─────┬─────┘
                                          ▼
                                  did they already
                                  like / hey you?
                                     │       │
                                   no       yes
                                     │       │
                             they see it   ┌─▼──────────┐
                             in "likes"    │ well, hey. │
                                           └─┬──────────┘
                                             ▼
                                    thread, pre-loaded with
                                    the Say Hey opener
```

Why a Say Hey lands as the first message: an empty thread after a match is
where conversations die. Carrying the opener through removes the blank page.

## 3. Vibe lifecycle

```
  no vibe
     │  tap "what's your vibe tonight?"
     ▼
  pick one of 8  ──►  pick a duration (1h / 3h / today / until off)
     │
     ▼
  ACTIVE ──► shown on your card, tile, story ring and chat header
     │   ──► discovery re-ranks: same vibe is the single largest signal
     │   ──► you appear under that vibe on the Vibes screen
     │
     ├── expires  ──► silently cleared, notification "your vibe expires soon"
     └── turned off ──► cleared immediately
```

A vibe is never sticky. That is the point — it describes tonight, not you.

## 4. Safety flows

### Block
```
profile / thread ──► ··· ──► block ──► confirm modal
                                          │
                                          ▼
        · removed from both grids, both directions
        · thread deleted
        · match removed
        · they are NOT told
        · reversible from HEY Safe → blocked
```

### Report
```
··· ──► report ──► pick reason ──► optional detail ──► "also block" (on by default)
                       │
                       ▼
          'underage' jumps the moderation queue
          reporter identity never disclosed
          evidence snapshot frozen at submit time
```

### The reciprocity rule
Privacy settings that reduce what others see also reduce what *you* see:

| You turn off | You also lose |
|---|---|
| your distance | seeing others' distance |
| your online status | seeing others' online status |

Asymmetric privacy is a surveillance feature. HEY doesn't offer it — including
to HEY+ subscribers.

## 5. First-session path to value

The shortest path from install to a sent opener:

```
welcome → join (≈90s) → discover → tap ⚡ → pick "hey 👋" → sent
```

No forced photo upload, no forced bio, no email confirmation wall. A user who
skips everything after the age gate still lands on a working Discover screen —
the fixtures make sure it is never empty.
