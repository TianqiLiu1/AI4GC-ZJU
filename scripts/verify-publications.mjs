#!/usr/bin/env node
// Read-only: cross-checks each BibTeX entry against DBLP and prints a diff report.
// Does NOT modify any files. Usage: node scripts/verify-publications.mjs

import { readFileSync, existsSync, readdirSync } from "fs";
import { execFileSync } from "child_process";
import path from "path";

const ROOT = process.cwd();
const GLOBAL_BIB = path.join(ROOT, "content/publications.bib");
const TEAM_DIR = path.join(ROOT, "content/team");

function findBibFiles() {
  const files = [];
  if (existsSync(GLOBAL_BIB)) files.push(GLOBAL_BIB);
  function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "papers.bib") files.push(p);
    }
  }
  if (existsSync(TEAM_DIR)) walk(TEAM_DIR);
  return files;
}

function parseEntries(text) {
  const entries = [];
  const re = /@(\w+)\s*\{\s*([^,]+),([\s\S]*?)\n\}/g;
  let m;
  while ((m = re.exec(text))) {
    const [, type, key, body] = m;
    const fields = {};
    const fre = /(\w+)\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let fm;
    while ((fm = fre.exec(body))) fields[fm[1].toLowerCase()] = fm[2].trim();
    entries.push({ type: type.toLowerCase(), key: key.trim(), fields });
  }
  return entries;
}

const norm = (s) =>
  (s || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s*\d{4}$/, "") // strip DBLP disambig like "0001"
    .replace(/[^a-z0-9 ]/gi, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const splitAuthors = (s) =>
  (s || "")
    .split(/\s+and\s+/i)
    .map((a) => a.trim())
    .filter(Boolean);

function titleKey(t) {
  return norm(t).replace(/\.$/, "");
}

async function dblpLookup(title) {
  const url =
    "https://dblp.org/search/publ/api?format=json&h=8&q=" +
    encodeURIComponent(title.replace(/[{}]/g, ""));
  const headers = {
    Accept: "application/json",
    "User-Agent": "ai4gc-website-bib-check/1.0 (one-off metadata reconciliation)",
  };

  // Use curl (honors the http(s)_proxy env vars that Node fetch ignores).
  // DBLP rate-limits; retry with exponential backoff on transient failure / empty body.
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const out = execFileSync(
        "curl",
        ["-s", "-m", "25", "-A", headers["User-Agent"], "-H", "Accept: application/json", url],
        { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
      );
      const data = JSON.parse(out);
      return (data?.result?.hits?.hit ?? []).map((h) => h.info);
    } catch (err) {
      lastErr = err;
      await sleep(4000 * (attempt + 1));
    }
  }
  throw lastErr ?? new Error("DBLP lookup failed");
}

function pickBest(hits, title) {
  const want = titleKey(title);
  const matches = hits.filter((h) => titleKey(h.title || "") === want);
  const pool = matches.length ? matches : hits;
  // prefer published (conference/journal) over CoRR/informal
  const rank = (h) =>
    /informal/i.test(h.type || "") || (h.venue || "") === "CoRR" ? 1 : 0;
  pool.sort((a, b) => rank(a) - rank(b));
  return { best: pool[0], exactCount: matches.length };
}

function dblpAuthors(info) {
  let a = info?.authors?.author ?? [];
  if (!Array.isArray(a)) a = [a];
  return a.map((x) => (typeof x === "string" ? x : x.text).replace(/\s+\d{4}$/, "").trim());
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const files = findBibFiles();
  let nOk = 0,
    nDiff = 0,
    nMiss = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const entries = parseEntries(readFileSync(file, "utf8"));
    console.log(`\n========== ${rel} (${entries.length} entries) ==========`);

    for (const e of entries) {
      const title = e.fields.title || "";
      let hits;
      try {
        hits = await dblpLookup(title);
      } catch (err) {
        console.log(`\n[?] ${e.key}: DBLP query failed (${err.message})`);
        await sleep(2500);
        continue;
      }
      await sleep(2500);

      const { best, exactCount } = pickBest(hits, title);
      if (!best) {
        nMiss++;
        console.log(`\n[NOT FOUND] ${e.key}\n   title: ${title}`);
        continue;
      }

      const curAuthors = splitAuthors(e.fields.author);
      const dbAuthors = dblpAuthors(best);
      const authorsSame =
        curAuthors.length === dbAuthors.length &&
        curAuthors.every((a, i) => norm(a) === norm(dbAuthors[i]));
      const curVenue = e.fields.booktitle || e.fields.journal || "";
      // DBLP labels arXiv preprints "CoRR"; treat that as equivalent to our "arXiv".
      const dbVenue = (best.venue || "") === "CoRR" ? "arXiv" : best.venue || "";
      const venueSame = norm(curVenue) === norm(dbVenue);
      const yearSame = (e.fields.year || "") === String(best.year || "");
      const curDoi = (e.fields.doi || "").toLowerCase();
      const dbDoi = (best.doi || "").toLowerCase();
      const doiSame = curDoi === dbDoi || !dbDoi;

      const diffs = [];
      if (!authorsSame)
        diffs.push(
          `   authors:\n     現 ${curAuthors.join(", ")}\n     DBLP ${dbAuthors.join(", ")}`,
        );
      if (!venueSame) diffs.push(`   venue: 現 "${curVenue}" → DBLP "${dbVenue}"`);
      if (!yearSame) diffs.push(`   year:  現 "${e.fields.year}" → DBLP "${best.year}"`);
      if (!doiSame) diffs.push(`   doi:   現 "${e.fields.doi || "-"}" → DBLP "${best.doi}"`);

      const flag = exactCount === 0 ? " ⚠ title-mismatch(模糊匹配,需人工核对)" : "";
      if (diffs.length === 0) {
        nOk++;
        console.log(`\n[OK] ${e.key}${flag}`);
      } else {
        nDiff++;
        console.log(
          `\n[DIFF] ${e.key}${flag}  (${best.venue} ${best.year}, dblp:${best.key})\n${diffs.join("\n")}`,
        );
      }
    }
  }

  console.log(`\n========== SUMMARY ==========`);
  console.log(`OK: ${nOk}   DIFF: ${nDiff}   NOT FOUND: ${nMiss}   files: ${files.length}`);
})();
