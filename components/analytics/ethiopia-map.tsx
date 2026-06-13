'use client';

// Ethiopia choropleth-style bubble map rendered with d3-geo (no react-simple-maps
// — that lib caps at React 18 and relies on defaultProps which React 19 removed).
// We project a bundled GeoJSON (/ethiopia.geojson) to an SVG path and overlay
// city bubbles sized by company count. Geographic data here is REAL.
import { useEffect, useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection } from 'geojson';

export interface MapBubble {
  city: string;
  lng: number;
  lat: number;
  count: number;
}

export function EthiopiaMap({
  bubbles,
  width = 560,
  height = 460,
}: {
  bubbles: MapBubble[];
  width?: number;
  height?: number;
}) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let on = true;
    fetch('/ethiopia.geojson')
      .then((r) => r.json())
      .then((d) => {
        if (on) setGeo(d);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  const { pathD, project } = useMemo(() => {
    if (!geo) return { pathD: '', project: null as null | ((lng: number, lat: number) => [number, number] | null) };
    const projection = geoMercator().fitExtent(
      [
        [24, 24],
        [width - 24, height - 24],
      ],
      geo
    );
    const path = geoPath(projection);
    return {
      pathD: path(geo) || '',
      project: (lng: number, lat: number) => projection([lng, lat]) as [number, number] | null,
    };
  }, [geo, width, height]);

  const maxCount = Math.max(1, ...bubbles.map((b) => b.count));

  if (!geo) {
    return (
      <div className="flex h-[360px] items-center justify-center text-sm text-ink-muted animate-pulse">
        Loading map…
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Map of Ethiopia">
      <path d={pathD} fill="#EAF1ED" stroke="#1F4F3F" strokeWidth={0.8} strokeLinejoin="round" />
      {project &&
        bubbles.map((b, i) => {
          const p = project(b.lng, b.lat);
          if (!p) return null;
          const r = 7 + (b.count / maxCount) * 24;
          return (
            <g key={`${b.city}-${i}`}>
              <circle cx={p[0]} cy={p[1]} r={r} fill="#1F4F3F" fillOpacity={0.16} />
              <circle cx={p[0]} cy={p[1]} r={Math.max(3, r * 0.38)} fill="#1F4F3F" />
              <text
                x={p[0]}
                y={p[1] - r - 5}
                textAnchor="middle"
                className="fill-ink"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                {b.city}
              </text>
              <text
                x={p[0]}
                y={p[1] - r + 8}
                textAnchor="middle"
                className="fill-paper"
                style={{ fontSize: 10, fontWeight: 700 }}
              >
                {b.count}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
