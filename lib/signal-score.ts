// Green Circle Signal Score — a transparent 0–100 composite that ranks a
// startup's investment signal for the investor cockpit.
//
// Readiness-leaning by design: 70% of the weight (profile + traction) is
// derivable from the startup document itself, so scores are meaningful from day
// one and are NEVER fabricated. The remaining 30% (investor demand + freshness)
// comes from real recorded behaviour and sharpens as traffic accrues.
//
// Weights:
//   Profile Strength  40   how complete / credible the profile is
//   Traction          30   substance signals (revenue, achievements, team, age, stage)
//   Investor Demand   20   real views / watchlist / view-trend (normalised)
//   Freshness         10   recency of join / update

export interface SignalScoreInput {
  logo?: string;
  description?: string;
  founders?: unknown[];
  website?: string;
  pitch?: string;
  achievements?: string[];
  images?: string[];
  video?: string | null;
  revenue?: string;
  employees?: string;
  foundedYear?: string;
  stage?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/** Per-startup behavioural signal, already normalised to 0–100 by the caller. */
export interface DemandSignal {
  /** 0–100 demand component (caller normalises raw views/watchlist against the platform max). */
  demandScore: number;
}

export interface SignalBreakdown {
  profileStrength: number; // 0–100
  traction: number; // 0–100
  demand: number; // 0–100
  freshness: number; // 0–100
}

export interface SignalScore {
  overall: number; // 0–100
  label: 'Hot' | 'Strong' | 'Promising' | 'Developing' | 'Early';
  breakdown: SignalBreakdown;
}

const WEIGHTS = { profileStrength: 0.4, traction: 0.3, demand: 0.2, freshness: 0.1 };

const DAY = 24 * 60 * 60 * 1000;

/** Profile completeness / credibility (0–100). Superset of the old discover-route score. */
export function profileStrengthScore(s: SignalScoreInput): number {
  let score = 0;
  if (s.logo && !s.logo.includes('placeholder')) score += 15;
  if ((s.description?.length ?? 0) > 200) score += 15;
  else if ((s.description?.length ?? 0) > 60) score += 7;
  if ((s.founders?.length ?? 0) > 0) score += 15;
  if (s.website) score += 10;
  if (s.pitch) score += 10;
  if ((s.achievements?.length ?? 0) > 0) score += 10;
  if ((s.images?.length ?? 0) > 0) score += 10;
  if (s.video) score += 10;
  if (s.revenue) score += 5;
  return Math.min(score, 100);
}

/** Substance / traction signals from the profile (0–100). */
export function tractionScore(s: SignalScoreInput): number {
  let score = 0;

  // Revenue disclosed is itself a strong signal; magnitude adds more.
  const revenue = parseInt((s.revenue || '').replace(/[^0-9]/g, ''), 10);
  if (s.revenue && s.revenue.trim() !== '') score += 15;
  if (Number.isFinite(revenue) && revenue > 0) {
    if (revenue >= 1_000_000) score += 15;
    else if (revenue >= 100_000) score += 10;
    else if (revenue >= 10_000) score += 5;
  }

  // Achievements / milestones.
  const achievements = s.achievements?.length ?? 0;
  score += Math.min(achievements * 5, 15);

  // Team size as an execution signal.
  const employees = parseInt(s.employees || '', 10);
  if (Number.isFinite(employees) && employees > 0) {
    if (employees >= 25) score += 15;
    else if (employees >= 10) score += 12;
    else if (employees >= 4) score += 8;
    else score += 4;
  }

  // Operating history.
  const foundedYear = parseInt(s.foundedYear || '', 10);
  if (Number.isFinite(foundedYear) && foundedYear > 1990) {
    const age = new Date().getFullYear() - foundedYear;
    if (age >= 3) score += 10;
    else if (age >= 1) score += 6;
    else score += 3;
  }

  // Stage maturity.
  const stageWeights: Record<string, number> = {
    idea: 2,
    'pre-seed': 5,
    seed: 9,
    'series-a': 14,
    'series-b-plus': 15,
    bootstrapped: 8,
  };
  score += stageWeights[(s.stage || '').trim()] ?? 0;

  return Math.min(score, 100);
}

/** Recency of activity (0–100): recently joined or updated startups score higher. */
export function freshnessScore(s: SignalScoreInput): number {
  const ref = s.updatedAt || s.createdAt;
  if (!ref) return 0;
  const ageDays = (Date.now() - new Date(ref).getTime()) / DAY;
  if (ageDays <= 7) return 100;
  if (ageDays <= 30) return 80;
  if (ageDays <= 90) return 55;
  if (ageDays <= 180) return 35;
  if (ageDays <= 365) return 20;
  return 10;
}

function labelFor(overall: number): SignalScore['label'] {
  if (overall >= 80) return 'Hot';
  if (overall >= 65) return 'Strong';
  if (overall >= 50) return 'Promising';
  if (overall >= 35) return 'Developing';
  return 'Early';
}

/**
 * Compose the overall Signal Score. `demand` is the 0–100 demand component the
 * caller computes by normalising real engagement against the platform max; pass
 * 0 when there's no behavioural data yet (the score simply leans fully on
 * readiness, which is the honest outcome).
 */
export function computeSignalScore(
  startup: SignalScoreInput,
  demand: DemandSignal = { demandScore: 0 }
): SignalScore {
  const breakdown: SignalBreakdown = {
    profileStrength: Math.round(profileStrengthScore(startup)),
    traction: Math.round(tractionScore(startup)),
    demand: Math.round(clamp(demand.demandScore)),
    freshness: Math.round(freshnessScore(startup)),
  };

  const overall = Math.round(
    breakdown.profileStrength * WEIGHTS.profileStrength +
      breakdown.traction * WEIGHTS.traction +
      breakdown.demand * WEIGHTS.demand +
      breakdown.freshness * WEIGHTS.freshness
  );

  return { overall, label: labelFor(overall), breakdown };
}

/**
 * Turn raw per-startup engagement into the 0–100 demand component, normalised
 * against the platform's current maxima so it's relative, not absolute.
 */
export function demandFromEngagement(
  e: { uniqueViews?: number; watchlistAdds?: number; viewTrend?: number | null },
  max: { uniqueViews: number; watchlistAdds: number }
): number {
  const viewPart = max.uniqueViews > 0 ? (e.uniqueViews ?? 0) / max.uniqueViews : 0;
  const watchPart = max.watchlistAdds > 0 ? (e.watchlistAdds ?? 0) / max.watchlistAdds : 0;
  // Views 60%, watchlist 40%; a positive view trend nudges up to +15.
  const base = (viewPart * 0.6 + watchPart * 0.4) * 100;
  const trendBoost = e.viewTrend && e.viewTrend > 0 ? Math.min(e.viewTrend / 100, 0.15) * 100 : 0;
  return clamp(base + trendBoost);
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export const SIGNAL_WEIGHTS = WEIGHTS;
