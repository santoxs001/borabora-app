# HEY · screen map

23 routes. Every one is implemented — there are no placeholder screens.

## Route table

| Route | Screen | Auth | Notes |
|---|---|---|---|
| `/` | Boot gate | — | Renders the wordmark while the session hydrates, then redirects |
| `/welcome` | Welcome | public | *who are you saying hey to?* · Apple / Google / email |
| `/join` | Onboarding | public | 11-step flow, includes the 18+ gate |
| `/discover` | **Discover** (home) | ✓ | Presence rail → vibe → one card → actions |
| `/nearby` | **close to you** | ✓ | Grid, sorted by distance / presence / recency |
| `/vibes` | **Vibes** | ✓ | Your vibe, live counts, filtered results |
| `/explore` | Explore | ✓ | Search + 13 interest categories as rails |
| `/messages` | Messages | ✓ | New-match rail, threads, saved |
| `/messages/[id]` | Chat | ✓ | Immersive — no tab bar |
| `/u/[id]` | Profile detail | ✓ | Gallery, icebreakers, actions, safety |
| `/profile` | You | ✓ | Card, stats, Spotlight, quick links |
| `/profile/edit` | Edit profile | ✓ | Photos, bio, interests, icebreakers, details |
| `/likes` | Likes you | ✓ | Real count; faces blurred without HEY+ |
| `/notifications` | Notifications | ✓ | Marks read on view |
| `/places` | HEY Places | ✓ | Aggregate only |
| `/plus` | HEY+ | ✓ | Immersive — no tab bar |
| `/settings` | Settings | ✓ | |
| `/settings/privacy` | Privacy | ✓ | Distance precision, visibility, data rights |
| `/settings/safe` | **HEY Safe** | ✓ | Blocking, filtering, disappearing, platform controls |
| `/settings/blocked` | Blocked list | ✓ | |
| `/settings/verification` | Verification | ✓ | 3-pose selfie flow, provider-ready |
| `/settings/notifications` | Notification prefs | ✓ | Sample copy shown next to each switch |
| `/legal/[doc]` | Terms · Privacy · Guidelines | ✓ | |

## Screen anatomy

### Discover — the home screen
```
┌────────────────────────────────────────┐
│ hey.            ⚙ filters  🔍  🔔      │  sticky, frosted
├────────────────────────────────────────┤
│ CLOSE TO YOU                           │
│  ( + )  (N)  (E)  (A)  (N)   →         │  presence rail, horizontal
│ your vibe Noah Enzo Alex Nico          │  vibe emoji badge under each
├────────────────────────────────────────┤
│ ( what's your vibe tonight?        › ) │  one-line pill
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ ● ONLINE                    🖼 5   │ │
│ │                                    │ │
│ │           [ photo ]                │ │  card flexes to fill
│ │                                    │ │
│ │  🍸 drinks                         │ │
│ │  Marco 24 ✓                        │ │
│ │  📍 1.2 km away                    │ │
│ │  designer, coffee addict…          │ │
│ │  design  coffee  techno  +2        │ │
│ └────────────────────────────────────┘ │
│      ↺   ✕    ☆    ♡    ⚡            │  actions always in view
│         6 more with your filters       │
├────────────────────────────────────────┤
│ discover  nearby  vibes  messages  you │
└────────────────────────────────────────┘
```

The card height is driven by the container, not a fixed aspect ratio, so the
action row is **never** below the fold — on any device height.

### Chat
```
┌────────────────────────────────────────┐
│ ‹  (M) Marco ✓                    ···  │
│       recently active · 🍸 drinks      │
├────────────────────────────────────────┤
│ ( 📍 Marco is 900 m away. ask him out?)│  contextual CTA
├────────────────────────────────────────┤
│  ┌──────────────────────┐              │
│  │ hey 👋               │              │
│  └──────────────────────┘              │
│              ┌───────────────────────┐ │
│              │ that playlist is …    │ │
│              └───────────────────────┘ │
│                          14:32 · read  │
│  ● ● ●                                 │  typing
├────────────────────────────────────────┤
│ 🖼 🎤 [ message marco          ]  ➤    │
└────────────────────────────────────────┘
```

### The match moment
Full-screen. Two photos slide in from opposite edges and meet at the connection
mark; the wordmark lands, then the copy:

```
              ( photo )  ✕  ( photo )

                    hey.
                  well, hey.
             Marco said hey back.

              [  say something  ]
              [  keep looking   ]
```

Never *IT'S A MATCH!* — the language is the product's own.

## Navigation rules

- **Five tabs**, always: Discover · Nearby · Vibes · Messages · Profile.
- **Immersive routes** (`/messages/[id]`, `/plus`, `/u/[id]`) hide the tab bar —
  they own the screen and have their own way out.
- Explore, Places, Likes and Notifications hang off headers, not the tab bar.
  They are visited with intent; they don't need a permanent seat.
- Every non-tab screen has a back affordance in the same place.
