# DESIGN.md — Daylight

The design system for fathul-dashboard. Every visual decision in the frontend
comes from this file. If something you need isn't here, add it here first.

---

## 1. Direction

**Cobalt Daylight.** A light workspace: warm unbleached paper as the page
ground, white cards floating on it, deep navy ink, and one true cobalt carrying
every action and active state.

Three rules hold the whole thing together:

1. **Warm neutrals, cool accent.** Greys are biased toward paper, never toward
   printer grey. The blue is the only cold thing on screen, which is what makes
   it read as an action.
2. **Elevation is a currency.** Border, fill, radius and shadow each say
   "separate object." Spend them by role (§5), not uniformly. A view has at most
   one lifted surface.
3. **Colour means state, not decoration.** Moss = good, amber = attention,
   rust = broken, cobalt = interactive. A colour never appears for flavour.

Dark theme is a token swap of the same system, not a second design. Its
neutrals stay **warm** — the paper hue dropped in lightness, not slate grey — so
rule 1 still holds and cobalt remains the only cold thing on screen.

---

## 2. Colour

Tokens live in `styles/globals.css` as space-separated RGB channels, and are
exposed to Tailwind in `tailwind.config.js` as `rgb(var(--x) / <alpha-value>)`
so opacity modifiers (`bg-accent1/10`) work.

**Never write a hex or a Tailwind palette colour (`bg-blue-500`, `text-white`)
in a component.** Use the token classes. That is the only reason both themes work.

| Token          | Light     | Dark      | Use                                            |
| -------------- | --------- | --------- | ---------------------------------------------- |
| `bg`           | `#F4F1E9` | `#1A1815` | Page ground. Warm paper.                        |
| `surface`      | `#FFFFFF` | `#211F1B` | Cards, sidebar, top bar, modals.                |
| `surface2`     | `#EDE9DE` | `#2C2923` | Sunken wells, hover fills, inset code, tracks.  |
| `border`       | `#E2DCCD` | `#38342D` | Default hairline.                               |
| `borderStrong` | `#CFC7B4` | `#4A453C` | Emphasis: focused fields, active chips.         |
| `text`         | `#16202E` | `#F0EDE4` | Primary ink.                                    |
| `text2`        | `#40495A` | `#C9C4B9` | Secondary body copy — still fully readable.     |
| `muted`        | `#6F6A61` | `#969085` | Labels, metadata, placeholders. AA at 14px+.    |
| `accent1`      | `#1F4FD8` | `#8AA9F7` | **Cobalt.** Links, primary buttons, active nav. |
| `accent2`      | `#9C5A08` | `#E0AA5C` | Ochre. Freelance, secondary emphasis.           |
| `highlight`    | `#17724C` | `#5FBE8F` | Moss. Success, server up, done.                 |
| `warning`      | `#8A5807` | `#E3B45E` | Attention, paused, medium priority.             |
| `danger`       | `#B23520` | `#E88068` | Rust. Down, destructive, high priority.         |
| `onAccent`     | `#FFFFFF` | `#14120F` | Text on a filled accent surface.                |

**Semantic pairs.** A tinted chip is always `bg-X/10 text-X ring-1 ring-inset
ring-X/25` in light. Never fill a chip at full saturation except for the single
primary button in a view.

**Category colours** (`lib/utils.ts`): OIKN → cobalt · Freelance → ochre ·
Personal → moss · Side → muted.

---

## 3. Typography

Three faces, three jobs, loaded through `next/font/google` so they are
self-hosted and the app works offline after a build.

| Role        | Family                  | Where                                             |
| ----------- | ----------------------- | ------------------------------------------------- |
| **Display** | Bricolage Grotesque 600 | Page titles, card headings, big numbers. `font-display` |
| **UI**      | IBM Plex Sans 400/500/600 | Everything read as a sentence or a control. `font-sans` |
| **Data**    | JetBrains Mono 400/500  | Times, latency, ports, keys, env vars, paths. `font-mono` |

Display is set tight (`-0.025em`) and never below 15px — it is for titles, not
labels. Any column of digits gets `tabular-nums`.

**Scale** (1.20 ratio, all in `text-*` utilities):

| Step | Size | Use                                    |
| ---- | ---- | -------------------------------------- |
| `xs` | 11px | Uppercase labels, badges, keycaps       |
| `sm` | 12px | Metadata, timestamps, helper text       |
| `base` | 14px | **Body default.** Rows, inputs, buttons |
| `md` | 16px | Card headings, emphasized values         |
| `lg` | 19px | Section titles                           |
| `xl` | 23px | Page titles                              |
| `2xl` | 28px | Hero figures, the Today band             |
| `3xl` | 34px | Reserved: single hero number             |

Uppercase labels get `tracking-[0.08em]`. Headings get `text-wrap: balance`.

