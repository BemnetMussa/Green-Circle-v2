'use client';

import type { SignalBreakdown } from '@/lib/signal-score';

const ROWS: { key: keyof SignalBreakdown; label: string; weight: string }[] = [
  { key: 'profileStrength', label: 'Profile strength', weight: '40%' },
  { key: 'traction', label: 'Traction', weight: '30%' },
  { key: 'demand', label: 'Investor demand', weight: '20%' },
  { key: 'freshness', label: 'Freshness', weight: '10%' },
];

/** Transparent "why this score" — the four weighted sub-scores as labelled bars. */
export function SignalBreakdownBars({ breakdown }: { breakdown: SignalBreakdown }) {
  return (
    <div className="space-y-2">
      {ROWS.map(({ key, label, weight }) => {
        const value = breakdown[key];
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <span className="text-ink-muted">
                {label} <span className="text-ink-faint">· {weight}</span>
              </span>
              <span className="font-medium text-ink">{value}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-paper-deep overflow-hidden">
              <div
                className="h-full rounded-full bg-forest"
                style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
