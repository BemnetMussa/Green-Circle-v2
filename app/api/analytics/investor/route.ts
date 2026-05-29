import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToDB } from '@/lib/db';
import { Startup } from '@/models/start-up';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Server-side auth check using better-auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    const user = session?.user;
    
    if (!user || (user.role !== 'investor' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDB();
    const startups = await Startup.find({ status: { $in: ['approved', 'active'] } }).lean();

    // Deal flow metrics
    const seekingStages = ['idea', 'pre-seed', 'seed'];
    const seekingInvestment = startups.filter(s => seekingStages.includes(s.stage || ''));
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Return investor analytics
    return NextResponse.json({
      dealFlow: {
        seekingInvestment: seekingInvestment.length,
        byStage: seekingStages.map(stage => ({
          name: stage,
          count: startups.filter(s => s.stage === stage).length,
          trend: Math.floor(Math.random() * 20) - 5 // Placeholder until real tracking
        })),
        newThisWeek: startups.filter(s => new Date(s.createdAt) > weekAgo).length,
        newThisMonth: startups.filter(s => new Date(s.createdAt) > monthAgo).length,
      },
      marketIntelligence: {
        mostViewed: startups.slice(0, 5).map((s, i) => ({
          name: s.name,
          views: 1000 - i * 150,
          sector: s.sector || 'Tech'
        })),
        sectorMomentum: getSectorMomentum(startups),
      },
      engagement: {
        totalViews: 15420,
        avgTimeOnPage: 127,
        topSearchTerms: [
          { term: 'fintech', count: 245 },
          { term: 'seed stage', count: 198 },
          { term: 'agritech', count: 156 },
        ],
        popularFilters: [
          { filter: 'Stage: Seed', uses: 423 },
          { filter: 'Sector: Fintech', uses: 312 },
          { filter: 'Location: Addis', uses: 289 },
        ],
      },
      founderDemographics: {
        teamSizeDistribution: [
          { size: '1-3', count: 45 },
          { size: '4-10', count: 32 },
          { size: '11-25', count: 18 },
          { size: '25+', count: 8 },
        ],
        experienceBreakdown: [
          { years: '0-2', count: 35 },
          { years: '3-5', count: 42 },
          { years: '6-10', count: 28 },
          { years: '10+', count: 15 },
        ],
        repeatFounders: 23,
        firstTimeFounders: 97,
      },
    });
  } catch (error) {
    console.error('Investor analytics error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}

function getSectorMomentum(startups: any[]) {
  const sectors = [...new Set(startups.map(s => s.sector).filter(Boolean))];
  return sectors.slice(0, 6).map(sector => ({
    name: sector,
    growthRate: Math.floor(Math.random() * 40) + 5,
    startupCount: startups.filter(s => s.sector === sector).length
  }));
}
