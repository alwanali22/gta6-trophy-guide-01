// Boot the Sunset Platinum guide: load the list, wire the tabs, toolbar and views.
import { loadTrophies } from './data.js';
import { loadState, saveState } from './store.js';
import { renderHeader, renderChecklist, renderRoadmap, renderMissables, renderPlanner, renderSave } from './views.js';

const doc = await loadTrophies();
let state = loadState();
const ui = { view: 'checklist', query: '', kind: 'all', grade: 'all', selected: 17 };

function render() {
  renderHeader(doc, state);
  if (ui.view === 'checklist') renderChecklist(doc, state, ui, selectTrophy);
  else if (ui.view === 'roadmap') renderRoadmap(doc, state, selectTrophy);
  else if (ui.view === 'missables') renderMissables(doc, state, selectTrophy);
  else if (ui.view === 'planner') renderPlanner(doc, state, selectTrophy);
  else renderSave(doc, state, reload);
}

function selectTrophy(id, stay) {
  ui.selected = id;
  if (!stay) ui.view = 'checklist';
  render();
}

function reload() {
  state = loadState();
  render();
}

document.getElementById('tabs').addEventListener('click', (e) => {
  const button = e.target.closest('button[data-view]');
  if (!button) return;
  ui.view = button.dataset.view;
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('active', b === button);
  render();
});

document.getElementById('search').addEventListener('input', (e) => { ui.query = e.target.value; ui.view = 'checklist'; render(); });
document.getElementById('kindFilter').addEventListener('change', (e) => { ui.kind = e.target.value; ui.view = 'checklist'; render(); });
document.getElementById('gradeFilter').addEventListener('change', (e) => { ui.grade = e.target.value; ui.view = 'checklist'; render(); });
document.getElementById('spoilerToggle').addEventListener('change', (e) => {
  state.spoiler = e.target.checked;
  saveState(state);
  render();
});
document.getElementById('spoilerToggle').checked = state.spoiler;

render();