---

## 4. Space & rhythm

A 4px base. Use only these steps: **4 · 8 · 12 · 16 · 24 · 32 · 48**.

- Page container: `max-w-[1400px]`, padding `24px` (`16px` under `sm`).
- Gap between top-level page sections: `24px`.
- Gap inside a grid of cards: `16px`.
- Card padding: `16px`; a lifted/hero card gets `24px`.
- List row vertical padding: `12px`; dense rows `8px`.
- Related things `8px` apart, unrelated things `24px` apart. Nothing between.

---

## 5. Elevation — three tiers

| Tier         | Recipe                                                        | Use                                  |
| ------------ | ------------------------------------------------------------- | ------------------------------------ |
| **0 · Flat** | No border, no fill. Just spacing.                             | Page sections, grouped list bodies.  |
| **1 · Card** | `bg-surface` + `border border-border` + `rounded-xl` + `shadow-card` | The default. Every widget.    |
| **2 · Lift** | Tier 1 + `shadow-lift`                                        | One per view: the primary object, modals, popovers, dragged rows. |

Radii: `rounded-md` (6px) chips and small controls · `rounded-lg` (8px) buttons,
inputs · `rounded-xl` (12px) cards · `rounded-2xl` (16px) the Today band and
modals. Nothing else.

Shadows are soft and warm-black, never a glow. `shadow-card` is a 1px contact
shadow plus a wide, faint diffusion; `shadow-lift` doubles the diffusion.

**Elevation changes medium in dark.** A black shadow on a near-black ground is
invisible, so `.dark .card-lift` raises the *surface* (`surface2`) and
strengthens the border instead of leaning on the shadow. The same reason the
scrim goes heavier in dark: separation has to come from value, not shade.

---

## 6. Components

Class recipes live in `@layer components` in `styles/globals.css`. Use them —
don't re-derive a button out of utilities.

- `.card` / `.card-hover` / `.card-lift` — the three tiers.
- `.btn` (neutral) · `.btn-accent` (one per view) · `.btn-ghost` · `.btn-danger`
  · `.btn-sm`. Every button label says what happens: "Save", "Add project".
- `.input` · `.select` · `.textarea` — `bg-surface`, hairline border, cobalt
  focus ring at 2px offset.
- `.chip` — the tinted state pill (§2).
- `.row` — the shared list row: fixed height, hover fill, actions revealed on
  hover but always focusable.
- `.field-label` — the uppercase 11px label above an input.
- `.well` — a `surface2` inset for code, env values, and empty regions.
- `.skeleton` — matches the shape of the real content it replaces.

**Icons:** lucide-react at `16` inside rows and buttons, `18` in the sidebar and
top bar, `20` in page headers. Never larger; never an emoji as a section marker.

---

## 7. Motion

Fast, small, and only on state change.

- Hover / press: `150ms` `ease-out`. Press = `active:scale-[0.98]`.
- Enter (modal, popover, toast): `180ms` `cubic-bezier(.16,1,.3,1)`.
- Page and list entrance: `.stagger-in`, max 6 steps, `40ms` apart.
- Never animate layout on data refresh, and never move something a user is
  about to click.
- Every animation sits behind `@media (prefers-reduced-motion: reduce)`.

---

## 8. Accessibility floor

- Body text ≥ 4.5:1; large text and UI edges ≥ 3:1. `muted` is the lightest
  text allowed and only at 12px+.
- Focus is always visible: `:focus-visible` → 2px cobalt ring, 2px offset.
  Never remove it, never rely on hover alone.
- State is never colour alone — a status dot carries a label, a priority chip
  carries a word.
- Every icon-only control has an `aria-label` and a `title`.
- Hit targets ≥ 32×32.

---

## 9. Layout patterns

- **App shell:** fixed sidebar (`232px`, collapsible to `64px`) + sticky top bar.
  The sidebar is `surface`, the page is `bg` — the ground shift is what separates
  chrome from content, not a heavy border.
- **Sidebar** groups navigation under uppercase labels: Work / Life / Infra.
- **Top bar** carries only orientation: next prayer, weather, clock, theme.
  Never page actions — those belong in the page header.
- **Page header:** title + one-line subtitle on the left, at most one primary
  action and one secondary on the right.
- **Dashboard:** a full-width Today band, then a bento grid where the daily log
  is the largest object. Not three equal columns.
- **List pages:** header → filter bar → rows. Filters never reflow the rows.
- **Empty states** state what the thing is and offer the action that creates one.

---

## 10. Writing

Plain, second-person, no jargon from the data model. "Add project", not "Create
new project entity". Errors say what broke and what to do. Toasts confirm in the
past tense: "Project saved." Dates are `Mon, 2 Sep`; times are 24-hour mono.
