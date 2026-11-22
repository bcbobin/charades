// Pulls what Google Search Console knows about the site and writes a report of what to fix:
// search queries and pages (clicks, impressions, CTR, position), each sitemap URL's index status,
// the sitemap's status, and optionally PageSpeed (Core Web Vitals + Lighthouse) for mobile.
// Needs the Search Console API and PageSpeed Insights API enabled in the key's Google Cloud project.
//
//   GSC_KEY=/path/to/service-account.json node tools/seo_audit.js [--days 90] [--psi] [--out seo-report]
//
// The service account needs (at least Restricted) access to the property in Search Console:
// Settings → Users and permissions. No npm packages needed. Writes <out>.md and <out>.json, both
// git-ignored. Search data lags 2–3 days behind.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const arg = (name, def) => { const i = process.argv.indexOf("--" + name); return i < 0 ? def : (process.argv[i + 1] ?? true); };
const DAYS = +arg("days", 90);
const OUT = arg("out", path.join(ROOT, "seo-report"));
const PSI = process.argv.includes("--psi");
const HOST = fs.readFileSync(path.join(ROOT, "CNAME"), "utf8").trim();
const PROPERTY = arg("property", `sc-domain:${HOST}`);
const KEY_FILE = process.env.GSC_KEY;
if (!KEY_FILE) { console.error("Set GSC_KEY to the service account's JSON key file."); process.exit(1); }

// ---------- auth: service-account JWT → access token ----------
async function token(scope = "https://www.googleapis.com/auth/webmasters.readonly") {
  const key = JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
  const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({
    iss: key.client_email, scope,
    aud: key.token_uri, iat: now, exp: now + 3600
  });
  const jwt = unsigned + "." + crypto.sign("RSA-SHA256", Buffer.from(unsigned), key.private_key).toString("base64url");
  const r = await fetch(key.token_uri, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt })
  });
  if (!r.ok) throw new Error(`token: ${r.status} ${await r.text()}`);
  return (await r.json()).access_token;
}

let TOKEN, PSI_TOKEN;
async function api(url, body) {
  const r = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${TOKEN}`, ...(body && { "Content-Type": "application/json" }) },
    body: body && JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${url}: ${r.status} ${j.error?.message || ""}`);
  return j;
}
const GSC = "https://searchconsole.googleapis.com/webmasters/v3/sites/" + encodeURIComponent(PROPERTY);
const day = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const search = (dimensions, rowLimit = 250) =>
  api(GSC + "/searchAnalytics/query", { startDate: day(DAYS + 3), endDate: day(3), dimensions, rowLimit })
    .then(j => (j.rows || []).map(r => ({ keys: r.keys, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })));

