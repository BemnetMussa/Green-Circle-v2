// Read-side analytics. Pure aggregation over `analytics_events` + `startups`.
//
// Everything here returns REAL numbers computed at read time — no constants, no
// Math.random. When no events have been recorded yet, these return zeros/empty
// arrays, which is the honest answer ("no data yet"), never a fabricated one.
import { connectToDB } from '@/lib/db';
import { AnalyticsEvent } from '@/models/analytics-event';
import { Startup } from '@/models/start-up';

export type PeriodKey = 'week' | 'month' | 'all';

const DAY = 24 * 60 * 60 * 1000;

/** Start of the current window, and of the equally-sized window before it. */
export function periodWindow(period: PeriodKey): {
  curStart: Date | null;
  prevStart: Date | null;
} {
  if (period === 'all') return { curStart: null, prevStart: null };
  const days = period === 'week' ? 7 : 30;
  const curStart = new Date(Date.now() - days * DAY);
  const prevStart = new Date(Date.now() - 2 * days * DAY);
  return { curStart, prevStart };
}

function sinceMatch(curStart: Date | null) {
  return curStart ? { createdAt: { $gte: curStart } } : {};
}

/** % change of current vs previous window. Null when there's no basis. */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Resolve startup ids (as recorded in events — string form) back to startup
 * docs, tolerant of whether `_id` is an ObjectId or a custom string.
 */
async function startupsByStringIds(
  ids: string[]
): Promise<Map<string, { name: string; sector?: string }>> {
  const map = new Map<string, { name: string; sector?: string }>();
  if (ids.length === 0) return map;
  const docs = await Startup.aggregate<{ key: string; name: string; sector?: string }>([
    { $addFields: { key: { $toString: '$_id' } } },
    { $match: { key: { $in: ids } } },
    { $project: { key: 1, name: 1, sector: 1 } },
  ]);
  for (const d of docs) map.set(d.key, { name: d.name, sector: d.sector });
  return map;
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

export async function getViewMetrics(period: PeriodKey): Promise<{
  totalViews: number;
  uniqueViews: number;
  avgTimeOnPageSec: number;
}> {
  await connectToDB();
  const { curStart } = periodWindow(period);

  const [agg] = await AnalyticsEvent.aggregate([
    { $match: { type: 'startup_view', ...sinceMatch(curStart) } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        sessions: { $addToSet: '$sessionId' },
        avgDuration: { $avg: { $cond: [{ $gt: ['$durationMs', 0] }, '$durationMs', null] } },
      },
    },
  ]);

  return {
    totalViews: agg?.totalViews ?? 0,
    uniqueViews: agg?.sessions?.filter(Boolean).length ?? 0,
    avgTimeOnPageSec: agg?.avgDuration ? Math.round(agg.avgDuration / 1000) : 0,
  };
}

