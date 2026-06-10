import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { buildDealflow, type DealflowFilters } from '@/lib/dealflow';

/** Escape a value for CSV (RFC-4180-ish): wrap in quotes, double internal quotes. */
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user || (user.role !== 'investor' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sp = req.nextUrl.searchParams;
    const sortParam = sp.get('sort');
    const filters: DealflowFilters = {
      sector: sp.get('sector') || undefined,
      stage: sp.get('stage') || undefined,
      location: sp.get('location') || undefined,
      minScore: sp.get('minScore') ? parseInt(sp.get('minScore')!, 10) : undefined,
      sort:
        sortParam === 'trending' || sortParam === 'newest' || sortParam === 'score'
          ? sortParam
          : 'score',
    };

    const items = await buildDealflow(filters);

    const headerRow = [
      'Name',
      'Sector',
      'Stage',
      'Location',
      'Founded',
      'Employees',
      'Signal Score',
      'Profile Strength',
      'Traction',
      'Investor Demand',
      'Freshness',
      'Unique Views (30d)',
      'Watchlist Adds (30d)',
      'Joined',
    ];

    const rows = items.map((i) =>
      [
        i.name,
        i.sector ?? '',
        i.stage ?? '',
        i.location ?? '',
        i.foundedYear ?? '',
        i.employees ?? '',
        i.signal.overall,
        i.signal.breakdown.profileStrength,
        i.signal.breakdown.traction,
        i.signal.breakdown.demand,
        i.signal.breakdown.freshness,
        i.engagement.uniqueViews,
        i.engagement.watchlistAdds,
        i.createdAt ? i.createdAt.slice(0, 10) : '',
      ]
        .map(csvCell)
        .join(',')
    );

    const csv = [headerRow.map(csvCell).join(','), ...rows].join('\r\n');
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="green-circle-dealflow-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error('Dealflow export error:', error);
    return NextResponse.json({ error: 'Failed to export deal flow' }, { status: 500 });
  }
}
