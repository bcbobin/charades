// One bot game: opens a holiday page in a fresh browser context and plays `turns` turns with
// random taps, checking the game after every action. Everything random comes from `seed`:
// the bot's choices and the page's own Math.random, so a seed replays the same game.
import { check, layout, snapshot } from "./checks.mjs";
import { buildPools } from "./pools.mjs";

export const rng = a => () => {
  a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

// Runs in the page before any of its scripts. Each load (reloads too) gets its own seeded
// Math.random, and CSS motion is switched off so taps never land mid-animation.
function pageInit(seed) {
  const n = Number(sessionStorage.getItem("autoplay:loads") || 0);
  sessionStorage.setItem("autoplay:loads", n + 1);
  let a = (seed * 31 + n * 0x9e3779b9) | 0;
  Math.random = () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const css = "*,*::before,*::after{transition:none!important;animation:none!important}";
  document.addEventListener("DOMContentLoaded", () =>
    document.head.appendChild(Object.assign(document.createElement("style"), { textContent: css })));
}

// A tap the way a finger would: the element must be on screen and on top at its centre.
function tapInPage([sel, i]) {
  const el = document.querySelectorAll(sel)[i];
  if (!el) return `nothing matches ${sel}[${i}]`;
  let r = el.getBoundingClientRect();
  if (!r.width || !r.height) return `${sel} is not visible`;
  if (r.top < 0 || r.bottom > innerHeight) { el.scrollIntoView({ block: "center" }); r = el.getBoundingClientRect(); }
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  if (x < 0 || x > innerWidth) return `${sel} is off screen`;
  const hit = document.elementFromPoint(x, y);
  if (!hit || (hit !== el && !el.contains(hit))) return `${sel} is covered by ${hit?.id || hit?.className || hit?.tagName}`;
  el.click();
  return null;
}

class Failure extends Error {}
const pickW = (r, table) => {
  const total = table.reduce((s, [w]) => s + w, 0);
  let x = r() * total;
  for (const [w, v] of table) if ((x -= w) < 0) return v;
  return table[table.length - 1][1];
};
const NAMES = ["Turkeys", "  Pilgrims  ", "The Stuffing Squad of Grandma's House", "🦃🦃", "A", "Pie Crew"];

export async function playGame(browser, { base, holiday, seed, turns = 20, viewport = { width: 360, height: 640 }, keepTrace = false }) {
  const r = rng(seed);
  const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const origin = new URL(base).origin;
  // Nothing leaves the machine: Ko-fi, web fonts and the suggestion form get an empty reply.
  await context.route(u => new URL(u).origin !== origin, route => route.fulfill({ status: 200, body: "" }));
  await context.addInitScript(pageInit, seed);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(`page error: ${e.message}`));
  page.on("console", m => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
    if (m.type() === "warning" && /listed twice/.test(m.text())) errors.push(`duplicate word: ${m.text()}`);
  });
  let confirmAnswer = true;
  page.on("dialog", d => (confirmAnswer ? d.accept() : d.dismiss()));

  const trace = [], layoutIssues = [], draws = [];
  const out = { seed, holiday, turns: 0, steps: 0, failure: null, layout: layoutIssues, draws, trace };
  let step = 0, action = "load", prev = null, ctx, model;
  const clock = { now: Date.UTC(2026, 10, 26, 18) };   // Thanksgiving dinner

  const load = async reload => {
    if (!reload) await page.clock.install({ time: clock.now });
    if (reload) await page.reload(); else await page.goto(`${base}/${holiday}/index.html`);
    await page.waitForSelector("#grid .opt", { timeout: 10000 });
    // The fake clock runs freely while the page loads; stop it so the timer moves only when the bot says.
    await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 1000);
  };
  const ff = ms => page.clock.fastForward(ms);
  const tap = async (sel, i = 0) => {
    const why = await page.evaluate(tapInPage, [sel, i]);
    if (why) throw new Failure(`can't tap: ${why}`);
  };

  const verify = async () => {
    step++;
    const snap = await page.evaluate(snapshot);
    const problems = [...errors.splice(0), ...check(snap, model, { ...ctx, prev })];
    for (const l of layout(snap)) layoutIssues.push({ ...l, step });
    // Every newly drawn word, for the report's share and coverage numbers.
    for (const [k, list] of Object.entries(snap.recent)) {
      const before = prev?.recent?.[k] || [];
      if (list.length && JSON.stringify(list) !== JSON.stringify(before)) draws.push([k, list[list.length - 1]]);
    }
    const hand = snap.state?.hands?.[snap.state.mode];
    trace.push({ step, action, screen: snap.screen, mode: snap.state?.mode, scores: snap.state?.scores,
      team: snap.state?.team, hand: hand?.map(h => h.word), act: snap.screen === "act" ? snap.act.word : undefined });
    if (!keepTrace && trace.length > 8) trace.shift();
    if (problems.length) throw new Failure(problems.join("; "));
    if (Array.isArray(hand)) model.hands[snap.state.mode] = hand;
    prev = snap;
    return snap;
  };
  const deal = () => { model.hands[model.mode] = undefined; };

  // ---- home-screen actions ----
  async function settingsVisit() {
    action = "open settings";
    if (r() < 0.3) { const i = r() < 0.5 ? 0 : 1; action = `tap team ${i} name`; await tap(".team .name", i); }
    else await tap("#gearBtn");
    model.screen = "settings";
    await verify();
    for (let n = 1 + Math.floor(r() * 3); n--;) {
      const what = pickW(r, [[3, "choice"], [2, "minus"], [2, "plus"], [3, "rename"], [1, "reset names"]]);
      if (what === "choice") {
        const i = Math.floor(r() * 4); action = `timer choice ${i}`;
        await tap("#timeChoices button", i);
        model.seconds = [30, 45, 60, 90][i];
      } else if (what === "minus" || what === "plus") {
        action = `timer ${what}`;
        await tap(what === "minus" ? "#timeMinus" : "#timePlus");
        model.seconds = Math.min(180, Math.max(10, model.seconds + (what === "minus" ? -5 : 5)));
      } else if (what === "rename") {
        const i = r() < 0.5 ? 0 : 1, name = r() < 0.15 ? ctx.teams[i] : NAMES[Math.floor(r() * NAMES.length)];
        action = `rename team ${i} to ${JSON.stringify(name)}`;
        await page.fill(`#name${i}`, name);
        const n2 = name.trim().slice(0, 20);
        model.names[i] = n2 && n2 !== ctx.teams[i] ? n2 : null;
      } else {
        action = "use holiday names";
        await tap("#namesReset");
        model.names = [null, null];
      }
      await verify();
    }
    action = "close settings";
    if (r() < 0.3) await page.evaluate(() => document.getElementById("settings").click());   // tap the backdrop
    else await tap("#settingsDone");
    model.screen = "home";
    await verify();
  }

  async function reload() {
    action = "reload";
    await load(true);
    model.screen = "home";
    await verify();
  }

  // ---- one turn: pick a word, act it out, score it ----
  async function playTurn() {
    if (r() < 0.85) {
      const i = Math.floor(r() * 3);
      action = `pick card ${i}`;
      model.actWord = model.hands[model.mode][i].word;
      await tap("#grid .opt", i);
    } else {
      action = "random word";
      await tap("#randomBtn");
      model.actWord = null;
    }
    model.screen = "act";
    model.timer = { phase: "ready" };
    if (model.actWord === null) {
      // The random word isn't known in advance; it must be a real word, checked via the drawn list.
      model.actWord = await page.textContent("#actWord");
      const known = Object.values(ctx.pools).some(c => c[model.mode].themed.includes(model.actWord) || c[model.mode].everyday.includes(model.actWord));
      if (!known) throw new Failure(`random word "${model.actWord}" is not a ${model.mode} word`);
    }
    await verify();

    const opening = r();
    if (opening < 0.08) { action = "back"; await tap("#backBtn"); model.screen = "home"; await verify(); return false; }
    if (opening < 0.11) { await reload(); return false; }

    action = "start"; await tap("#startBtn");
    model.timer = { phase: "running", leftMs: model.seconds * 1000 };
    await verify();

    for (;;) {
      const t = model.timer;
      const what = pickW(r, [[3, "wait"], [1, "pause"], [3, "got"], [2, "missed"], [3, "time up"], [0.3, "reload"]]);
      if (what === "wait") {
        const ms = Math.floor(r() * Math.max(0, t.leftMs - 1000));
        action = `wait ${ms}ms`; await ff(ms); t.leftMs -= ms;
        await verify();
      } else if (what === "pause") {
        action = "pause"; await (r() < 0.5 ? tap("#pauseBtn") : tap("#timer"));
        t.phase = "paused"; await verify();
        action = "wait while paused"; await ff(1000 + Math.floor(r() * 20000)); await verify();
        action = "resume"; await (r() < 0.5 ? tap("#pauseBtn") : tap("#timer"));
        t.phase = "running"; await verify();
      } else if (what === "reload") {
        await reload(); return false;
      } else {
        if (what === "time up") {
          action = "run out the clock"; await ff(t.leftMs + 50);
          model.timer = { phase: "over" };
          await verify();
        }
        const got = what === "got" || (what === "time up" && r() < 0.4);
        action = got ? "got it" : "missed";
        await tap(got ? "#gotBtn" : "#missBtn");
        if (got) model.scores[model.team]++;
        model.team = 1 - model.team;
        model.screen = "home"; model.timer = null; deal();
        await verify();
        return true;
      }
    }
  }

  try {
    await load(false);
    const pageData = await page.evaluate(() => ({ words: window.THEME.words, everyday: window.EVERYDAY, teams: window.THEME.teams }));
    ctx = { pools: buildPools(pageData.words, pageData.everyday), teams: pageData.teams };
    model = { scores: [0, 0], team: 0, mode: "easy", seconds: 45, names: [null, null], screen: "home", hands: {} };
    out.pools = ctx.pools;
    await verify();

    while (out.turns < turns) {
      const what = pickW(r, [[50, "turn"], [8, "next"], [6, "mode"], [5, "score"], [3, "switch"], [2, "reset"], [4, "settings"], [2, "reload"]]);
      if (what === "turn") { if (await playTurn()) out.turns++; }
      else if (what === "next") { action = "next"; await tap("#nextBtn"); deal(); await verify(); }
      else if (what === "mode") {
        const m = model.mode === "easy" ? "hard" : "easy";
        action = `mode ${m}`; await tap(`#modeToggle button[data-mode="${m}"]`);
        model.mode = m; await verify();
      } else if (what === "score") {
        const i = r() < 0.5 ? 0 : 1, d = r() < 0.5 ? -1 : 1;
        action = `team ${i} ${d > 0 ? "+" : "-"}1`; await tap(`.team[data-t="${i}"] .adj button[data-d="${d}"]`);
        model.scores[i] = Math.max(0, model.scores[i] + d); await verify();
      } else if (what === "switch") { action = "switch team"; await tap("#switchBtn"); model.team = 1 - model.team; await verify(); }
      else if (what === "reset") {
        confirmAnswer = r() < 0.7;
        action = `reset scores (${confirmAnswer ? "ok" : "cancel"})`; await tap("#resetBtn");
        if (confirmAnswer) { model.scores = [0, 0]; model.team = 0; }
        await verify();
      } else if (what === "settings") await settingsVisit();
      else await reload();
    }
  } catch (e) {
    out.failure = { step, action, message: e instanceof Failure ? e.message : `harness error: ${e.message}`, last: trace.slice(-8) };
  } finally {
    out.steps = step;
    await context.close();
  }
  if (!keepTrace) delete out.trace;
  return out;
}
