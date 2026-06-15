import Link from 'next/link';

type Variant = 'default' | 'white' | 'ink';

interface LogoProps {
  variant?: Variant;
  markOnly?: boolean;
  showTagline?: boolean;
  className?: string;
}

// Bright brand green from the logo artwork (rings + "GREEN"). "CIRCLE" + tagline
// use the ink token so they flip to light on the dark footer.
const GREEN = '#43b35f';

export function Logo({
  variant = 'default',
  markOnly = false,
  showTagline = false,
  className = '',
}: LogoProps) {
  const ink = variant === 'white' ? 'text-paper' : 'text-ink';

  if (markOnly) {
    return (
      <Link href="/" aria-label="Green Circle" className={`inline-flex items-center ${className}`}>
        <Rings className="h-9 w-9" />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      aria-label="Green Circle — home"
      className={`group inline-flex flex-col items-center ${className}`}
    >
      {/* Wordmark with the concentric rings centered behind it */}
      <span className="relative inline-flex items-center justify-center px-2.5 py-1">
        <Rings className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[200%] w-auto -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 group-hover:scale-105" />
        <span className="font-sans text-[1.05rem] font-extrabold uppercase leading-none tracking-[-0.02em] sm:text-[1.1rem]">
          <span style={{ color: GREEN }}>Green</span>
          <span className={`ml-1 ${ink}`}>Circle</span>
        </span>
      </span>
      {showTagline && (
        <span className={`mt-1 text-[8px] font-bold uppercase tracking-[0.2em] ${ink}`}>
          Join the circle and grow together
        </span>
      )}
    </Link>
  );
}

/** Concentric green rings (the "circle" emblem). */
function Rings({ className = '' }: { className?: string }) {
  const radii = [49, 41.8, 34.6, 27.4, 20.2, 13];
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden preserveAspectRatio="xMidYMid meet">
      {radii.map((r, i) => (
        <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={GREEN} strokeWidth="1.3" />
      ))}
    </svg>
  );
}

export { Rings as Mark };
