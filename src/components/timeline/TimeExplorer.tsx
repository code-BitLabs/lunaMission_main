import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  const stepHours = windowHours === 24 ? 1 : 6;
  const currentEpochMs = new Date(currentIsoUtc).getTime();

  // Anchored window start time: keeps a stable window so the cursor moves visibly across the chart
  const [windowStartMs, setWindowStartMs] = useState<number>(() => {
    // Start window with current epoch at approx 20% from left
    return currentEpochMs - (windowHours * 0.2) * 3600 * 1000;
  });

  const windowEndMs = windowStartMs + windowHours * 3600 * 1000;

  // Re-anchor window if current epoch moves outside or too close to edges
  useEffect(() => {
    if (currentEpochMs < windowStartMs || currentEpochMs > windowEndMs) {
      // Re-anchor so current epoch is around 25% from left
      setWindowStartMs(currentEpochMs - (windowHours * 0.25) * 3600 * 1000);
    } else if (currentEpochMs > windowStartMs + windowHours * 0.85 * 3600 * 1000) {
      // Slide window forward by half a window when reaching right side
      setWindowStartMs((prev) => prev + (windowHours * 0.4) * 3600 * 1000);
    }
  }, [currentEpochMs, windowStartMs, windowEndMs, windowHours]);

  // When windowHours changes (e.g. 24h to 7d), re-anchor around current epoch
  const handleWindowHoursChange = (hours: 24 | 168) => {
    setWindowHours(hours);
    setWindowStartMs(currentEpochMs - (hours * 0.25) * 3600 * 1000);
  };

  // Generate series points across the stable window
  const points = useMemo(() => {
    const list: TimelineDataPoint[] = [];
    const stepMs = stepHours * 3600 * 1000;
    const numSteps = Math.round((windowHours * 3600 * 1000) / stepMs);
    const centerDate = new Date(windowStartMs + (windowHours / 2) * 3600 * 1000);

    return generateTimelineSeries(
      selectedSite,
      centerDate,
      windowHours,
      stepHours,
      calculationMode
    );
  }, [selectedSite, windowStartMs, windowHours, stepHours, calculationMode]);

  // Ref to always access the latest epoch inside the interval loop
  const currentIsoUtcRef = useRef(currentIsoUtc);
  currentIsoUtcRef.current = currentIsoUtc;

  // Playback simulation loop (advances UTC epoch by 1 hour every 600ms)
  useEffect(() => {
    if (!isPlaying) return;

    const intervalId = setInterval(() => {
      const nextUtc = stepUtc(currentIsoUtcRef.current, stepHours * 60);
      onEpochChange(nextUtc);
    }, 600);

    return () => clearInterval(intervalId);
  }, [isPlaying, stepHours, onEpochChange]);

  // Chart dimensions
  const svgWidth = 900;
  const svgHeight = 160;
  const padding = { top: 24, right: 30, bottom: 30, left: 45 };
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

  // Compute cursor position based on actual current time relative to the window
  const firstPointMs = points.length > 0 ? points[0].epochMs : windowStartMs;
  const lastPointMs = points.length > 0 ? points[points.length - 1].epochMs : windowEndMs;
  const timeSpanMs = Math.max(1, lastPointMs - firstPointMs);
  const progressRatio = Math.max(0, Math.min(1, (currentEpochMs - firstPointMs) / timeSpanMs));
  const currentCursorX = padding.left + progressRatio * chartW;

  // Find nearest data point to current epoch for instantaneous elevation readouts
  const nearestPoint = useMemo(() => {
    if (points.length === 0) return null;
    let closest = points[0];
    let minDiff = Math.abs(points[0].epochMs - currentEpochMs);
    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].epochMs - currentEpochMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = points[i];
      }
    }
    return closest;
  }, [points, currentEpochMs]);

  // Click on chart to jump to timestamp
  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    if (clickX >= padding.left && clickX <= svgWidth - padding.right) {
      const relRatio = (clickX - padding.left) / chartW;
      const clickedMs = firstPointMs + relRatio * timeSpanMs;
      // Snap to nearest step
      const stepMs = stepHours * 3600 * 1000;
      const snappedMs = Math.round(clickedMs / stepMs) * stepMs;
      onEpochChange(formatIsoUtc(new Date(snappedMs)));
    }
  };

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
          {isPlaying && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--lm-radius-xs)] bg-emerald-950/60 border border-emerald-600/40 text-[11px] font-mono text-emerald-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Simulating (+{stepHours}h / 600ms)
            </span>
          )}
        </div>

        {/* Action Controls: Window selector, Step & Play */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Window size buttons */}
          <div className="flex items-center gap-0.5 bg-[var(--lm-color-surface-raised)] p-0.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)]">
            <button
              type="button"
              onClick={() => handleWindowHoursChange(24)}
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
              onClick={() => handleWindowHoursChange(168)}
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
              title={isPlaying ? 'Pause Simulation' : 'Play Continuous Simulation'}
              className={`px-2.5 py-1 rounded-[var(--lm-radius-xs)] text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isPlaying
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/50'
                  : 'text-[var(--lm-color-text-primary)] hover:bg-[var(--lm-color-surface-strong)]'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-[var(--lm-color-sun)]" />}
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
          className="w-full min-w-[680px] h-44 select-none cursor-crosshair"
          onClick={handleChartClick}
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

          {/* Sample Points */}
          {points.map((p, idx) => {
            const x = getX(idx, points.length);
            return (
              <g key={p.timestampUtc} className="sample-point">
                {p.sunElevationDeg !== null && (
                  <circle
                    cx={x}
                    cy={getY(p.sunElevationDeg)}
                    r="2.5"
                    fill="var(--lm-color-sun)"
                    stroke="#070b12"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                )}
                {p.earthElevationDeg !== null && (
                  <circle
                    cx={x}
                    cy={getY(p.earthElevationDeg)}
                    r="2.5"
                    fill="var(--lm-color-earth)"
                    stroke="#070b12"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                )}
                {/* Time Axis Tick Labels */}
                {idx % (windowHours === 24 ? 3 : 4) === 0 && (
                  <text
                    x={x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    fill="var(--lm-color-text-muted)"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {p.timestampUtc.substring(11, 16)}
                  </text>
                )}
              </g>
            );
          })}

          {/* MOVING ACTIVE EPOCH CURSOR SCANNER */}
          <g className="cursor-line-group pointer-events-none">
            {/* Vertical Cursor Line */}
            <line
              x1={currentCursorX}
              y1={padding.top}
              x2={currentCursorX}
              y2={svgHeight - padding.bottom}
              stroke="var(--lm-color-selected-site)"
              strokeWidth="1.8"
              strokeDasharray="4 2"
            />

            {/* Glowing Active Elevation Points at Cursor */}
            {nearestPoint?.sunElevationDeg !== null && nearestPoint?.sunElevationDeg !== undefined && (
              <g>
                <circle
                  cx={currentCursorX}
                  cy={getY(nearestPoint.sunElevationDeg)}
                  r="7"
                  fill="none"
                  stroke="var(--lm-color-sun)"
                  strokeWidth="1.5"
                  className="animate-ping"
                  opacity="0.6"
                />
                <circle
                  cx={currentCursorX}
                  cy={getY(nearestPoint.sunElevationDeg)}
                  r="5"
                  fill="var(--lm-color-sun)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {nearestPoint?.earthElevationDeg !== null && nearestPoint?.earthElevationDeg !== undefined && (
              <g>
                <circle
                  cx={currentCursorX}
                  cy={getY(nearestPoint.earthElevationDeg)}
                  r="7"
                  fill="none"
                  stroke="var(--lm-color-earth)"
                  strokeWidth="1.5"
                  className="animate-ping"
                  opacity="0.6"
                />
                <circle
                  cx={currentCursorX}
                  cy={getY(nearestPoint.earthElevationDeg)}
                  r="5"
                  fill="var(--lm-color-earth)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {/* Top Cursor Time Badge */}
            <g transform={`translate(${Math.max(padding.left + 50, Math.min(svgWidth - padding.right - 50, currentCursorX))}, ${padding.top - 12})`}>
              <rect
                x="-46"
                y="-10"
                width="92"
                height="16"
                rx="3"
                fill="var(--lm-color-surface-strong)"
                stroke="var(--lm-color-selected-site)"
                strokeWidth="1"
              />
              <text
                x="0"
                y="2"
                textAnchor="middle"
                fill="var(--lm-color-selected-site)"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {currentIsoUtc.substring(11, 19)}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Series Legend & Status Note */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono-num text-[var(--lm-color-text-muted)] pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[var(--lm-color-sun)] rounded-full" />
            <span className="text-[var(--lm-color-sun)] font-medium">
              Sun: {nearestPoint?.sunElevationDeg !== null ? `${nearestPoint?.sunElevationDeg?.toFixed(2)}°` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[var(--lm-color-earth)] rounded-full" />
            <span className="text-[var(--lm-color-earth)] font-medium">
              Earth: {nearestPoint?.earthElevationDeg !== null ? `${nearestPoint?.earthElevationDeg?.toFixed(2)}°` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--lm-color-text-disabled)]">
            <span className="w-3 border-b border-dashed border-[var(--lm-color-border)]" />
            <span>0° Mean Horizon</span>
          </div>
        </div>

        <div className="text-[11px] text-[var(--lm-color-text-muted)]">
          Click any point on the chart or hit Simulate to scrub continuous time
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
              {points.map((p) => {
                const isSelected = p.timestampUtc === currentIsoUtc;
                return (
                  <tr
                    key={p.timestampUtc}
                    onClick={() => onEpochChange(p.timestampUtc)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[var(--lm-color-surface-raised)] font-bold text-white' : 'hover:bg-[var(--lm-color-surface-raised)]/40'
                    }`}
                  >
                    <td className="py-1 px-2">{p.timestampUtc}</td>
                    <td className="py-1 px-2 text-[var(--lm-color-sun)]">{p.sunElevationDeg?.toFixed(2)}°</td>
                    <td className="py-1 px-2">{p.solarIlluminated ? 'Illuminated' : 'Shadowed'}</td>
                    <td className="py-1 px-2 text-[var(--lm-color-earth)]">{p.earthElevationDeg?.toFixed(2)}°</td>
                    <td className="py-1 px-2">{p.earthVisible ? 'Visible' : 'Sub-horizon'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
