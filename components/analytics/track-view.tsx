'use client';

import { useEffect } from 'react';

/**
 * Fires a `startup_view` event when a profile mounts, then reports the real
 * time-on-page via `navigator.sendBeacon` when the user leaves. Dedup, owner
 * exclusion and bot/admin filtering all happen server-side in /api/analytics/track,
 * so this component stays dumb on purpose.
 */
export function TrackView({ startupId }: { startupId: string }) {
  useEffect(() => {
    if (!startupId) return;
    const startedAt = Date.now();

    // Initial view (credentials so the gc_sid cookie + session ride along).
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type: 'startup_view', startupId }),
      keepalive: true,
    }).catch(() => {});

    // Report dwell time on the way out. sendBeacon survives page unload.
    const sendDuration = () => {
      const durationMs = Date.now() - startedAt;
      if (durationMs < 1000) return; // ignore instant bounces / accidental opens
      const payload = JSON.stringify({ type: 'startup_view', startupId, durationMs });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics/track',
          new Blob([payload], { type: 'application/json' })
        );
      }
    };

    const onHidden = () => {
      if (document.visibilityState === 'hidden') sendDuration();
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', sendDuration);

    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', sendDuration);
    };
  }, [startupId]);

  return null;
}
