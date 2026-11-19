// Views: checklist + detail pane, roadmap, missables, next-up planner, save page.
import { gradeLabel, countText } from './data.js';
import { displayName, displayDescription, applyFilters, isStoryHidden } from './filters.js';
import { earnedCount, exportText, importSummary } from './store.js';

export const STAGE_NAMES = {
  1: 'First steps in Leonida',
  2: 'Chapters 2-3 and the stranger strands',
  3: 'Chapters 3-4 and the range',
  4: 'The finale and the big grinds',
  5: 'Cleanup and the platinum',
};

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function gradeBadge(trophy) {
  return el('span', 'grade grade-' + trophy.grade, gradeLabel(trophy.grade));
}

function kindChip(trophy) {
  return el('span', 'chip', trophy.kind);
}

function missableChip(trophy) {
  if (!trophy.missable) return null;
  return el('span', 'chip missable', 'MISSABLE — WATCH');
}

function counterChip(trophy, state) {
  if (!trophy.count) return null;
  const value = state.counters[trophy.id] || 0;
  return el('span', 'chip', value + '/' + countText(trophy) + ' ' + trophy.countLabel);
}

export function renderChecklistInto(listEl, detailEl, ctx) {
  listEl.textContent = '';
  const rows = applyFilters(ctx.trophies, ctx.state, ctx.query, ctx.kind, ctx.grade);
  if (rows.length === 0) {
    const note = el('div', 'empty-note', ctx.kind === 'online'
      ? 'No online trophies in this list — all 55 trophies are earned in single-player.'
      : 'No trophies match these filters.');
    listEl.appendChild(note);
  }
  rows.forEach((trophy) => {
    const row = el('div', 'trow' + (ctx.state.earned[trophy.id] ? ' earned' : ''));
    row.dataset.id = String(trophy.id);
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'earned';
    box.checked = !!ctx.state.earned[trophy.id];
    box.setAttribute('aria-label', 'Mark earned: ' + trophy.name);
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      ctx.onToggle(trophy.id, box.checked);
    });
    row.appendChild(box);
    const main = el('div', 'tmain');
    main.appendChild(el('div', 'tname', displayName(trophy, ctx.state)));
    main.appendChild(el('div', 'tdesc', displayDescription(trophy, ctx.state)));
    const chips = el('div', 'chips');
    chips.appendChild(kindChip(trophy));
    const miss = missableChip(trophy);
    if (miss) chips.appendChild(miss);
    const counter = counterChip(trophy, ctx.state);
    if (counter) chips.appendChild(counter);
    main.appendChild(chips);
    row.appendChild(main);
    row.appendChild(gradeBadge(trophy));
    row.addEventListener('click', (event) => {
      if (event.target.closest('input, textarea, select')) return;
      ctx.onSelect(trophy.id);
    });
    listEl.appendChild(row);
  });
  const selected = ctx.trophies.find((t) => t.id === ctx.selectedId) || rows[0];
  if (selected) renderDetailInto(detailEl, selected, ctx);
  else detailEl.textContent = '';
}

