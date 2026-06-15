import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToDB } from '@/lib/db';
import { Startup } from '@/models/start-up';
import { auth } from '@/lib/auth';
import { STARTUP_STAGES, STARTUP_STAGE_LABELS } from '@/lib/startup-stage';
import {
  getViewMetrics,
  getMostViewedStartups,
  getSectorMomentum,
  getStageDealFlow,
  getTopSearchTerms,
  getPopularFilters,
  getSignalScoreDistribution,
} from '@/lib/analytics-aggregate';
import { buildDealflow } from '@/lib/dealflow';

const SEEKING_STAGES = ['idea', 'pre-seed', 'seed'];

export async function GET(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user || (user.role !== 'investor' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDB();

    const startups = await Startup.find({ status: { $in: ['approved', 'active'] } })
      .select('stage location createdAt')
      .lean<{ stage?: string; location?: string; createdAt?: Date }[]>();

    const now = Date.now();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Stage funnel in canonical order (skip undisclosed/empty).
    const stageCounts = new Map<string, number>();
    for (const s of startups) {
      const k = (s.stage || '').trim();
      if (k) stageCounts.set(k, (stageCounts.get(k) || 0) + 1);
    }
    const stageFunnel = STARTUP_STAGES.filter((s) => s !== 'undisclosed').map((stage) => ({
      stage,
      label: STARTUP_STAGE_LABELS[stage],
      count: stageCounts.get(stage) || 0,
    }));

    // Geographic distribution (top 10, by first location segment, e.g. city).
    const geoCounts = new Map<string, number>();
    for (const s of startups) {
      const loc = (s.location || 'Unknown').split(',')[0].trim() || 'Unknown';
      geoCounts.set(loc, (geoCounts.get(loc) || 0) + 1);
    }
    const geographic = [...geoCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Monthly growth (last 12 months) from real createdAt.
    const monthlyGrowth: { month: string; count: number }[] = [];
    const ref = new Date();
    for (let i = 11; i >= 0; i--) {
      const start = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      const end = new Date(ref.getFullYear(), ref.getMonth() - i + 1, 1);
      monthlyGrowth.push({
        month: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: startups.filter((s) => {
          const c = s.createdAt ? new Date(s.createdAt) : null;
          return c && c >= start && c < end;
        }).length,
      });
    }

    // Everything behavioural below comes from recorded events (starts at zero
    // until traffic accrues — honest by construction, never fabricated).
    const [
      viewMetrics,
      mostViewed,
      sectorMomentum,
      byStage,
      topSearchTerms,
      popularFilters,
      scored,
    ] = await Promise.all([
      getViewMetrics('month'),
      getMostViewedStartups('week', 5),
      getSectorMomentum('month', 6),
      getStageDealFlow(SEEKING_STAGES, 'week'),
      getTopSearchTerms('month', 5),
      getPopularFilters('month', 5),
      buildDealflow({ sort: 'score' }),
    ]);

    const scores = scored.map((s) => s.signal.overall);
    const avgSignalScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return NextResponse.json({
      dealFlow: {
        seekingInvestment: startups.filter((s) => SEEKING_STAGES.includes(s.stage || '')).length,
        byStage,
        newThisWeek: startups.filter((s) => s.createdAt && new Date(s.createdAt) > weekAgo).length,
        newThisMonth: startups.filter((s) => s.createdAt && new Date(s.createdAt) > monthAgo).length,
        totalTracked: startups.length,
        avgSignalScore,
      },
      marketIntelligence: {
        sectorMomentum,
        stageFunnel,
        geographic,
        monthlyGrowth,
        signalScoreDistribution: getSignalScoreDistribution(scores),
        mostViewed: mostViewed.map((m) => ({
          name: m.name,
          views: m.views,
          uniqueViews: m.uniqueViews,
          sector: m.sector,
        })),
      },
      engagement: {
        totalViews: viewMetrics.totalViews,
        uniqueViews: viewMetrics.uniqueViews,
        avgTimeOnPage: viewMetrics.avgTimeOnPageSec,
        topSearchTerms,
        popularFilters,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        windows: { views: '30d', mostViewed: '7d', momentum: '30d', dealFlowTrend: '7d' },
      },
    });
  } catch (error) {
    console.error('Investor analytics error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
