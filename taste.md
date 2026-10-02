# Taste — Taskly

`style.md` covers the visual system. This document covers **judgment**: how Taskly should
feel, what we optimise for, and the calls we make when a decision isn't written down.
Anyone changing this app should be able to answer "would this feel like Taskly?" by
reading this file.

## 1. The feeling

**A calm desk, not a cockpit.** Taskly should feel like a fresh notepad: immediately
usable, quietly confident, slightly warm. When someone opens it, the first reaction must
be "I know what to do" — not "look at all these features".

Three words to steer by: **plain, fast, kind.**

- *Plain* — no gradients screaming for attention, no gamification, no emoji confetti.
- *Fast* — the add field is focused on load; every action resolves instantly with
  visible feedback.
- *Kind* — completing a task is rewarding (green fill, satisfying strike), deleting is
  explicit, empty states reassure instead of scolding ("All clear", not "No tasks! Add
  one now!").

## 2. What we optimise for (in order)

1. **Capture speed** — typing a task must never require opening a dialog. The quick-add
   bar is the front door; the modal is for the details.
2. **Legibility over density** — if a row gets crowded, move metadata to a second line;
   never shrink text below 12 px.
3. **Predictability** — one accent colour, one shadow style, one radius family. If a new
   element needs a new colour to look right, the design is wrong.
4. **Zero anxiety** — nothing yells. Overdue is amber/red text on a soft pill, not a
   flashing banner. No streaks, no "you're falling behind" copy.
5. **Local-first trust** — never imply cloud sync; export/import exists and is visible
   so users know their data is theirs.

## 3. Do / Don't

**Do**
- Keep the accent blue for anything interactive and nothing else.
- Show, don't tell: counts, progress bar, and the seed tasks teach the app without a
  tutorial.
- Make destructive actions reversible-feeling: one task at a time is undoable by
  re-adding; bulk "Clear completed" confirms through a toast (and is scoped to completed
  only).
- Prefer fewer options visible by default (▾ disclosure for advanced quick-add fields).
- Keep copy short, sentence case, contractions fine ("0 left", "Nothing due today").

**Don't**
- Don't add badges, coins, streaks, levels, or motivational quotes.
- Don't block the UI with loading spinners — everything is local and synchronous.
- Don't nest more than one modal, or open a modal for a trivial choice.
- Don't use pure black (`#000`) or pure white-on-white; dark theme backgrounds sit at
  `#14161b`–`#1c1f26` to avoid harsh contrast.
- Don't put more than ~5 controls in one row on mobile.
- Don't animate longer than 250 ms (progress bar's 400 ms fill is the sole exception,
  and it's additive feedback).
- Don't introduce a framework, build step, or runtime dependency.

## 4. Opinionated defaults

| Decision | Choice | Why |
|---|---|---|
| Status chip default | **All** | First impression shows the whole picture incl. the completed seed task (teaches checkboxes) |
| Sort default | **Manual** | User order is the most personal; explicit choice otherwise persists |
| Priority default | **Medium** | Neutral; avoids silently flagging everything as urgent |
| New task position | **Top** | Newest work is usually current work |
| Overdue handling | Label shows "Today/yesterday's date" in red pill | Informational, not nagging |
| Completing | Keeps task in place until filter/refresh, no auto-archive | People like seeing what they just finished |
| Repeating tasks | Spawn next occurrence on completion | Deterministic, visible, works offline |
| Seeded demo data | 3 tasks + 1 note, self-referential | The app explains itself on first run |

## 5. Copy voice

- Calm, concise, second person implied ("Add a task and press Enter…").
- Never blame: no "You failed", no "Overdue!" as a standalone.
- Empty states: two lines — a soft title + a useful hint.
- Toasts state what happened, past tense: "Task added", "Backup exported".
- Errors are specific and recoverable: "Import failed — invalid backup file".

## 6. Feature radar (what earns a place)

A feature lands only if it passes all three:
1. **Works fully offline**, synchronously, in localStorage's budget.
2. **Doesn't slow capture** — adds no extra required input to the common path.
3. **Is self-explanatory** without documentation or onboarding.

Passing this bar: per-task notes, categories, due dates, repeat rules, search, filters,
sort, drag reorder, themes, export/import, toasts. Failing it (for v1): accounts, sync,
markdown editor, attachments, notifications, subtask trees, collaboration.

## 7. When in doubt

Ship the quieter option, the fewer-clicks option, and the option that reads well in
sentence case. Taskly should feel like it was made by someone who uses it every day —
because it was.
