/* ============================================================
   Taskly — app.js
   Vanilla JS. No dependencies. All state persists to
   localStorage. See architecture.md for the data flow.
   ============================================================ */
'use strict';

/* ---------- Storage ---------- */

const STORAGE_KEY = 'taskly:v1';
const THEME_KEY = 'taskly:theme';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayISO = () => new Date().toISOString().slice(0, 10);

const defaultState = () => ({
  tasks: [],
  notes: [],
  settings: { filter: 'all', category: null, status: 'all', sort: 'manual', view: 'tasks' },
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      settings: { ...defaultState().settings, ...(parsed.settings || {}) },
    };
  } catch {
    return seed();
  }
}

function seed() {
  const t = todayISO();
  const s = defaultState();
  s.tasks = [
    { id: uid(), title: 'Welcome to Taskly — check me off!', note: 'Click the round checkbox on the left. Everything saves automatically in your browser.', done: false, due: t, priority: 'medium', category: 'Getting started', repeat: 'none', order: 0, created: Date.now() },
    { id: uid(), title: 'Try adding a task with the form above', note: 'Press ▾ for due date, priority and category.', done: false, due: '', priority: 'low', category: 'Getting started', repeat: 'none', order: 1, created: Date.now() },
    { id: uid(), title: 'Open the Notes tab to write something', note: '', done: true, due: '', priority: 'medium', category: 'Getting started', repeat: 'none', order: 2, created: Date.now() },
  ];
  s.notes = [
    { id: uid(), title: 'My first note', body: 'Notes are for anything that is not a task — ideas, links, lists.\n\nClick me to edit.', created: Date.now(), updated: Date.now() },
  ];
  return s;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- Utilities ---------- */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fmtDue(iso) {
  if (!iso) return '';
  const t = todayISO();
  if (iso === t) return 'Today';
  const d = new Date(iso + 'T00:00:00');
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  if (iso === tomorrow) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function relTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60e3) return 'just now';
  if (diff < 3600e3) return Math.floor(diff / 60e3) + 'm ago';
  if (diff < 864e5) return Math.floor(diff / 3600e3) + 'h ago';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
}

/* ---------- Selectors ---------- */

let searchQuery = '';

function visibleTasks() {
  const { filter, category, status } = state.settings;
  const t = todayISO();

  let list = state.tasks.slice();

  if (category) {
    list = list.filter((x) => (x.category || '') === category);
  } else if (filter === 'today') {
    list = list.filter((x) => x.due && x.due <= t);
  } else if (filter === 'upcoming') {
    list = list.filter((x) => x.due && x.due > t);
  } else if (filter === 'active') {
    list = list.filter((x) => !x.done);
  } else if (filter === 'completed') {
    list = list.filter((x) => x.done);
  }

  if (status === 'open') list = list.filter((x) => !x.done);
  if (status === 'done') list = list.filter((x) => x.done);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter((x) =>
      (x.title || '').toLowerCase().includes(q) ||
      (x.note || '').toLowerCase().includes(q) ||
      (x.category || '').toLowerCase().includes(q));
  }

  const prioRank = { high: 0, medium: 1, low: 2 };
  const sort = state.settings.sort;

  if (sort === 'due') {
    list.sort((a, b) => (a.due || '9999') .localeCompare(b.due || '9999'));
  } else if (sort === 'priority') {
    list.sort((a, b) => prioRank[a.priority] - prioRank[b.priority]);
  } else if (sort === 'created') {
    list.sort((a, b) => b.created - a.created);
  } else if (sort === 'alpha') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  return list;
}

function counts() {
  const t = todayISO();
  const tasks = state.tasks;
  return {
    all: tasks.length,
    today: tasks.filter((x) => x.due && x.due <= t && !x.done).length,
    upcoming: tasks.filter((x) => x.due && x.due > t).length,
    active: tasks.filter((x) => !x.done).length,
    completed: tasks.filter((x) => x.done).length,
    notes: state.notes.length,
  };
}

