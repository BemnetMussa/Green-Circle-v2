'use client';

// Real interactive coverage map (Leaflet + free Carto tiles, no API key).
// Centered on Ethiopia, with a circle marker per city sized by startup count —
// the standard, lightweight way to show location coverage on the web.
// Loaded via next/dynamic { ssr: false } because Leaflet needs `window`.
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapBubble {
  city: string;
  lng: number;
  lat: number;
  count: number;
}

export default function CoverageMap({ bubbles }: { bubbles: MapBubble[] }) {
  const maxCount = Math.max(1, ...bubbles.map((b) => b.count));

  return (
    <div className="overflow-hidden rounded-lg border border-rule">
      <MapContainer
        center={[9.15, 40.0]}
        zoom={5.4}
        minZoom={4}
        maxZoom={9}
        scrollWheelZoom={false}
        style={{ height: 340, width: '100%', background: '#eef2f0' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {bubbles.map((b) => {
          const r = 7 + (b.count / maxCount) * 22;
          return (
            <CircleMarker
              key={b.city}
              center={[b.lat, b.lng]}
              radius={r}
              pathOptions={{
                color: '#1F4F3F',
                weight: 1.5,
                fillColor: '#3a7d55',
                fillOpacity: 0.55,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                <span className="text-xs font-semibold">
                  {b.city}: {b.count} {b.count === 1 ? 'company' : 'companies'}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
