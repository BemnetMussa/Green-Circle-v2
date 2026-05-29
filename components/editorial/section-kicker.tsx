import type { ReactNode } from 'react';

interface SectionKickerProps {
  children: ReactNode;
  className?: string;
  tone?: 'ink' | 'forest' | 'ember';
}

/**
 * Tracked small-caps eyebrow. Replaces the old pill-shaped "VERIFICATION
 * STANDARD" / "TOP PERFORMING ASSETS" kickers with a single line of type.
 */
export function SectionKicker({
  children,
  className = '',
  tone = 'ink',
}: SectionKickerProps) {
  const color =
    tone === 'forest'
      ? 'text-forest'
      : tone === 'ember'
      ? 'text-ember'
      : 'text-ink-faint';

  return (
    <span
      className={`inline-block text-[11px] font-semibold uppercase tracking-[0.14em] ${color} ${className}`}
    >
      {children}
    </span>
  );
}