function categories() {
  const map = new Map();
  for (const t of state.tasks) {
    if (!t.category) continue;
    map.set(t.category, (map.get(t.category) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/* ---------- Rendering ---------- */

function render() {
  renderNav();
  renderTasks();
  renderNotes();
  renderProgress();
}

function renderNav() {
  const c = counts();

  $$('[data-count]').forEach((el) => {
    el.textContent = c[el.dataset.count] ?? 0;
  });

  $$('.nav-item[data-filter]').forEach((el) => {
    el.classList.toggle('is-active',
      !state.settings.category && el.dataset.filter === state.settings.filter &&
      state.settings.view === 'tasks');
  });

  const notesBtn = $('#notesToggle');
  notesBtn.classList.toggle('is-active', state.settings.view === 'notes');

  const list = $('#categoryList');
  const cats = categories();
  $('#categoryLabel').hidden = cats.length === 0;
  list.innerHTML = cats.map(([name, n]) => `
    <li><button class="nav-item ${state.settings.category === name ? 'is-active' : ''}" data-category="${esc(name)}" type="button">
      <span class="nav-icon" aria-hidden="true">▸</span> ${esc(name)} <span class="count">${n}</span>
    </button></li>`).join('');

  const dl = $('#categoryDatalist');
  if (dl) dl.innerHTML = cats.map(([name]) => `<option value="${esc(name)}"></option>`).join('');
}


const TITLES = {
  all: 'All tasks', today: 'Today', upcoming: 'Upcoming',
  active: 'Active', completed: 'Completed', category: '',
};

function renderTasks() {
  const view = state.settings.view;
  $('#tasksView').hidden = view !== 'tasks';
  $('#notesView').hidden = view !== 'notes';
  if (view === 'notes') return;

  const list = visibleTasks();
  const cat = state.settings.category;

  $('#viewTitle').textContent = cat || TITLES[state.settings.filter] || 'All tasks';
  $('#viewSub').textContent = `${list.length} task${list.length === 1 ? '' : 's'}`;

  $$('.nav-item[data-filter]').forEach((b) =>
    b.classList.toggle('is-active', !cat && b.dataset.filter === state.settings.filter));

  $$('.chip').forEach((c) =>
    c.classList.toggle('is-active', c.dataset.status === state.settings.status));

  $('#sortSelect').value = state.settings.sort;

  const ul = $('#taskList');
  ul.innerHTML = list.map(taskHTML).join('');

  const empty = $('#emptyState');
  const isEmpty = list.length === 0;
  empty.hidden = !isEmpty;
  ul.hidden = isEmpty;
  $('#listFoot').style.visibility = isEmpty ? 'hidden' : 'visible';

  const open = state.tasks.filter((t) => !t.done).length;
  $('#remainingLabel').textContent = `${open} left`;

  bindDrag();
}

function taskHTML(t) {
  const today = todayISO();
  let dueTag = '';
  if (t.due) {
    const cls = t.due < today && !t.done ? 'tag-due-over' : t.due === today ? 'tag-due-today' : '';
    dueTag = `<span class="tag ${cls}" title="${esc(t.due)}">◷ ${fmtDue(t.due)}</span>`;
  }

  const prio = ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium';
  const repeatTag = t.repeat && t.repeat !== 'none'
    ? `<span class="tag" title="Repeats ${esc(t.repeat)}">↻ ${esc(t.repeat)}</span>` : '';

  return `
  <li class="task-item ${t.done ? 'is-done' : ''}" data-id="${t.id}" draggable="true">
    <button class="check ${t.done ? 'is-on' : ''}" data-act="toggle" type="button"
      aria-label="${t.done ? 'Mark as not done' : 'Mark as done'}" aria-pressed="${t.done}">✓</button>

    <div class="task-body">
      <span class="task-title">${esc(t.title)}</span>
      ${t.note ? `<p class="task-note">${esc(t.note)}</p>` : ''}
      <div class="task-meta">
        <span class="tag tag-priority-${prio}">${prio}</span>
        ${dueTag}
        ${t.category ? `<span class="tag">▣ ${esc(t.category)}</span>` : ''}
        ${repeatTag}
      </div>
    </div>

    <div class="task-actions">
      <button class="icon-btn" data-act="edit" type="button" aria-label="Edit task" title="Edit">✎</button>
      <button class="icon-btn danger" data-act="del" type="button" aria-label="Delete task" title="Delete">🗑</button>
    </div>
  </li>`;
}

function renderProgress() {
  const today = todayISO();
  const dueToday = state.tasks.filter((t) => t.due && t.due <= today);
  const done = dueToday.filter((t) => t.done).length;
  const pct = dueToday.length ? Math.round((done / dueToday.length) * 100) : 0;

  $('#progressPct').textContent = pct + '%';
  $('#progressBar').style.width = pct + '%';
  $('#progressSub').textContent = dueToday.length
    ? `${done} of ${dueToday.length} due task${dueToday.length === 1 ? '' : 's'} done`
    : 'Nothing due today';
}

function renderNotes() {
  if (state.settings.view !== 'notes') return;

  let notes = state.notes.slice().sort((a, b) => b.updated - a.updated);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    notes = notes.filter((n) =>
      (n.title || '').toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q));
  }

  $('#notesSub').textContent = `${notes.length} note${notes.length === 1 ? '' : 's'}`;

  const grid = $('#noteGrid');
  grid.innerHTML = notes.map((n) => `
    <li class="note-card" data-note="${n.id}" tabindex="0" role="button">
      <h3>${esc(n.title || 'Untitled')}</h3>
      ${n.body ? `<p>${esc(n.body)}</p>` : ''}
      <span class="note-date">edited ${relTime(n.updated)}</span>
    </li>`).join('');

  const empty = notes.length === 0;
  $('#notesEmpty').hidden = !empty;
  grid.hidden = empty;
}


/* ---------- Task mutations ---------- */

function addTask(data) {
  const task = {
    id: uid(),
    title: data.title.trim(),
    note: (data.note || '').trim(),
    done: false,
    due: data.due || '',
    priority: data.priority || 'medium',
    category: (data.category || '').trim(),
    repeat: data.repeat || 'none',
    order: Math.min(-1, ...state.tasks.map((t) => t.order ?? 0)) - 1,
    created: Date.now(),
  };
  if (!task.title) return null;
  state.tasks.unshift(task);
  save();
  render();
  return task;
}

function updateTask(id, patch) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  Object.assign(t, patch);
  save();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((x) => x.id !== id);
  save();
  render();
}

/* Completing a repeating task spawns the next occurrence. */
function toggleTask(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  save();

  if (t.done && t.repeat && t.repeat !== 'none' && t.due) {
    const next = new Date(t.due + 'T00:00:00');
    if (t.repeat === 'daily') next.setDate(next.getDate() + 1);
    else if (t.repeat === 'weekly') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);

    state.tasks.unshift({
      ...t,
      id: uid(),
      done: false,
      due: next.toISOString().slice(0, 10),
      created: Date.now(),
    });
    save();
    toast(`Repeats ${t.repeat} — next occurrence added`);
  }

  render();
}

