#!/usr/bin/env node
// Ethiopian-startup fetcher — pulls structured PUBLIC sources, parses them into
// schema-shaped records, and MERGES new ones into data/ethiopian-startups.json
// (dedup by normalized name; existing entries are never modified).
//
// This is the "fetcher" engine: each source has a url + a parser. v1 ships a
// parser for community markdown-table lists (the most reliable, lowest-risk
// source — public, attributed, structured). Add more sources/parsers below.
//
// Every fetched record is marked UNVERIFIED with its source attached, per
// docs/data-verification.md — nothing here is "published", it's staged for
// human review before import.
//
// Run:  node scripts/fetch-startups.mjs
// Needs Node 18+ (global fetch). No API key.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'ethiopian-startups.json');

/* --------------------------------- sources --------------------------------- */
// Add structured, public, attributable sources here. Each: { name, url, parse }.
const SOURCES = [
  {
    name: 'HenokB/Startups-in-Ethiopia (GitHub community list)',
    url: 'https://raw.githubusercontent.com/HenokB/Startups-in-Ethiopia/main/README.md',
    parse: parseMarkdownTable,
  },
];

/* --------------------------------- parsers --------------------------------- */
// Parses a GitHub markdown table: | Name | About | Location | Website | Founded | Founder/s |
function parseMarkdownTable(md, sourceUrl) {
  const rows = md
    .split('\n')
    .filter((l) => l.trim().startsWith('|') && l.includes('|', 1))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));

  const out = [];
  for (const cells of rows) {
    if (cells.length < 4) continue;
    const rawName = cells[0];
    // skip header + separator rows
    if (/^name$/i.test(rawName) || /^-+$/.test(rawName) || rawName === '') continue;

    const name = rawName.replace(/^\d+\.\s*/, '').trim();
    const about = cells[1] || '';
    const location = cells[2] || 'Ethiopia';
    const website = extractUrl(cells[3]);
    const foundedYear = (cells[4] || '').match(/\d{4}/)?.[0] || null;
    const founders = (cells[5] || '')
      .split(/,| and /i)
      .map((f) => f.trim())
      .filter(Boolean)
      .map((n) => ({ name: n }));

    if (!name) continue;
    const filled = [website, foundedYear, founders.length, about].filter(Boolean).length;
    out.push({
      name,
      website: website || null,
      sector: '', // not provided by this source — set on review
      location: location || 'Ethiopia',
      foundedYear,
      stage: '',
      description: about || '',
      founders,
      _meta: {
        confidence: filled >= 3 ? 'medium' : 'low',
        sources: [sourceUrl],
        fetchedAt: new Date().toISOString().slice(0, 10),
      },
    });
  }
  return out;
}

function extractUrl(cell) {
  const md = cell.match(/\]\((https?:\/\/[^)]+)\)/);
  if (md) return md[1];
  const bare = cell.match(/https?:\/\/\S+/);
  return bare ? bare[0] : null;
}

/* --------------------------------- merge ----------------------------------- */
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/\b(plc|inc|ltd|technologies|technology|tech|llc|et|ethiopia)\b/g, '')
    .replace(/[^a-z0-9]/g, '');

async function main() {
  const db = JSON.parse(readFileSync(OUT, 'utf8'));
  const existing = new Map(db.startups.map((s) => [norm(s.name), s]));

  let added = 0;
  const log = [];
  for (const src of SOURCES) {
    process.stdout.write(`Fetching: ${src.name}\n`);
    let md;
    try {
      const res = await fetch(src.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      md = await res.text();
    } catch (e) {
      console.error(`  ! skipped (${e.message})`);
      continue;
    }
    const records = src.parse(md, src.url);
    let srcAdded = 0;
    for (const rec of records) {
      const key = norm(rec.name);
      if (!key || existing.has(key)) continue; // never overwrite existing
      existing.set(key, rec);
      db.startups.push(rec);
      srcAdded++;
      added++;
    }
    log.push({ source: src.name, found: records.length, added: srcAdded });
    console.log(`  parsed ${records.length}, added ${srcAdded} new`);
  }

  db._meta.count = db.startups.length;
  db._meta.lastFetch = { date: new Date().toISOString().slice(0, 10), results: log };
  writeFileSync(OUT, JSON.stringify(db, null, 2) + '\n');
  console.log(`\nDone. +${added} new → ${db.startups.length} total in data/ethiopian-startups.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
