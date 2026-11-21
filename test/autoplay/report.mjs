// Sums up many bot games: failures (with the seed to replay each), how often holiday words
// came up against what the game intends, which holiday words never came up, and words that
// didn't fit on screen.
import { expectedThemedShare } from "./pools.mjs";

export function summarize(results, poolsByHoliday) {
  const failures = results.filter(g => g.failure).map(g => ({ seed: g.seed, holiday: g.holiday, ...g.failure }));
  const holidays = {};
  for (const g of results) {
    const h = holidays[g.holiday] ||= { games: 0, turns: 0, steps: 0, draws: {}, seen: new Set(), layout: {} };
    h.games++; h.turns += g.turns; h.steps += g.steps;
    for (const [k, w] of g.draws) {
      const [cat, mode, src] = k.split(":");
      const d = h.draws[`${cat}:${mode}`] ||= { themed: 0, everyday: 0 };
      d[src]++;
      if (src === "themed") h.seen.add(`${cat}:${mode}:${w}`);
    }
    for (const l of g.layout) h.layout[`${l.where}: ${l.word}`] = (h.layout[`${l.where}: ${l.word}`] || 0) + 1;
  }

  const out = { games: results.length, failed: failures.length, failures, holidays: {} };
  for (const [id, h] of Object.entries(holidays)) {
    const pools = poolsByHoliday[id] || {};
    const share = {}, warnings = [];
    for (const [cm, d] of Object.entries(h.draws)) {
      const [cat, mode] = cm.split(":");
      const n = d.themed + d.everyday, expected = pools[cat] ? expectedThemedShare(pools[cat][mode]) : 0;
      const observed = d.themed / n;
      share[cm] = { draws: n, observed: +observed.toFixed(3), expected: +expected.toFixed(3) };
      // Flag only differences far outside chance (5 standard errors) once there are enough draws.
      const se = Math.sqrt(expected * (1 - expected) / n);
      if (n >= 200 && Math.abs(observed - expected) > Math.max(5 * se, 0.02))
        warnings.push(`${cm}: holiday words on ${(observed * 100).toFixed(1)}% of cards, expected ${(expected * 100).toFixed(1)}%`);
    }
    const unseen = [];
    for (const [cat, modes] of Object.entries(pools)) for (const [mode, p] of Object.entries(modes))
      for (const w of p.themed) if (!h.seen.has(`${cat}:${mode}:${w}`)) unseen.push(`${cat}:${mode}:${w}`);
    const total = Object.values(pools).reduce((s, m) => s + Object.values(m).reduce((t, p) => t + p.themed.length, 0), 0);
    out.holidays[id] = {
      games: h.games, turns: h.turns, steps: h.steps,
      holidayWordsSeen: `${total - unseen.length}/${total}`, unseen,
      themedShare: share, warnings,
      layout: Object.entries(h.layout).sort((a, b) => b[1] - a[1]).map(([what, times]) => ({ what, times }))
    };
  }
  return out;
}

export function print(report, seconds) {
  const lines = [`${report.games} games, ${report.failed} failed, ${seconds.toFixed(1)}s`];
  for (const [id, h] of Object.entries(report.holidays)) {
    lines.push(`  ${id}: ${h.turns} turns, ${h.steps} checks, holiday words seen ${h.holidayWordsSeen}` +
      (h.layout.length ? `, ${h.layout.length} layout issue(s)` : ""));
    for (const w of h.warnings) lines.push(`    ! ${w}`);
    for (const l of h.layout.slice(0, 10)) lines.push(`    layout ${l.what} (x${l.times})`);
  }
  for (const f of report.failures.slice(0, 20))
    lines.push(`  FAIL ${f.holiday} seed ${f.seed} step ${f.step} [${f.action}]: ${f.message}`);
  if (report.failures.length) lines.push(`  replay one: npm run autoplay -- --replay <seed> --holiday <id>`);
  return lines.join("\n");
}