/* ---------- Drag reorder (manual sort only) ---------- */

let dragId = null;

function bindDrag() {
  if (state.settings.sort !== 'manual') return;

  $$('.task-item').forEach((el) => {
    el.addEventListener('dragstart', () => {
      dragId = el.dataset.id;
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      dragId = null;
    });
    el.addEventListener('dragover', (e) => e.preventDefault());
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetId = el.dataset.id;
      if (!dragId || dragId === targetId) return;

      const order = visibleTasks().map((t) => t.id);
      const from = order.indexOf(dragId);
      const to = order.indexOf(targetId);
      order.splice(to, 0, order.splice(from, 1)[0]);
      order.forEach((id, i) => {
        const t = state.tasks.find((x) => x.id === id);
        if (t) t.order = i;
      });
      save();
      render();
    });
  });
}


/* ---------- Notes ---------- */

function addNote(title, body = '') {
  const note = { id: uid(), title: title.trim() || 'Untitled', body, created: Date.now(), updated: Date.now() };
  if (!note.title) return null;
  state.notes.unshift(note);
  save();
  render();
  return note;
}

function updateNote(id, patch) {
  const n = state.notes.find((x) => x.id === id);
  if (!n) return;
  Object.assign(n, patch, { updated: Date.now() });
  save();
  render();
}

