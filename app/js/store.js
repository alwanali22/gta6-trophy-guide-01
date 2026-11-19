// Progress state in localStorage: earned ids, per-trophy counters, per-trophy notes, spoiler setting.
export const STATE_KEY = 'sunset-platinum-v1';

export function defaultState() {
  return { earned: [], counts: {}, notes: {}, spoiler: true };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      spoiler: parsed.spoiler !== false,
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  const at = state.earned.indexOf(id);
  if (at === -1) state.earned.push(id);
  else state.earned.splice(at, 1);
  saveState(state);
}

export function setCount(state, id, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  state.counts[id] = n;
  saveState(state);
  return n;
}

export function getCount(state, id) {
  return state.counts[id] || 0;
}

export function setNote(state, id, text) {
  if (text.trim()) state.notes[id] = text.trim();
  else delete state.notes[id];
  saveState(state);
}

export function exportProgress(state) {
  return JSON.stringify({ app: 'sunset-platinum', version: 1, exportedAt: new Date().toISOString(), state }, null, 2);
}

export function importProgress(text) {
  const parsed = JSON.parse(text);
  const incoming = parsed.state || parsed;
  const next = defaultState();
  if (Array.isArray(incoming.earned)) next.earned = incoming.earned.filter((n) => Number.isInteger(n));
  if (incoming.counts && typeof incoming.counts === 'object') next.counts = incoming.counts;
  if (incoming.notes && typeof incoming.notes === 'object') next.notes = incoming.notes;
  if (typeof incoming.spoiler === 'boolean') next.spoiler = incoming.spoiler;
  saveState(next);
  return next;
}