/** Real "most viewed" — ranked by distinct sessions, with view + unique counts. */
export async function getMostViewedStartups(
  period: PeriodKey,
  limit = 5
): Promise<{ startupId: string; name: string; sector: string; views: number; uniqueViews: number }[]> {
  await connectToDB();
  const { curStart } = periodWindow(period);

  const rows = await AnalyticsEvent.aggregate<{
    _id: string;
    views: number;
    sessions: (string | null)[];
  }>([
    { $match: { type: 'startup_view', startupId: { $ne: null }, ...sinceMatch(curStart) } },
    { $group: { _id: '$startupId', views: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
    { $sort: { views: -1 } },
    { $limit: limit },
  ]);

  const names = await startupsByStringIds(rows.map((r) => r._id));
  return rows.map((r) => ({
    startupId: r._id,
    name: names.get(r._id)?.name ?? 'Unknown',
    sector: names.get(r._id)?.sector ?? 'Unspecified',
    views: r.views,
    uniqueViews: r.sessions.filter(Boolean).length,
  }));
}

/** View-volume trend: current window vs previous equally-sized window. */
export async function getViewTrend(period: PeriodKey): Promise<number | null> {
  if (period === 'all') return null;
  await connectToDB();
  const { curStart, prevStart } = periodWindow(period);

  const [agg] = await AnalyticsEvent.aggregate([
    { $match: { type: 'startup_view', createdAt: { $gte: prevStart! } } },
    {
      $group: {
        _id: null,
        current: { $sum: { $cond: [{ $gte: ['$createdAt', curStart] }, 1, 0] } },
        previous: { $sum: { $cond: [{ $lt: ['$createdAt', curStart] }, 1, 0] } },
      },
    },
  ]);
  return pctChange(agg?.current ?? 0, agg?.previous ?? 0);
}

// ---------------------------------------------------------------------------
// Search & filters
// ---------------------------------------------------------------------------

export async function getTopSearchTerms(
  period: PeriodKey,
  limit = 8
): Promise<{ term: string; count: number }[]> {
  await connectToDB();
  const { curStart } = periodWindow(period);
  const rows = await AnalyticsEvent.aggregate<{ _id: string; count: number }>([
    { $match: { type: 'search', query: { $nin: [null, ''] }, ...sinceMatch(curStart) } },
    { $group: { _id: '$query', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ term: r._id, count: r.count }));
}

export async function getPopularFilters(
  period: PeriodKey,
  limit = 8
): Promise<{ filter: string; uses: number }[]> {
  await connectToDB();
  const { curStart } = periodWindow(period);
  const rows = await AnalyticsEvent.aggregate<{ _id: { k: string; v: string }; uses: number }>([
    { $match: { type: 'filter', ...sinceMatch(curStart) } },
    { $group: { _id: { k: '$filterKey', v: '$filterValue' }, uses: { $sum: 1 } } },
    { $sort: { uses: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({
    filter: `${capitalize(r._id.k)}: ${capitalize(r._id.v)}`,
    uses: r.uses,
  }));
}

// ---------------------------------------------------------------------------
// Startup-derived (single source for both public + investor routes)
// ---------------------------------------------------------------------------

/**
 * Per-sector momentum from the startups collection: how many NEW startups
 * joined each sector in the current window vs the previous one. Real growth.
 */
export async function getSectorMomentum(
  period: PeriodKey,
  limit = 6
): Promise<{ name: string; growthRate: number | null; startupCount: number }[]> {
  await connectToDB();
  const { curStart, prevStart } = periodWindow(period);

  const rows = await Startup.aggregate<{
    _id: string;
    total: number;
    current: number;
    previous: number;
  }>([
    { $match: { status: { $in: ['approved', 'active'] }, sector: { $nin: [null, ''] } } },
    {
      $group: {
        _id: '$sector',
        total: { $sum: 1 },
        current: {
          $sum: { $cond: [curStart ? { $gte: ['$createdAt', curStart] } : false, 1, 0] },
        },
        previous: {
          $sum: {
            $cond: [
              curStart && prevStart
                ? { $and: [{ $gte: ['$createdAt', prevStart] }, { $lt: ['$createdAt', curStart] }] }
                : false,
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { total: -1 } },
    { $limit: limit },
  ]);

  return rows.map((r) => ({
    name: r._id,
    startupCount: r.total,
    growthRate: period === 'all' ? null : pctChange(r.current, r.previous),
  }));
}

/** New-startup trend per funding stage (current vs previous window). */
export async function getStageDealFlow(
  stages: string[],
  period: PeriodKey
): Promise<{ name: string; count: number; trend: number | null }[]> {
  await connectToDB();
  const { curStart, prevStart } = periodWindow(period);

  const rows = await Startup.aggregate<{
    _id: string;
    count: number;
    current: number;
    previous: number;
  }>([
    { $match: { status: { $in: ['approved', 'active'] }, stage: { $in: stages } } },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        current: {
          $sum: { $cond: [curStart ? { $gte: ['$createdAt', curStart] } : false, 1, 0] },
        },
        previous: {
          $sum: {
            $cond: [
              curStart && prevStart
                ? { $and: [{ $gte: ['$createdAt', prevStart] }, { $lt: ['$createdAt', curStart] }] }
                : false,
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const byStage = new Map(rows.map((r) => [r._id, r]));
  return stages.map((stage) => {
    const r = byStage.get(stage);
    return {
      name: stage,
      count: r?.count ?? 0,
      trend: period === 'all' || !r ? null : pctChange(r.current, r.previous),
    };
  });
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Per-startup engagement (powers the Signal Score "demand" component + cards)
// ---------------------------------------------------------------------------

export interface StartupEngagement {
  views: number;
  uniqueViews: number;
  watchlistAdds: number;
  /** % change in views, current window vs previous. Null for `all` or no basis. */
  viewTrend: number | null;
}

/**
 * Engagement per startup over a window, keyed by the startup's string id. Only
 * startups with at least one event appear; callers default the rest to zero.
 */
export async function getEngagementByStartup(
  period: PeriodKey
): Promise<Map<string, StartupEngagement>> {
  await connectToDB();
  const { curStart, prevStart } = periodWindow(period);

  const since = prevStart ?? curStart; // widen to previous window so we can trend
  const rows = await AnalyticsEvent.aggregate<{
    _id: string;
    views: number;
    sessions: (string | null)[];
    watchlistAdds: number;
    prevViews: number;
  }>([
    {
      $match: {
        startupId: { $ne: null },
        type: { $in: ['startup_view', 'watchlist_add'] },
        ...(since ? { createdAt: { $gte: since } } : {}),
      },
    },
    {
      $group: {
        _id: '$startupId',
        views: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'startup_view'] },
                  curStart ? { $gte: ['$createdAt', curStart] } : true,
                ],
              },
              1,
              0,
            ],
          },
        },
        sessions: {
          // Emit null (not $$REMOVE — illegal inside a $group accumulator) for
          // non-current-window views; the caller drops falsy values when counting.
          $addToSet: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'startup_view'] },
                  curStart ? { $gte: ['$createdAt', curStart] } : true,
                ],
              },
              '$sessionId',
              null,
            ],
          },
        },
        watchlistAdds: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'watchlist_add'] },
                  curStart ? { $gte: ['$createdAt', curStart] } : true,
                ],
              },
              1,
              0,
            ],
          },
        },
        prevViews: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'startup_view'] },
                  curStart && prevStart
                    ? {
                        $and: [
                          { $gte: ['$createdAt', prevStart] },
                          { $lt: ['$createdAt', curStart] },
                        ],
                      }
                    : false,
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const map = new Map<string, StartupEngagement>();
  for (const r of rows) {
    map.set(r._id, {
      views: r.views,
      uniqueViews: r.sessions.filter(Boolean).length,
      watchlistAdds: r.watchlistAdds,
      viewTrend: period === 'all' ? null : pctChange(r.views, r.prevViews),
    });
  }
  return map;
}

/** Startup ids ranked by recent engagement velocity (views + 2×watchlist). */
export async function getTrendingStartupIds(
  period: PeriodKey,
  limit = 6
): Promise<string[]> {
  const engagement = await getEngagementByStartup(period);
  return [...engagement.entries()]
    .map(([id, e]) => ({ id, score: e.views + e.watchlistAdds * 2 }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.id);
}

/** Bucket a set of signal scores into a histogram for the market-intel chart. */
export function getSignalScoreDistribution(
  scores: number[]
): { range: string; count: number }[] {
  const buckets = [
    { range: '0–34', min: 0, max: 34 },
    { range: '35–49', min: 35, max: 49 },
    { range: '50–64', min: 50, max: 64 },
    { range: '65–79', min: 65, max: 79 },
    { range: '80–100', min: 80, max: 100 },
  ];
  return buckets.map((b) => ({
    range: b.range,
    count: scores.filter((s) => s >= b.min && s <= b.max).length,
  }));
}
