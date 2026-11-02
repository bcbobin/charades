// Shared charades engine. A holiday page sets window.THEME (id, title, teams, words, ...),
// loads shared/everyday.js, then this file, which builds the same layout for every holiday.
(() => {
const T = window.THEME;
const DEFAULT_SECONDS = 45;
const OPTIONS_PER_DEAL = 3;
// Each deal picks a random word from those NOT shown in the last RECENT_SHARE of that
// pool's deals, so a word can't come back until most of its pool has been seen.
const RECENT_SHARE = 0.7;
// Chance a card comes from the holiday's own words instead of the shared everyday ones.
// A holiday list shorter than THEMED_FULL gets a proportionally smaller share, so a
// handful of words doesn't repeat on every other card.
const THEMED_SHARE = 0.75;
const THEMED_FULL = 12;
const MODES = ["easy", "hard"];
const CATS = [
  { id: "songs", label: "🎵 Song" },
  { id: "movies", label: "🎬 Movie" },
  { id: "actions", label: "🕺 Action" },
  { id: "books", label: "📖 Book" },
  { id: "quotes", label: "💬 Quote / Phrase" },
  { id: "chars", label: "🦸 Character" }
];

// ---------- word pools ----------
// Holiday words are claimed first, so an everyday duplicate is the one dropped.
const key = w => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const seen = new Set();
const claim = (words, where) => words.filter(w => {
  const k = key(w);
  if (seen.has(k)) { if (where) console.warn(`${where}: "${w}" is listed twice`); return false; }
  seen.add(k);
  return true;
});
const CATEGORIES = CATS.map(c => ({ ...c, label: (T.labels || {})[c.id] || c.label, color: `var(--c-${c.id})`, pools: {} }));
for (const cat of CATEGORIES) for (const m of MODES)
  cat.pools[m] = { themed: claim(((T.words[cat.id] || {})[m]) || [], `${T.id}.${cat.id}.${m}`) };
for (const cat of CATEGORIES) for (const m of MODES)
  cat.pools[m].everyday = claim(((window.EVERYDAY[cat.id] || {})[m]) || []);
const hasWord = (cat, word) => {
  const p = cat.pools[state.mode];
  return p.themed.includes(word) || p.everyday.includes(word);
};

// ---------- persistence (per-device convenience only) ----------
const PREFIX = `charades:${T.id}:`;
const store = {
  get(k, d) { try { const v = localStorage.getItem(PREFIX + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch {} }
};
let state = store.get("state", null);
if (!state && T.legacyKey) {
  // The game used to live at the site root and saved under a different key.
  try { state = JSON.parse(localStorage.getItem(T.legacyKey)); } catch {}
}
state = state || {};
if (!Array.isArray(state.scores) || state.scores.length !== 2) state.scores = [0, 0];
if (state.team !== 1) state.team = 0;
if (!Number.isFinite(state.seconds)) state.seconds = DEFAULT_SECONDS;
if (state.mode !== "hard") state.mode = "easy";
// names[i] is null while the team uses the holiday's preset name.
state.names = [0, 1].map(i => {
  const n = Array.isArray(state.names) && typeof state.names[i] === "string" ? state.names[i].trim() : "";
  return n && n !== T.teams[i] ? n : null;
});
const teamName = i => state.names[i] || T.teams[i];
let recent = store.get("recent", {});
const save = () => { store.set("state", state); store.set("recent", recent); };

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function draw(cat) {
  const p = cat.pools[state.mode];
  const share = THEMED_SHARE * Math.min(1, p.themed.length / THEMED_FULL);
  const useThemed = p.themed.length && (Math.random() < share || !p.everyday.length);
  const src = useThemed ? "themed" : "everyday";
  const words = p[src];
  const k = `${cat.id}:${state.mode}:${src}`;
  const n = Math.floor(words.length * RECENT_SHARE);
  const rec = n ? (recent[k] || []).filter(w => words.includes(w)).slice(-n) : [];
  const word = pick(words.filter(w => !rec.includes(w)));
  recent[k] = n ? [...rec, word].slice(-n) : [];
  return word;
}
const playable = () => CATEGORIES.filter(c => c.pools[state.mode].themed.length || c.pools[state.mode].everyday.length);

// ---------- layout ----------
document.body.insertAdjacentHTML("afterbegin", `
<div class="fx" id="fx" aria-hidden="true"></div>
<div class="wrap" id="home">
  <h1 id="title"></h1>
  <div class="deco-row">
    <a class="home-link" href="../" aria-label="All holidays">🏠</a>
    <div class="deco" id="deco"></div>
  </div>

  <div class="scores">
    ${[0, 1].map(i => `
    <div class="team" data-t="${i}">
      <button class="name" aria-label="Rename team"></button>
      <div class="pts">0</div>
      <div class="adj"><button data-d="-1" aria-label="Minus a point">−</button><button data-d="1" aria-label="Plus a point">+</button></div>
    </div>`).join("")}
  </div>
  <div class="mode" id="modeToggle">
    <button data-mode="easy"></button><button data-mode="hard"></button>
  </div>
  <div class="turn-label" id="turnLabel"></div>

  <div class="grid" id="grid"></div>

  <div class="bottom">
    <div class="row">
      <button class="btn ghost" id="randomBtn">🎲 Random</button>
      <button class="btn ghost" id="nextBtn">🔄 Next</button>
    </div>
    <div class="small-links">
      <button id="switchBtn">Switch team</button>
      <button id="resetBtn">Reset scores</button>
      <button id="gearBtn">⚙️ Settings</button>
    </div>
  </div>
</div>

<div class="act" id="act">
  <div class="wrap">
    <div>
      <div class="cat-big" id="actCat"></div>
      <div class="word-big" id="actWord"></div>
      <div class="hint" id="actHint"></div>
    </div>

    <div>
      <div class="timer" id="timer">
        <svg viewBox="0 0 120 120">
          <circle class="track" cx="60" cy="60" r="52" fill="none" stroke-width="10"/>
          <circle class="ring" id="ring" cx="60" cy="60" r="52" fill="none" stroke-width="10"/>
        </svg>
        <div class="num" id="num"></div>
      </div>
      <div class="timesup" id="timesUp"></div>
    </div>

    <div class="act-buttons">
      <button class="btn" id="startBtn">▶ Start</button>
      <div class="row hidden" id="resultRow">
        <button class="btn red" id="missBtn">✖ Missed</button>
        <button class="btn green" id="gotBtn">✔ Got it!</button>
      </div>
      <button class="btn ghost hidden" id="pauseBtn">⏸ Pause</button>
      <button class="btn ghost" id="backBtn">← Back to options</button>
    </div>
  </div>
</div>

<div class="sheet-bg" id="settings">
  <div class="sheet">
    <h2>Settings</h2>
    <label for="name0">Team names</label>
    <div class="names">
      <input id="name0" maxlength="20" autocomplete="off" autocapitalize="words" enterkeyhint="done">
      <input id="name1" maxlength="20" autocomplete="off" autocapitalize="words" enterkeyhint="done">
    </div>
    <button class="link-btn names-reset" id="namesReset">Use the holiday names</button>
    <label>Timer length</label>
    <div class="choices" id="timeChoices">
      <button data-s="30">30s</button><button data-s="45">45s</button><button data-s="60">60s</button><button data-s="90">90s</button>
    </div>
    <div class="stepper">
      <button id="timeMinus" aria-label="5 seconds less">−</button>
      <output id="timeOut">45s</output>
      <button id="timePlus" aria-label="5 seconds more">+</button>
    </div>
    <button class="btn" id="settingsDone">Done</button>
  </div>
</div>`);

const $ = id => document.getElementById(id);
$("title").textContent = T.title;
$("deco").textContent = T.deco || "";
$("timesUp").textContent = T.timesUp || "Time's Up!";
const modeBtns = [...document.querySelectorAll("#modeToggle button")];
modeBtns.forEach(b => b.textContent = (T.modes || {})[b.dataset.mode] || (b.dataset.mode === "easy" ? "😊 Easy" : "🔥 Hard"));

if (T.particles && T.particles.length) {
  const fx = $("fx");
  if (T.particleMotion === "rise") fx.classList.add("rise");
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.textContent = pick(T.particles);
    const d = 10 + Math.random() * 12;
    s.style.cssText = `left:${Math.random() * 100}%;font-size:${12 + Math.random() * 16}px;--d:${d}s;--delay:${-Math.random() * d}s;` +
      `--x:${(Math.random() - .5) * 120}px;--r:${(Math.random() - .5) * 360}deg`;
    fx.appendChild(s);
  }
}

// ---------- home screen ----------
const grid = $("grid");
const teams = [...document.querySelectorAll(".team")];
let current = null;

function renderScores() {
  teams.forEach((el, i) => {
    el.querySelector(".pts").textContent = state.scores[i];
    el.querySelector(".name").textContent = teamName(i);
    el.classList.toggle("active", state.team === i);
  });
  const label = $("turnLabel"), b = document.createElement("b");
  b.textContent = teamName(state.team);
  label.replaceChildren(b, "'s turn — pick one to act out");
}

function renderMode() {
  modeBtns.forEach(b => b.classList.toggle("on", b.dataset.mode === state.mode));
}

// Each mode keeps its own hand of cards, so flipping Easy/Hard shows the same cards
// as before; only Next (or finishing a turn) deals a new hand, and only for the current mode.
function deal() {
  const cats = playable().sort(() => Math.random() - 0.5).slice(0, OPTIONS_PER_DEAL);
  state.hands = { ...state.hands, [state.mode]: cats.map(cat => ({ id: cat.id, word: draw(cat) })) };
  save();
  showHand();
}

function showHand() {
  const hand = (state.hands || {})[state.mode];
  const cards = Array.isArray(hand) && hand.map(h => ({ cat: CATEGORIES.find(c => c.id === h.id), word: h.word }));
  if (!cards || !cards.length || cards.some(c => !c.cat || !hasWord(c.cat, c.word))) return deal();
  grid.innerHTML = "";
  cards.forEach(({ cat, word }, i) => {
    const b = document.createElement("button");
    b.className = "opt";
    b.style.setProperty("--c", cat.color);
    b.style.animationDelay = (i * 40) + "ms";
    b.innerHTML = `<span class="cat"></span><span class="word"></span>`;
    b.querySelector(".cat").textContent = cat.label;
    b.querySelector(".word").textContent = word;
    b.onclick = () => openAct(cat, word);
    grid.appendChild(b);
  });
}

teams.forEach((el, i) => {
  el.querySelectorAll(".adj button").forEach(b => b.onclick = e => {
    e.stopPropagation();
    state.scores[i] = Math.max(0, state.scores[i] + Number(b.dataset.d));
    save(); renderScores();
  });
  el.querySelector(".name").onclick = () => openSettings($("name" + i));
});
$("nextBtn").onclick = () => { unlockAudio(); deal(); };
$("randomBtn").onclick = () => { const cat = pick(playable()); const word = draw(cat); save(); openAct(cat, word); };
modeBtns.forEach(b => b.onclick = () => {
  if (state.mode === b.dataset.mode) return;
  state.mode = b.dataset.mode;
  save(); renderMode(); showHand();
});
$("switchBtn").onclick = () => { state.team = 1 - state.team; save(); renderScores(); };
$("resetBtn").onclick = () => {
  if (confirm("Reset both scores to 0?")) { state.scores = [0, 0]; state.team = 0; save(); renderScores(); }
};

// ---------- act screen / timer ----------
const act = $("act"), ring = $("ring"), num = $("num"), timerEl = $("timer");
const CIRC = 2 * Math.PI * 52;
ring.style.strokeDasharray = CIRC;
let endAt = 0, raf = 0, lastWhole = null, wakeLock = null;
let pausedLeft = null;   // ms remaining while paused, null when running

function openAct(cat, word) {
  unlockAudio();
  current = { cat, word };
  $("actCat").textContent = cat.label;
  $("actCat").style.color = cat.color;
  $("actWord").textContent = word;
  $("actHint").textContent = "Read it, hide the phone, then tap start!";
  act.classList.remove("over");
  act.classList.add("show");
  $("startBtn").classList.remove("hidden");
  $("resultRow").classList.add("hidden");
  $("backBtn").classList.remove("hidden");
  $("pauseBtn").classList.add("hidden");
  setPaused(null);
  setRing(1, state.seconds);
  $("startBtn").textContent = `▶ Start ${state.seconds}s`;
}

function setRing(frac, secs) {
  ring.style.strokeDashoffset = CIRC * (1 - frac);
  num.textContent = secs;
  timerEl.classList.toggle("low", secs <= 5 && frac < 1);
}

function startTimer() {
  endAt = performance.now() + state.seconds * 1000;
  lastWhole = null;
  $("startBtn").classList.add("hidden");
  $("backBtn").classList.add("hidden");
  $("resultRow").classList.remove("hidden");
  $("pauseBtn").classList.remove("hidden");
  $("actHint").textContent = "Acting! Tap ✔ as soon as they guess it.";
  requestWake();
  beep(660, 0.12);
  tick();
}

function setPaused(left) {
  pausedLeft = left;
  const paused = left !== null;
  timerEl.classList.toggle("paused", paused);
  $("pauseBtn").textContent = paused ? "▶ Resume" : "⏸ Pause";
}

function togglePause() {
  if (act.classList.contains("over") || $("pauseBtn").classList.contains("hidden")) return;
  if (pausedLeft === null) {
    cancelAnimationFrame(raf);
    setPaused(Math.max(0, endAt - performance.now()));
    $("actHint").textContent = "Paused — tap Resume (or the timer) to keep going.";
  } else {
    endAt = performance.now() + pausedLeft;
    setPaused(null);
    $("actHint").textContent = "Acting! Tap ✔ as soon as they guess it.";
    tick();
  }
}

function tick() {
  const left = Math.max(0, endAt - performance.now());
  const secs = Math.ceil(left / 1000);
  setRing(left / (state.seconds * 1000), secs);
  if (secs !== lastWhole) {
    if (lastWhole !== null && secs <= 5 && secs > 0) beep(880, 0.08);
    lastWhole = secs;
  }
  if (left <= 0) return timeUp();
  raf = requestAnimationFrame(tick);
}

function stopTimer() { cancelAnimationFrame(raf); releaseWake(); }

function timeUp() {
  stopTimer();
  act.classList.add("over");
  $("pauseBtn").classList.add("hidden");
  $("actHint").textContent = "Did they get it at the buzzer?";
  buzzer();
  try { navigator.vibrate && navigator.vibrate([300, 100, 300]); } catch {}
}

function finish(gotIt) {
  stopTimer();
  if (gotIt) { state.scores[state.team]++; beep(523, .1); setTimeout(() => beep(784, .18), 110); }
  state.team = 1 - state.team;
  save();
  act.classList.remove("show");
  renderScores();
  deal();
}

$("startBtn").onclick = startTimer;
$("pauseBtn").onclick = togglePause;
timerEl.onclick = togglePause;
$("gotBtn").onclick = () => finish(true);
$("missBtn").onclick = () => finish(false);
$("backBtn").onclick = () => { stopTimer(); act.classList.remove("show"); };

// ---------- sound ----------
let ctx = null;
function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
  } catch {}
}
function beep(freq, dur, type = "square", vol = 0.12) {
  if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch {}
}
function buzzer() {
  if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(220, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.9);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 1);
  } catch {}
}

