// Renderers for every view. All text is set with textContent (never innerHTML with data),
// so trophy names and guides can never inject markup.
import { gradeLabel, gradeSymbol, sourceLabels, STAGES, trophyById } from './data.js';
import { isEarned, toggleEarned, setCount, getCount, setNote, exportProgress, importProgress, STATE_KEY } from './store.js';
import { applyFilters, displayName, displayDescription, isHiddenBySpoiler, nextUpList } from './filters.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function chip(text, cls) {
  return el('span', 'chip' + (cls ? ' ' + cls : ''), text);
}

export function renderHeader(doc, state) {
  const n = state.earned.length;
  const pct = Math.round((n / doc.trophies.length) * 100);
  document.getElementById('progressCount').textContent = n + '/' + doc.trophies.length;
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('progressFill').style.width = pct + '%';
  const stage = STAGES.find((s) => doc.trophies.some((t) => t.stage === s.n && !isEarned(state, t.id)));
  document.getElementById('progressNote').textContent =
    n === doc.trophies.length ? 'Platinum earned — Leonida Legend!' : 'Road to the platinum: ' + (stage ? stage.title : 'final cleanup');
}

export function renderChecklist(doc, state, ui, onSelect) {
  const view = document.getElementById('view');
  view.replaceChildren();
  const split = el('div', 'split');
  const list = el('div', 'trophy-list');
  const shown = applyFilters(doc, state, ui.query, ui.kind, ui.grade);
  if (ui.kind === 'online') {
    list.append(el('p', 'empty', 'No online trophies in this list — all 55 are single-player.'));
  }
  if (!shown.length && ui.kind !== 'online') {
    list.append(el('p', 'empty', 'No trophies match this search and filter.'));
  }
  for (const t of shown) {
    const row = el('div', 'trophy-row' + (isEarned(state, t.id) ? ' earned' : '') + (ui.selected === t.id ? ' selected' : ''));
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, t.id);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('change', () => { toggleEarned(state, t.id); onSelect(t.id, true); });
    row.append(box);
    const badge = el('span', 'grade-badge ' + t.grade, gradeSymbol(t.grade));
    row.append(badge);
    const mid = el('div');
    mid.append(el('div', 'tname', displayName(state, t)));
    mid.append(el('div', 'tdesc', displayDescription(state, t)));
    const meta = el('div', 'tmeta');
    meta.append(chip(gradeLabel(t.grade)));
    meta.append(chip(t.kind, 'kind-' + t.kind));
    if (t.missable === 'watch') meta.append(chip('! MISSABLE WATCH', 'missable'));
    if (t.count) meta.append(chip(getCount(state, t.id) + '/' + t.count.toLocaleString() + ' ' + (t.countLabel || ''), 'counter'));
    if (state.notes[t.id]) meta.append(chip('NOTE'));
    mid.append(meta);
    row.append(mid);
    const right = el('div');
    right.append(chip('#' + t.id));
    row.append(right);
    row.addEventListener('click', (e) => { if (e.target !== box) onSelect(t.id, false); });
    list.append(row);
  }
  split.append(list);
  const detail = el('aside', 'detail');
  renderDetail(doc, state, ui, detail, onSelect);
  split.append(detail);
  view.append(split);
}

export function renderDetail(doc, state, ui, into, onSelect) {
  const t = trophyById(doc, ui.selected) || doc.trophies[0];
  into.replaceChildren();
  into.append(el('h2', null, displayName(state, t)));
  into.append(el('p', 'grade-line', gradeLabel(t.grade).toUpperCase() + ' · #' + t.id + ' · ' + t.kind.toUpperCase()));
  into.append(el('p', 'official', '“' + displayDescription(state, t) + '”'));
  if (t.missable === 'watch') {
    into.append(el('span', 'missable-flag', '! MISSABLE WATCH'));
    into.append(el('p', null, 'Basis (from the official description): ' + t.missableBasis));
  } else {
    into.append(el('p', null, 'Missable: no — ' + t.missableBasis));
  }
  into.append(el('h3', null, 'GUIDE'));
  into.append(el('p', null, t.guide));
  if (t.count) {
    const box = el('div', 'counter-box');
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(t.count);
    input.value = String(getCount(state, t.id));
    input.setAttribute('aria-label', 'Progress counter for ' + t.name);
    const target = el('span', null, '/ ' + t.count.toLocaleString() + ' ' + (t.countLabel || ''));
    const save = el('button', null, 'Save count');
    save.type = 'button';
    save.addEventListener('click', () => { setCount(state, t.id, input.value); onSelect(t.id, true); });
    box.append(input, target, save);
    into.append(el('h3', null, 'YOUR PROGRESS'));
    into.append(box);
  }
  into.append(el('h3', null, 'SOURCES'));
  const src = el('p', 'sources');
  src.textContent = sourceLabels(doc, t).join(' · ') + ' — names, descriptions, grades and count targets from the official list. Steps are drawn from the official description; where it does not decide them, the guide says so instead of inventing locations.';
  into.append(src);
  into.append(el('h3', null, 'YOUR NOTE'));
  const note = document.createElement('textarea');
  note.value = state.notes[t.id] || '';
  note.placeholder = 'Your own note for this trophy…';
  note.setAttribute('aria-label', 'Note for ' + t.name);
  note.addEventListener('change', () => { setNote(state, t.id, note.value); onSelect(t.id, true); });
  into.append(note);
}

