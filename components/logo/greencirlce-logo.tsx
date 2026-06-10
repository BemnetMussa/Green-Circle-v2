import Link from 'next/link';

type Variant = 'default' | 'white' | 'ink';

interface LogoProps {
  variant?: Variant;
  markOnly?: boolean;
  className?: string;
}

export function Logo({
  variant = 'default',
  markOnly = false,
  className = '',
}: LogoProps) {
  const isWhite = variant === 'white';
  const greenColor = isWhite ? 'text-paper' : 'text-ink';
  const circleColor = variant === 'default' ? 'text-forest' : isWhite ? 'text-paper' : 'text-ink';
  const scribbleColor = circleColor; 

  if (markOnly) {
    return (
      <Link href="/" aria-label="Green Circle" className={`inline-flex items-center ${className}`}>
        <Mark className={`h-8 w-8 ${scribbleColor}`} />
      </Link>
    );
  }

  const size = 'text-[1.4375rem] sm:text-[1.5rem] leading-none tracking-[-0.035em]';

  return (
    <Link
      href="/"
      aria-label="Green Circle — home"
      className={`inline-block py-2 group font-sans ${className}`}
    >
      <span className={`inline-flex items-baseline ${size}`}>
        <span className={`font-medium ${greenColor}`}>Green</span>
        
        {/* Changed positioning on this span and the SVG inside it */}
        <span className={`relative ml-[0.35em] font-semibold ${circleColor}`}>
          Circle
          <svg
            aria-hidden
            /* Centered directly over the text with controlled percentage sizing */
            className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[135%] h-[140%] -z-10 ${scribbleColor} opacity-55 transition-opacity duration-200 group-hover:opacity-[0.88]`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M 9 52 Q 16 8 50 6 T 91 50 T 49 94 T 8 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.85"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>

      </span>
    </Link>
  );
}

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
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}