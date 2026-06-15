import type { ReactNode } from 'react';

interface BylineProps {
  author?: string;
  date?: string;
  location?: string;
  children?: ReactNode;
  className?: string;
}

/** "By Green Circle · Addis Ababa · Updated October 2025" metadata line. */
export function Byline({
  author = 'Green Circle',
  date,
  location,
  children,
  className = '',
}: BylineProps) {
  const parts = [
    author ? `By ${author}` : null,
    location,
    date,
  ].filter(Boolean) as string[];

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-faint ${className}`}
    >
      {parts.map((part, i) => (
        <span key={part} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden className="h-px w-3 bg-ink-faint/40" />}
          <span>{part}</span>
        </span>
      ))}
      {children}
    </div>
  );
}
