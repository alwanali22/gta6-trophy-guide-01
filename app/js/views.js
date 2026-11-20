// All rendering: checklist, detail pane, sources panel, roadmap,
// missables, planner and the save view. No network, no libraries.
import { displayName, displayDescription, isHiddenBySpoiler, counterProgress } from './filters.js';

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function citeMarks(cites) {
  return (cites || []).map((n) => `<span class="cite">[${n}]</span>`).join(' ');
}

export function gradeBadge(grade) {
  return `<span class="badge ${grade}">${grade.toUpperCase()}</span>`;
}

const STAGES = [
  { n: 1, title: 'Story first — protect the one missable', text: 'Chapters 1–2, plus the Chapter 1 balcony meditation. Keep a manual save at the start of each chapter: there is no mission replay.' },
  { n: 2, title: 'Finish the story', text: 'Chapters 3–5 and the final mission. Robbery tools arrive here; start shop and jewelry jobs when they appear.' },
  { n: 3, title: 'Character questlines', text: 'Andy, Kenton, Billy, Randy, Tyrone, Bret, and the 8 stranger strands. All stay open after the story.' },
  { n: 4, title: 'Activities, races & counters', text: 'Stunts, shooting ranges, drone races, races, WAiNK scans and the long counters. Most of this feeds the 100% checklist.' },
  { n: 5, title: 'Robberies, money & cleanup — Platinum', text: 'Vaults, gangs, shops, garages and the 100% checklist itself. A Long Road is the last big step before the platinum.' },
];

export function renderSourcesPanel(el, sources, citedBy) {
  el.innerHTML = '<h3>Sources — read 20 Nov 2026</h3><ol>' + sources.map((s) => {
    const count = citedBy.get(s.n) || 0;
    return `<li><b>[${s.n}] ${escapeHtml(s.name)}</b> — ${escapeHtml(s.title)}<br>` +
      `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.url)}</a><br>` +
      `Read ${escapeHtml(s.read)} · cited by ${count} of 55 guides</li>`;
  }).join('') + '</ol><p>Every guide step cites the source(s) behind that step. Sources 1–2 are the official list; the rest are the guides actually read.</p>';
}

export function renderSourcesFoot(els, sources, citedBy) {
  for (const el of els) {
    el.innerHTML = '<h3>Sources</h3><ol>' + sources.map((s) => {
      const count = citedBy.get(s.n) || 0;
      return `<li><b>[${s.n}] ${escapeHtml(s.name)}</b> — ${escapeHtml(s.title)} — cited by ${count} of 55 guides · <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">open</a></li>`;
    }).join('') + '</ol>';
  }
}

export function renderChecklist(listEl, countEl, earnedEl, filtered, all, state, selectedId) {
  const earned = all.filter((t) => state.earned[t.id]).length;
  countEl.textContent = `${filtered.length} of ${all.length} trophies`;
  earnedEl.textContent = `${earned} earned`;
  if (filtered.length === 0) {
    listEl.innerHTML = '<li>No trophies match. Online: this list has 0 online trophies — every one of the 55 is single-player.</li>';
    return;
  }
  listEl.innerHTML = filtered.map((t) => {
    const hidden = isHiddenBySpoiler(t, state);
    const chips = [];
    if (t.kind) chips.push(t.kind);
    if (t.missable || t.flags.possibly) chips.push('missable');
    if (t.flags.watch) chips.push('watch');
    if (t.flags.unconfirmed) chips.push('unconfirmed');
    if (t.count) chips.push(`${state.counters[t.id] || 0}/${t.count}`);
    return `<li data-action="select" data-id="${t.id}" class="${t.id === selectedId ? 'sel' : ''} ${state.earned[t.id] ? 'done' : ''}">` +
      `<input type="checkbox" data-action="toggle" data-id="${t.id}" ${state.earned[t.id] ? 'checked' : ''} aria-label="Earned: ${escapeHtml(t.name)}">` +
      `<span><span class="tname">${escapeHtml(displayName(t, state))}</span>${gradeBadge(t.grade)}<br>` +
      `<span class="tdesc">${escapeHtml(displayDescription(t, state))}</span><br>` +
      chips.map((c) => `<span class="chip ${c === 'missable' || c === 'watch' ? 'hot' : ''}">${escapeHtml(c)}</span>`).join('') +
      `</span></li>`;
  }).join('');
}

