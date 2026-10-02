/* ============================================================
   smoke.test.js — boots the real app in jsdom and exercises
   the main user flows. Run with: npm test
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  .replace('<script src="app.js"></script>', ''); // we eval manually after stubs
const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
const win = dom.window;

/* --- Stubs for APIs jsdom lacks --- */
win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
win.URL.createObjectURL = () => 'blob:stub';
win.URL.revokeObjectURL = () => {};

const errors = [];
win.addEventListener('error', (e) => errors.push(e.message));

win.eval(js);

const doc = win.document;
const $ = (s) => doc.querySelector(s);
const $$ = (s) => Array.from(doc.querySelectorAll(s));
const submit = (form) => form.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
const type = (sel, value) => {
  const el = $(sel);
  el.value = value;
  el.dispatchEvent(new win.Event('input', { bubbles: true }));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0;
const failures = [];
function assert(cond, name) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { failures.push(name); console.log('  FAIL ' + name); }
}

(async () => {
  console.log('— boot & seed —');
  assert(errors.length === 0, 'no runtime errors on boot');
  assert($('#tasksView').hidden === false, 'tasks view visible by default');
  assert($$('#taskList .task-item').length === 3, 'seed renders 3 tasks (status=all default)');
  assert($('[data-count="all"]').textContent === '3', 'all count = 3');
  assert($('[data-count="completed"]').textContent === '1', 'completed count = 1');
  assert($('#viewTitle').textContent === 'All tasks', 'view title correct');
  assert(doc.documentElement.getAttribute('data-theme') === 'light', 'theme applied (light)');

  console.log('— quick add —');
  $('#quickAddInput').value = 'Buy groceries';
  $('#quickNoteInput').value = 'Milk, eggs, bread';
  $('#quickDueInput').value = new Date().toISOString().slice(0, 10);
  submit($('#quickAddForm'));
  assert($$('#taskList .task-item').length === 4, 'task added to visible list');
  assert($('[data-count="all"]').textContent === '4', 'all count incremented');
  assert($('#toast').textContent === 'Task added', 'toast shown');
  assert($('#quickAddInput').value === '', 'input cleared after add');
  assert($('#progressSub').textContent.includes('0 of 2'), 'progress reflects 2 due tasks, 0 done');

  console.log('— status chip & completion —');
  $('.chip[data-status="open"]').click();
  assert($$('#taskList .task-item').length === 3, 'open chip hides the 1 completed task');
  $('#taskList .task-item .check').click();
  assert($('[data-count="completed"]').textContent === '2', 'completed count after toggle');
  assert($$('#taskList .task-item').length === 2, 'toggled task leaves the open filter');

  console.log('— nav filters —');
  $('.nav-item[data-filter="completed"]').click();
  assert($$('#taskList .task-item').length === 2, 'completed filter shows 2 done tasks');
  assert($('.chip[data-status="all"]').classList.contains('is-active'),
    'nav click resets status chip to All');
  $('.nav-item[data-filter="all"]').click();
  assert($$('#taskList .task-item').length === 4, 'all filter shows every task again');

  console.log('— search —');
  type('#searchInput', 'grocer');
  await sleep(200);
  assert($$('#taskList .task-item').length === 1, 'search narrows to 1 task');
  assert($('.task-title').textContent === 'Buy groceries', 'search matched correct task');
  type('#searchInput', '');
  await sleep(200);
  assert($$('#taskList .task-item').length === 4, 'search cleared restores list');

  console.log('— edit & delete via modal —');
  $('#taskList .task-item [data-act="edit"]').click();
  assert($('#taskModal').hidden === false, 'task modal opens');
  assert($('#deleteTaskBtn').hidden === false, 'delete button visible when editing');
  $('#fTitle').value = 'Buy groceries ASAP';
  submit($('#taskForm'));
  assert($('#taskModal').hidden === true, 'modal closes after save');
  assert($('#taskList').textContent.includes('Buy groceries ASAP'), 'edit persisted to DOM');

  $('#taskList .task-item [data-act="edit"]').click();
  $('#deleteTaskBtn').click();
  assert($('#taskModal').hidden === true, 'modal closes after delete');
  assert($('[data-count="all"]').textContent === '3', 'task deleted from counts');

  /* ================= Part 2 ================= */

  console.log('— notes —');
  $('#notesToggle').click();
  assert($('#notesView').hidden === false, 'notes view opens');
  assert($('#tasksView').hidden === true, 'tasks view hidden');
  assert($$('#noteGrid .note-card').length === 1, 'seed note rendered');
  $('#noteTitleInput').value = 'Meeting ideas';
  submit($('#noteForm'));
  assert($$('#noteGrid .note-card').length === 2, 'note added');
  assert($('#noteModal').hidden === false, 'adding a note opens its editor');
  $('#nBody').value = 'Ship the beta on Friday';
  submit($('#noteFormEdit'));
  assert($('#noteModal').hidden === true, 'note modal closes after save');
  $('#noteGrid .note-card').click();
  assert($('#nBody').value === 'Ship the beta on Friday', 'note body persisted');
  $('#deleteNoteBtn').click();
  assert($$('#noteGrid .note-card').length === 1, 'note deleted');

  console.log('— persistence —');
  const stored = JSON.parse(win.localStorage.getItem('taskly:v1'));
  assert(stored && stored.tasks.length === 3, 'localStorage holds 3 tasks');
  assert(stored.notes.length === 1, 'localStorage holds 1 note');

  console.log('— theme —');
  $('#themeToggle').click();
  assert(doc.documentElement.getAttribute('data-theme') === 'dark', 'theme toggles to dark');
  assert($('#themeLabel').textContent === 'Light mode', 'theme label updates');
  $('#themeToggle').click();
  assert(doc.documentElement.getAttribute('data-theme') === 'light', 'theme toggles back');

  console.log('— clear completed & misc —');
  $$('.nav-item[data-filter]')[0].click(); // back to tasks view
  $('#clearDoneBtn').click();
  assert($('[data-count="completed"]').textContent === '0', 'clear completed empties done list');
  $('#quickAdvancedBtn').click();
  assert($('#quickExtra').hidden === false, 'quick extra options toggle open');
  $('#exportBtn').click();
  assert($('#toast').textContent === 'Backup exported', 'export runs without error');

  console.log('— runtime errors —');
  assert(errors.length === 0, 'no runtime errors during entire run' +
    (errors.length ? ' -> ' + errors.join(' | ') : ''));

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('FAILED: ' + failures.join(' | '));
    process.exit(1);
  }
})().catch((e) => {
  console.error('TEST CRASH:', e);
  process.exit(1);
});


