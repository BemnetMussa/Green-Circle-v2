import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F4EFE4',
        }}
      >
        <svg viewBox="0 0 100 100" width={48} height={48}>
          <path
            d="M 18 52 Q 22 16 52 14 T 86 50 T 50 86 T 18 52 Z"
            fill="none"
            stroke="#3A7D55"
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
