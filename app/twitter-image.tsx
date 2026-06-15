import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Green Circle — Ethiopian Startup Discovery Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function TwitterImage() {
  const fraunces = await fetch(
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&display=swap',
  )
    .then((res) => res.text())
    .then((css) => {
      const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
      return match ? fetch(match[1]).then((r) => r.arrayBuffer()) : null;
    })
    .catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#F4EFE4',
          padding: '72px 80px',
          fontFamily: 'Fraunces, Georgia, serif',
          color: '#1C1A17',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg viewBox="0 0 100 100" width={68} height={68}>
            <path
              d="M 18 52 Q 22 16 52 14 T 86 50 T 50 86 T 18 52 Z"
              fill="none"
              stroke="#3A7D55"
              strokeWidth={7.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: '-0.02em' }}>
            Green Circle
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ height: 1, width: 160, background: '#D9D2C1' }} />
          <div
            style={{
              fontSize: 72,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              maxWidth: 980,
            }}
          >
            Discover Ethiopian startups and connect with founders.
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 22,
              fontFamily: 'sans-serif',
              color: '#948C7E',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            <span>Discovery</span>
            <span style={{ width: 4, height: 4, background: '#948C7E', borderRadius: 99 }} />
            <span>Investment</span>
            <span style={{ width: 4, height: 4, background: '#948C7E', borderRadius: 99 }} />
            <span>Growth</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fraunces
        ? [{ name: 'Fraunces', data: fraunces, style: 'normal', weight: 500 }]
        : undefined,
    },
  );
}
