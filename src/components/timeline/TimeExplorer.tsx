import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Clock, Sun, Globe as EarthIcon, Table } from 'lucide-react';
import { CandidateSite } from '../../types/site';
import { CalculationMode, TimelineDataPoint } from '../../types/celestial';
import { generateTimelineSeries } from '../../lib/celestial';
import { stepUtc, formatIsoUtc } from '../../lib/time';

interface TimeExplorerProps {
  selectedSite: CandidateSite;
  currentIsoUtc: string;
  onEpochChange: (newIsoUtc: string) => void;
  calculationMode: CalculationMode;
}

export function TimeExplorer({
  selectedSite,
  currentIsoUtc,
  onEpochChange,
  calculationMode,
}: TimeExplorerProps) {
  const [windowHours, setWindowHours] = useState<24 | 168>(24); // 24h or 7 days (168h)
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const centerDate = new Date(currentIsoUtc);
  const stepHours = windowHours === 24 ? 1 : 6;

  // Generate series points
  const points = generateTimelineSeries(
    selectedSite,
    centerDate,
    windowHours,
    stepHours,
    calculationMode
  );

  // Playback loop (advances UTC epoch by 1 hour every 800ms)
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        onEpochChange(stepUtc(currentIsoUtc, 60));
      }, 800);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, currentIsoUtc, onEpochChange]);

  // Chart dimensions
  const svgWidth = 900;
  const svgHeight = 160;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  // Elevation range: -10° to +15°
  const minElev = -10;
  const maxElev = 15;

  function getY(elev: number): number {
    const clamped = Math.max(minElev, Math.min(maxElev, elev));
    const ratio = (clamped - minElev) / (maxElev - minElev);
    return padding.top + chartH * (1 - ratio);
  }

  function getX(index: number, total: number): number {
    return padding.left + (index / (total - 1)) * chartW;
  }

  const zeroY = getY(0);

  // Build SVG path data for Sun and Earth series
  const sunPath = points
    .map((p, idx) => {
      if (p.sunElevationDeg === null) return '';
      const x = getX(idx, points.length);
      const y = getY(p.sunElevationDeg);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const earthPath = points
    .map((p, idx) => {
      if (p.earthElevationDeg === null) return '';
      const x = getX(idx, points.length);
      const y = getY(p.earthElevationDeg);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  // Center point is the current epoch
  const centerIdx = Math.floor(points.length / 2);
  const currentCursorX = getX(centerIdx, points.length);

  return (
    <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] p-4 sm:p-5 flex flex-col gap-3">
      {/* Time Explorer Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[var(--lm-color-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[var(--lm-color-sun)]" />
            <h3 className="text-sm font-semibold text-[var(--lm-color-text-primary)]">
              Time Explorer
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--lm-color-text-muted)]">
            Continuous Celestial Elevation Series
          </span>
        </div>

        {/* Action Controls: Window selector, Step & Play */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Window size buttons */}
          <div className="flex items-center gap-0.5 bg-[var(--lm-color-surface-raised)] p-0.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)]">
            <button
              type="button"
              onClick={() => setWindowHours(24)}
              className={`px-2 py-0.5 text-xs font-mono rounded-[var(--lm-radius-xs)] ${
                windowHours === 24
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] font-semibold'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              24 Hours
            </button>
            <button
              type="button"
              onClick={() => setWindowHours(168)}
              className={`px-2 py-0.5 text-xs font-mono rounded-[var(--lm-radius-xs)] ${
                windowHours === 168
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] font-semibold'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              7 Days
            </button>
          </div>

          {/* Stepping and Play */}
          <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-0.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)]">
            <button
              type="button"
              onClick={() => onEpochChange(stepUtc(currentIsoUtc, -stepHours * 60))}
              title={`Step back ${stepHours} hour(s)`}
              className="p-1 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause Simulation' : 'Play Forward in Time'}
              className="px-2 py-1 rounded-[var(--lm-radius-xs)] text-xs font-medium text-[var(--lm-color-text-primary)] hover:bg-[var(--lm-color-surface-strong)] flex items-center gap-1"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Simulate'}</span>
            </button>

            <button
              type="button"
              onClick={() => onEpochChange(stepUtc(currentIsoUtc, stepHours * 60))}
              title={`Step forward ${stepHours} hour(s)`}
              className="p-1 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Accessible Table View Toggle */}
          <button
            type="button"
            onClick={() => setShowDataTable(!showDataTable)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-[var(--lm-radius-sm)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] hover:text-white"
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Interactive Timeline Chart (SVG) */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[680px] h-40 select-none cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            if (clickX >= padding.left && clickX <= svgWidth - padding.right) {
              const relRatio = (clickX - padding.left) / chartW;
              const pointIdx = Math.round(relRatio * (points.length - 1));
              const selectedPoint = points[pointIdx];
              if (selectedPoint) {
                onEpochChange(selectedPoint.timestampUtc);
              }
            }
          }}
        >
          {/* Sub-horizon Shadow Shading (y >= zeroY) */}
          <rect
            x={padding.left}
            y={zeroY}
            width={chartW}
            height={padding.top + chartH - zeroY}
            fill="#09101b"
            opacity="0.8"
          />

          {/* Zero Horizon Line (0.0°) */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={svgWidth - padding.right}
            y2={zeroY}
            stroke="var(--lm-color-border)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <text
            x={padding.left - 6}
            y={zeroY + 3}
            fill="var(--lm-color-text-muted)"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            0°
          </text>

          {/* Elevation Horizontal Grid Lines */}
          {[10, 5, -5].map((elev) => {
            const y = getY(elev);
            return (
              <g key={elev}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="var(--lm-color-border-subtle)"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  fill="var(--lm-color-text-disabled)"
                  fontSize="8.5"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {elev > 0 ? `+${elev}°` : `${elev}°`}
                </text>
              </g>
            );
          })}

          {/* Sun Elevation Series Path (Solar Gold) */}
          <path
            d={sunPath}
            fill="none"
            stroke="var(--lm-color-sun)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Earth Elevation Series Path (Earth Blue) */}
          <path
            d={earthPath}
            fill="none"
            stroke="var(--lm-color-earth)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Sample Points (Clickable) */}
          {points.map((p, idx) => {
            const x = getX(idx, points.length);
            const isCenter = idx === centerIdx;
            return (
              <g key={p.timestampUtc} className="sample-point">
                {p.sunElevationDeg !== null && (
                  <circle
                    cx={x}
                    cy={getY(p.sunElevationDeg)}
                    r={isCenter ? '4.5' : '2.5'}
                    fill="var(--lm-color-sun)"
                    stroke="#070b12"
                    strokeWidth="1"
                  />
                )}
                {p.earthElevationDeg !== null && (
                  <circle
                    cx={x}
                    cy={getY(p.earthElevationDeg)}
                    r={isCenter ? '4.5' : '2.5'}
                    fill="var(--lm-color-earth)"
                    stroke="#070b12"
                    strokeWidth="1"
                  />
                )}
                {/* Time Axis Tick Labels */}
                {idx % (windowHours === 24 ? 3 : 4) === 0 && (
                  <text
                    x={x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    fill={isCenter ? 'var(--lm-color-text-primary)' : 'var(--lm-color-text-disabled)'}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight={isCenter ? '600' : '400'}
                  >
                    {p.timestampUtc.substring(11, 16)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Current Epoch Vertical Cursor Line */}
          <line
            x1={currentCursorX}
            y1={padding.top}
            x2={currentCursorX}
            y2={svgHeight - padding.bottom}
            stroke="var(--lm-color-text-primary)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <text
            x={currentCursorX}
            y={padding.top - 6}
            textAnchor="middle"
            fill="var(--lm-color-text-primary)"
            fontSize="9.5"
            fontWeight="bold"
            fontFamily="monospace"
          >
            ▲ Selected Epoch (UTC)
          </text>
        </svg>
      </div>

      {/* Series Legend & Status Note */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono-num text-[var(--lm-color-text-muted)] pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[var(--lm-color-sun)] rounded-full" />
            <span className="text-[var(--lm-color-sun)] font-medium">Sun Elevation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[var(--lm-color-earth)] rounded-full" />
            <span className="text-[var(--lm-color-earth)] font-medium">Earth Elevation</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--lm-color-text-disabled)]">
            <span className="w-3 border-b border-dashed border-[var(--lm-color-border)]" />
            <span>0° Mean Horizon</span>
          </div>
        </div>

        <div className="text-[11px] text-[var(--lm-color-text-muted)]">
          Click any timestamp to synchronize observatory epoch
        </div>
      </div>

      {/* Expandable Accessible Data Table */}
      {showDataTable && (
        <div className="mt-2 border-t border-[var(--lm-color-border-subtle)] pt-3 overflow-x-auto max-h-60">
          <table className="w-full text-xs font-mono-num text-left">
            <thead>
              <tr className="border-b border-[var(--lm-color-border)] text-[var(--lm-color-text-muted)]">
                <th className="py-1 px-2">Epoch (UTC)</th>
                <th className="py-1 px-2">Sun Elev (°)</th>
                <th className="py-1 px-2">Sun Status</th>
                <th className="py-1 px-2">Earth Elev (°)</th>
                <th className="py-1 px-2">Earth Line-of-Sight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-secondary)]">
              {points.map((p) => (
                <tr
                  key={p.timestampUtc}
                  className={p.timestampUtc === currentIsoUtc ? 'bg-[var(--lm-color-surface-raised)] font-bold text-white' : ''}
                >
                  <td className="py-1 px-2">{p.timestampUtc}</td>
                  <td className="py-1 px-2 text-[var(--lm-color-sun)]">{p.sunElevationDeg?.toFixed(2)}°</td>
                  <td className="py-1 px-2">{p.solarIlluminated ? 'Illuminated' : 'Shadowed'}</td>
                  <td className="py-1 px-2 text-[var(--lm-color-earth)]">{p.earthElevationDeg?.toFixed(2)}°</td>
                  <td className="py-1 px-2">{p.earthVisible ? 'Visible' : 'Sub-horizon'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
