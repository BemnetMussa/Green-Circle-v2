'use client';

/** Score band → color. Forest green at the top, amber mid, muted low. */
function bandColor(score: number): string {
  if (score >= 80) return '#1F4F3F'; // forest — Hot
  if (score >= 65) return '#2D5A4A'; // Strong
  if (score >= 50) return '#C5A028'; // amber — Promising
  if (score >= 35) return '#D4B84A'; // Developing
  return '#9CA3AF'; // muted — Early
}

export function SignalScoreRing({
  score,
  size = 56,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = Math.max(4, Math.round(size * 0.1));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(Math.max(score, 0), 100) / 100) * circ;
  const color = bandColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E5E5" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none text-ink" style={{ fontSize: size * 0.3 }}>
          {Math.round(score)}
        </span>
        {label && (
          <span className="text-[8px] font-semibold uppercase tracking-wide" style={{ color }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export { bandColor };