function deleteNote(id) {
  state.notes = state.notes.filter((x) => x.id !== id);
  save();
  render();
}

/* ---------- Modal helpers ---------- */

let modalReturnFocus = null;

function openModal(id) {
  modalReturnFocus = document.activeElement;
  const m = $(id);
  m.hidden = false;
  const first = m.querySelector('input, textarea, select');
  if (first) first.focus();
}

function closeModal(id) {
  $(id).hidden = true;
  if (modalReturnFocus && modalReturnFocus.focus) modalReturnFocus.focus();
}

function anyOpenModal() {
  return $$('.modal').find((m) => !m.hidden);
}

/* ---------- Task modal logic ---------- */

let editingTaskId = null;

function openTaskModal(task = null) {
  editingTaskId = task ? task.id : null;
  $('#modalTitle').textContent = task ? 'Edit task' : 'New task';
  $('#deleteTaskBtn').hidden = !task;

  $('#fTitle').value = task ? task.title : '';
  $('#fNote').value = task ? task.note : '';
  $('#fDue').value = task ? task.due : '';
  $('#fPriority').value = task ? task.priority : 'medium';
  $('#fCategory').value = task ? task.category : '';
  $('#fRepeat').value = task ? task.repeat : 'none';

  openModal('#taskModal');
}

function readTaskForm() {
  return {
    title: $('#fTitle').value,
    note: $('#fNote').value,
    due: $('#fDue').value,
    priority: $('#fPriority').value,
    category: $('#fCategory').value,
    repeat: $('#fRepeat').value,
  };
}

/* ---------- Note modal logic ---------- */

let editingNoteId = null;

function openNoteModal(note = null) {
  editingNoteId = note ? note.id : null;
  $('#noteModalTitle').textContent = note ? 'Edit note' : 'New note';
  $('#nTitle').value = note ? note.title : '';
  $('#nBody').value = note ? note.body : '';
  openModal('#noteModal');
}

/* ---------- Theme ---------- */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $('#themeLabel').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}


/* ============================================================
   Event wiring
   ============================================================ */

/* ----- Quick add form ----- */

$('#quickAdvancedBtn').addEventListener('click', () => {
  const box = $('#quickExtra');
  box.hidden = !box.hidden;
  $('#quickAdvancedBtn').textContent = box.hidden ? '▾' : '▴';
});

$('#quickAddForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('#quickAddInput').value.trim();
  if (!title) return;

  const task = addTask({
    title,
    note: $('#quickNoteInput').value,
    due: $('#quickDueInput').value,
    priority: $('#quickPriorityInput').value,
    category: $('#quickCategoryInput').value,
  });

  if (task) {
    $('#quickAddInput').value = '';
    $('#quickNoteInput').value = '';
    $('#quickDueInput').value = '';
    $('#quickCategoryInput').value = '';
    toast('Task added');
  }
});

/* ----- Navigation ----- */

$('#filterList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  state.settings.filter = btn.dataset.filter;
  state.settings.category = null;
  state.settings.status = 'all';
  state.settings.view = 'tasks';
  save();
  render();
  closeSidebarMobile();
});

$('#categoryList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-category]');
  if (!btn) return;
  state.settings.category = btn.dataset.category;
  state.settings.status = 'all';
  state.settings.view = 'tasks';
  save();
  render();
  closeSidebarMobile();
});

function showNotes() {
  state.settings.view = 'notes';
  save();
  render();
  closeSidebarMobile();
}

$('#notesToggle').addEventListener('click', showNotes);
$('#newNoteBtn').addEventListener('click', () => { showNotes(); openNoteModal(null); });

/* ----- Status chips ----- */

$('#statusChips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  state.settings.status = chip.dataset.status;
  save();
  render();
});

/* ----- Sort ----- */

$('#sortSelect').addEventListener('change', (e) => {
  state.settings.sort = e.target.value;
  save();
  render();
});

/* ----- Search ----- */

