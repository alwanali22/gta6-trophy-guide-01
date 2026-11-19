// Progress saved in the browser (localStorage), exportable and importable.
export const STORAGE_KEY = 'sunset-platinum-v1';
export const APP_NAME = 'sunset-platinum';

export function blankState() {
  return { earned: {}, counters: {}, notes: {}, spoiler: true };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    const state = blankState();
    if (parsed && typeof parsed === 'object') {
      if (parsed.earned) state.earned = parsed.earned;
      if (parsed.counters) state.counters = parsed.counters;
      if (parsed.notes) state.notes = parsed.notes;
      if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
    }
    return state;
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function earnedCount(state) {
  return Object.values(state.earned).filter(Boolean).length;
}

export function exportPayload(state) {
  return {
    app: APP_NAME,
    version: 1,
    earned: state.earned,
    counters: state.counters,
    notes: state.notes,
    spoiler: state.spoiler,
  };
}

export function exportText(state) {
  return JSON.stringify(exportPayload(state), null, 2);
}

export function downloadExport(state) {
  const blob = new Blob([exportText(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sunset-platinum-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseImport(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
  const state = blankState();
  if (parsed.earned) state.earned = parsed.earned;
  if (parsed.counters) state.counters = parsed.counters;
  if (parsed.notes) state.notes = parsed.notes;
  if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
  return state;
}

export function importSummary(state) {
  const counters = Object.keys(state.counters).length;
  const notes = Object.keys(state.notes).filter((k) => state.notes[k]).length;
  return 'Imported: ' + earnedCount(state) + ' of 55 earned, ' + counters + ' counters, ' + notes + ' notes restored.';
}
