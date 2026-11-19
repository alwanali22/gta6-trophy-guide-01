// Load the official trophy list with this guide's own guides.
export async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('trophies.json failed to load');
  const data = await response.json();
  return data.trophies;
}

export function trophyById(trophies, id) {
  return trophies.find((t) => t.id === id) || null;
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function countText(trophy) {
  if (!trophy.count) return '';
  return trophy.count.toLocaleString('en-US');
}