export function renderDetailInto(detailEl, trophy, ctx) {
  detailEl.textContent = '';
  const hidden = isStoryHidden(trophy, ctx.state);
  detailEl.appendChild(el('h2', null, displayName(trophy, ctx.state)));
  const gradeLine = gradeLabel(trophy.grade) + ' trophy' + (trophy.count ? ' — ' + (ctx.state.counters[trophy.id] || 0) + '/' + countText(trophy) + ' ' + trophy.countLabel : '');
  detailEl.appendChild(el('p', 'grade-line', gradeLine));
  detailEl.appendChild(el('p', null, displayDescription(trophy, ctx.state)));
  if (hidden) {
    detailEl.appendChild(el('p', null, 'Spoiler guard is on: the guide for this story trophy appears once it is earned.'));
    return;
  }
  detailEl.appendChild(el('p', null, trophy.guide));
  if (trophy.steps && trophy.steps.length) {
    const stepsTitle = el('p', null, 'Steps');
    stepsTitle.style.fontWeight = '700';
    detailEl.appendChild(stepsTitle);
    const list = document.createElement('ol');
    trophy.steps.forEach((step) => list.appendChild(el('li', null, step)));
    detailEl.appendChild(list);
  }
  if (trophy.missable && trophy.missableBasis) {
    detailEl.appendChild(el('p', 'basis', 'Missable — watch: ' + trophy.missableBasis));
  }
  detailEl.appendChild(el('p', 'sources', 'Sources: ' + trophy.sources.join(' · ')));
  if (trophy.count) {
    const wrap = el('div', 'counter-row');
    wrap.appendChild(el('label', null, 'Your progress — ' + trophy.countLabel));
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'counter-input';
    input.min = '0';
    input.max = String(trophy.count);
    input.value = String(ctx.state.counters[trophy.id] || 0);
    input.setAttribute('aria-label', 'Progress for ' + trophy.name);
    input.addEventListener('change', () => {
      const value = Math.max(0, Math.min(trophy.count, Number(input.value) || 0));
      ctx.onCounter(trophy.id, value);
    });
    wrap.appendChild(input);
    wrap.appendChild(el('span', null, ' / ' + countText(trophy) + ' ' + trophy.countLabel));
    detailEl.appendChild(wrap);
  }
  const noteWrap = el('div', 'note-row');
  noteWrap.appendChild(el('label', null, 'Your notes'));
  const note = document.createElement('textarea');
  note.className = 'note-input';
  note.placeholder = 'Add a note for this trophy — saved in your browser.';
  note.value = ctx.state.notes[trophy.id] || '';
  note.addEventListener('input', () => ctx.onNote(trophy.id, note.value));
  noteWrap.appendChild(note);
  detailEl.appendChild(noteWrap);
}

export function renderRoadmapInto(viewEl, ctx) {
  viewEl.textContent = '';
  const total = ctx.trophies.length;
  const done = earnedCount(ctx.state);
  const card = el('div', 'platinum-card');
  card.appendChild(el('h2', null, 'Road to the platinum'));
  card.appendChild(el('p', null, done + ' of ' + total + ' trophies earned (' + Math.round((done / total) * 100) + '%). Finish all five stages, in order, and Vice Got a Price! unlocks. The missable watch list lives on the Missables tab — clear it early.'));
  viewEl.appendChild(card);
  for (let stage = 1; stage <= 5; stage++) {
    const members = ctx.trophies.filter((t) => t.stage === stage);
    const stageDone = members.filter((t) => ctx.state.earned[t.id]).length;
    const pct = members.length ? Math.round((stageDone / members.length) * 100) : 0;
    const box = el('div', 'stage');
    box.appendChild(el('h2', null, 'Stage ' + stage + ' — ' + STAGE_NAMES[stage]));
    box.appendChild(el('p', 'stage-meta', stageDone + '/' + members.length + ' earned · ' + pct + '%'));
    const bar = el('div', 'stage-bar');
    const fill = el('span');
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    box.appendChild(bar);
    const list = document.createElement('ul');
    members.forEach((trophy) => {
      const item = el('li', ctx.state.earned[trophy.id] ? 'done' : '', displayName(trophy, ctx.state) + ' — ' + gradeLabel(trophy.grade) + (trophy.missable ? ' · MISSABLE' : ''));
      item.dataset.id = String(trophy.id);
      list.appendChild(item);
    });
    box.appendChild(list);
    viewEl.appendChild(box);
  }
}

export function renderMissablesInto(viewEl, ctx) {
  viewEl.textContent = '';
  const watch = ctx.trophies.filter((t) => t.missable);
  const done = watch.filter((t) => ctx.state.earned[t.id]).length;
  viewEl.appendChild(el('p', null, done + ' of ' + watch.length + ' watch trophies earned. Flags come only from the official descriptions — each card shows its basis. When in doubt, do the watch item the first time the moment appears.'));
  watch.forEach((trophy) => {
    const box = el('div', 'miss-row');
    box.appendChild(el('h3', null, (ctx.state.earned[trophy.id] ? '✓ ' : '') + trophy.name + ' — ' + gradeLabel(trophy.grade)));
    box.appendChild(el('p', 'basis', 'Basis: ' + trophy.missableBasis));
    box.appendChild(el('p', null, trophy.guide));
    box.appendChild(el('p', 'sources', 'Sources: ' + trophy.sources.join(' · ')));
    viewEl.appendChild(box);
  });
}

