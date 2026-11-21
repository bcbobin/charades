// Invariants checked after every bot action. Each returns a list of problems (strings);
// an empty list means the game is in the state the bot's model says it should be in.
import { poolFor, recentCap } from "./pools.mjs";

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// What one page.evaluate reads back: saved state, what is on screen, layout overflow.
export function snapshot() {
  const q = s => document.querySelector(s);
  const shown = el => !!el && !el.classList.contains("hidden") && el.getClientRects().length > 0;
  const id = window.THEME.id;
  const load = k => { try { return JSON.parse(localStorage.getItem(`charades:${id}:${k}`)); } catch { return null; } };
  const sticksOut = (el, box) => {
    if (!el || !box) return false;
    const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    return r.left < b.left - 1 || r.right > b.right + 1 || el.scrollWidth > el.clientWidth + 1;
  };
  const screen = q("#act")?.classList.contains("show") ? "act"
    : q("#settings")?.classList.contains("show") ? "settings" : "home";
  return {
    state: load("state"),
    recent: load("recent") || {},
    screen,
    cards: [...document.querySelectorAll("#grid .opt")].map(b => ({
      word: b.querySelector(".word")?.textContent ?? "",
      overflow: sticksOut(b.querySelector(".word"), b)
    })),
    scores: [...document.querySelectorAll(".team .pts")].map(e => Number(e.textContent)),
    names: [...document.querySelectorAll(".team .name")].map(e => e.textContent),
    active: [...document.querySelectorAll(".team")].findIndex(e => e.classList.contains("active")),
    act: {
      word: q("#actWord")?.textContent ?? "",
      over: !!q("#act")?.classList.contains("over"),
      num: Number(q("#num")?.textContent),
      paused: !!q("#timer")?.classList.contains("paused"),
      start: shown(q("#startBtn")), result: shown(q("#resultRow")), pause: shown(q("#pauseBtn")), back: shown(q("#backBtn")),
      overflow: screen === "act" && sticksOut(q("#actWord"), q("#act .wrap"))
    },
    pageOverflow: document.documentElement.scrollWidth > innerWidth + 1
  };
}

// model: { scores, team, mode, seconds, names, screen, hands (per mode, unset = a deal is due), actWord?, timer? }
// ctx:   { pools, teams, prev (previous snapshot) }
export function check(snap, model, ctx) {
  const bad = [];
  const s = snap.state;
  if (!s) return ["no saved state in localStorage"];

  // Saved state matches what the bot did.
  for (const k of ["scores", "team", "mode", "seconds", "names"])
    if (!eq(s[k], model[k])) bad.push(`state.${k} is ${JSON.stringify(s[k])}, expected ${JSON.stringify(model[k])}`);
  if (s.scores.some(n => !Number.isInteger(n) || n < 0)) bad.push(`bad score ${JSON.stringify(s.scores)}`);

  // Screen shows the same state.
  if (snap.screen !== model.screen) bad.push(`screen is ${snap.screen}, expected ${model.screen}`);
  if (!eq(snap.scores, model.scores)) bad.push(`shown scores ${snap.scores} != ${model.scores}`);
  if (snap.active !== model.team) bad.push(`highlighted team ${snap.active}, expected ${model.team}`);
  const names = [0, 1].map(i => model.names[i] || ctx.teams[i]);
  if (!eq(snap.names, names)) bad.push(`shown names ${JSON.stringify(snap.names)} != ${JSON.stringify(names)}`);

  // The hand for the current mode: three cards, three different categories, words from that pool.
  const hand = s.hands?.[s.mode];
  if (!Array.isArray(hand) || hand.length !== 3) bad.push(`hand has ${hand?.length} cards`);
  else {
    if (new Set(hand.map(h => h.id)).size !== hand.length) bad.push(`hand repeats a category: ${hand.map(h => h.id)}`);
    for (const h of hand) {
      const p = ctx.pools[h.id]?.[s.mode];
      if (!p || !(p.themed.includes(h.word) || p.everyday.includes(h.word))) bad.push(`"${h.word}" is not a ${s.mode} ${h.id} word`);
    }
    if (!eq(snap.cards.map(c => c.word), hand.map(h => h.word))) bad.push(`cards on screen ${JSON.stringify(snap.cards.map(c => c.word))} != saved hand`);
    const kept = model.hands?.[s.mode];
    if (kept && !eq(hand, kept)) bad.push(`hand changed without a deal`);
  }

  // Recently shown lists: no repeats, capped, and a newly drawn word was not recently shown.
  for (const [k, list] of Object.entries(snap.recent)) {
    const pool = poolFor(ctx.pools, k);
    if (!pool) { bad.push(`unknown recent key ${k}`); continue; }
    if (new Set(list).size !== list.length) bad.push(`recent ${k} has a repeat`);
    if (list.length > recentCap(pool)) bad.push(`recent ${k} has ${list.length} > cap ${recentCap(pool)}`);
    const before = ctx.prev?.recent?.[k] || [];
    const drawn = list[list.length - 1];
    if (drawn !== undefined && !eq(list, before) && before.includes(drawn)) bad.push(`"${drawn}" came back while still recent (${k})`);
  }

  // Act screen.
  if (model.screen === "act") {
    const a = snap.act, t = model.timer;
    if (a.word !== model.actWord) bad.push(`act word "${a.word}", expected "${model.actWord}"`);
    if (t.phase === "ready") {
      if (!a.start || !a.back || a.result || a.pause) bad.push(`ready buttons wrong ${JSON.stringify(a)}`);
      if (a.num !== model.seconds) bad.push(`ready timer shows ${a.num}, expected ${model.seconds}`);
    } else if (t.phase === "running" || t.phase === "paused") {
      if (a.start || a.back || !a.result || !a.pause) bad.push(`running buttons wrong ${JSON.stringify(a)}`);
      if (a.paused !== (t.phase === "paused")) bad.push(`paused=${a.paused}, expected ${t.phase}`);
      if (a.over) bad.push("time-up shown while time is left");
      const want = Math.ceil(t.leftMs / 1000);
      if (a.num !== want) bad.push(`timer shows ${a.num}, expected ${want} (${t.leftMs}ms left)`);
    } else if (t.phase === "over") {
      if (!a.over || a.pause || !a.result) bad.push(`time-up screen wrong ${JSON.stringify(a)}`);
      if (a.num !== 0) bad.push(`timer at time-up shows ${a.num}`);
    }
  }
  return bad;
}

// Layout problems are reported, not failed: a long word may still read fine wrapped.
export function layout(snap) {
  const out = [];
  for (const c of snap.cards) if (c.overflow) out.push({ where: "card", word: c.word });
  if (snap.act.overflow) out.push({ where: "act", word: snap.act.word });
  if (snap.pageOverflow) out.push({ where: "page", word: "" });
  return out;
}
