// Checks every public link the portfolio shows, as a logged-out visitor
// would see it: project live sites and code links from projects.json, and
// the https links in the profile (src/data/profile/profile.ts).
//
// Usage: npm run check:links
// Exits with 1 if any shown link fails, so it can run in CI later (6.4/6.6).
// Sealed projects (in-development, ready-for-review) are listed but never
// fail the check: their links are not shown to visitors.

import { readFileSync } from "node:fs";

const SHOWN = new Set(["published", "unavailable"]);
const projects = JSON.parse(readFileSync(new URL("../projects.json", import.meta.url), "utf8"));
const profileSource = readFileSync(new URL("../src/data/profile/profile.ts", import.meta.url), "utf8");

const links = [];
for (const p of projects) {
  const shown = SHOWN.has(p.status);
  // A closed (unavailable) project hides its live link, so only its code link is shown.
  if (p.liveUrl) links.push({ where: `${p.id} live site`, url: p.liveUrl, shown: shown && p.status === "published" });
  if (p.githubUrl) links.push({ where: `${p.id} code`, url: p.githubUrl, shown });
  for (const e of p.evidence ?? []) if (e.url) links.push({ where: `${p.id} evidence "${e.label}"`, url: e.url, shown });
}
for (const [, url] of profileSource.matchAll(/url:\s*"(https:\/\/[^"]+)"/g)) {
  links.push({ where: "profile", url, shown: true });
}

async function status(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(20_000), headers: { "user-agent": "museum-link-check" } });
      if (res.ok || method === "GET") return res.status;
    } catch (error) {
      if (method === "GET") return `error: ${error.cause?.code ?? error.name}`;
    }
  }
}

let failed = 0;
for (const link of links) {
  const result = await status(link.url);
  const ok = typeof result === "number" && result >= 200 && result < 400;
  const tag = ok ? "ok  " : link.shown ? "FAIL" : "skip";
  if (!ok && link.shown) failed++;
  console.log(`${tag} ${String(result).padEnd(5)} ${link.where}: ${link.url}${link.shown ? "" : " (not shown to visitors)"}`);
}
console.log(failed ? `\n${failed} shown link(s) failed.` : "\nAll shown links work.");
process.exit(failed ? 1 : 0);