let searchTimer;
$('#searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = e.target.value.trim();
    render();
  }, 120);
});

/* ----- Task list actions (event delegation) ----- */

$('#taskList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = btn.closest('.task-item').dataset.id;
  const task = state.tasks.find((x) => x.id === id);
  if (!task) return;

  if (btn.dataset.act === 'toggle') toggleTask(id);
  else if (btn.dataset.act === 'edit') openTaskModal(task);
  else if (btn.dataset.act === 'del') {
    deleteTask(id);
    toast('Task deleted');
  }
});

$('#clearDoneBtn').addEventListener('click', () => {
  const n = state.tasks.filter((t) => t.done).length;
  if (!n) return toast('Nothing completed yet');
  state.tasks = state.tasks.filter((t) => !t.done);
  save();
  render();
  toast(`${n} completed task${n === 1 ? '' : 's'} cleared`);
});

/* ----- Notes list actions ----- */

$('#noteGrid').addEventListener('click', (e) => {
  const card = e.target.closest('[data-note]');
  if (!card) return;
  const note = state.notes.find((x) => x.id === card.dataset.note);
  if (note) openNoteModal(note);
});

$('#noteGrid').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('[data-note]');
  if (!card) return;
  e.preventDefault();
  const note = state.notes.find((x) => x.id === card.dataset.note);
  if (note) openNoteModal(note);
});

$('#noteForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#noteTitleInput');
  if (!input.value.trim()) return;
  const note = addNote(input.value);
  if (note) {
    input.value = '';
    toast('Note added');
    openNoteModal(note);
  }
});


/* ----- Task modal ----- */

$('#newTaskBtn').addEventListener('click', () => { openTaskModal(null); closeSidebarMobile(); });

$('#taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = readTaskForm();
  if (!data.title.trim()) return;

  if (editingTaskId) {
    updateTask(editingTaskId, data);
    toast('Task updated');
  } else {
    addTask(data);
    toast('Task added');
  }
  closeModal('#taskModal');
});

$('#deleteTaskBtn').addEventListener('click', () => {
  if (!editingTaskId) return;
  deleteTask(editingTaskId);
  closeModal('#taskModal');
  toast('Task deleted');
});

/* ----- Note modal ----- */

$('#noteFormEdit').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!editingNoteId) return;
  updateNote(editingNoteId, { title: $('#nTitle').value, body: $('#nBody').value });
  closeModal('#noteModal');
  toast('Note saved');
});

$('#deleteNoteBtn').addEventListener('click', () => {
  if (!editingNoteId) return;
  deleteNote(editingNoteId);
  closeModal('#noteModal');
  toast('Note deleted');
});

/* ----- Modal close handlers ----- */

$$('.modal').forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeModal('#' + modal.id);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const open = anyOpenModal();
    if (open) { closeModal('#' + open.id); return; }
    closeSidebarMobile();
  }
  /* "n" opens a new task when no modal or input is active. */
  if (e.key === 'n' && !anyOpenModal() &&
      !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
    e.preventDefault();
    openTaskModal(null);
  }
});

/* ----- Theme, export, import ----- */

$('#themeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `taskly-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup exported');
});

$('#importBtn').addEventListener('click', () => $('#importFile').click());

$('#importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.tasks) || !Array.isArray(data.notes)) throw new Error('bad shape');
      state = {
        tasks: data.tasks,
        notes: data.notes,
        settings: { ...defaultState().settings, ...(data.settings || {}) },
      };
      save();
      render();
      toast('Backup imported');
    } catch {
      toast('Import failed — invalid backup file');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

/* ----- Mobile sidebar ----- */

function closeSidebarMobile() {
  if (window.innerWidth <= 860) $('#sidebar').classList.remove('open');
}

$('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

document.addEventListener('click', (e) => {
  if (window.innerWidth > 860) return;
  const sb = $('#sidebar');
  if (!sb.classList.contains('open')) return;
  if (e.target.closest('#sidebar') || e.target.closest('#menuBtn')) return;
  sb.classList.remove('open');
});

/* ----- Init ----- */

initTheme();
render();

