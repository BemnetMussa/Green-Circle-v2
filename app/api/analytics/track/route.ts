import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { connectToDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Startup } from '@/models/start-up';
import { recordStartupView, recordViewDuration, recordEvent } from '@/lib/analytics';

const SESSION_COOKIE = 'gc_sid';
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Read the anonymous session id, creating + persisting one if absent. */
async function getOrCreateSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sid = randomUUID();
  jar.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return sid;
}

/** Best-effort: is this signed-in user a founder of this startup? Never throws. */
async function isOwnerOfStartup(
  startupId: string,
  userId?: string,
  email?: string
): Promise<boolean> {
  if (!userId && !email) return false;
  try {
    await connectToDB();
    const or: Record<string, unknown>[] = [{ _id: startupId }];
    if (/^[0-9a-fA-F]{24}$/.test(startupId)) {
      or.push({ _id: new mongoose.Types.ObjectId(startupId) });
    }
    const doc = (await Startup.collection.findOne(
      { $or: or } as never,
      { projection: { founders: 1, founderEmail: 1, 'contact.email': 1 } }
    )) as Record<string, unknown> | null;
    if (!doc) return false;

    const founders = (doc.founders as unknown[] | undefined) ?? [];
    if (userId && founders.some((f) => String(f) === userId)) return true;
    if (email) {
      const founderEmail = (doc.founderEmail as string | undefined)?.toLowerCase();
      const contactEmail = (
        (doc.contact as { email?: string } | undefined)?.email || ''
      ).toLowerCase();
      if (founderEmail === email.toLowerCase()) return true;
      if (contactEmail === email.toLowerCase()) return true;
    }
    return false;
  } catch {
    return false; // never block a view over an owner-check failure
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type, startupId, durationMs, path } = body as {
      type?: string;
      startupId?: string;
      durationMs?: number;
      path?: string;
    };

    const sessionId = await getOrCreateSessionId();

    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    const referrer = req.headers.get('referer') || undefined;

    if (type === 'startup_view') {
      if (!startupId) {
        return NextResponse.json({ error: 'startupId required' }, { status: 400 });
      }

      // Unload beacon: attach dwell time to the existing view row instead of
      // inserting a second (which the dedup window would drop anyway).
      if (typeof durationMs === 'number' && durationMs > 0) {
        const updated = await recordViewDuration({ startupId, sessionId, durationMs });
        return NextResponse.json({ ok: true, updated });
      }

      const isOwner = await isOwnerOfStartup(startupId, user?.id, user?.email);
      const recorded = await recordStartupView({
        startupId,
        sessionId,
        userId: user?.id,
        role: (user as { role?: string } | undefined)?.role,
        durationMs: typeof durationMs === 'number' ? durationMs : undefined,
        referrer,
        isOwner,
      });
      return NextResponse.json({ ok: true, recorded });
    }

    if (type === 'page_view') {
      await recordEvent({
        type: 'page_view',
        path,
        sessionId,
        userId: user?.id,
        role: (user as { role?: string } | undefined)?.role,
        referrer,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'unsupported event type' }, { status: 400 });
  } catch (err) {
    console.warn('[analytics] track endpoint error', err);
    // Tracking failures are never surfaced to the user as errors.
    return NextResponse.json({ ok: false });
  }
}
