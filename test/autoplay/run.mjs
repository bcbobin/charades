// Autoplay: bots play many seeded games of charades in headless Chromium and check the
// game after every tap. Works on this repo (the website) or on any built copy, such as
// charades-app's www/.
//
//   node test/autoplay/run.mjs                                  500 Thanksgiving games on this repo
//   node test/autoplay/run.mjs --games 5000 --holiday all       every holiday
//   node test/autoplay/run.mjs --base ../charades-app/www       the app build
//   node test/autoplay/run.mjs --replay 1234                    one game, in a visible browser, step by step
//
// Options: --base <dir|url> --holiday <id|all> --games N --each N --seed N --turns N --workers N
// --each N plays N games per holiday and overrides --games.
//          --viewport WxH --out report.json --trace traces.jsonl --replay SEED
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, readdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { cpus } from "node:os";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { playGame } from "./bot.mjs";
import { print, summarize } from "./report.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = Object.fromEntries(process.argv.slice(2).join(" ").split(/\s*--/).filter(Boolean).map(a => {
  const [k, ...v] = a.split(" ");
  return [k, v.join(" ") || true];
}));
const replay = args.replay !== undefined ? Number(args.replay) : null;
const opt = {
  base: args.base || repo,
  holiday: args.holiday || "thanksgiving",
  games: replay !== null ? 1 : Number(args.games || 500),
  seed: replay ?? Number(args.seed || 1),
  turns: Number(args.turns || 20),
  workers: replay !== null ? 1 : Number(args.workers || Math.max(1, Math.min(8, cpus().length - 1))),
  viewport: (([w, h]) => ({ width: w, height: h }))((args.viewport || "360x640").split("x").map(Number)),
  out: args.out || null,
  trace: args.trace || null
};

// Serve a folder, the same way GitHub Pages and the app's web view do.
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml" };
async function serve(dir) {
  const server = createServer(async (req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (path.endsWith("/")) path += "index.html";
    try { res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" }).end(await readFile(join(dir, path))); }
    catch { res.writeHead(404).end("Not found"); }
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

async function holidaysIn(dir) {
  const out = [];
  for (const d of await readdir(dir)) {
    const f = join(dir, d, "index.html");
    if (existsSync(f) && /shared\/(game|native)\.js/.test(await readFile(f, "utf8"))) out.push(d);
  }
  return out.sort();
}

const isUrl = /^https?:\/\//.test(opt.base);
const dir = isUrl ? null : resolve(opt.base);
if (dir && !(await stat(dir).catch(() => null))?.isDirectory()) throw new Error(`no such folder: ${dir}`);
const server = dir ? await serve(dir) : null;
const base = (server?.url || opt.base).replace(/\/$/, "");
const holidays = opt.holiday === "all" ? (dir ? await holidaysIn(dir) : (() => { throw new Error("--holiday all needs a folder --base"); })())
  : opt.holiday.split(",");
if (args.each && replay === null) opt.games = Number(args.each) * holidays.length;

const started = performance.now();
const browser = await chromium.launch({ headless: replay === null, slowMo: replay !== null ? 150 : 0 });
const results = [], pools = {};
let next = 0, done = 0, traceLines = [];
try {
  await Promise.all(Array.from({ length: opt.workers }, async () => {
    while (next < opt.games) {
      const i = next++, seed = opt.seed + i, holiday = holidays[i % holidays.length];
      const g = await playGame(browser, { base, holiday, seed, turns: opt.turns, viewport: opt.viewport, keepTrace: !!opt.trace || replay !== null });
      if (g.pools) pools[holiday] ||= g.pools;
      delete g.pools;
      if (g.trace) { traceLines[i] = JSON.stringify({ seed, holiday, failure: g.failure, trace: g.trace }); delete g.trace; }
      results.push(g);
      if (++done % 100 === 0 && process.stderr.isTTY) process.stderr.write(`\r${done}/${opt.games}`);
    }
  }));
} finally {
  if (process.stderr.isTTY) process.stderr.write("\r");
  await browser.close();
  server?.close();
}

results.sort((a, b) => a.seed - b.seed);
const report = summarize(results, pools);
report.options = { ...opt, base: opt.base === repo ? "." : opt.base };
console.log(print(report, (performance.now() - started) / 1000));
if (replay !== null) console.log(traceLines.filter(Boolean).map(l => JSON.parse(l).trace.map(t => `${t.step}\t${t.action}\t${t.screen}\t${JSON.stringify(t.scores)}\t${t.act ?? (t.hand || []).join(" | ")}`).join("\n")).join("\n"));
if (opt.out) await writeFile(opt.out, JSON.stringify(report, null, 2));
if (opt.trace) await writeFile(opt.trace, traceLines.filter(Boolean).join("\n") + "\n");
process.exitCode = report.failed ? 1 : 0;