export function renderPlannerInto(viewEl, ctx) {
  viewEl.textContent = '';
  const unfinished = ctx.trophies.filter((t) => !ctx.state.earned[t.id]);
  const missables = unfinished.filter((t) => t.missable);
  const story = unfinished.filter((t) => t.kind === 'story' && !t.missable)
    .sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  const counters = unfinished.filter((t) => t.count && !t.missable)
    .sort((a, b) => (((ctx.state.counters[b.id] || 0) / b.count) - ((ctx.state.counters[a.id] || 0) / a.count)));
  const rest = unfinished.filter((t) => !t.missable && t.kind !== 'story' && !t.count)
    .sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  const picks = [];
  const add = (trophy, why) => { if (picks.length < 10 && !picks.some((p) => p.trophy.id === trophy.id)) picks.push({ trophy, why }); };
  missables.forEach((t) => add(t, 'Missable first — do it while the moment is available.'));
  story.slice(0, 4).forEach((t) => add(t, 'Earliest unfinished story stage (stage ' + t.stage + ').'));
  counters.slice(0, 3).forEach((t) => {
    const value = ctx.state.counters[t.id] || 0;
    add(t, 'Nearest counter: ' + value + '/' + countText(t) + ' ' + t.countLabel + ' done.');
  });
  rest.slice(0, 3).forEach((t) => add(t, 'Next in stage ' + t.stage + ' — ' + STAGE_NAMES[t.stage] + '.'));
  viewEl.appendChild(el('p', null, 'Next up, in order: missables first, then the earliest unfinished story stage, then the nearest counters. ' + unfinished.length + ' trophies left.'));
  if (picks.length === 0) {
    viewEl.appendChild(el('div', 'empty-note', 'Everything is earned — the platinum is yours.'));
    return;
  }
  picks.forEach(({ trophy, why }) => {
    const box = el('div', 'next-row');
    box.appendChild(el('h3', null, trophy.name + ' — ' + gradeLabel(trophy.grade)));
    box.appendChild(el('p', 'why', why));
    box.appendChild(el('p', null, trophy.description));
    box.addEventListener('click', () => ctx.onSelect(trophy.id));
    viewEl.appendChild(box);
  });
}

export function renderSaveInto(viewEl, ctx) {
  viewEl.textContent = '';
  const panel = el('div', 'save-panel');
  panel.appendChild(el('h2', null, 'Save & Export'));
  const done = earnedCount(ctx.state);
  const counters = Object.keys(ctx.state.counters).length;
  const notes = Object.keys(ctx.state.notes).filter((k) => ctx.state.notes[k]).length;
  panel.appendChild(el('p', null, done + ' of 55 trophies earned · ' + counters + ' counters tracked · ' + notes + ' notes saved. Progress is stored in this browser (localStorage) and never leaves it unless you export it.'));
  const status = el('p', null, ctx.lastImport || 'No import yet — import a progress file to restore it.');
  status.id = 'importStatus';
  panel.appendChild(status);
  const exportBtn = el('button', null, 'Export progress');
  exportBtn.id = 'exportBtn';
  exportBtn.addEventListener('click', () => {
    ctx.onExport();
    preview.textContent = exportText(ctx.state);
  });
  panel.appendChild(exportBtn);
  const importLabel = el('label', null, ' Import progress ');
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.id = 'importFile';
  importInput.accept = 'application/json';
  importInput.addEventListener('change', () => ctx.onImportFile(importInput));
  importLabel.appendChild(importInput);
  panel.appendChild(importLabel);
  const resetBtn = el('button', 'secondary', 'Reset progress');
  resetBtn.id = 'resetBtn';
  resetBtn.addEventListener('click', () => ctx.onReset());
  panel.appendChild(resetBtn);
  panel.appendChild(el('p', null, 'Export preview — the exact file the Export button downloads:'));
  const preview = document.createElement('pre');
  preview.id = 'exportPreview';
  preview.textContent = exportText(ctx.state);
  panel.appendChild(preview);
  viewEl.appendChild(panel);
  void importSummary;
}
