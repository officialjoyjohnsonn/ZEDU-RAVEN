# Architecture — Taskly

## 1. Overview

Taskly is a single-page, client-only app. The browser loads `index.html`, which pulls in
one stylesheet (`styles.css`) and one script (`app.js`). There is no server code, no
bundler and no dependencies at runtime.

```
┌────────────────────────────────────────────────────────┐
│ index.html          static markup: shell, modals,      │
│                     empty containers for JS to fill    │
├────────────────────────────────────────────────────────┤
│ styles.css          design tokens (CSS custom props),  │
│                     layout, components, themes,        │
│                     responsive rules                   │
├────────────────────────────────────────────────────────┤
│ app.js              state, persistence, selectors,     │
│                     renderers, event wiring, modals    │
├────────────────────────────────────────────────────────┤
│ localStorage        single key `taskly:v1` = whole     │
│                     state as JSON; `taskly:theme`      │
└────────────────────────────────────────────────────────┘
```

## 2. Data model

Single state object, one source of truth:

```js
state = {
  tasks: Task[],
  notes: Note[],
  settings: {
    view:     'tasks' | 'notes',
    filter:   'all' | 'today' | 'upcoming' | 'active' | 'completed',
    category: string | null,   // non-null overrides `filter`
    status:   'all' | 'open' | 'done',   // chip sub-filter
    sort:     'manual' | 'due' | 'priority' | 'created' | 'alpha',
  }
}
```

```js
Task = {
  id: string,        // uid(): base36 timestamp + random
  title: string,
  note: string,      // per-task note (longer text)
  done: boolean,
  due: string,       // 'YYYY-MM-DD' or '' (no due date)
  priority: 'low' | 'medium' | 'high',
  category: string,
  repeat: 'none' | 'daily' | 'weekly' | 'monthly',
  order: number,     // manual sort position (lower = higher in list)
  created: number    // epoch ms
}

Note = { id, title, body, created, updated }   // updated: epoch ms
```

## 3. Data flow

Unidirectional and deliberately simple — **event → mutate state → save → render**:

```
user event (click / submit / input)
        │
        ▼
handler mutates `state` (addTask, toggleTask, updateNote, …)
        │
        ▼
save()  →  localStorage['taskly:v1'] = JSON.stringify(state)
        │
        ▼
render() → renderNav()        counts, active nav item, category list
           renderTasks()      filter → sort → innerHTML into #taskList
           renderNotes()      (only when view === 'notes')
           renderProgress()   today bar
```

There is no diffing or virtual DOM: renderers rebuild their container's innerHTML from
scratch. Lists are small (personal scale), so this is fast enough and keeps the code
auditable. Event listeners are attached **once** to stable containers
(`#taskList`, `#noteGrid`, `#filterList`, …) and use **event delegation** with
`closest('[data-act]')`, so re-rendering never leaks listeners.

## 4. Module map (`app.js`)

| Section | Responsibility |
|---|---|
| Storage | `load()`, `save()`, `seed()` (first-run demo data), schema guard on parse |
| Utilities | `esc()` HTML-escape, `fmtDue()`, `relTime()`, `toast()`, `uid()` |
| Selectors | `visibleTasks()` pipeline: category → filter → status → search → sort |
| | `counts()`, `categories()` for the sidebar |
| Renderers | `render()` and the four `renderX()` functions, `taskHTML()` template |
| Mutations | `addTask`, `updateTask`, `deleteTask`, `toggleTask` (repeat spawning), `addNote`, `updateNote`, `deleteNote` |
| Drag & drop | `bindDrag()` — HTML5 DnD, only active when sort = manual |
| Modals | `openModal/closeModal`, focus save & restore, task/note editors |
| Theme | `initTheme()` (saved → `prefers-color-scheme` → light), `applyTheme()` |
| Events | Delegated listeners, keyboard shortcuts, mobile sidebar, import/export |
| Init | `initTheme(); render();` |

## 5. Key decisions & trade-offs

1. **localStorage over IndexedDB** — data is tiny (a few KB); localStorage gives atomic
   `setItem`, synchronous reads at boot, and trivially inspectable JSON. Trade-off:
   ~5 MB ceiling and blocking writes; both irrelevant at this scale.
2. **innerHTML templating over a framework** — zero dependencies, instantly runnable
   from `file://`. Mitigated XSS with mandatory `esc()` on every interpolation; tests
   verify all 57 DOM ids used by the script exist in the markup.
3. **Settings persisted inside the same state blob** — filters/views survive reload
   exactly as left. Import replaces settings too (with defaults merged).
4. **Repeat = spawn-on-complete** — no background scheduler (an open tab can't wake a
   closed app without a service worker); the next occurrence is created the moment a
   repeating task is ticked off, keeping the model explicit and debuggable.
5. **Negative `order` for new tasks** — new tasks unshift with the lowest order, so
   they appear on top without renumbering the rest.

## 6. Persistence contract

- Write: every mutation calls `save()` immediately (no dirty-flag batching).
- Read: `load()` at script start; malformed JSON or wrong shape falls back to `seed()`.
- Import: file parsed → shape validated (`Array.isArray(tasks) && Array.isArray(notes)`)
  → state replaced → `save()` + `render()`. Invalid files are rejected with a toast,
  never written.

## 7. Testing strategy

- `verify.js` — static audit: every `$('#id')` in `app.js` exists in `index.html`.
- `smoke.test.js` — jsdom boots the real `index.html` + `app.js`, stubs
  `matchMedia`/`URL.createObjectURL`, then asserts 44 behaviours across boot, quick-add,
  chips, nav filters, search, modal CRUD, notes CRUD, persistence, theme,
  clear-completed, export and runtime-error-free execution.
- Run: `npm test`.

## 8. Extension points

- **New filter:** add a branch in `visibleTasks()`, a nav `<li>`, a `TITLES` entry, a
  count key in `counts()`.
- **New task field:** extend `Task`, both form readers (`readTaskForm`,
  quick-add), `taskHTML()` and a tag in `.task-meta`.
- **Sync:** replace `save()`/`load()` with an async adapter; nothing else changes
  because all mutations go through the storage functions.

