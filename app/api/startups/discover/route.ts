import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { Startup } from '@/models/start-up';

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

function calculateProfileScore(startup: any): number {
  let score = 0;
  if (startup.logo && !startup.logo.includes('placeholder')) score += 15;
  if (startup.description?.length > 200) score += 15;
  if (startup.founders?.length > 0) score += 15;
  if (startup.website) score += 10;
  if (startup.pitch) score += 10;
  if (startup.achievements?.length > 0) score += 10;
  if (startup.images?.length > 0) score += 10;
  if (startup.video) score += 10;
  if (startup.revenue) score += 5;
  return Math.min(score, 100);
}

function isNewThisWeek(date: any): boolean {
  if (!date) return false;
  const d = new Date(date);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return d >= weekAgo;
}
