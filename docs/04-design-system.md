# HEY · design system

## Foundations

### Colour

| Token | Hex | Role |
|---|---|---|
| Obsidian | `#0B0B0D` | the ground. every screen sits on it |
| Bone | `#F4F2EE` | primary type. never pure white |
| Graphite | `#2A2A2F` | surfaces, cards, inputs |
| **Ultraviolet** | `#7A3CFF` | **the only accent** |

Supporting: `ultraviolet-bright #9463FF`, `ultraviolet-deep #5A22D6`,
`ultraviolet-wash rgba(122,60,255,0.14)`, `signal-online #3DDC97`,
`signal-warn #FFB020`, `signal-danger #FF4D6A`.

**The ultraviolet rule.** Exactly one ultraviolet control per screen carries the
primary action. If two things are ultraviolet, one of them is wrong. This is why
Say Hey is the only filled control in the Discover action row.

**No rainbow.** The palette is a deliberate rejection of default queer-brand
visual language. Identity here comes from typography and restraint.

### Type

- **Display** — Archivo 800/900, `letter-spacing: -0.035em`, `line-height: 0.94`.
  Lowercase almost everywhere. Stands in for Neue Haas Grotesk Display Pro.
- **Body** — Inter 400–600. Stands in for Inter Regular in the brand sheet.
- **Eyebrow** — 11px, uppercase, `tracking: 0.18em`, `bone-faint`.

Fonts load from Google Fonts at runtime via `<link>`, not at build time, so the
app builds and renders correctly offline with the system stack.

### Shape & depth

Radii: `xs 8 · sm 12 · md 16 · lg 22 · xl 28 · card 26`. Everything interactive
is at least `sm`; photo surfaces are `lg` or `card`.

Elevation is one frosted surface (`surface-blur`: 72% obsidian + 20px blur +
140% saturate) plus two shadows — `card` for photo cards, `glow` for
ultraviolet controls only.

A `grain` overlay (inline SVG turbulence, 16% opacity, overlay blend) sits on
every large dark area. Without it, big obsidian fields band on OLED.

### Motion

| Curve | Value | Used for |
|---|---|---|
| `ease-hey` | `cubic-bezier(0.22, 1, 0.36, 1)` | everything by default |
| `ease-snap` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | toggles, toasts — slight overshoot |

Durations: 150–200ms for feedback, 300–450ms for entrances, 620ms for the match
photos. Press feedback is `scale(0.97)` on buttons, `scale(0.90)` on icon
buttons — you feel it before you see it.

Every animation is disabled under `prefers-reduced-motion`.

### The dot

`hey.`'s full stop is the brand's load-bearing element. It is reused as:
loading (three dots pulsing), presence, the Spotlight motif (growing + pulsing),
the active-tab marker, and the `+` in HEY+.

## Components

All in `src/components/ui`. Every one is typed, keyboard-operable, and carries
its own accessible name.

| Component | Variants | States |
|---|---|---|
| `Button` | primary · secondary · ghost · outline · danger; sm/md/lg | default · hover · pressed · disabled · loading · fullWidth |
| `IconButton` | solid · glass · ghost · primary; sm/md/lg/xl | + active (aria-pressed) |
| `Chip` / `VibeChip` | sm/md, static or interactive | selected · disabled |
| `Avatar` | xs…xl | online · ring |
| `Badge` | uv · neutral · online · warn · plus | — |
| `VerifiedTick` · `OnlineDot` · `CountBadge` | — | — |
| `Input` · `Textarea` · `SearchField` | leading icon, trailing slot | error · hint · char count |
| `Dropdown` | native `<select>` under a styled shell | — |
| `Toggle` | `role="switch"` | checked · disabled |
| `Slider` · `RangeSlider` | single / dual thumb | — |
| `Tabs` · `Segmented` | sliding indicator | selected |
| `Sheet` · `Modal` | tall sheet | focus-trapped, Escape, body lock |
| `Toast` | default · uv · danger | auto-dismiss 2.8s, `aria-live` |
| `EmptyState` | any icon | — |
| `Skeleton` · `Loading` | card / row / full-screen | shimmer |
| `StepProgress` | segmented | — |
| `Row` · `RowGroup` | link · button · static | danger |
| `ProfileCard` · `ProfileTile` · `ProfileGrid` | — | — |
| `ProfileGallery` | scroll-snap + tap zones | — |
| `ChatBubble` · `TypingBubble` | mine / theirs; text · photo · audio · system | reactions · reply · tail |
| `PhotoManager` | 1–9 photos | reorder · primary · remove · in-review |

### Two implementation notes worth knowing

**Photo placeholders are generated, not fetched.** `src/lib/gradient.ts` hashes
a seed into a dark duotone plus a large low-contrast initial. The app therefore
ships no stock imagery of real people, works offline, and gets its loading state
for free — a real photo fades in over the exact same surface.

**Positioning is never hardcoded on indicator components.** `OnlineDot` carries
no `relative` of its own, because Tailwind emits `.relative` after `.absolute`
and would silently beat any `absolute` a caller passed in.
