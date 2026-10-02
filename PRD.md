# PRD — Taskly (Todo List + Notes App)

**Status:** v1 shipped  
**Stack:** Vanilla HTML, CSS, JavaScript — no frameworks, no build step, no backend.  
**Repo layout:** `index.html`, `styles.css`, `app.js` + documentation set.

---

## 1. Problem

People need a fast, private place to track tasks and jot notes without signing up for a
service, waiting for a sync, or handing data to a server. Existing tools are either
bloated, account-gated, or online-only.

## 2. Goal

A single-file-served web app that:

- lets a user capture, organise, complete and review tasks in seconds;
- doubles as a lightweight notes keeper;
- works fully offline after first load;
- keeps all data on the device (localStorage) with export/import as the backup path.

**Non-goals (v1):** accounts, cloud sync, collaboration, calendars, mobile apps,
notifications/push, recurring reminders that fire while the app is closed.

## 3. Users & primary jobs

| Persona | Job to be done |
|---|---|
| Busy individual | Capture a task in < 3 s, find it later, tick it off |
| Student / researcher | Keep short notes alongside action items |
| Careful optimiser | Review what's due today, filter by category, clear clutter |

## 4. Functional requirements

### 4.1 Tasks (must have)
- **F1** Create a task with a title; optionally note, due date, priority (`low|medium|high`), category, repeat rule (`none|daily|weekly|monthly`).
- **F2** Complete / uncomplete with one click; completed tasks stay visible until cleared.
- **F3** Edit and delete any task (modal editor, delete needs an explicit click).
- **F4** Views/filters: All, Today (due ≤ today), Upcoming (due > today), Active, Completed, plus dynamic per-category views.
- **F5** Status chips: Open / Done / All as a sub-filter of the current view.
- **F6** Sort: manual (drag order), due date, priority, newest, A→Z.
- **F7** Search across title, note and category with 120 ms debounce.
- **F8** Repeating tasks: completing one spawns the next occurrence from the due date.
- **F9** Manual drag-reorder when sort = manual.
- **F10** Quick-add bar with a disclosure (▾) for due/priority/category/note.

### 4.2 Notes (must have)
- **F11** Create a note from the top bar or the Notes view; edit title + body in a modal; delete.
- **F12** Notes grid sorted by last-edited, with relative timestamps.
- **F13** Search applies to notes too.

### 4.3 Supporting features
- **F14** Sidebar counts (all/today/upcoming/active/completed/notes) always live.
- **F15** "Today's progress" bar: done ÷ due-today tasks.
- **F16** Dark/light theme, persisted; honours `prefers-color-scheme` on first run.
- **F17** Full-text backup export (JSON download) and import (validated before replacing state).
- **F18** "Clear completed" one-click cleanup with toast confirmation.
- **F19** Toast feedback for every mutating action.
- **F20** First-run seed data so the app explains itself (3 tasks, 1 note).

### 4.4 Quality requirements
- **Q1** All state persists across reloads (localStorage key `taskly:v1`).
- **Q2** Responsive down to 360 px; sidebar becomes a slide-over under 860 px.
- **Q3** Keyboard accessible: visible focus rings, Escape closes modals, `n` = new task.
- **Q4** Semantic HTML + ARIA (`aria-pressed`, `role="dialog"`, `aria-live` regions).
- **Q5** `prefers-reduced-motion` disables animation.
- **Q6** All user content rendered via an HTML-escaper (XSS-safe).

## 5. Success metrics (personal project scale)
- Task capture ≤ 3 seconds, ≤ 2 clicks/keystrokes.
- Zero data loss on reload; import rejects malformed backups.
- Test suite (`npm test`) green: DOM-id audit + 44 jsdom behavioural assertions.

## 6. Out of scope for v1 / future
Attachments & markdown rendering in notes, subtasks, undo stack, PWA service worker +
install prompt, i18n, sync via user's own storage.

## 7. Acceptance checklist
- [x] Create / edit / complete / delete task with all optional fields
- [x] Filters, chips, sort, search behave as specified
- [x] Repeating task spawns next occurrence
- [x] Notes CRUD + search
- [x] Theme, export, import, clear-completed, toasts
- [x] Mobile layout, keyboard support, reduced motion
- [x] Docs: `agent.md`, `PRD.md`, `architecture.md`, `style.md`, `taste.md`
