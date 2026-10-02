# agent.md — Working on Taskly

Instructions for AI agents (and new contributors) modifying this repository.
Read this before writing any code.

## 1. Project snapshot

- Vanilla **HTML + CSS + JS only**. No frameworks, no bundler, no TypeScript, no runtime
  dependencies. Node exists **solely** to run tests (`jsdom` is a devDependency).
- Three runtime files: `index.html`, `styles.css`, `app.js`. Docs: `PRD.md`,
  `architecture.md`, `style.md`, `taste.md` (plus this file).
- The app must keep working when opened directly from `file://`.

## 2. Hard rules

1. **Never add a runtime dependency or build step.**
2. **Never write user content into innerHTML unescaped** — every interpolation of user
   data in `taskHTML()`/`renderNotes()` must go through `esc()`.
3. **Every mutation must call `save()` then `render()`** — no exceptions; the UI reads
   only from `state`.
4. **IDs referenced in JS must exist in HTML.** `verify.js` enforces this.
5. **Both themes must be updated together** — if you add a colour token, define it in
   `:root` *and* `[data-theme="dark"]`.
6. **Match the existing voice**: sentence case, past-tense toasts, no trailing periods
   on buttons/labels (see `style.md` §9, `taste.md` §5).
7. **Feature gate**: new features must pass the three-part bar in `taste.md` §6.

## 3. Conventions

- Formatting: 2-space indent, single quotes in JS, semicolons, `'use strict'` at top of
  `app.js`.
- Selectors: `$` / `$$` helpers; event listeners are **delegated** on stable containers
  (`#taskList`, `#noteGrid`, `#filterList`, `#statusChips`) — never re-bound per render.
- IDs: `camelCase` (`quickAddInput`); data hooks: `data-act`, `data-filter`,
  `data-status`, `data-category`, `data-note`, `data-count`.
- Dates stored as `'YYYY-MM-DD'` strings; timestamps as epoch ms numbers.
- DOM ids referenced from JS: kebab-safe `[A-Za-z0-9_-]`.
- Documentation must be kept in sync with behaviour changes (especially `architecture.md`
  for state/flow changes and `style.md` for token changes).

## 4. Typical tasks

**Add a task field** (e.g. `estimate`):
1. Extend the `Task` shape in `architecture.md` and `seed()`/defaults if needed.
2. Add inputs to both `#quickExtra` (quick-add) and `#taskForm` (modal).
3. Include the value in `readTaskForm()` and the quick-add submit handler.
4. Render a tag in `taskHTML()` using an existing tag class or a new priority-style
   variant; add CSS in the "Task list" section of `styles.css`.
5. Add ≥ 1 assertion to `smoke.test.js`.

**Add a filter** (e.g. `blocked`):
1. Branch in `visibleTasks()`; entry in `TITLES`; count key in `counts()`.
2. `<li>` button with `data-filter="blocked"` in `#filterList`.
3. Test: seed/state tweak + assertion in `smoke.test.js`.

**Change visuals**: edit tokens in `styles.css`, then update the tables in `style.md`.

## 5. Testing (required)

```powershell
npm test        # runs verify.js (DOM id audit) then smoke.test.js (44 jsdom assertions)
```

- `node --check app.js` before committing JS changes (syntax gate).
- After any behaviour change, update or extend `smoke.test.js`; the suite must end with
  `passed, 0 failed`.
- `matchMedia` and `URL.createObjectURL` are stubbed in tests — don't rely on them
  behaving differently.

## 6. Do not

- Don't reformat unrelated code or convert quotes/indentation across a file.
- Don't rename `STORAGE_KEY` (`taskly:v1`) without a migration path.
- Don't remove the seed data (first-run UX is a product requirement).
- Don't add inline `style="…"` except for dynamic values (e.g. `progressBar.width`).
- Don't use `alert()`/`confirm()` — use the modal pattern or `toast()`.
- Don't implement features listed as "Failing this bar" in `taste.md` §6.

## 7. Definition of done

- [ ] `npm test` green (verify + smoke, 0 failures)
- [ ] `node --check app.js` clean
- [ ] Works light **and** dark theme; no visual regressions in mobile breakpoint
- [ ] Docs updated (`architecture.md` if state/flow changed, `style.md` if visuals
      changed, `PRD.md` if scope changed)
- [ ] New user-facing copy follows the voice in `taste.md` §5
