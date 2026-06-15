// ⚠️ MOCK — sample investor-engagement figures for layout preview, used only
// until real traffic accrues. Deterministic per startup (seeded by id, weighted
// by Signal Score so higher-signal startups read as more-viewed). NOT real —
// always shown behind a "Sample" tag. Delete when behavioural data is live.

interface DealLike {
  _id: string;
  name: string;
  sector?: string;
  signal: { overall: number };
}

export interface DealEngagement {
  uniqueViews: number;
  watchlistAdds: number;
  viewTrend: number | null;
}

export interface MockEngagementSummary {
  uniqueViews: number;
  totalViews: number;
  avgTimeSec: number;
  mostViewed: { name: string; sector: string; uniqueViews: number }[];
  topSearches: { term: string; count: number }[];
}

function hash(s: string): number {
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

export function mockDealEngagement(id: string, signal: number): DealEngagement {
  const r = mulberry32(hash(id));
  const base = 6 + Math.round((signal / 100) * 90); // higher signal → more views
  const uniqueViews = Math.max(1, base + Math.round((r() - 0.5) * 28));
  const watchlistAdds = Math.round(uniqueViews * (0.05 + r() * 0.12));
  const viewTrend = Math.round(-15 + r() * 70); // -15 … +55
  return { uniqueViews, watchlistAdds, viewTrend };
}

// Sample market-signal datasets — used to populate charts that have no real
// data yet (sector momentum / monthly growth). Plausible, clearly tagged.
export function mockSectorMomentum(): { name: string; growthRate: number; startupCount: number }[] {
  return [
    { name: 'Fintech', growthRate: 46, startupCount: 9 },
    { name: 'Agritech', growthRate: 33, startupCount: 5 },
    { name: 'Healthtech', growthRate: 28, startupCount: 4 },
    { name: 'Logistics', growthRate: 19, startupCount: 6 },
    { name: 'E-commerce', growthRate: 14, startupCount: 3 },
    { name: 'Edtech', growthRate: 9, startupCount: 3 },
  ];
}

export function mockMonthlyGrowth(): { month: string; count: number }[] {
  const now = new Date();
  const curve = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8];
  return curve.map((count, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), count };
  });
}

const SEARCH_TERMS = ['fintech', 'agritech', 'seed stage', 'logistics', 'payments', 'healthtech', 'Addis Ababa', 'AI'];

export function mockEngagementSummary(deals: DealLike[]): MockEngagementSummary {
  const scored = deals
    .map((d) => ({ d, e: mockDealEngagement(d._id, d.signal.overall) }))
    .sort((a, b) => b.e.uniqueViews - a.e.uniqueViews);

  const uniqueViews = scored.reduce((s, x) => s + x.e.uniqueViews, 0);
  const mostViewed = scored.slice(0, 5).map((x) => ({
    name: x.d.name,
    sector: x.d.sector || '—',
    uniqueViews: x.e.uniqueViews,
  }));

  const r = mulberry32(hash('gc-searches'));
  const topSearches = SEARCH_TERMS.slice(0, 6)
    .map((term) => ({ term, count: 4 + Math.round(r() * 38) }))
    .sort((a, b) => b.count - a.count);

  return {
    uniqueViews,
    totalViews: Math.round(uniqueViews * 1.6),
    avgTimeSec: 47,
    mostViewed,
    topSearches,
  };
}
