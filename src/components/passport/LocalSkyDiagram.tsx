import React from 'react';
import { Sun, Globe as EarthIcon } from 'lucide-react';
import { CalculationMode } from '../../types/celestial';

interface LocalSkyDiagramProps {
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  earthElevationDeg: number;
  earthAzimuthDeg: number;
  terrainElevationDeg: number;
  calculationMode: CalculationMode;
}

export function LocalSkyDiagram({
  sunElevationDeg,
  sunAzimuthDeg,
  earthElevationDeg,
  earthAzimuthDeg,
  terrainElevationDeg,
  calculationMode,
}: LocalSkyDiagramProps) {
  // SVG Canvas dimensions: 360 x 180
  const width = 360;
  const height = 180;
  const originX = 180;
  const originY = 135; // Local surface origin
  const radius = 105;

  // Angular scale: Elevation ranges typically from -15° to +75°
  // Elevation 0° is along horizontal line.
  // Elevation +90° is directly vertical up (Zenith).
  // Negative elevation goes below horizontal line into ground.
  function polarToSvg(elevDeg: number, isRightSide: boolean): { x: number; y: number } {
    // Clamp visual elevation between -15° and +75° for diagram clarity
    const clampedElev = Math.max(-15, Math.min(75, elevDeg));
    const elevRad = (clampedElev * Math.PI) / 180;
    const direction = isRightSide ? 1 : -1;
    const x = originX + direction * radius * Math.cos(elevRad);
    const y = originY - radius * Math.sin(elevRad);
    return { x, y };
  }

  // Display Sun on right side, Earth on left side (or vice versa for clarity)
  const sunPos = polarToSvg(sunElevationDeg, true);
  const earthPos = polarToSvg(earthElevationDeg, false);

  // Terrain slope profile
  const terrainSlopeRad = (terrainElevationDeg * Math.PI) / 180;
  const terrainRightX = originX + 160 * Math.cos(terrainSlopeRad);
  const terrainRightY = originY - 160 * Math.sin(terrainSlopeRad);
  const terrainLeftX = originX - 160 * Math.cos(terrainSlopeRad);
  const terrainLeftY = originY + 160 * Math.sin(terrainSlopeRad);

  return (
    <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--lm-color-text-primary)]">
          Local Sky & Horizon Cross-Section
        </span>
        <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface)] px-2 py-0.5 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)]">
          {calculationMode === 'terrain-aware' ? 'LOLA DEM Horizon Profile' : 'Geometric Horizon (0.0°)'}
        </span>
      </div>

      {/* SVG Cross-Section Illustration */}
      <div className="w-full flex items-center justify-center py-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[340px] h-auto overflow-visible select-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sky-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#08101d" />
              <stop offset="100%" stopColor="#0c1726" />
            </linearGradient>
            <linearGradient id="ground-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2536" />
              <stop offset="100%" stopColor="#0f1622" />
            </linearGradient>
          </defs>

          {/* Sky Dome Arc */}
          <path
            d={`M 20 ${originY} A ${radius + 40} ${radius + 40} 0 0 1 340 ${originY}`}
            fill="none"
            stroke="var(--lm-color-border-subtle)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />

          {/* Lunar Subsurface Polygon */}
          <path
            d={`M 15 ${originY} L 345 ${originY} L 345 ${height} L 15 ${height} Z`}
            fill="url(#ground-gradient)"
            stroke="none"
          />

          {/* Mean Mathematical Horizon Line (0.0°) */}
          <line
            x1="15"
            y1={originY}
            x2="345"
            y2={originY}
            stroke="var(--lm-color-border)"
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />
          <text
            x="20"
            y={originY + 12}
            fill="var(--lm-color-text-disabled)"
            fontSize="8"
            fontFamily="monospace"
          >
            0.0° Mean Sphere Horizon
          </text>

          {/* Local Terrain Horizon Profile (Terrain-aware mode) */}
          {calculationMode === 'terrain-aware' && terrainElevationDeg !== 0 && (
            <line
              x1={terrainLeftX}
              y1={terrainLeftY}
              x2={terrainRightX}
              y2={terrainRightY}
              stroke="#547196"
              strokeWidth="1.5"
            />
          )}

          {/* Local Zenith Normal Axis */}
          <line
            x1={originX}
            y1={originY}
            x2={originX}
            y2={originY - radius - 20}
            stroke="var(--lm-color-border)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x={originX + 4}
            y={originY - radius - 10}
            fill="var(--lm-color-text-disabled)"
            fontSize="8"
            fontFamily="monospace"
          >
            Zenith (+90°)
          </text>

          {/* Lunar Observer Site Pin */}
          <circle cx={originX} cy={originY} r="3" fill="var(--lm-color-selected-site)" />

          {/* Sun Vector Ray (Solar Gold) */}
          <line
            x1={originX}
            y1={originY}
            x2={sunPos.x}
            y2={sunPos.y}
            stroke="var(--lm-color-sun)"
            strokeWidth="2"
          />
          <circle cx={sunPos.x} cy={sunPos.y} r="6" fill="var(--lm-color-sun)" />
          {/* Sun Glow Indicator */}
          <circle cx={sunPos.x} cy={sunPos.y} r="10" fill="var(--lm-color-sun)" opacity="0.25" />
          <text
            x={sunPos.x + 8}
            y={sunPos.y + 3}
            fill="var(--lm-color-sun)"
            fontSize="9"
            fontWeight="600"
            fontFamily="monospace"
          >
            Sun ({sunElevationDeg > 0 ? `+${sunElevationDeg}°` : `${sunElevationDeg}°`})
          </text>

          {/* Earth Vector Ray (Earth Blue) */}
          <line
            x1={originX}
            y1={originY}
            x2={earthPos.x}
            y2={earthPos.y}
            stroke="var(--lm-color-earth)"
            strokeWidth="2"
          />
          <circle cx={earthPos.x} cy={earthPos.y} r="5" fill="var(--lm-color-earth)" />
          {/* Earth Glow Indicator */}
          <circle cx={earthPos.x} cy={earthPos.y} r="9" fill="var(--lm-color-earth)" opacity="0.25" />
          <text
            x={earthPos.x - 72}
            y={earthPos.y + 3}
            fill="var(--lm-color-earth)"
            fontSize="9"
            fontWeight="600"
            fontFamily="monospace"
          >
            Earth ({earthElevationDeg > 0 ? `+${earthElevationDeg}°` : `${earthElevationDeg}°`})
          </text>
        </svg>
      </div>

      {/* Accessible Text Summary Table for Screen Readers and Small Screens */}
      <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-xs)] p-2">
        <table className="w-full text-[11px] font-mono-num text-left">
          <thead>
            <tr className="text-[var(--lm-color-text-muted)] border-b border-[var(--lm-color-border-subtle)]">
              <th className="pb-1 font-medium">Target</th>
              <th className="pb-1 font-medium">Elevation</th>
              <th className="pb-1 font-medium">Azimuth</th>
              <th className="pb-1 font-medium">Local Clearance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-secondary)]">
            <tr>
              <td className="py-1 font-semibold text-[var(--lm-color-sun)] flex items-center gap-1">
                <Sun className="w-3 h-3" /> Sun
              </td>
              <td className="py-1">{sunElevationDeg > 0 ? `+${sunElevationDeg}°` : `${sunElevationDeg}°`}</td>
              <td className="py-1">{sunAzimuthDeg}°</td>
              <td className="py-1">
                {sunElevationDeg - terrainElevationDeg > 0
                  ? `+${(sunElevationDeg - terrainElevationDeg).toFixed(2)}° (Clear)`
                  : `${(sunElevationDeg - terrainElevationDeg).toFixed(2)}° (Obscured)`}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-[var(--lm-color-earth)] flex items-center gap-1">
                <EarthIcon className="w-3 h-3" /> Earth
              </td>
              <td className="py-1">{earthElevationDeg > 0 ? `+${earthElevationDeg}°` : `${earthElevationDeg}°`}</td>
              <td className="py-1">{earthAzimuthDeg}°</td>
              <td className="py-1">
                {earthElevationDeg - terrainElevationDeg > 0
                  ? `+${(earthElevationDeg - terrainElevationDeg).toFixed(2)}° (Visible)`
                  : `${(earthElevationDeg - terrainElevationDeg).toFixed(2)}° (Below horizon)`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
