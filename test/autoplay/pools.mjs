// Rebuilds the word pools exactly as shared/game.js does: holiday words are claimed first,
// so an everyday duplicate is dropped. Lets the checks know which words may appear and how
// long each pool's "recently shown" list may grow.
export const MODES = ["easy", "hard"];
export const CATS = ["songs", "movies", "actions", "books", "quotes", "chars"];
export const RECENT_SHARE = 0.7;
export const THEMED_SHARE = 0.75;
export const THEMED_FULL = 12;

const key = w => w.toLowerCase().replace(/[^a-z0-9]/g, "");

export function buildPools(themeWords, everyday) {
  const seen = new Set();
  const claim = words => (words || []).filter(w => { const k = key(w); if (seen.has(k)) return false; seen.add(k); return true; });
  const pools = {};
  for (const c of CATS) { pools[c] = {}; for (const m of MODES) pools[c][m] = { themed: claim(themeWords[c]?.[m]) }; }
  for (const c of CATS) for (const m of MODES) pools[c][m].everyday = claim(everyday[c]?.[m]);
  return pools;
}

export const poolFor = (pools, recentKey) => {
  const [c, m, src] = recentKey.split(":");
  return pools[c]?.[m]?.[src];
};
export const recentCap = words => Math.floor(words.length * RECENT_SHARE);
export const expectedThemedShare = p =>
  !p.themed.length ? 0 : !p.everyday.length ? 1 : THEMED_SHARE * Math.min(1, p.themed.length / THEMED_FULL);