export function renderDetail(el, trophy, state, sources) {
  if (!trophy) {
    el.innerHTML = '<h2>Pick a trophy</h2><p class="off">Choose any trophy on the left to see its guide, its steps with citations, and its counter.</p>';
    return;
  }
  const hidden = isHiddenBySpoiler(trophy, state);
  if (hidden) {
    el.innerHTML = `<h2>??? — hidden until earned</h2><p class="off">Story trophy · ${gradeBadge(trophy.grade)}</p>` +
      `<p>This story trophy is hidden by the spoiler setting. Earn it in the game (or tick it earned on the left) to reveal its name, description and guide.</p>` +
      `<p class="off">Missable? ${escapeHtml(trophy.missableBasis)}</p>`;
    return;
  }
  const warnings = [];
  if (trophy.flags.possibly) warnings.push(`Possibly missable: ${escapeHtml(trophy.missableBasis)} Do the Chapter 1 balcony meditation before leaving Chapter 1, and keep a Chapter 1 save.`);
  if (trophy.flags.watch) warnings.push('Watch: a specific moment that may not repeat — see the steps below.');
  if (trophy.flags.unconfirmed) warnings.push('Unconfirmed: at least one step below has no second source confirming it. Treat it as a report, not a fact.');
  if (trophy.flags.disagree) warnings.push('Sources disagree: the steps below show both versions where the guides differ.');
  const cp = counterProgress(trophy, state);
  const sourceLine = (trophy.sources || []).map((n) => {
    const s = sources.find((x) => x.n === n);
    return s ? `[${n}] ${escapeHtml(s.name)}` : `[${n}]`;
  }).join(' · ');
  el.innerHTML = `<h2>${escapeHtml(trophy.name)}</h2><p class="off">${escapeHtml(trophy.description)} ${gradeBadge(trophy.grade)}</p>` +
    `<p>${escapeHtml(trophy.guide)}</p>` +
    (warnings.length ? `<div class="warn">${warnings.join('<br>')}</div>` : '') +
    `<ol>${(trophy.steps || []).map((st) => `<li>${escapeHtml(st.t)} ${citeMarks(st.c)}</li>`).join('')}</ol>` +
    `<p class="off">Missable? ${escapeHtml(trophy.missableBasis)}</p>` +
    (cp ? `<div class="counter"><label>Progress: <input type="number" min="0" max="${cp.target}" value="${cp.value}" data-counter="${trophy.id}" aria-label="Counter for ${escapeHtml(trophy.name)}"> / ${cp.target} ${escapeHtml(trophy.countLabel || '')}</label></div>` : '') +
    `<label>Note<br><textarea class="notebox" data-note="${trophy.id}" placeholder="Your own note — saved on this device.">${escapeHtml(state.notes[trophy.id] || '')}</textarea></label>` +
    `<p class="off">Sources: ${sourceLine}</p>`;
}

export function renderRoadmap(el, trophies, state) {
  const earned = trophies.filter((t) => state.earned[t.id]).length;
  const pct = Math.round((earned / trophies.length) * 100);
  el.innerHTML = `<div class="plat"><div class="big">Vice Got a Price! — ${earned}/55 · ${pct}%</div>` +
    `<p>The platinum needs the other 54 trophies. Hardest step: A Long Road (100% completion). Only 1 trophy is possibly missable; everything else stays open after the story.</p></div>` +
    STAGES.map((st) => {
      const list = trophies.filter((t) => t.stage === st.n);
      const done = list.filter((t) => state.earned[t.id]).length;
      const p = list.length ? Math.round((done / list.length) * 100) : 0;
      return `<div class="stage"><h2>Stage ${st.n} — ${escapeHtml(st.title)}</h2><p>${escapeHtml(st.text)}</p>` +
        `<div class="bar"><i style="width:${p}%"></i></div><p>${done}/${list.length} done · ${p}%</p>` +
        `<ul>${list.map((t) => `<li><input type="checkbox" data-action="toggle" data-id="${t.id}" ${state.earned[t.id] ? 'checked' : ''}> ` +
          `<span data-action="select" data-id="${t.id}" style="cursor:pointer">${escapeHtml(displayName(t, state))}</span> ${gradeBadge(t.grade)}</li>`).join('')}</ul></div>`;
    }).join('');
}

