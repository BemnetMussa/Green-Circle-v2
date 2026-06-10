// Shared deal-flow builder: fetch approved startups, attach real engagement +
// Signal Score, rank and filter. Used by both the JSON API and the CSV export
// so the two can never drift apart.
import { connectToDB } from '@/lib/db';
import { Startup } from '@/models/start-up';
import { serializeStartupId } from '@/lib/serialize-startup-id';
import { getEngagementByStartup, type StartupEngagement } from '@/lib/analytics-aggregate';
import {
  computeSignalScore,
  demandFromEngagement,
  type SignalScore,
} from '@/lib/signal-score';

export interface DealflowFilters {
  sector?: string;
  stage?: string;
  location?: string;
  minScore?: number;
  sort?: 'score' | 'trending' | 'newest';
  limit?: number;
}

export interface DealflowItem {
  _id: string;
  name: string;
  logo?: string;
  sector?: string;
  stage?: string;
  location?: string;
  description?: string;
  foundedYear?: string;
  employees?: string;
  createdAt?: string;
  signal: SignalScore;
  engagement: StartupEngagement;
}

const EMPTY_ENGAGEMENT: StartupEngagement = {
  views: 0,
  uniqueViews: 0,
  watchlistAdds: 0,
  viewTrend: null,
};

export async function buildDealflow(filters: DealflowFilters): Promise<DealflowItem[]> {
  await connectToDB();

  const query: Record<string, unknown> = { status: { $in: ['approved', 'active'] } };
  if (filters.sector && filters.sector !== 'all') query.sector = filters.sector;
  if (filters.stage && filters.stage !== 'all') query.stage = filters.stage;
  if (filters.location && filters.location !== 'all') {
    query.location = { $regex: filters.location, $options: 'i' };
  }

  const [docs, engagementMap] = await Promise.all([
    Startup.find(query).lean(),
    getEngagementByStartup('month'),
  ]);

  // Platform maxima for relative demand normalisation.
  let maxUnique = 0;
  let maxWatch = 0;
  for (const e of engagementMap.values()) {
    if (e.uniqueViews > maxUnique) maxUnique = e.uniqueViews;
    if (e.watchlistAdds > maxWatch) maxWatch = e.watchlistAdds;
  }
  const max = { uniqueViews: maxUnique, watchlistAdds: maxWatch };

  let items: DealflowItem[] = docs.map((doc) => {
    const id = serializeStartupId((doc as { _id: unknown })._id);
    const engagement = engagementMap.get(id) ?? EMPTY_ENGAGEMENT;
    const signal = computeSignalScore(doc as never, {
      demandScore: demandFromEngagement(engagement, max),
    });
    return {
      _id: id,
      name: (doc as { name?: string }).name ?? 'Unknown',
      logo: (doc as { logo?: string }).logo,
      sector: (doc as { sector?: string }).sector,
      stage: (doc as { stage?: string }).stage,
      location: (doc as { location?: string }).location,
      description: (doc as { description?: string }).description,
      foundedYear: (doc as { foundedYear?: string }).foundedYear,
      employees: (doc as { employees?: string }).employees,
      createdAt: (doc as { createdAt?: Date }).createdAt?.toISOString(),
      signal,
      engagement,
    };
  });

  if (typeof filters.minScore === 'number' && filters.minScore > 0) {
    items = items.filter((i) => i.signal.overall >= filters.minScore!);
  }

  const sort = filters.sort ?? 'score';
  items.sort((a, b) => {
    if (sort === 'newest') {
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    }
    if (sort === 'trending') {
      const av = a.engagement.views + a.engagement.watchlistAdds * 2;
      const bv = b.engagement.views + b.engagement.watchlistAdds * 2;
      if (bv !== av) return bv - av;
      return b.signal.overall - a.signal.overall; // tie-break by score
    }
    return b.signal.overall - a.signal.overall;
  });

  if (filters.limit && filters.limit > 0) items = items.slice(0, filters.limit);
  return items;
}
