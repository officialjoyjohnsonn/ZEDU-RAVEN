# Taskly — Todos & Notes

A tidy, offline-first todo list **with notes**, built in plain HTML, CSS and JavaScript.
No frameworks, no build step, no backend — just open it and go.

## Run

```powershell
# option 1: open directly
start .\index.html

# option 2: serve
npm start
```

## Test

```powershell
npm test        # DOM id audit + 44 jsdom behavioural assertions
```

## Features

- **Tasks** — quick-add, per-task notes, due dates, priority, categories, repeating
  tasks (daily/weekly/monthly), drag reordering
- **Notes** — separate notes grid with title + body, edit/delete, relative timestamps
- **Views** — All / Today / Upcoming / Active / Completed + dynamic category views
- **Chips & sort** — Open/Done/All sub-filter; sort by manual, due, priority, newest, A→Z
- **Search** — debounced, covers task titles, notes and categories
- **Progress** — sidebar counts + today's progress bar
- **Themes** — light/dark, persisted, honours system preference
- **Backup** — JSON export / import (validated before replacing data)
- **Keyboard** — `n` = new task, `Esc` = close modal
- **Storage** — everything persists in `localStorage` (key `taskly:v1`)

## Files

| File | Purpose |
|---|---|
| `index.html` | Markup: shell, sidebar, views, modals |
| `styles.css` | Design tokens, components, themes, responsive rules |
| `app.js` | State, persistence, rendering, events |
| `PRD.md` | Product requirements & acceptance checklist |
| `architecture.md` | Data model, data flow, module map, decisions |
| `style.md` | Visual design system (tokens, components, motion) |
| `taste.md` | Product taste guide — feel, defaults, voice, feature bar |
| `agent.md` | Instructions for agents/contributors changing this codebase |
| `verify.js`, `smoke.test.js` | Test suite (dev-only, jsdom) |
