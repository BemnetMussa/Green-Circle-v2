import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { Startup } from '@/models/start-up';
import { profileStrengthScore } from '@/lib/signal-score';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since'); // 'week' | 'month' | 'all'
    const stage = searchParams.get('stage');
    const sector = searchParams.get('sector');
    const limit = parseInt(searchParams.get('limit') || '20');

    await connectToDB();

    // Build query
    const query: any = { status: { $in: ['approved', 'active'] } };

    // Time filter
    if (since === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.createdAt = { $gte: weekAgo };
    } else if (since === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      query.createdAt = { $gte: monthAgo };
    }

    // Stage filter
    if (stage && stage !== 'all') {
      query.stage = stage;
    }

    // Sector filter
    if (sector && sector !== 'all') {
      query.sector = sector;
    }

    const startups = await Startup.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Enrich with calculated fields
    const enriched = startups.map(s => ({
      ...s,
      profileScore: calculateProfileScore(s),
      isNew: isNewThisWeek(s.createdAt),
    }));

    return NextResponse.json({
      startups: enriched,
      total: enriched.length,
      filters: { since, stage, sector },
    });
  } catch (error) {
    console.error('Discovery API error:', error);
    return NextResponse.json(
      { error: 'Failed to load startups' },
      { status: 500 }
    );
  }
}

// Single source of truth for profile completeness lives in lib/signal-score.ts.
function calculateProfileScore(startup: any): number {
  return profileStrengthScore(startup);
}

function isNewThisWeek(date: any): boolean {
  if (!date) return false;
  const d = new Date(date);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return d >= weekAgo;
}