// ---------- keep screen awake while timing (works on https/localhost only) ----------
async function requestWake() { try { wakeLock = await navigator.wakeLock?.request("screen"); } catch {} }
function releaseWake() { try { wakeLock?.release(); } catch {} wakeLock = null; }

// ---------- settings ----------
const settings = $("settings");
const nameInputs = [$("name0"), $("name1")];
function setSeconds(s) {
  state.seconds = Math.min(180, Math.max(10, s));
  save();
  $("timeOut").textContent = state.seconds + "s";
  document.querySelectorAll("#timeChoices button").forEach(b => b.classList.toggle("on", Number(b.dataset.s) === state.seconds));
}
function fillNames() {
  nameInputs.forEach((inp, i) => { inp.value = state.names[i] || ""; inp.placeholder = T.teams[i]; });
}
nameInputs.forEach((inp, i) => {
  inp.oninput = () => {
    const n = inp.value.trim().slice(0, 20);
    state.names[i] = n && n !== T.teams[i] ? n : null;
    save(); renderScores();
  };
  inp.onkeydown = e => { if (e.key === "Enter") inp.blur(); };
});
$("namesReset").onclick = () => { state.names = [null, null]; save(); fillNames(); renderScores(); };
function openSettings(focusEl) {
  setSeconds(state.seconds);
  fillNames();
  settings.classList.add("show");
  if (focusEl) { focusEl.focus(); focusEl.select(); }
}
const closeSettings = () => { document.activeElement?.blur(); settings.classList.remove("show"); };
document.querySelectorAll("#timeChoices button").forEach(b => b.onclick = () => setSeconds(Number(b.dataset.s)));
$("timeMinus").onclick = () => setSeconds(state.seconds - 5);
$("timePlus").onclick = () => setSeconds(state.seconds + 5);
$("gearBtn").onclick = () => openSettings();
$("settingsDone").onclick = closeSettings;
settings.onclick = e => { if (e.target === settings) closeSettings(); };

renderScores();
renderMode();
showHand();
})();
