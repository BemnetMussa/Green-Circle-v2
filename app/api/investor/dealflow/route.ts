import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { buildDealflow, type DealflowFilters } from '@/lib/dealflow';

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
      limit: sp.get('limit') ? parseInt(sp.get('limit')!, 10) : undefined,
    };

    const items = await buildDealflow(filters);
    return NextResponse.json({ items, total: items.length, filters });
  } catch (error) {
    console.error('Dealflow error:', error);
    return NextResponse.json({ error: 'Failed to load deal flow' }, { status: 500 });
  }
}
