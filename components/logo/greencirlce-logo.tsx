import Link from 'next/link';

type Variant = 'default' | 'white' | 'ink';

interface LogoProps {
  variant?: Variant;
  /** When true, render only the mark (no wordmark). Used by favicon, mobile drawer, avatars. */
  markOnly?: boolean;
  className?: string;
}

/**
 * Green Circle wordmark — same logic as always:
 *   Green (ink, medium) + Circle (forest, semibold) + hand scribble behind Circle only.
 *
 * Typography is sans (registry / system), not display serif — reads as infrastructure,
 * not a magazine masthead.
 */
export function Logo({
  variant = 'default',
  markOnly = false,
  className = '',
}: LogoProps) {
  const greenColor =
    variant === 'default' ? 'text-ink' : variant === 'ink' ? 'text-ink' : 'text-paper';
  const circleColor =
    variant === 'default'
      ? 'text-forest'
      : variant === 'ink'
      ? 'text-ink'
      : 'text-paper';
  const scribbleColor =
    variant === 'default'
      ? 'text-forest'
      : variant === 'ink'
      ? 'text-ink'
      : 'text-paper';

  if (markOnly) {
    return (
      <Link
        href="/"
        aria-label="Green Circle"
        className={`inline-flex items-center ${className}`}
      >
        <Mark className={`h-8 w-8 ${scribbleColor}`} />
      </Link>
    );
  }

  const size =
    'text-[1.4375rem] sm:text-[1.5rem] leading-none tracking-[-0.035em]';

  return (
    <Link
      href="/"
      aria-label="Green Circle — home"
      className={`inline-block py-2 group font-sans ${className}`}
    >
      <span className={`inline-flex items-baseline ${size}`}>
        <span className={`font-medium ${greenColor}`}>Green</span>
        <span className={`relative ml-[0.35em] font-semibold ${circleColor}`}>
          Circle
          <svg
            aria-hidden
            className={`pointer-events-none absolute -left-[0.55em] -right-[0.55em] -top-[0.35em] -bottom-[0.35em] -z-10 h-[145%] w-[120%] ${scribbleColor} opacity-55 transition-opacity duration-200 group-hover:opacity-[0.88]`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M 9 52 Q 16 8 50 6 T 91 50 T 49 94 T 8 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.85"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </span>
    </Link>
  );
}

/**
 * Standalone scribble mark — favicon, mobile drawer, OG, fallbacks.
 */
export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M 18 52
           Q 22 16 52 14
           T 86 50
           T 50 86
           T 18 52
           Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
