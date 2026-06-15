import type { ReactNode } from 'react';

interface PullQuoteProps {
  children: ReactNode;
  attribution?: string;
  className?: string;
}

export function PullQuote({ children, attribution, className = '' }: PullQuoteProps) {
  return (
    <figure className={`my-12 border-l-2 border-forest pl-6 md:pl-8 ${className}`}>
      <blockquote>
        <p
          className="font-display text-ink text-2xl md:text-3xl leading-[1.25] font-medium text-balance"
          style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
        >
          &ldquo;{children}&rdquo;
        </p>
      </blockquote>
      {attribution && (
        <figcaption className="mt-4 text-sm text-ink-faint uppercase tracking-[0.14em] font-semibold">
          {attribution}
        </figcaption>
      )}
    </figure>
  );
}
