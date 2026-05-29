import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToDB } from '@/lib/db';
import { InvestorWatchlist } from '@/models/investor-watchlist';
import { Startup } from '@/models/start-up';
import { auth } from '@/lib/auth';

// GET - Get investor's watchlist
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user || (user.role !== 'investor' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDB();

    const watchlist = await InvestorWatchlist.find({ investorId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch full startup details
    const startupIds = watchlist.map(w => w.startupId);
    const startups = await Startup.find({ _id: { $in: startupIds } }).lean();

    // Merge watchlist data with startup details
    const enriched = watchlist.map(w => ({
      ...w,
      startup: startups.find(s => (s._id as string).toString() === w.startupId),
    }));

    return NextResponse.json({ watchlist: enriched });
  } catch (error) {
    console.error('Watchlist GET error:', error);
    return NextResponse.json({ error: 'Failed to load watchlist' }, { status: 500 });
  }
}

// POST - Add to watchlist
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user || (user.role !== 'investor' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { startupId, notes, priority, tags } = body;

    await connectToDB();

    const watchlistItem = await InvestorWatchlist.create({
      investorId: user.id,
      startupId,
      notes,
      priority: priority || 'medium',
      tags: tags || [],
    });

    return NextResponse.json({ success: true, item: watchlistItem });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Already in watchlist' }, { status: 409 });
    }
    console.error('Watchlist POST error:', error);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

// DELETE - Remove from watchlist
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user || (user.role !== 'investor' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get('startupId');

    if (!startupId) {
      return NextResponse.json({ error: 'startupId required' }, { status: 400 });
    }

    await connectToDB();

    await InvestorWatchlist.deleteOne({
      investorId: user.id,
      startupId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Watchlist DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
