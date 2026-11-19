// Boot: load the trophies, wire the tabs, filters, spoiler switch and save page.
import { loadTrophies } from './data.js';
import { loadState, saveState, earnedCount, downloadExport, parseImport, importSummary, blankState } from './store.js';
import { applyFilters } from './filters.js';
import { renderChecklistInto, renderRoadmapInto, renderMissablesInto, renderPlannerInto, renderSaveInto } from './views.js';

const state = loadState();
let trophies = [];
let tab = 'checklist';
let selectedId = 17;
let lastImport = '';

const viewEl = document.getElementById('view');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kindFilter');
const gradeEl = document.getElementById('gradeFilter');
const spoilerEl = document.getElementById('spoilerToggle');

function updateProgress() {
  const done = earnedCount(state);
  document.getElementById('progressCount').textContent = done + '/55';
  document.getElementById('progressPct').textContent = Math.round((done / 55) * 100) + '%';
  document.getElementById('progressBar').style.width = Math.round((done / 55) * 100) + '%';
}

function ctx() {
  return {
    trophies,
    state,
    selectedId,
    query: searchEl.value,
    kind: kindEl.value,
    grade: gradeEl.value,
    lastImport,
    onToggle: (id, checked) => {
      state.earned[id] = checked;
      if (!checked) delete state.earned[id];
      saveState(state);
      updateProgress();
      render();
    },
    onSelect: (id) => {
      selectedId = id;
      if (tab !== 'checklist') setTab('checklist');
      else render();
    },
    onCounter: (id, value) => {
      if (value > 0) state.counters[id] = value;
      else delete state.counters[id];
      saveState(state);
      render();
    },
    onNote: (id, text) => {
      if (text) state.notes[id] = text;
      else delete state.notes[id];
      saveState(state);
    },
    onExport: () => downloadExport(state),
    onImportFile: async (input) => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = parseImport(text);
        Object.assign(state, imported);
        saveState(state);
        lastImport = importSummary(state);
        updateProgress();
        render();
      } catch {
        lastImport = 'Import failed — that file is not a Sunset Platinum progress export.';
        render();
      }
    },
    onReset: () => {
      const fresh = blankState();
      Object.assign(state, fresh);
      state.spoiler = spoilerEl.checked;
      saveState(state);
      lastImport = '';
      updateProgress();
      render();
    },
  };
}

function render() {
  updateProgress();
  if (tab === 'checklist') {
    viewEl.innerHTML = '<section class="check-wrap"><div id="list" class="list"></div><aside id="detail" class="detail"></aside></section>';
    renderChecklistInto(document.getElementById('list'), document.getElementById('detail'), ctx());
  } else if (tab === 'roadmap') {
    renderRoadmapInto(viewEl, ctx());
  } else if (tab === 'missables') {
    renderMissablesInto(viewEl, ctx());
  } else if (tab === 'next') {
    renderPlannerInto(viewEl, ctx());
  } else if (tab === 'save') {
    renderSaveInto(viewEl, ctx());
  }
}

function setTab(next) {
  tab = next;
  document.querySelectorAll('.tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
  render();
}

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => setTab(button.dataset.tab));
});
searchEl.addEventListener('input', () => { if (tab !== 'checklist') setTab('checklist'); else render(); });
kindEl.addEventListener('change', () => { if (tab !== 'checklist') setTab('checklist'); else render(); });
gradeEl.addEventListener('change', () => { if (tab !== 'checklist') setTab('checklist'); else render(); });
spoilerEl.addEventListener('change', () => {
  state.spoiler = spoilerEl.checked;
  saveState(state);
  render();
});

spoilerEl.checked = state.spoiler;
loadTrophies().then((loaded) => {
  trophies = loaded;
  render();
}).catch(() => {
  viewEl.textContent = 'Could not load the trophy list. Check that app/data/trophies.json is present and reload.';
});
