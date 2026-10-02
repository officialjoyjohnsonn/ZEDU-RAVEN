# Style Guide — Taskly

The single source of truth for how Taskly looks and feels. All values live as CSS custom
properties at the top of `styles.css` (`:root` for light, `[data-theme="dark"]` for
dark). If you change a token, both themes must be updated.

## 1. Design principles

1. **Quiet by default.** One accent colour carries all interactivity; everything else is
   neutral. No colour for colour's sake.
2. **Density with air.** Compact rows, generous card padding (14–16 px), 8 px gaps.
3. **Content first.** The task title is the darkest, largest text in a row; metadata is
   smaller, lighter, and pill-shaped.
4. **Motion is feedback, not decoration.** 150–220 ms, ease, never blocking.

## 2. Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f6f7f9` | `#14161b` | Page background |
| `--surface` | `#ffffff` | `#1c1f26` | Cards, sidebar, inputs |
| `--surface-2` | `#f1f3f6` | `#23262e` | Secondary fills, chips |
| `--border` | `#e3e6eb` | `#2c303a` | Hairlines, input borders |
| `--text` | `#171a21` | `#eceef2` | Primary text |
| `--text-2` | `#5c6470` | `#a2aab8` | Secondary text |
| `--text-3` | `#8b93a1` | `#737c8c` | Muted: timestamps, hints |
| `--accent` | `#3b6ef6` | `#6c93ff` | Buttons, active nav, focus |
| `--danger` | `#d64545` | `#ff7a7a` | Destructive, overdue |
| `--ok` | `#1f9d61` | `#55d194` | Completed check, low priority |
| `--warn` | `#b7791f` | `#f0b95e` | Due today, medium priority |

Rule: **one accent per view.** Red only ever means "destructive/overdue", green only
"done/low risk", amber only "needs attention soon".

### Priority semantics
| Priority | Foreground | Soft background |
|---|---|---|
| high | `--high` (red) | `--danger-soft` |
| medium | `--medium` (amber) | `--warn-soft` |
| low | `--low` (green) | `--ok-soft` |

## 3. Typography

- Family: **Inter**, fallback `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
- Scale: h1 `24/700`, h2 `17/600`, body `15/400`, small `13`, meta `12`, micro `11`.
- Letter-spacing: `-0.02em` on headings (brand, h1), `+0.08em` uppercase on nav labels.
- Numbers in counts use `font-variant-numeric: tabular-nums` so they don't jitter.

## 4. Spacing & shape

- Base unit 4 px; common gaps 6, 8, 12, 16, 20, 24, 32.
- Radii: `--radius-sm` 8 px (buttons, inputs), `--radius` 12 px (cards, modals inner),
  `--radius-lg` 18 px (modal shell), pills `999px`.
- Sidebar width `264px`; main column max-width `980px`, centred.

## 5. Elevation

Two shadows only:
- `--shadow` — resting cards and quick-add (1 px line + soft 24 px bloom).
- `--shadow-lg` — modals, mobile sidebar, toast.
Hover raises a card by shadow + 2 px translate (notes) — never by scale on text rows.

## 6. Components

| Component | Anatomy | States |
|---|---|---|
| Button | 9 px 16 px padding, radius-sm, 14/600 | `btn-primary` (accent), `btn-ghost` (hairline), `btn-danger` (soft red), `btn-sm` |
| Icon button | 38×38 (30×30 in rows), hairline or transparent | hover fills `surface-2` |
| Nav item | icon + label + count pill, 8×10 padding | default muted → hover `surface-2` → active `accent-soft`/accent |
| Chip / pill | radius 999, 13/600 | active = accent fill, white text |
| Task row | check + body + actions, 14×16 padding | hover accent border; done = 62 % opacity + line-through |
| Check circle | 22 px, 2 px ring | hover ring accent; on = green fill + white ✓ |
| Tag | 12 px pill in `surface-2` | priority/due/category variants (table above) |
| Input | 9–10 px padding, hairline | focus: accent border + 3 px `accent-soft` ring |
| Modal | 520 px max, radius-lg, `pop` 180 ms | backdrop `rgba(10,12,16,.55)` + blur |
| Toast | bottom-centre pill, inverted colours | auto-dismiss 2.4 s, `slideUp` |

## 7. Motion

```
fast    150 ms   colour/border state changes
medium  180–220 ms  modals, row fade-in, sidebar slide
slow    400 ms   progress bar width
easing  ease / ease-out everywhere; no bouncy curves
```
All animation is wrapped by `@media (prefers-reduced-motion: reduce)` → disabled.

## 8. Layout rules

- Desktop ≥ 860 px: fixed sticky sidebar + scrolling main.
- Mobile < 860 px: sidebar becomes a slide-over drawer (hamburger toggles,
  tap-outside closes, choosing an item closes); view header stacks; modal fields stack.
- Task rows: metadata wraps to a new line rather than truncating; titles
  `overflow-wrap: anywhere` so long unbroken strings can't break layout.

## 9. Writing & microcopy

- Sentence case everywhere; no trailing periods on labels.
- Verbs for actions: "New task", "Clear completed", "Add note".
- Empty states are calm, two lines: a title ("All clear") + a hint.
- Counts: "3 tasks", "1 note" — always plural-aware.