export function renderRoadmap(doc, state, onSelect) {
  const view = document.getElementById('view');
  view.replaceChildren();
  for (const stage of STAGES) {
    const members = doc.trophies.filter((t) => t.stage === stage.n && t.id !== 1);
    const done = members.filter((t) => isEarned(state, t.id)).length;
    const card = el('section', 'stage-card');
    card.append(el('h2', null, stage.title + ' — ' + done + '/' + members.length));
    card.append(el('p', 'stage-sub', stage.sub));
    const bar = el('div', 'progress-bar');
    const fill = el('div');
    fill.style.width = Math.round((done / members.length) * 100) + '%';
    bar.append(fill);
    card.append(bar);
    const list = el('div', 'stage-list');
    for (const t of members) {
      const item = el('label', 'stage-item');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = isEarned(state, t.id);
      box.addEventListener('change', () => { toggleEarned(state, t.id); onSelect(t.id, true); });
      item.append(box);
      item.append(el('span', null, displayName(state, t) + (t.missable === 'watch' ? '  [watch]' : '')));
      item.append(chip(gradeLabel(t.grade)));
      list.append(item);
    }
    card.append(list);
    view.append(card);
  }
  const plat = el('section', 'stage-card');
  plat.append(el('h2', null, 'Platinum — Vice Got a Price!'));
  plat.append(el('p', 'stage-sub', 'Earned automatically once the other 54 trophies are yours. Finish stages 1–5 in order and it pops on its own.'));
  view.append(plat);
}

export function renderMissables(doc, state, onSelect) {
  const view = document.getElementById('view');
  view.replaceChildren();
  view.append(el('p', null, 'Only 9 trophies carry a missable watch — and every flag below comes from the official description, with its basis shown. Everything else is a counted total or story progress with no time limit in the description.'));
  const list = el('div', 'miss-list');
  for (const t of doc.trophies.filter((x) => x.missable === 'watch')) {
    const row = el('div', 'miss-row');
    row.append(el('div', 'tname', (isEarned(state, t.id) ? '✓ ' : '') + t.name + '  ·  ' + gradeLabel(t.grade)));
    row.append(el('p', 'basis', 'Basis: ' + t.missableBasis));
    row.append(el('p', 'basis', t.guide));
    row.addEventListener('click', () => onSelect(t.id, false));
    list.append(row);
  }
  view.append(list);
  const safe = el('p', null, 'Safe by design: all chapter and mission trophies come from story progress, and every counted trophy (stunts, races, collectibles, money) can be worked on any time — including after the story, according to the descriptions.');
  view.append(safe);
}

export function renderPlanner(doc, state, onSelect) {
  const view = document.getElementById('view');
  view.replaceChildren();
  view.append(el('p', null, 'Next up, smart-ordered: missable watches first, then the earliest unfinished story stage, then the counters closest to done.'));
  const list = el('div', 'next-list');
  const picks = nextUpList(doc, state).slice(0, 10);
  picks.forEach((pick, i) => {
    const row = el('div', 'next-row');
    row.append(el('div', 'rank', String(i + 1)));
    const mid = el('div');
    mid.append(el('div', 'tname', displayName(state, pick.trophy) + '  ·  ' + gradeLabel(pick.trophy.grade)));
    mid.append(el('div', 'why', pick.why));
    row.append(mid);
    row.append(chip(pick.trophy.missable === 'watch' ? 'WATCH' : pick.trophy.kind));
    row.addEventListener('click', () => onSelect(pick.trophy.id, false));
    list.append(row);
  });
  view.append(list);
}

// Last export/import feedback, kept across re-renders so the Save tab can
// show the exported file's contents and the import result on screen.
let lastExportText = '';
let lastImportStatus = '';

export function renderSave(doc, state, onReload) {
  const view = document.getElementById('view');
  view.replaceChildren();
  const card = el('div', 'save-card');
  card.append(el('h2', null, 'Save & export'));
  const notes = Object.keys(state.notes).length;
  const counts = Object.keys(state.counts).length;
  card.append(el('p', null, 'Progress lives in this browser (localStorage): ' + state.earned.length + ' of ' + doc.trophies.length + ' earned, ' + counts + ' counters, ' + notes + ' notes. Export a backup file, or import one to restore.'));
  const exp = el('button', null, 'Export progress (.json)');
  exp.type = 'button';
  const preview = el('pre', 'export-preview', lastExportText || 'Click “Export progress” to preview the backup file here — the full JSON appears below, exactly as saved.');
  exp.addEventListener('click', () => {
    lastExportText = exportProgress(state);
    preview.textContent = lastExportText;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lastExportText], { type: 'application/json' }));
    a.download = 'sunset-platinum-progress.json';
    a.click();
  });
  card.append(exp);
  card.append(el('h3', null, 'EXPORT PREVIEW'));
  card.append(preview);
  const impLabel = el('label', null, 'Import progress ');
  const imp = document.createElement('input');
  imp.type = 'file';
  imp.accept = 'application/json';
  imp.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const next = importProgress(await file.text());
      lastImportStatus = 'Imported: ' + next.earned.length + ' of ' + doc.trophies.length + ' earned, ' + Object.keys(next.counts).length + ' counters, ' + Object.keys(next.notes).length + ' notes restored.';
      onReload();
    } catch {
      lastImportStatus = 'That file is not a Sunset Platinum export.';
      alert('That file is not a Sunset Platinum export.');
      onReload();
    }
  });
  impLabel.append(imp);
  card.append(impLabel);
  if (lastImportStatus) card.append(el('p', 'import-status', lastImportStatus));
  const reset = el('button', 'danger', 'Reset all progress');
  reset.type = 'button';
  reset.addEventListener('click', () => {
    if (confirm('Clear all earned trophies, counters and notes?')) {
      localStorage.removeItem(STATE_KEY);
      onReload();
    }
  });
  card.append(el('p', null, ''), reset);
  view.append(card);
}
