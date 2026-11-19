// Load the trophy list and expose lookups. The list itself lives in data/trophies.json.
export async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  return doc;
}

export function trophyById(doc, id) {
  return doc.trophies.find((t) => t.id === id);
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function gradeSymbol(grade) {
  if (grade === 'platinum') return '★';
  if (grade === 'gold') return 'G';
  if (grade === 'silver') return 'S';
  return 'B';
}

export function sourceLabels(doc, trophy) {
  return trophy.sources.map((i) => doc.sources[i].label);
}

export const STAGES = [
  { n: 1, title: 'Stage 1 — Arrival', sub: 'First steps in Leonida: opening mission, first activities, first sights.' },
  { n: 2, title: 'Stage 2 — Chapters 1–2', sub: 'The early story: chapters 1 and 2 plus the first character strands.' },
  { n: 3, title: 'Stage 3 — Chapters 3–4 & finale', sub: 'The late story: chapters 3 and 4, stranger strands, the final mission.' },
  { n: 4, title: 'Stage 4 — Activities, skills & side hustles', sub: 'The long middle: ranges, races, stunts, robberies, choices, money.' },
  { n: 5, title: 'Stage 5 — Collectibles & 100%', sub: 'Cleanup: cards, WAiNK spots, vehicles, garages, and the 100% gold.' },
];
