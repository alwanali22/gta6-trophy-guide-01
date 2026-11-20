// Boot the guide: load data, render every tab, wire the controls.
// All state lives in localStorage; the page makes no network request
// beyond fetching its own two data files.
import { loadGuideData, computeAudit, auditLine } from './data.js';
import { loadProgress, saveProgress, downloadExport, exportProgressText, importProgressText } from './store.js';
import { applyTrophyFilters, planNextUp } from './filters.js';
import { renderSourcesPanel, renderSourcesFoot, renderChecklist, renderDetail, renderRoadmap, renderMissables, renderPlanner, renderSave, renderMatrix } from './views.js';

const state = loadProgress();
let trophies = [];
let sources = [];
let audit = null;
let selectedId = 17;
let currentTab = 'checklist';
const query = { search: '', kind: 'all', grade: 'all' };

const $ = (id) => document.getElementById(id);

function renderAll() {
  $('audit').innerHTML = auditLine(audit);
  $('bigcount').textContent = `${trophies.filter((t) => state.earned[t.id]).length}/55`;
  renderSourcesPanel($('sourcesPanel'), sources, audit.citedBy);
  renderSourcesFoot(document.querySelectorAll('[data-sources-foot]'), sources, audit.citedBy);
  renderSourcesPanel($('sourcesview'), sources, audit.citedBy);
  const filtered = applyTrophyFilters(trophies, state, query);
  renderChecklist($('tlist'), $('listCount'), $('listEarned'), filtered, trophies, state, selectedId);
  const selected = trophies.find((t) => t.id === selectedId) || trophies[0];
  renderDetail($('detail'), selected, state, sources);
  renderRoadmap($('roadmap'), trophies, state);
  renderMissables($('missables'), trophies);
  renderPlanner($('planner'), planNextUp(trophies, state));
  renderSave($('saveview'), state, trophies);
  renderMatrix($('matrixview'), trophies, sources, audit.citedBy, state);
  const preview = $('exportPreview');
  if (preview) preview.value = exportProgressText(state);
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('on', v.id === `view-${tab}`));
}

function openTrophy(id) {
  selectedId = id;
  switchTab('checklist');
  renderAll();
  const row = document.querySelector(`.tlist li[data-id="${id}"]`);
  if (row) row.scrollIntoView({ block: 'nearest' });
}

document.addEventListener('click', (event) => {
  const tabBtn = event.target.closest('#tabs button');
  if (tabBtn) { switchTab(tabBtn.dataset.tab); return; }
  const kindBtn = event.target.closest('#kindChips button');
  if (kindBtn) {
    query.kind = kindBtn.dataset.kind;
    document.querySelectorAll('#kindChips button').forEach((b) => b.classList.toggle('on', b === kindBtn));
    renderAll();
    return;
  }
  const toggle = event.target.closest('[data-action="toggle"]');
  if (toggle) {
    const id = Number(toggle.dataset.id);
    state.earned[id] = !state.earned[id];
    if (!state.earned[id]) delete state.earned[id];
    saveProgress(state);
    renderAll();
    event.stopPropagation();
    return;
  }
  const act = event.target.closest('[data-action]');
  if (!act) return;
  const action = act.dataset.action;
  const id = Number(act.dataset.id);
  if (action === 'select' || action === 'open') openTrophy(id);
  if (action === 'export') downloadExport(state);
  if (action === 'reset' && confirm('Reset all progress, counters and notes?')) {
    for (const key of ['earned', 'counters', 'notes']) state[key] = {};
    saveProgress(state);
    renderAll();
  }
});

document.addEventListener('change', (event) => {
  const counter = event.target.closest('[data-counter]');
  if (counter) {
    const id = Number(counter.dataset.counter);
    const trophy = trophies.find((t) => t.id === id);
    const value = Math.max(0, Math.min(trophy.count, Number(counter.value) || 0));
    state.counters[id] = value;
    saveProgress(state);
    renderAll();
    return;
  }
  const note = event.target.closest('[data-note]');
  if (note) {
    const id = Number(note.dataset.note);
    if (note.value.trim()) state.notes[id] = note.value;
    else delete state.notes[id];
    saveProgress(state);
    return;
  }
  if (event.target.id === 'importFile' && event.target.files[0]) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = importProgressText(String(reader.result));
      const status = $('importStatus');
      if (result.ok) {
        Object.assign(state, result.state);
        saveProgress(state);
        renderAll();
        const after = $('importStatus');
        if (after) { after.textContent = `Import status: imported ${file.name} — progress restored.`; after.className = 'status ok'; }
      } else if (status) {
        status.textContent = `Import status: failed — ${result.error}`;
        status.className = 'status bad';
      }
    };
    reader.readAsText(file);
  }
});

$('search').addEventListener('input', (event) => { query.search = event.target.value; renderAll(); });
$('gradeFilter').addEventListener('change', (event) => { query.grade = event.target.value; renderAll(); });
$('spoiler').addEventListener('change', (event) => {
  state.spoiler = event.target.checked;
  saveProgress(state);
  renderAll();
});

loadGuideData().then((data) => {
  trophies = data.trophies;
  sources = data.sources;
  audit = computeAudit(trophies, sources, data.sourcesRead);
  $('spoiler').checked = state.spoiler;
  renderAll();
}).catch((error) => {
  $('audit').textContent = `Could not load the guide data (${error.message}). The app needs its own data files under app/data/.`;
});
