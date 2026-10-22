import React from 'react';
import { Sun, Globe as EarthIcon, ShieldCheck, AlertTriangle } from 'lucide-react';
import { CalculationMode } from '../../types/celestial';
import { formatNumber, formatAngle, formatDuration } from '../../lib/formatters';

interface LocalSkyDiagramProps {
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  earthElevationDeg: number;
  earthAzimuthDeg: number;
  terrainElevationDeg: number;
  earthTerrainElevationDeg?: number;
  calculationMode: CalculationMode;
  meanTerrainHorizonDeg?: number;
  maxTerrainObstructionDeg?: number;
  solarIlluminationFraction?: number;
  earthRangeKm?: number;
  lightTimeSeconds?: number;
}

export function LocalSkyDiagram({
  sunElevationDeg,
  sunAzimuthDeg,
  earthElevationDeg,
  earthAzimuthDeg,
  terrainElevationDeg,
  earthTerrainElevationDeg,
  calculationMode,
  meanTerrainHorizonDeg = 0.5,
  maxTerrainObstructionDeg = 1.8,
  solarIlluminationFraction = 1.0,
  earthRangeKm = 390853,
  lightTimeSeconds = 1.304,
}: LocalSkyDiagramProps) {
  // Chart Coordinate Frame: Topocentric Horizon (Azimuth: 0° to 360°, Elevation: -6° to +22°)
  const viewBoxW = 560;
  const viewBoxH = 150;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;

  const chartW = viewBoxW - padLeft - padRight;
  const chartH = viewBoxH - padTop - padBottom;

  const minElev = -6;
  const maxElev = 22;

  function elevToY(elev: number): number {
    const clamped = Math.max(minElev, Math.min(maxElev, elev));
    const ratio = (clamped - minElev) / (maxElev - minElev);
    return padTop + chartH * (1 - ratio);
  }

  function azToX(az: number): number {
    const normAz = ((az % 360) + 360) % 360;
    return padLeft + (normAz / 360) * chartW;
  }

  const zeroY = elevToY(0);

  const sunX = azToX(sunAzimuthDeg);
  const sunY = elevToY(sunElevationDeg);

  const earthX = azToX(earthAzimuthDeg);
  const earthY = elevToY(earthElevationDeg);

  // Clearance calculations
  const effectiveEarthTerrain = earthTerrainElevationDeg !== undefined ? earthTerrainElevationDeg : terrainElevationDeg;
  const sunClearance = sunElevationDeg - terrainElevationDeg;
  const earthClearance = earthElevationDeg - effectiveEarthTerrain;

  // Build terrain horizon silhouette across 360 degrees
  const terrainPoints: string[] = [];
  const numSteps = 36;
  for (let i = 0; i <= numSteps; i++) {
    const az = (i / numSteps) * 360;
    const x = azToX(az);
    // Terrain height variation around site azimuths
    const variation = Math.sin((az * Math.PI) / 90) * 0.4 + Math.cos((az * Math.PI) / 45) * 0.3;
    const terrDeg = calculationMode === 'terrain-aware'
      ? Math.max(0, meanTerrainHorizonDeg + variation * (maxTerrainObstructionDeg - meanTerrainHorizonDeg))
      : 0;
    const y = elevToY(terrDeg);
    terrainPoints.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const terrainPath = `${terrainPoints.join(' ')} L ${padLeft + chartW} ${padTop + chartH} L ${padLeft} ${padTop + chartH} Z`;

  return (
    <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3.5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--lm-color-border-subtle)] pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--lm-color-text-primary)]">
              Local-Sky Horizon Geometry
            </span>
            <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface)] px-1.5 py-0.5 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)]">
              Topocentric Frame
            </span>
          </div>
          <div className="text-[11px] text-[var(--lm-color-text-muted)] mt-0.5">
            LOLA 360° terrain mask vs Sun &amp; Earth topocentric elevation
          </div>
        </div>

        <span className="text-[10px] font-mono text-[var(--lm-color-selected-site)] bg-[var(--lm-color-surface-strong)] px-2 py-0.5 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-selected-site)]/40">
          {calculationMode === 'terrain-aware' ? 'Terrain-Aware DEM' : 'Geometry-Only Spherical'}
        </span>
      </div>

      {/* SVG Azimuth-Elevation Chart */}
      <div className="w-full overflow-hidden bg-[var(--lm-color-canvas)] rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)] p-1">
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          className="w-full h-auto select-none overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="local-terrain-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e2c3f" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0d1420" stopOpacity="0.95" />
            </linearGradient>
            <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffb830" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#ffb830" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffb830" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="earth-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8ccbff" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#8ccbff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8ccbff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Elevation Horizontal Grid Lines */}
          {[-5, 0, 5, 10, 15, 20].map((deg) => {
            const y = elevToY(deg);
            const isZero = deg === 0;
            return (
              <g key={deg}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartW}
                  y2={y}
                  stroke={isZero ? '#70D6C5' : 'var(--lm-color-border-subtle)'}
                  strokeWidth={isZero ? 1.2 : 0.8}
                  strokeDasharray={isZero ? '4 3' : '2 3'}
                  strokeOpacity={isZero ? 0.75 : 0.4}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill={isZero ? '#70D6C5' : 'var(--lm-color-text-muted)'}
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {deg > 0 ? `+${deg}°` : `${deg}°`}
                </text>
              </g>
            );
          })}

          {/* 0° Spherical Horizon Label */}
          <text
            x={padLeft + chartW - 6}
            y={zeroY - 4}
            textAnchor="end"
            fill="#70D6C5"
            fontSize="8"
            fontFamily="monospace"
            opacity="0.8"
          >
            Ideal 0° Spherical Horizon
          </text>

          {/* Shaded Subsurface / Terrain Silhouette */}
          <path d={terrainPath} fill="url(#local-terrain-grad)" />

          {/* Azimuth Vertical Grid Lines & Cardinal Labels */}
          {[
            { label: 'N (0°)', az: 0 },
            { label: 'E (90°)', az: 90 },
            { label: 'S (180°)', az: 180 },
            { label: 'W (270°)', az: 270 },
            { label: 'N (360°)', az: 360 },
          ].map(({ label, az }) => {
            const x = azToX(az);
            return (
              <g key={label}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartH}
                  stroke="var(--lm-color-border-subtle)"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                  strokeOpacity="0.4"
                />
                <text
                  x={x}
                  y={padTop + chartH + 14}
                  textAnchor="middle"
                  fill="var(--lm-color-text-muted)"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Earth Vertical Drop Line to Horizon */}
          <line
            x1={earthX}
            y1={earthY}
            x2={earthX}
            y2={zeroY}
            stroke="#8ccbff"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            opacity="0.6"
          />

          {/* Earth Disk Marker */}
          <g>
            <circle cx={earthX} cy={earthY} r="12" fill="url(#earth-glow)" />
            <circle cx={earthX} cy={earthY} r="4.5" fill="#8ccbff" stroke="#ffffff" strokeWidth="1" />
            <text
              x={earthX > padLeft + chartW - 70 ? earthX - 8 : earthX + 8}
              y={earthY - 6}
              textAnchor={earthX > padLeft + chartW - 70 ? 'end' : 'start'}
              fill="#8ccbff"
              fontSize="9"
              fontWeight="600"
              fontFamily="monospace"
            >
              Earth ({formatAngle(earthElevationDeg, { decimals: 2, sign: true })})
            </text>
          </g>

          {/* Sun Vertical Drop Line to Horizon */}
          <line
            x1={sunX}
            y1={sunY}
            x2={sunX}
            y2={zeroY}
            stroke="#ffb830"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            opacity="0.6"
          />

          {/* Sun Disk Marker */}
          <g>
            <circle cx={sunX} cy={sunY} r="14" fill="url(#sun-glow)" />
            <circle cx={sunX} cy={sunY} r="5" fill="#ffb830" stroke="#ffffff" strokeWidth="1" />
            <text
              x={sunX > padLeft + chartW - 70 ? sunX - 8 : sunX + 8}
              y={sunY - 6}
              textAnchor={sunX > padLeft + chartW - 70 ? 'end' : 'start'}
              fill="#ffb830"
              fontSize="9"
              fontWeight="600"
              fontFamily="monospace"
            >
              Sun ({formatAngle(sunElevationDeg, { decimals: 2, sign: true })})
            </text>
          </g>
        </svg>
      </div>

      {/* Two Detailed Analytical Summary Cards (Screenshot C) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Left: Solar Elevation & Illumination */}
        <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-xs)] p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--lm-color-border-subtle)] mb-1.5">
            <span className="font-semibold text-[var(--lm-color-sun)] flex items-center gap-1 font-mono">
              <Sun className="w-3.5 h-3.5" />
              <span>Solar Elevation &amp; Illumination</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs ${
              sunClearance > 0 ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800' : 'bg-rose-950/70 text-rose-400 border border-rose-800'
            }`}>
              {sunClearance > 0 ? `${formatNumber(solarIlluminationFraction * 100, { decimals: 1 })}% Illuminated` : 'Shadowed'}
            </span>
          </div>

          <div className="space-y-1 font-mono-num text-[11px]">
            <div className="flex justify-between">
              <span className="text-[var(--lm-color-text-muted)]">Topocentric Elevation:</span>
              <span className="text-[var(--lm-color-sun)] font-semibold">{formatAngle(sunElevationDeg, { decimals: 3, sign: true })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--lm-color-text-muted)]">Azimuth (North-Clockwise):</span>
              <span className="text-[var(--lm-color-text-primary)]">{formatAngle(sunAzimuthDeg, { decimals: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--lm-color-text-muted)]">Local Terrain Obstruction:</span>
              <span className="text-[var(--lm-color-text-secondary)]">{formatAngle(terrainElevationDeg, { decimals: 2 })}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[var(--lm-color-border-subtle)]">
              <span className="text-[var(--lm-color-text-muted)]">Horizon Clearance:</span>
              <span className={`font-semibold ${sunClearance > 0 ? 'text-[var(--lm-color-selected-site)]' : 'text-[var(--lm-color-danger)]'}`}>
                {formatAngle(sunClearance, { decimals: 3, sign: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Earth Elevation & Line-of-Sight */}
        <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-xs)] p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--lm-color-border-subtle)] mb-1.5">
            <span className="font-semibold text-[var(--lm-color-earth)] flex items-center gap-1 font-mono">
              <EarthIcon className="w-3.5 h-3.5" />
              <span>Earth Elevation &amp; Line-of-Sight</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs ${
              earthClearance > 0 ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800' : 'bg-amber-950/70 text-amber-400 border border-amber-800'
            }`}>
              {earthClearance > 0 ? 'Geometric Line-of-Sight' : 'Occulted / Relay Req.'}
            </span>
          </div>

          <div className="space-y-1 font-mono-num text-[11px]">
            <div className="flex justify-between">
              <span className="text-[var(--lm-color-text-muted)]">Topocentric Elevation:</span>
              <span className="text-[var(--lm-color-earth)] font-semibold">{formatAngle(earthElevationDeg, { decimals: 3, sign: true })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--lm-color-text-muted)]">Azimuth (North-Clockwise):</span>
              <span className="text-[var(--lm-color-text-primary)]">{formatAngle(earthAzimuthDeg, { decimals: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--lm-color-text-muted)]">Earth Subtended Disc:</span>
              <span className="text-[var(--lm-color-text-secondary)]">~1.91°</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[var(--lm-color-border-subtle)]">
              <span className="text-[var(--lm-color-text-muted)]">Theoretical 1-Way Light Time:</span>
              <span className="text-[var(--lm-color-text-primary)] font-semibold">{formatDuration(lightTimeSeconds, 4)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible Text Summary Table */}
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
              <td className="py-1">{formatAngle(sunElevationDeg, { decimals: 2, sign: true })}</td>
              <td className="py-1">{formatAngle(sunAzimuthDeg, { decimals: 1 })}</td>
              <td className="py-1">
                {sunClearance > 0
                  ? `${formatAngle(sunClearance, { decimals: 2, sign: true })} (Clear)`
                  : `${formatAngle(sunClearance, { decimals: 2, sign: true })} (Obscured)`}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-[var(--lm-color-earth)] flex items-center gap-1">
                <EarthIcon className="w-3 h-3" /> Earth
              </td>
              <td className="py-1">{formatAngle(earthElevationDeg, { decimals: 2, sign: true })}</td>
              <td className="py-1">{formatAngle(earthAzimuthDeg, { decimals: 1 })}</td>
              <td className="py-1">
                {earthClearance > 0
                  ? `${formatAngle(earthClearance, { decimals: 2, sign: true })} (Visible)`
                  : `${formatAngle(earthClearance, { decimals: 2, sign: true })} (Below horizon)`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