export function renderMissables(el, trophies) {
  const watch = trophies.filter((t) => t.flags.possibly || t.flags.watch);
  const unconf = trophies.filter((t) => t.flags.unconfirmed);
  const disag = trophies.filter((t) => t.flags.disagree);
  const card = (t, why) => `<div class="misscard"><h2>${escapeHtml(t.name)} ${gradeBadge(t.grade)}</h2>` +
    `<p><b>${escapeHtml(why)}</b></p><p>${escapeHtml(t.guide)}</p><p class="off">Basis: ${escapeHtml(t.missableBasis)}</p>` +
    `<p><button class="act ghost" type="button" data-action="open" data-id="${t.id}">Open guide</button></p></div>`;
  el.innerHTML = `<h2 style="font-family:Georgia,Palatino,serif">Missables &amp; watch list</h2>` +
    `<p>Missable flags come only from the official descriptions, with the basis shown. On top of that, a trophy is “possibly missable” when the sources disagree about whether it can be missed, or when a one-time moment is unconfirmed.</p>` +
    `<h3>Possibly missable / watch (${watch.length})</h3>` +
    (watch.map((t) => card(t, t.flags.possibly ? 'Possibly missable — the Chapter 1 meditation may be required and cannot be repeated.' : 'Watch — a timed moment (Yago’s hourglass race) to catch while it is open.')).join('') || '<p>None.</p>') +
    `<h3>Unconfirmed (${unconf.length})</h3>` +
    (unconf.map((t) => card(t, 'Unconfirmed — at least one step has no second source confirming it.')).join('')) +
    `<h3>Sources disagree (${disag.length})</h3>` +
    (disag.map((t) => card(t, 'Sources disagree — the guide shows both versions.')).join('')) +
    `<p>Every other trophy: the official description names no one-time moment, and the guides report it stays available after the story. Story trophies pop automatically and cannot be missed.</p>`;
}

export function renderPlanner(el, plan) {
  const top = plan.slice(0, 12);
  el.innerHTML = `<h2 style="font-family:Georgia,Palatino,serif">Next up</h2>` +
    `<p>Ordered by what matters most: possibly-missable and watch trophies first, then the earliest unfinished story stage, then the counters nearest completion.</p>` +
    top.map((p, i) => `<div class="planrow" data-action="open" data-id="${p.trophy.id}"><span class="rank">${i + 1}</span>` +
      `<span><b>${escapeHtml(p.trophy.name)}</b> ${gradeBadge(p.trophy.grade)}<br><span class="why">${escapeHtml(p.reason)}</span></span></div>`).join('') +
    (plan.length === 0 ? '<p>Everything is earned — Vice Got a Price! is yours.</p>' : `<p>${plan.length} trophies still open.</p>`);
}

export function renderSave(el, state, trophies) {
  const earned = trophies.filter((t) => state.earned[t.id]).length;
  el.innerHTML = `<div class="savegrid"><div class="savecard"><h2>Your progress</h2>` +
    `<p><b>${earned}/55 trophies earned.</b> Progress, counters and notes are saved in this browser (localStorage) as you tick them.</p>` +
    `<p><button class="act" type="button" data-action="export">Download export (.json)</button>` +
    `<button class="act ghost" type="button" data-action="reset">Reset progress</button></p>` +
    `<p class="status" id="importStatus">Import status: nothing imported yet.</p></div>` +
    `<div class="savecard"><h2>Export preview</h2><p>This is exactly what the download contains.</p>` +
    `<textarea class="export" id="exportPreview" readonly></textarea>` +
    `<p><label>Import a file: <input type="file" id="importFile" accept="application/json,.json"></label></p></div></div>`;
}
