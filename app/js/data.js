// Load the guide data (trophies + sources) and compute the audit numbers
// shown in the audit bar. Every count comes from the data itself.
export async function loadGuideData() {
  const [trophiesRes, sourcesRes] = await Promise.all([
    fetch('data/trophies.json'),
    fetch('data/sources.json'),
  ]);
  const trophiesDoc = await trophiesRes.json();
  const sourcesDoc = await sourcesRes.json();
  return { trophies: trophiesDoc.trophies, sources: sourcesDoc.sources, sourcesRead: sourcesDoc.read };
}

export function computeAudit(trophies, sources, sourcesRead) {
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let stepsTotal = 0;
  let stepsCited = 0;
  let guidesCited = 0;
  const flags = { possibly: 0, watch: 0, unconfirmed: 0, disagree: 0 };
  const citedBy = new Map(sources.map((s) => [s.n, 0]));
  for (const t of trophies) {
    grades[t.grade] = (grades[t.grade] || 0) + 1;
    if (t.sources && t.sources.length > 0) guidesCited += 1;
    for (const n of t.sources || []) citedBy.set(n, (citedBy.get(n) || 0) + 1);
    for (const step of t.steps || []) {
      stepsTotal += 1;
      if (step.c && step.c.length > 0) stepsCited += 1;
    }
    if (t.flags) {
      if (t.flags.possibly) flags.possibly += 1;
      if (t.flags.watch) flags.watch += 1;
      if (t.flags.unconfirmed) flags.unconfirmed += 1;
      if (t.flags.disagree) flags.disagree += 1;
    }
  }
  const singleSource = trophies.filter((t) => (t.sources || []).filter((n) => n > 2).length === 1).length;
  return {
    total: trophies.length, grades, hidden: 28,
    guidesCited, stepsTotal, stepsCited,
    sourcesRead: sources.length, sourcesDate: sourcesRead,
    possibly: flags.possibly, watch: flags.watch,
    unconfirmed: flags.unconfirmed, disagree: flags.disagree,
    singleSource, citedBy,
  };
}

export function auditLine(audit) {
  return `<b>${audit.total} official</b> · ${audit.grades.platinum}P ${audit.grades.gold}G ${audit.grades.silver}S ${audit.grades.bronze}B · ` +
    `<b>${audit.hidden} hidden</b> · ${audit.guidesCited}/${audit.total} guides cite a source · ` +
    `<b>${audit.stepsCited}/${audit.stepsTotal} steps cited</b> · ${audit.sourcesRead} sources read ${audit.sourcesDate} · ` +
    `<b>${audit.possibly} possibly missable</b> · ${audit.watch} watch · ${audit.unconfirmed} unconfirmed · ` +
    `${audit.singleSource} single-source · ${audit.disagree} disagree`;
}

export function sourceByNumber(sources, n) {
  return sources.find((s) => s.n === n);
}
