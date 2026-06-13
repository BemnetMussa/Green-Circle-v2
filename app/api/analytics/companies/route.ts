// Public companies feed for the Dealroom-style analytics table.
// Reuses the shared deal-flow builder but returns a SLIM, public-safe shape:
// only signal.{overall,label} + a relative growth %. Raw engagement counts and
// the signal breakdown are investor-only and must NEVER be exposed here.
import { NextResponse } from 'next/server';
import { buildDealflow, type DealflowItem } from '@/lib/dealflow';

export interface PublicCompany {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  sector?: string;
  stage?: string;
  location?: string;
  foundedYear?: string;
  /** Listing date — used only for the "Newest" sort. */
  createdAt?: string;
  signal: { overall: number; label: DealflowItem['signal']['label'] };
  /** Relative demand trend (= engagement.viewTrend); null renders as "—". */
  growth: number | null;
}

export interface CompaniesFacets {
  sectors: string[];
  stages: string[];
  locations: string[];
}

export interface CompaniesResponse {
  companies: PublicCompany[];
  total: number;
  facets: CompaniesFacets;
}

/** First token of a comma-separated location (mirrors the directory). */
function firstLocationToken(location?: string): string | undefined {
  if (!location) return undefined;
  return location.split(',')[0]?.trim() || location;
}

export async function GET() {
  try {
    // Full approved/active set, ranked by Signal Score. Client does the
    // filtering/search/sort for instant UX, so facets must stay complete.
    const items = await buildDealflow({});

    const companies: PublicCompany[] = items.map((i) => ({
      _id: i._id,
      name: i.name,
      logo: i.logo,
      description: i.description,
      sector: i.sector,
      stage: i.stage,
      location: i.location,
      foundedYear: i.foundedYear,
      createdAt: i.createdAt,
      signal: { overall: i.signal.overall, label: i.signal.label },
      growth: i.engagement.viewTrend,
    }));

    const sectors = new Set<string>();
    const stages = new Set<string>();
    const locations = new Set<string>();
    for (const c of companies) {
      if (c.sector) sectors.add(c.sector);
      if (c.stage?.trim()) stages.add(c.stage.trim());
      const loc = firstLocationToken(c.location);
      if (loc) locations.add(loc);
    }

    const response: CompaniesResponse = {
      companies,
      total: companies.length,
      facets: {
        sectors: Array.from(sectors).sort((a, b) => a.localeCompare(b)),
        stages: Array.from(stages),
        locations: Array.from(locations).sort((a, b) => a.localeCompare(b)),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Companies analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to load companies' },
      { status: 500 }
    );
  }
}
