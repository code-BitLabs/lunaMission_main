import React from 'react';
import { projectLatLon, DEFAULT_PROJECTION_CONFIG } from '../../../lib/projection';

export interface CraterFeature {
  name: string;
  lat: number;
  lon: number;
  diameterKm: number;
  hasPsr: boolean;
  isMajor: boolean;
}

export const CRATERS: CraterFeature[] = [
  { name: 'Shackleton', lat: -89.9, lon: 0, diameterKm: 21, hasPsr: true, isMajor: true },
  { name: 'de Gerlache', lat: -88.5, lon: 271.4, diameterKm: 32, hasPsr: true, isMajor: true },
  { name: 'Shoemaker', lat: -88.1, lon: 45, diameterKm: 50, hasPsr: true, isMajor: false },
  { name: 'Faustini', lat: -87.3, lon: 77, diameterKm: 39, hasPsr: true, isMajor: false },
  { name: 'Haworth', lat: -87.4, lon: 355, diameterKm: 35, hasPsr: true, isMajor: false },
  { name: 'Nobile', lat: -85.2, lon: 53.5, diameterKm: 73, hasPsr: true, isMajor: false },
  { name: 'Amundsen', lat: -84.5, lon: 82.8, diameterKm: 105, hasPsr: true, isMajor: true },
  { name: 'Malapert', lat: -84.9, lon: 12.9, diameterKm: 69, hasPsr: false, isMajor: true },
];

export interface CraterLayerProps {
  showCraters: boolean;
  showPsr: boolean;
  zoom: number;
}

/**
 * Renders subdued crater boundaries, floor depressions, and permanently shadowed regions (PSRs).
 * Follows progressive disclosure: secondary crater labels are hidden at low regional zoom.
 */
export function CraterLayer({ showCraters, showPsr, zoom }: CraterLayerProps) {
  if (!showCraters) return null;

  const { maxRadius: MAX_RADIUS } = DEFAULT_PROJECTION_CONFIG;
  const DEG_SPAN = 7;

  return (
    <g className="craters-layer select-none pointer-events-none">
      {CRATERS.map((crater) => {
        const pos = projectLatLon(crater.lat, crater.lon);
        // Scale km to svg pixels: 1 degree latitude = ~30.3 km
        const radiusPx = Math.max(7, (crater.diameterKm / 2 / 30.3 / DEG_SPAN) * MAX_RADIUS);
        // Level of Detail: secondary craters only show labels at zoom >= 1.3
        const showLabel = crater.isMajor || zoom >= 1.3;

        return (
          <g key={crater.name} className="crater-feature">
            {/* Crater Rim Profile */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radiusPx}
              fill="#080e18"
              fillOpacity="0.45"
              stroke="#1b2a3d"
              strokeWidth="0.75"
              strokeOpacity="0.45"
            />

            {/* Crater Floor / Interior (Permanently Shadowed Region) */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radiusPx * 0.72}
              fill={showPsr && crater.hasPsr ? 'url(#psr-hatch)' : '#05080f'}
              stroke="#111c29"
              strokeWidth="0.5"
              strokeOpacity="0.35"
            />

            {/* High-Legibility Technical Crater Name Label */}
            {showLabel && (
              <text
                x={pos.x}
                y={pos.y + radiusPx + 8}
                textAnchor="middle"
                fill="#8fa2b8"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="500"
                letterSpacing="0.04em"
                opacity={crater.isMajor ? 0.92 : 0.75}
                className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
              >
                {crater.name}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
