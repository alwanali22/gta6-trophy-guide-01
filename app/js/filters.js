// Filtering, the spoiler rule, and the Next-up planner ordering.
export function isStory(trophy) {
  return trophy.kind === 'story';
}

export function isHiddenBySpoiler(trophy, state) {
  return state.spoiler && isStory(trophy) && !state.earned[trophy.id];
}

export function displayName(trophy, state) {
  return isHiddenBySpoiler(trophy, state) ? '??? — hidden until earned' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isHiddenBySpoiler(trophy, state) ? 'Story trophy — name and description hidden by the spoiler setting until earned.' : trophy.description;
}

export function applyTrophyFilters(trophies, state, query) {
  const q = (query.search || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (query.kind === 'story' && t.kind !== 'story') return false;
    if (query.kind === 'missable' && !t.missable && !t.flags.possibly && !t.flags.watch) return false;
    if (query.kind === 'collectibles' && t.kind !== 'collectibles') return false;
    if (query.kind === 'activities' && t.kind !== 'activities') return false;
    if (query.kind === 'online') return false;
    if (query.grade !== 'all' && t.grade !== query.grade) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

export function counterProgress(trophy, state) {
  if (!trophy.count) return null;
  const value = Number(state.counters[trophy.id] || 0);
  return { value, target: trophy.count, ratio: Math.min(1, value / trophy.count) };
}

// Next up: possibly-missable / watch trophies first, then the earliest
// unfinished story stage, then the counters nearest completion.
export function planNextUp(trophies, state) {
  const open = trophies.filter((t) => !state.earned[t.id]);
  const scored = open.map((t) => {
    let score = 0;
    let reason = '';
    if (t.flags.possibly || t.flags.watch) {
      score += 1000;
      reason = t.flags.possibly ? 'Possibly missable — do it before its moment passes.' : 'Watch — a timed moment to catch while it is open.';
    } else if (t.kind === 'story') {
      score += 500 - t.stage * 10;
      reason = `Story, stage ${t.stage} — earliest unfinished story step.`;
    } else {
      const cp = counterProgress(t, state);
      if (cp && cp.ratio > 0) {
        score += 100 + cp.ratio * 100;
        reason = `Counter nearest done: ${cp.value}/${cp.target} ${t.countLabel || ''}.`;
      } else if (cp) {
        score += 50;
        reason = `Counter trophy: ${cp.target} ${t.countLabel || ''} to go.`;
      } else {
        score += 10;
        reason = 'Cleanup trophy — do it whenever its moment comes up.';
      }
    }
    return { trophy: t, score, reason };
  });
  scored.sort((a, b) => b.score - a.score || a.trophy.stage - b.trophy.stage || a.trophy.id - b.trophy.id);
  return scored;
}
