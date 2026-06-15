import type { Startup } from '@/types';

const INVALID = new Set(['', 'undefined', 'null', '[object object]']);

/** Safe path for `/startups/[id]`, or `null` if the listing has no usable id. */
export function startupDetailHref(startup: Pick<Startup, '_id'>): string | null {
  const raw = String(startup._id ?? '').trim();
  if (INVALID.has(raw.toLowerCase())) return null;
  return `/startups/${encodeURIComponent(raw)}`;
}
