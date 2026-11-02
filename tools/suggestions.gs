// Google Apps Script web app that stores "Suggest a word" submissions as rows in a Google
// Sheet, so they never reach an inbox. Setup steps are in the README ("Word suggestions").
// The game POSTs JSON: { game, category, difficulty, word, name, email, bot }.

const HEADERS = ["When", "Game", "Category", "Difficulty", "Word", "Credit as", "Email", "Added?"];
const GAMES = /^[a-z0-9-]{1,30}$/;
const CATEGORIES = ["songs", "movies", "actions", "books", "quotes", "chars"];
const DIFFICULTIES = ["easy", "hard"];
// Spam brake: at most this many rows a minute from everyone combined.
const PER_MINUTE = 20;

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return reply({ ok: false, error: "bad request" }); }
  // The hidden checkbox is only ticked by bots; pretend it worked.
  if (d.bot) return reply({ ok: true });
  const word = clip(d.word, 80);
  if (!word || !GAMES.test(d.game) || !CATEGORIES.includes(d.category) || !DIFFICULTIES.includes(d.difficulty)) {
    return reply({ ok: false, error: "bad request" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const cache = CacheService.getScriptCache();
    const minute = "n" + Math.floor(Date.now() / 60000);
    const n = Number(cache.get(minute) || 0);
    if (n >= PER_MINUTE) return reply({ ok: false, error: "busy" });
    cache.put(minute, String(n + 1), 120);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow([new Date(), d.game, d.category, d.difficulty, word, clip(d.name, 24), clip(d.email, 120), ""]);
  } finally {
    lock.releaseLock();
  }
  return reply({ ok: true });
}

// Trim, cap the length, and stop text like "=HYPERLINK(...)" from running as a formula.
function clip(v, max) {
  const s = String(v == null ? "" : v).trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