async function psi(url) {
  const q = new URLSearchParams({ url, strategy: "mobile" });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) q.append("category", c);
  // Authenticated as the service account, so it uses the project's own quota, not the shared anonymous one.
  const r = await fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + q, { headers: { Authorization: `Bearer ${PSI_TOKEN}` } });
  const j = await r.json();
  if (!r.ok) return { url, error: `${r.status} ${j.error?.message || ""}` };
  const lh = j.lighthouseResult;
  const failed = Object.values(lh.audits).filter(a => a.score !== null && a.score < 0.9 &&
    ["seo", "performance"].some(c => lh.categories[c].auditRefs.some(ref => ref.id === a.id && ref.weight > 0)));
  return {
    url,
    scores: Object.fromEntries(Object.entries(lh.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
    field: Object.fromEntries(Object.entries(j.loadingExperience?.metrics || {}).map(([k, v]) => [k, v.category])),
    failed: failed.map(a => ({ id: a.id, title: a.title, value: a.displayValue || "" }))
  };
}

// ---------- report ----------
const pct = x => (x * 100).toFixed(1) + "%";
const pos = x => x.toFixed(1);
const table = (head, rows) => rows.length
  ? `| ${head.join(" | ")} |\n|${head.map(() => "---").join("|")}|\n${rows.map(r => `| ${r.join(" | ")} |`).join("\n")}\n`
  : "_none_\n";
const short = u => u.replace(`https://${HOST}`, "") || "/";

(async () => {
  [TOKEN, PSI_TOKEN] = await Promise.all([token(), PSI && token("openid")]);
  const sitemapUrls = [...fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

  const [total, pages, queries, pairs, sitemaps] = await Promise.all([
    search([]), search(["page"]), search(["query"], 1000), search(["page", "query"], 1000),
    api(GSC + "/sitemaps").catch(e => ({ error: e.message }))
  ]);
  const inspections = [];
  for (const url of sitemapUrls) {
    try {
      const r = await api("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", { inspectionUrl: url, siteUrl: PROPERTY });
      const s = r.inspectionResult.indexStatusResult;
      inspections.push({ url, verdict: s.verdict, coverage: s.coverageState, lastCrawl: s.lastCrawlTime?.slice(0, 10) || "",
        googleCanonical: s.googleCanonical || "", userCanonical: s.userCanonical || "", robots: s.robotsTxtState, fetch: s.pageFetchState,
        mobile: r.inspectionResult.mobileUsabilityResult?.verdict || "", rich: r.inspectionResult.richResultsResult?.verdict || "" });
    } catch (e) { inspections.push({ url, error: e.message }); }
  }
  const speed = [];
  // A game page and an ideas page stand in for the rest: every holiday shares the same layout.
  if (PSI) for (const url of [`https://${HOST}/`, ...sitemapUrls.filter(u => /\/christmas\/(ideas\/)?$/.test(u))]) speed.push(await psi(url));

  // Opportunities: pages/queries near page 1 (position 4–20) and impressions without clicks.
  const near = pairs.filter(r => r.position >= 4 && r.position <= 20).sort((a, b) => b.impressions - a.impressions);
  const far = queries.filter(r => r.position > 20).sort((a, b) => b.impressions - a.impressions);
  const notIndexed = inspections.filter(i => i.error || i.verdict !== "PASS");
  const canonMismatch = inspections.filter(i => i.googleCanonical && i.userCanonical && i.googleCanonical !== i.userCanonical);
  const noImpr = sitemapUrls.filter(u => !pages.some(p => p.keys[0] === u));

  const t = total[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const md = `# SEO report: ${HOST}

${day(DAYS + 3)} to ${day(3)} (${DAYS} days) · property \`${PROPERTY}\` · generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC

**${t.clicks} clicks · ${t.impressions} impressions · CTR ${pct(t.ctr)} · avg position ${pos(t.position)}**

## Index status (${sitemapUrls.length - notIndexed.length}/${sitemapUrls.length} indexed)
${table(["URL", "Verdict", "Coverage", "Last crawl", "Mobile", "Rich results"],
  inspections.map(i => i.error ? [short(i.url), "error", i.error, "", "", ""] : [short(i.url), i.verdict, i.coverage, i.lastCrawl, i.mobile, i.rich]))}
${canonMismatch.length ? `\n**Google picked a different canonical:**\n${canonMismatch.map(i => `- ${short(i.url)} → ${i.googleCanonical}`).join("\n")}\n` : ""}
## Sitemaps
${sitemaps.error ? sitemaps.error : table(["Path", "Last read", "Errors", "Warnings", "Submitted"],
  (sitemaps.sitemap || []).map(s => [s.path, (s.lastDownloaded || "").slice(0, 10), s.errors, s.warnings, (s.contents || []).map(c => c.submitted).join(", ")]))}
## Pages
${table(["Page", "Clicks", "Impr.", "CTR", "Pos."], pages.map(r => [short(r.keys[0]), r.clicks, r.impressions, pct(r.ctr), pos(r.position)]))}
Sitemap pages with no impressions yet: ${noImpr.length ? noImpr.map(short).join(", ") : "none"}

## Top queries
${table(["Query", "Clicks", "Impr.", "CTR", "Pos."], queries.slice(0, 40).map(r => [r.keys[0], r.clicks, r.impressions, pct(r.ctr), pos(r.position)]))}
## Opportunities
### Near page 1 (position 4–20): improve title, description and on-page wording
${table(["Page", "Query", "Impr.", "CTR", "Pos."], near.slice(0, 30).map(r => [short(r.keys[0]), r.keys[1], r.impressions, pct(r.ctr), pos(r.position)]))}
### Seen but buried (position > 20): needs more relevant content or links
${table(["Query", "Impr.", "Pos."], far.slice(0, 30).map(r => [r.keys[0], r.impressions, pos(r.position)]))}
${PSI ? `## PageSpeed (mobile)
${speed.map(s => s.error ? `- ${short(s.url)}: ${s.error}` : `### ${short(s.url)}
Scores: ${Object.entries(s.scores).map(([k, v]) => `${k} ${v}`).join(" · ")}${Object.keys(s.field).length ? `  \nField data: ${Object.entries(s.field).map(([k, v]) => `${k} ${v}`).join(" · ")}` : ""}
${s.failed.length ? s.failed.map(a => `- ${a.title}${a.value ? ` (${a.value})` : ""}`).join("\n") : "- no failing audits"}`).join("\n\n")}
` : ""}`;
  fs.writeFileSync(OUT + ".md", md);
  fs.writeFileSync(OUT + ".json", JSON.stringify({ property: PROPERTY, days: DAYS, total: t, pages, queries, pairs, inspections, sitemaps, speed }, null, 2));
  console.log(`Wrote ${path.relative(process.cwd(), OUT)}.md and .json`);
})().catch(e => { console.error(e.message); process.exit(1); });
