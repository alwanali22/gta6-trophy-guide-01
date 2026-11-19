// Filters: kind, grade, search text and the spoiler rule.
export function isStoryHidden(trophy, state) {
  return state.spoiler && trophy.kind === 'story' && !state.earned[trophy.id];
}

export function displayName(trophy, state) {
  return isStoryHidden(trophy, state) ? '???' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isStoryHidden(trophy, state) ? 'Hidden until earned — spoiler guard is on.' : trophy.description;
}

export function applyFilters(trophies, state, query, kind, grade) {
  const q = (query || '').trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (kind === 'missable' && !trophy.missable) return false;
    if (kind === 'online') return false;
    if (kind !== 'all' && kind !== 'missable' && trophy.kind !== kind) return false;
    if (grade !== 'all' && trophy.grade !== grade) return false;
    if (q) {
      const hay = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function hiddenStoryCount(trophies, state) {
  return trophies.filter((t) => isStoryHidden(t, state)).length;
}
