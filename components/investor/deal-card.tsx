'use client';

import { useState } from 'react';
import { Eye, BookmarkPlus, BookmarkCheck, ChevronDown, Users } from 'lucide-react';
import type { SignalScore } from '@/lib/signal-score';
import { displayStartupStage } from '@/lib/startup-stage';
import { SignalScoreRing } from './signal-score-ring';
import { SignalBreakdownBars } from './signal-breakdown';

export interface DealCardData {
  _id: string;
  name: string;
  logo?: string;
  sector?: string;
  stage?: string;
  location?: string;
  description?: string;
  employees?: string;
  signal: SignalScore;
  engagement: { uniqueViews: number; watchlistAdds: number; viewTrend: number | null };
}

export function DealCard({
  deal,
  watchlisted,
  onWatchlist,
}: {
  deal: DealCardData;
  watchlisted: boolean;
  onWatchlist: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const stage = displayStartupStage(deal.stage);

  return (
    <div className="rounded-xl border border-rule bg-paper p-5 transition-all hover:border-forest/30">
      <div className="flex items-start gap-4">
        <SignalScoreRing score={deal.signal.overall} label={deal.signal.label} size={56} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-ink">{deal.name}</h3>
              <p className="truncate text-xs text-ink-muted">
                {deal.sector || 'Unspecified'}
                {deal.location ? ` · ${deal.location.split(',')[0]}` : ''}
              </p>
            </div>
            {stage && (
              <span className="shrink-0 rounded bg-paper-deep border border-rule px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                {stage}
              </span>
            )}
          </div>

          {deal.description && (
            <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{deal.description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {deal.engagement.uniqueViews} unique
            </span>
            <span className="inline-flex items-center gap-1">
              <BookmarkCheck className="h-3.5 w-3.5" />
              {deal.engagement.watchlistAdds} saved
            </span>
            {deal.employees && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {deal.employees}
              </span>
            )}
            {typeof deal.engagement.viewTrend === 'number' && deal.engagement.viewTrend !== 0 && (
              <span
                className={
                  deal.engagement.viewTrend > 0 ? 'text-green-600' : 'text-ink-faint'
                }
              >
                {deal.engagement.viewTrend > 0 ? '↑' : '↓'} {Math.abs(deal.engagement.viewTrend)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-forest hover:underline"
        aria-expanded={open}
      >
        {open ? 'Hide' : 'Why this score'}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-rule/60 bg-paper-deep p-3">
          <SignalBreakdownBars breakdown={deal.signal.breakdown} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <a
          href={`/startups/${deal._id}`}
          className="flex h-9 flex-1 items-center justify-center rounded-lg border border-rule bg-paper-deep text-sm font-medium text-ink transition-colors hover:bg-paper"
        >
          View profile
        </a>
        <button
          onClick={() => onWatchlist(deal._id)}
          disabled={watchlisted}
          aria-label={watchlisted ? 'In watchlist' : 'Add to watchlist'}
          className={`h-9 rounded-lg border px-3 text-sm font-medium transition-colors ${
            watchlisted
              ? 'border-forest bg-forest/10 text-forest'
              : 'border-rule bg-paper-deep text-ink-muted hover:text-forest'
          }`}
        >
          {watchlisted ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
