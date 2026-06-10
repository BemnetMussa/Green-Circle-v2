import { Schema, model, models, Document } from 'mongoose';

/**
 * Append-only behavioural event log — the single source of truth for every
 * analytic that is NOT derivable from the `startups` collection itself
 * (views, searches, filter usage, watchlist activity, time-on-page, …).
 *
 * Design rules:
 *  - Never mutate a row. We only ever insert and aggregate at read time.
 *    That keeps numbers reproducible and impossible to silently drift.
 *  - `sessionId` is an anonymous per-browser id (cookie `gc_sid`) so we can
 *    count *unique* visitors without auth, and de-duplicate refresh spam.
 *  - `userId` / `role` are captured when the actor is signed in, so we can
 *    later exclude internal/admin traffic and a founder viewing their own page.
 */
export type AnalyticsEventType =
  | 'startup_view' // someone opened a startup profile
  | 'search' // a directory search query was run
  | 'filter' // a directory filter was applied
  | 'watchlist_add'
  | 'watchlist_remove'
  | 'page_view'; // generic page view (home, analytics, …)

export interface IAnalyticsEvent extends Document {
  type: AnalyticsEventType;
  startupId?: string;
  userId?: string;
  role?: string;
  sessionId?: string;
  path?: string;
  /** Normalised (lowercased, trimmed) search term for `search` events. */
  query?: string;
  /** For `filter` events: which facet + value, e.g. key="sector" value="fintech". */
  filterKey?: string;
  filterValue?: string;
  sector?: string;
  stage?: string;
  /** Time-on-page in ms, sent by the unload beacon for `startup_view`. */
  durationMs?: number;
  referrer?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'startup_view',
        'search',
        'filter',
        'watchlist_add',
        'watchlist_remove',
        'page_view',
      ],
      index: true,
    },
    startupId: { type: String, index: true },
    userId: { type: String, index: true },
    role: { type: String },
    sessionId: { type: String },
    path: { type: String },
    query: { type: String },
    filterKey: { type: String },
    filterValue: { type: String },
    sector: { type: String },
    stage: { type: String },
    durationMs: { type: Number },
    referrer: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Time-series reads ("events of type X since date Y") — the hot path.
AnalyticsEventSchema.index({ type: 1, createdAt: -1 });
// Per-startup rollups (most-viewed, per-profile view counts).
AnalyticsEventSchema.index({ startupId: 1, type: 1, createdAt: -1 });
// De-dup lookups for a session's recent view of a given startup.
AnalyticsEventSchema.index({ type: 1, sessionId: 1, startupId: 1, createdAt: -1 });

export const AnalyticsEvent =
  models.AnalyticsEvent ||
  model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema, 'analytics_events');
