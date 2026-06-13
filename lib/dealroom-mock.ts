// ⚠️ MOCK DATA — layout preview only. NOT real.
// Deterministic Dealroom-style sample figures (valuation, funding, rounds,
// growth) derived from the company id, so the analytics table looks like
// Dealroom while the real funding/valuation backend is built later.
//
// These are FABRICATED for visual preview and must be replaced with a real
// data source before any investor sees them (Green Circle's #1 rule:
// no fabricated numbers in production). Delete this file when the backend lands.
import type { PublicCompany } from '@/app/api/analytics/companies/route';

export interface DealroomMockMetrics {
  marketScope: 'B2B' | 'B2C' | 'B2B, B2C';
  type: string; // business-model line, e.g. "marketplace commission"
  growthPct: number; // 12-month, may be negative
  growthSeries: { i: number; v: number }[];
  valuation: string | null; // "$8–12m" or null → "—"
  funding: string; // "$2.1m"
  lastRound: string; // "$2.0m SEED"
  lastRoundDate: string; // "May 2022"
  jobOpenings: number | null;
  // Raw numbers backing the formatted strings — let the ecosystem dashboard
  // aggregate the SAME figures the table displays, so they stay consistent.
  fundingUsd: number;
  lastRoundUsd: number;
  lastRoundType: string;
  lastRoundYear: number;
  valuationLowUsd: number | null;
  valuationHighUsd: number | null;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const TYPES = [
  'marketplace', 'saas', 'commission', 'mobile app', 'subscription',
  'ecommerce', 'platform', 'manufacturing', 'enterprise software', 'iot',
];

// Typical total-funding band (USD) per stage — used to keep mocks plausible.
const FUNDING_BANDS: Record<string, [number, number]> = {
  idea: [20_000, 150_000],
  'pre-seed': [50_000, 600_000],
  seed: [500_000, 5_000_000],
  'series-a': [5_000_000, 25_000_000],
  'series-b-plus': [25_000_000, 200_000_000],
  bootstrapped: [0, 1_000_000],
  undisclosed: [100_000, 3_000_000],
};

const STAGE_ROUND: Record<string, string> = {
  idea: 'PRE-SEED',
  'pre-seed': 'PRE-SEED',
  seed: 'SEED',
  'series-a': 'SERIES A',
  'series-b-plus': 'SERIES B',
  bootstrapped: 'GRANT',
  undisclosed: 'SEED',
};

const ALT_ROUNDS = ['ANGEL', 'DEBT', 'GRANT', 'LATE VC', 'EARLY VC', 'SUPPORT PROGRAM'];

/* deterministic PRNG so values are stable across renders -------------------- */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* money formatting (Dealroom-style) ----------------------------------------- */

export function fmtAmount(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}b`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}m`;
  if (n >= 1e3) {
    const v = n / 1e3;
    return `$${v < 100 ? v.toFixed(1) : Math.round(v)}k`;
  }
  return `$${Math.round(n)}`;
}

function fmtRange(low: number, high: number): string {
  let div = 1;
  let unit = '';
  if (high >= 1e6) {
    div = 1e6;
    unit = 'm';
  } else if (high >= 1e3) {
    div = 1e3;
    unit = 'k';
  }
  return `$${Math.round(low / div)}–${Math.round(high / div)}${unit}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* generator ----------------------------------------------------------------- */

export function dealroomMock(c: PublicCompany): DealroomMockMetrics {
  const rnd = mulberry32(hashStr(c._id || c.name));
  const stage = (c.stage || '').trim();

  // Funding
  const band = FUNDING_BANDS[stage] ?? [50_000, 2_000_000];
  let funding = Math.round(lerp(band[0], band[1], rnd()) / 1000) * 1000;
  if (funding < 1000) funding = 0;

  // Last round (a slice of total)
  const roundAmt = Math.max(1000, Math.round((funding * (0.35 + rnd() * 0.45)) / 1000) * 1000);
  let roundType = STAGE_ROUND[stage] ?? 'SEED';
  if ((stage === 'bootstrapped' || stage === 'undisclosed' || !stage) && rnd() < 0.6) {
    roundType = ALT_ROUNDS[Math.floor(rnd() * ALT_ROUNDS.length)];
  } else if (rnd() < 0.12) {
    roundType = 'DEBT';
  }
  const lastRound = funding > 0 ? `${fmtAmount(roundAmt)} ${roundType}` : `N/A ${roundType}`;

  // Valuation — only when funding is meaningful (else "—", like Dealroom)
  let valuation: string | null = null;
  let valuationLowUsd: number | null = null;
  let valuationHighUsd: number | null = null;
  if (funding >= 300_000) {
    const low = funding * (4 + rnd() * 3);
    const high = low * (1.25 + rnd() * 0.5);
    valuationLowUsd = Math.round(low);
    valuationHighUsd = Math.round(high);
    valuation = fmtRange(low, high);
  }

  // Last round date (between founding year and 2026)
  const fy = parseInt(String(c.foundedYear ?? ''), 10);
  const startY = Number.isFinite(fy) && fy > 2000 ? fy : 2018;
  const year = startY + Math.floor(rnd() * (2026 - startY + 1));
  const lastRoundDate = `${MONTHS[Math.floor(rnd() * 12)]} ${year}`;

  // Growth (12-month sparkline + %)
  const start = 30 + rnd() * 40;
  const up = rnd() > 0.22;
  const slope = (up ? 1 : -1) * (0.4 + rnd() * 3.2);
  const growthSeries = Array.from({ length: 12 }, (_, i) => {
    const noise = (rnd() - 0.5) * 6;
    return { i, v: Math.max(1, start + slope * i + noise) };
  });
  const growthPct = ((growthSeries[11].v - growthSeries[0].v) / growthSeries[0].v) * 100;

  // Job openings (~45% have any)
  const jobOpenings = rnd() < 0.45 ? 1 + Math.floor(rnd() * 24) : null;

  // Market scope
  const s = rnd();
  const marketScope = s < 0.5 ? 'B2C' : s < 0.85 ? 'B2B' : 'B2B, B2C';

  // Business-model type (1–2 tags)
  const t1 = TYPES[Math.floor(rnd() * TYPES.length)];
  const t2 = TYPES[Math.floor(rnd() * TYPES.length)];
  const type = rnd() < 0.5 && t2 !== t1 ? `${t1} ${t2}` : t1;

  return {
    marketScope,
    type,
    growthPct,
    growthSeries,
    valuation,
    funding: funding > 0 ? fmtAmount(funding) : '—',
    lastRound,
    lastRoundDate,
    jobOpenings,
    fundingUsd: funding,
    lastRoundUsd: funding > 0 ? roundAmt : 0,
    lastRoundType: roundType,
    lastRoundYear: year,
    valuationLowUsd,
    valuationHighUsd,
  };
}
