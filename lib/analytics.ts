// Server-side analytics recording.
//
// Every helper here is FIRE-AND-FORGET: it swallows its own errors and never
// throws into the caller. Recording an event must never be able to break a
// page load, a search, or a watchlist action. Reliability of the user request
// always wins over reliability of a single analytics row.
import { connectToDB } from '@/lib/db';
import { AnalyticsEvent, type AnalyticsEventType } from '@/models/analytics-event';

export interface RecordEventInput {
  type: AnalyticsEventType;
  startupId?: string;
  userId?: string;
  role?: string;
  sessionId?: string;
  path?: string;
  query?: string;
  filterKey?: string;
  filterValue?: string;
  sector?: string;
  stage?: string;
  durationMs?: number;
  referrer?: string;
  meta?: Record<string, unknown>;
}

/** How long (ms) before the same session viewing the same startup counts again. */
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/** Roles whose traffic we never count toward public/investor metrics. */
const EXCLUDED_ROLES = new Set(['admin']);

/** Low-level insert. Returns true if a row was written. */
export async function recordEvent(input: RecordEventInput): Promise<boolean> {
  try {
    await connectToDB();
    await AnalyticsEvent.create(input);
    return true;
  } catch (err) {
    console.warn('[analytics] failed to record event', input.type, err);
    return false;
  }
}

/**
 * Record a startup profile view, with de-duplication and internal-traffic
 * exclusion so the count reflects genuine, distinct interest.
 *
 * Skips when:
 *  - the viewer is an admin (internal traffic), or
 *  - the viewer is a founder of this same startup (self-view), or
 *  - the same session viewed the same startup within the dedup window.
 */
export async function recordStartupView(input: {
  startupId: string;
  sessionId?: string;
  userId?: string;
  role?: string;
  durationMs?: number;
  referrer?: string;
  isOwner?: boolean;
}): Promise<boolean> {
  if (!input.startupId) return false;
  if (input.role && EXCLUDED_ROLES.has(input.role)) return false;
  if (input.isOwner) return false;

  try {
    await connectToDB();

    if (input.sessionId) {
      const since = new Date(Date.now() - VIEW_DEDUP_WINDOW_MS);
      const recent = await AnalyticsEvent.exists({
        type: 'startup_view',
        sessionId: input.sessionId,
        startupId: input.startupId,
        createdAt: { $gte: since },
      });
      if (recent) return false; // already counted this session recently
    }

    await AnalyticsEvent.create({
      type: 'startup_view',
      startupId: input.startupId,
      sessionId: input.sessionId,
      userId: input.userId,
      role: input.role,
      durationMs: input.durationMs,
      referrer: input.referrer,
    });
    return true;
  } catch (err) {
    console.warn('[analytics] failed to record startup view', err);
    return false;
  }
}

/**
 * Attach a dwell time to the most recent view of this startup by this session.
 * Called by the unload beacon, which re-sends the same `startup_view` (and would
 * otherwise be swallowed by the dedup window). We update rather than insert so a
 * view is counted exactly once but still carries its real time-on-page.
 */
export async function recordViewDuration(input: {
  startupId: string;
  sessionId?: string;
  durationMs: number;
}): Promise<boolean> {
  if (!input.startupId || !input.sessionId || !(input.durationMs > 0)) return false;
  try {
    await connectToDB();
    const since = new Date(Date.now() - VIEW_DEDUP_WINDOW_MS);
    const res = await AnalyticsEvent.findOneAndUpdate(
      {
        type: 'startup_view',
        sessionId: input.sessionId,
        startupId: input.startupId,
        createdAt: { $gte: since },
      },
      { $max: { durationMs: input.durationMs } },
      { sort: { createdAt: -1 } }
    );
    return Boolean(res);
  } catch (err) {
    console.warn('[analytics] failed to record view duration', err);
    return false;
  }
}

/** Record a directory search. The query is normalised for clean aggregation. */
export async function recordSearch(
  query: string,
  ctx: { userId?: string; role?: string; sessionId?: string } = {}
): Promise<void> {
  const normalized = query.trim().toLowerCase();
  if (!normalized || EXCLUDED_ROLES.has(ctx.role ?? '')) return;
  await recordEvent({ type: 'search', query: normalized, ...ctx });
}

/** Record one applied filter facet (e.g. sector=fintech, stage=seed). */
export async function recordFilters(
  filters: Record<string, string | undefined>,
  ctx: { userId?: string; role?: string; sessionId?: string } = {}
): Promise<void> {
  if (EXCLUDED_ROLES.has(ctx.role ?? '')) return;
  const entries = Object.entries(filters).filter(
    ([, value]) => value != null && value !== ''
  );
  if (entries.length === 0) return;
  await Promise.all(
    entries.map(([filterKey, filterValue]) =>
      recordEvent({
        type: 'filter',
        filterKey,
        filterValue: String(filterValue).toLowerCase(),
        ...ctx,
      })
    )
  );
}

/** Record a watchlist add/remove for engagement signal. */
export async function recordWatchlist(
  action: 'add' | 'remove',
  startupId: string,
  ctx: { userId?: string; role?: string; sessionId?: string } = {}
): Promise<void> {
  await recordEvent({
    type: action === 'add' ? 'watchlist_add' : 'watchlist_remove',
    startupId,
    ...ctx,
  });
}

export { EXCLUDED_ROLES };
