// Progress saved in the browser (localStorage) plus export / import.
// Nothing leaves the device except the file the reader chooses to download.
export const STORAGE_KEY = 'gta6-guide-v5';

export function defaultProgress() {
  return { earned: {}, counters: {}, notes: {}, spoiler: true };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return { ...defaultProgress(), ...parsed };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportProgressText(state) {
  return JSON.stringify({ app: 'leonida-platinum-gta6', version: 1, exported: new Date().toISOString(), progress: state }, null, 2);
}

export function downloadExport(state) {
  const blob = new Blob([exportProgressText(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importProgressText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  const progress = parsed.progress || parsed;
  if (typeof progress !== 'object' || progress === null) {
    return { ok: false, error: 'That file holds no progress to import.' };
  }
  const state = { ...defaultProgress(), ...progress };
  if (typeof state.earned !== 'object') state.earned = {};
  if (typeof state.counters !== 'object') state.counters = {};
  if (typeof state.notes !== 'object') state.notes = {};
  return { ok: true, state };
}
