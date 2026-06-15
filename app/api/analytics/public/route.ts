import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { Startup } from '@/models/start-up';

export async function GET() {
  try {
    await connectToDB();
    
    const startups = await Startup.find({ status: { $in: ['approved', 'active'] } }).lean();
    
    // Calculate metrics
    const totalStartups = startups.length;
    
    // Sector distribution
    const sectorCounts: Record<string, number> = {};
    startups.forEach(s => {
      const sector = s.sector || 'Unspecified';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });
    
    // Stage distribution
    const stageCounts: Record<string, number> = {};
    startups.forEach(s => {
      const stage = s.stage || 'undisclosed';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });
    
    // Location distribution
    const locationCounts: Record<string, number> = {};
    startups.forEach(s => {
      const location = s.location || 'Unknown';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    
    // Monthly growth (last 12 months)
    const now = new Date();
    const monthlyGrowth: { month: string; count: number }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const count = startups.filter(s => {
        const created = s.createdAt ? new Date(s.createdAt) : null;
        return created && created >= monthStart && created < monthEnd;
      }).length;
      
      monthlyGrowth.push({ month: monthLabel, count });
    }
    
    // Team size metrics
    const teamSizes = startups
      .map(s => parseInt(s.employees || '0', 10))
      .filter(n => !isNaN(n) && n > 0);
    const avgTeamSize = teamSizes.length > 0 
      ? Math.round(teamSizes.reduce((a, b) => a + b, 0) / teamSizes.length) 
      : 0;
    
    // Founding year distribution
    const foundingYears: Record<string, number> = {};
    startups.forEach(s => {
      const year = s.foundedYear?.toString() || 'Unknown';
      foundingYears[year] = (foundingYears[year] || 0) + 1;
    });
    
    // Team size distribution — blank/zero employee counts are "unknown", not 1-3.
    const teamSizeBuckets: Record<string, number> = { '1-3': 0, '4-10': 0, '11-25': 0, '25+': 0 };
    startups.forEach(s => {
      const employees = parseInt(s.employees || '', 10);
      if (!Number.isFinite(employees) || employees <= 0) return; // unknown size, skip
      if (employees <= 3) teamSizeBuckets['1-3']++;
      else if (employees <= 10) teamSizeBuckets['4-10']++;
      else if (employees <= 25) teamSizeBuckets['11-25']++;
      else teamSizeBuckets['25+']++;
    });

    // Stage progression (velocity) requires per-startup stage history, which we
    // do not yet record. Returning [] is the honest answer until that data
    // exists — previously this was a fabricated multiple of current counts.
    const stageVelocity: { from: string; to: string; count: number }[] = [];

    // Top sectors with avg stage
    const sectorData = Object.entries(sectorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    
    return NextResponse.json({
      overview: {
        totalStartups,
        totalSectors: Object.keys(sectorCounts).length,
        avgTeamSize,
        seekingInvestment: startups.filter(s => 
          ['idea', 'pre-seed', 'seed'].includes(s.stage || '')
        ).length,
      },
      sectors: sectorData,
      stages: Object.entries(stageCounts).map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalStartups) * 100),
      })),
      locations: Object.entries(locationCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      monthlyGrowth,
      foundingYears: Object.entries(foundingYears)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => b.year.localeCompare(a.year))
        .slice(0, 8),
      teamSizeDistribution: Object.entries(teamSizeBuckets).map(([size, count]) => ({ size, count })),
      stageVelocity,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
