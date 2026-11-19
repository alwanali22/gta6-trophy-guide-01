// Filtering for the checklist: search text, kind, grade, and the spoiler guard.
import { isEarned } from './store.js';

export function applyFilters(doc, state, query, kind, grade) {
  const q = query.trim().toLowerCase();
  return doc.trophies.filter((t) => {
    if (kind === 'online') return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

export function isHiddenBySpoiler(state, trophy) {
  return state.spoiler && trophy.kind === 'story' && !isEarned(state, trophy.id);
}

export function displayName(state, trophy) {
  return isHiddenBySpoiler(state, trophy) ? '??? — story trophy hidden' : trophy.name;
}

export function displayDescription(state, trophy) {
  return isHiddenBySpoiler(state, trophy)
    ? 'Spoiler guard is on: earn this trophy to reveal its name and description.'
    : trophy.description;
}

// Smart Next-up order: watch-list missables first, then the earliest unfinished story stage, then nearest counters.
export function nextUpList(doc, state) {
  const remaining = doc.trophies.filter((t) => !isEarned(state, t.id));
  const byId = new Map(doc.trophies.map((t) => [t.id, t]));
  const scored = remaining.map((t) => {
    let score = 0;
    let why = '';
    if (t.missable === 'watch') {
      score += 100;
      why = 'Missable watch — do this while the moment is available.';
    } else if (t.kind === 'story') {
      score += 50 + (6 - t.stage) * 5;
      why = 'Next in the story — stage ' + t.stage + ' of the roadmap.';
    } else if (t.count) {
      const done = state.counts[t.id] || 0;
      const ratio = done / t.count;
      score += 20 + ratio * 25;
      why = 'Closest counter: ' + done + ' of ' + t.count.toLocaleString() + ' ' + (t.countLabel || '') + '.';
    } else {
      score += 10;
      why = 'Open activity — can be done any time.';
    }
    return { trophy: t, score, why };
  });
  scored.sort((a, b) => b.score - a.score || a.trophy.id - b.trophy.id);
  return scored;
}
