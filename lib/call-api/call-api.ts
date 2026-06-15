import { RawStartup, Startup, StartupResponse, StartupListResponse } from '@/types';
import { authClient } from '../auth-client';

/** Normalize `_id` from JSON (string, Extended JSON `$oid`, ObjectId-like, or `id` alias). */
function rawIdToString(id: unknown): string {
  if (id == null) return '';
  if (typeof id === 'string') return id.trim();
  if (typeof id === 'object' && '$oid' in (id as object)) {
    return String((id as { $oid: string }).$oid).trim();
  }
  if (
    typeof id === 'object' &&
    id !== null &&
    typeof (id as { toString?: () => string }).toString === 'function'
  ) {
    const t = (id as { toString: () => string }).toString().trim();
    if (t && !t.startsWith('[object ')) return t;
  }
  const s = String(id).trim();
  return s === '[object Object]' ? '' : s;
}

const transform = (s: RawStartup): Startup => ({
  _id: rawIdToString(
    (s as { _id?: unknown; id?: unknown })._id ?? (s as { id?: unknown }).id,
  ),
  name: s.name,
  logo: s.logo || '',
  sector: s.sector,
  location: s.location,
  description: s.description,
  foundedYear: Number(s.foundedYear),
  employees: s.employees,
  website: s.website || '',
  status: s.status,
  stage: s.stage,
  founders: s.founders,
  founderRole: s.founderRole,
  founderBio: s.founderBio,
  pitch: s.pitch,
  achievements: Array.isArray(s.achievements)
    ? s.achievements
    : s.achievements
    ? s.achievements.split(',').map((a) => a.trim())
    : [],
  contact: {
    email: s.founderEmail,
    phone: s.founderPhone,
  },
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

/** Outcome of fetching a single startup — distinguishes missing listing vs server/network errors. */
export type GetStartupByIdResult =
  | { ok: true; startup: Startup }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'error'; statusCode?: number; message: string };

// ✅ GET SINGLE STARTUP
export const getStartupById = async (id: string): Promise<GetStartupByIdResult> => {
  const safeId = typeof id === 'string' ? id.trim() : '';
  if (!safeId) {
    return { ok: false, reason: 'not_found' };
  }

  try {
    const res = await fetch(`/api/startups/${encodeURIComponent(safeId)}`);

    if (res.status === 404) {
      return { ok: false, reason: 'not_found' };
    }

    if (!res.ok) {
      return {
        ok: false,
        reason: 'error',
        statusCode: res.status,
        message:
          res.status >= 500
            ? 'The directory is temporarily unavailable. Please try again in a moment.'
            : 'We could not load this profile. Please try again.',
      };
    }

    const data: StartupResponse = await res.json();
    return { ok: true, startup: transform(data.startup) };
  } catch (err) {
    console.error('Error in getStartupById:', err);
    return {
      ok: false,
      reason: 'error',
      message:
        'We could not reach the server. Check your connection and try again.',
    };
  }
};


// ✅ GET STARTUPS FOR LOGGED-IN USER
export const userStartups = async (): Promise<Startup[]> => {
  try {
    const session = await authClient.getSession();
    const userEmail = session?.data?.user?.email;

    if (!userEmail) throw new Error('No user session');

    const res = await fetch(`/api/startups/by-email/${encodeURIComponent(userEmail)}`);
    if (!res.ok) throw new Error('Failed to fetch startups');

    const data: StartupListResponse = await res.json();
    return data.startups.map(transform);

  } catch (err) {
    console.error('Error in userStartups:', err);
    throw err;
  }
};


// ✅ GET ALL STARTUPS
export const filterStartup = async (): Promise<Startup[]> => {
  // Retry once after a short delay — smooths transient cold-start failures
  // (first request racing API compile / Mongo connection) so users don't see
  // a spurious "Failed to fetch startups".
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 700));
      const res = await fetch(`/api/startups`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to fetch startups');
      }

      const data: StartupListResponse = await res.json();
      if (!data.startups || data.startups.length === 0) return [];
      return data.startups.map(transform);
    } catch (error) {
      lastError = error;
    }
  }

  console.error('Error filtering startups:', lastError);
  throw lastError;
};


// ✅ UPDATE USER INFO
export const updatedUser = async ({
  email,
  phone,
  bio,
}: {
  email: string;
  phone: string;
  bio: string;
}) => {
  try {
    const res = await fetch('/api/updateUser', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, bio }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to update');
    return data;

  } catch (error) {
    console.error('Update user failed:', error);
    throw error;
  }
};
