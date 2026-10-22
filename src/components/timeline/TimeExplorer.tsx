import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sun,
  Globe as EarthIcon,
  Table,
  RotateCcw,
  FastForward,
  Info,
  Calendar,
} from 'lucide-react';
import { CandidateSite } from '../../types/site';
import { CalculationMode, TimelineDataPoint } from '../../types/celestial';
import { generateTimelineSeries, calculateSiteConditions } from '../../lib/celestial';
import { stepUtc, formatIsoUtc } from '../../lib/time';
import { formatAngle, formatNumber, formatDuration, formatDistance } from '../../lib/formatters';

export type TimeWindowHours = 24 | 168 | 720; // 24 hours, 7 days, 30 days

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
  const [windowHours, setWindowHours] = useState<TimeWindowHours>(24);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);
  const [showDataTable, setShowDataTable] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Stepping increment based on visible interval: 24h -> 1h; 7d -> 6h; 30d -> 12h
  const stepHours = windowHours === 24 ? 1 : windowHours === 168 ? 6 : 12;
  const currentEpochMs = new Date(currentIsoUtc).getTime();

  // Anchored window start time: maintains a stable visible window so the cursor moves across it
  const [windowStartMs, setWindowStartMs] = useState<number>(() => {
    return currentEpochMs - (windowHours * 0.25) * 3600 * 1000;
  });

  const windowEndMs = windowStartMs + windowHours * 3600 * 1000;

  // Re-anchor window if current epoch moves outside or close to edges
  useEffect(() => {
    if (currentEpochMs < windowStartMs || currentEpochMs > windowEndMs) {
      setWindowStartMs(currentEpochMs - (windowHours * 0.25) * 3600 * 1000);
    } else if (currentEpochMs > windowStartMs + windowHours * 0.85 * 3600 * 1000) {
      setWindowStartMs((prev) => prev + (windowHours * 0.4) * 3600 * 1000);
    }
  }, [currentEpochMs, windowStartMs, windowEndMs, windowHours]);

  // When changing visible interval (24h / 7d / 30d), preserve the canonical epoch and re-anchor window
  const handleWindowHoursChange = (hours: TimeWindowHours) => {
    setWindowHours(hours);
    setWindowStartMs(currentEpochMs - (hours * 0.25) * 3600 * 1000);
  };

  // Reset window position to center on current canonical epoch
  const handleResetToSelectedEpoch = () => {
    setWindowStartMs(currentEpochMs - (windowHours * 0.5) * 3600 * 1000);
  };

  // Generate series data points across the visible window
  const points = useMemo(() => {
    const centerDate = new Date(windowStartMs + (windowHours / 2) * 3600 * 1000);
    return generateTimelineSeries(
      selectedSite,
      centerDate,
      windowHours,
      stepHours,
      calculationMode
    );
  }, [selectedSite, windowStartMs, windowHours, stepHours, calculationMode]);

  // Ref to always access the latest epoch inside the playback interval
  const currentIsoUtcRef = useRef(currentIsoUtc);
  currentIsoUtcRef.current = currentIsoUtc;

  // Playback simulation loop
  useEffect(() => {
    if (!isPlaying) return;

    const tickMs = Math.round(600 / playbackSpeed);
    const intervalId = setInterval(() => {
      const nextUtc = stepUtc(currentIsoUtcRef.current, stepHours * 60);
      onEpochChange(nextUtc);
    }, tickMs);

    return () => clearInterval(intervalId);
  }, [isPlaying, stepHours, playbackSpeed, onEpochChange]);

  // Compute instantaneous site conditions for the canonical epoch to display key metric callouts
  const instantConditions = useMemo(() => {
    const d = new Date(currentIsoUtc);
    return calculateSiteConditions(selectedSite, d, calculationMode);
  }, [selectedSite, currentIsoUtc, calculationMode]);

  const instantSunElev = instantConditions.sunElevationDeg.kind === 'available' ? instantConditions.sunElevationDeg.value : null;
  const instantEarthElev = instantConditions.earthElevationDeg.kind === 'available' ? instantConditions.earthElevationDeg.value : null;
  const instantSunTerrain = instantConditions.localTerrainElevationAtSunAzimuthDeg.kind === 'available' ? instantConditions.localTerrainElevationAtSunAzimuthDeg.value : 0;
  const instantEarthTerrain = instantConditions.localTerrainElevationAtEarthAzimuthDeg.kind === 'available' ? instantConditions.localTerrainElevationAtEarthAzimuthDeg.value : 0;
  const instantSunClearance = instantSunElev !== null ? instantSunElev - instantSunTerrain : null;
  const instantEarthClearance = instantEarthElev !== null ? instantEarthElev - instantEarthTerrain : null;

  // Chart coordinate geometry
  const svgWidth = 960;
  const svgHeight = 220;
  const padding = { top: 30, right: 35, bottom: 40, left: 50 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  // Elevation range: -10° to +16°
  const minElev = -10;
  const maxElev = 16;

  function getY(elev: number): number {
    const clamped = Math.max(minElev, Math.min(maxElev, elev));
    const ratio = (clamped - minElev) / (maxElev - minElev);
    return padding.top + chartH * (1 - ratio);
  }

  function getX(index: number, total: number): number {
    if (total <= 1) return padding.left;
    return padding.left + (index / (total - 1)) * chartW;
  }

  const zeroY = getY(0);

  // Build SVG path strings for Sun and Earth series
  const sunPath = points
    .filter((p) => p.sunElevationDeg !== null)
    .map((p, idx) => {
      const origIdx = points.findIndex((pt) => pt.timestampUtc === p.timestampUtc);
      const x = getX(origIdx, points.length);
      const y = getY(p.sunElevationDeg!);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const earthPath = points
    .filter((p) => p.earthElevationDeg !== null)
    .map((p, idx) => {
      const origIdx = points.findIndex((pt) => pt.timestampUtc === p.timestampUtc);
      const x = getX(origIdx, points.length);
      const y = getY(p.earthElevationDeg!);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  // Cursor position calculation
  const firstPointMs = points.length > 0 ? points[0].epochMs : windowStartMs;
  const lastPointMs = points.length > 0 ? points[points.length - 1].epochMs : windowEndMs;
  const timeSpanMs = Math.max(1, lastPointMs - firstPointMs);
  const progressRatio = Math.max(0, Math.min(1, (currentEpochMs - firstPointMs) / timeSpanMs));
  const currentCursorX = padding.left + progressRatio * chartW;

  // Interactive scrubbing / click-to-epoch handler
  const setEpochFromClientX = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const clickX = ((clientX - rect.left) / rect.width) * svgWidth;
      const boundedX = Math.max(padding.left, Math.min(svgWidth - padding.right, clickX));
      const relRatio = (boundedX - padding.left) / chartW;
      const targetMs = firstPointMs + relRatio * timeSpanMs;

      // Snap to step increment
      const stepMs = stepHours * 3600 * 1000;
      const snappedMs = Math.round(targetMs / stepMs) * stepMs;
      onEpochChange(formatIsoUtc(new Date(snappedMs)));
    },
    [chartW, firstPointMs, onEpochChange, padding.left, padding.right, stepHours, svgWidth, timeSpanMs]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsScrubbing(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setEpochFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * svgWidth;
      if (clickX >= padding.left && clickX <= svgWidth - padding.right) {
        const relRatio = (clickX - padding.left) / chartW;
        const hoverIdx = Math.round(relRatio * (points.length - 1));
        if (hoverIdx >= 0 && hoverIdx < points.length) {
          setHoveredIndex(hoverIdx);
        }
      } else {
        setHoveredIndex(null);
      }
    }

    if (isScrubbing) {
      setEpochFromClientX(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsScrubbing(false);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  // Find hovered point data
  const activeTooltipPoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--lm-color-border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--lm-color-sun)]" />
            <h2 className="text-sm font-semibold text-[var(--lm-color-text-primary)]">
              Time Explorer
            </h2>
            <span className="text-[10px] font-mono text-[var(--lm-color-selected-site)] bg-[var(--lm-color-surface-strong)] px-2 py-0.5 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-selected-site)]/40 font-semibold">
              Canonical UTC
            </span>
          </div>
          <p className="text-xs text-[var(--lm-color-text-muted)] mt-0.5 font-mono">
            Continuous Sun &amp; Earth topocentric elevation series • Scrub or step to inspect
          </p>
        </div>

        {/* Action Controls: Interval, Playback, Speed, Table */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Visible Interval Selector: 24h, 7d, 30d */}
          <div className="flex items-center gap-0.5 bg-[var(--lm-color-surface-raised)] p-0.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
            {(
              [
                { label: '24 Hours', hours: 24 },
                { label: '7 Days', hours: 168 },
                { label: '30 Days', hours: 720 },
              ] as const
            ).map(({ label, hours }) => (
              <button
                key={hours}
                type="button"
                onClick={() => handleWindowHoursChange(hours)}
                className={`px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-xs)] transition-colors ${
                  windowHours === hours
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] font-semibold shadow-xs'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Stepping & Simulation Controls */}
          <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-0.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
            <button
              type="button"
              onClick={() => onEpochChange(stepUtc(currentIsoUtc, -stepHours * 60))}
              title={`Step back ${stepHours} hour(s)`}
              aria-label={`Step backward ${stepHours} hours`}
              className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-strong)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause Simulation' : 'Play Continuous Simulation'}
              aria-label={isPlaying ? 'Pause Simulation' : 'Play Continuous Simulation'}
              className={`px-3 py-1 rounded-[var(--lm-radius-xs)] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isPlaying
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/50'
                  : 'text-[var(--lm-color-text-primary)] hover:bg-[var(--lm-color-surface-strong)]'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-[var(--lm-color-sun)]" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              type="button"
              onClick={() => onEpochChange(stepUtc(currentIsoUtc, stepHours * 60))}
              title={`Step forward ${stepHours} hour(s)`}
              aria-label={`Step forward ${stepHours} hours`}
              className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-strong)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Speed multiplier toggle */}
          <div className="flex items-center gap-0.5 bg-[var(--lm-color-surface-raised)] p-0.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
            {([1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                title={`Playback speed ${spd}x`}
                className={`px-1.5 py-0.5 text-[11px] font-mono rounded-[var(--lm-radius-xs)] ${
                  playbackSpeed === spd
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-primary)] font-bold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Reset to Center Epoch */}
          <button
            type="button"
            onClick={handleResetToSelectedEpoch}
            title="Center time window on selected epoch"
            aria-label="Center on selected epoch"
            className="p-1.5 rounded-[var(--lm-radius-sm)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-strong)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Table View Toggle */}
          <button
            type="button"
            onClick={() => setShowDataTable(!showDataTable)}
            title="Toggle Accessible Synchronized Data Table"
            aria-label="Toggle Data Table"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-sm)] border transition-colors ${
              showDataTable
                ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border-[var(--lm-color-selected-site)] font-semibold'
                : 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] border-[var(--lm-color-border)] hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* 2. Concept Key Metric Callouts (Large bold instant readouts matching prompt specification) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Sun Elevation Card */}
        <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-md)] p-3.5 flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-4 h-4 text-[var(--lm-color-sun)]" />
              <span className="text-xs font-mono font-semibold text-[var(--lm-color-sun)] uppercase tracking-wider">
                Sun Elevation
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--lm-color-sun)] tracking-tight">
              {formatAngle(instantSunElev, { decimals: 2, sign: true })}
            </div>
            <div className="text-xs text-[var(--lm-color-text-muted)] mt-1">
              Elevation at selected epoch ({currentIsoUtc.substring(11, 16)} UTC)
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-[var(--lm-radius-xs)] text-xs font-mono font-medium ${
                instantConditions.solarIllumination === 'illuminated'
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                  : instantConditions.solarIllumination === 'partial-penumbra'
                  ? 'bg-amber-950/70 text-amber-400 border border-amber-800'
                  : 'bg-rose-950/70 text-rose-400 border border-rose-800'
              }`}
            >
              {instantConditions.solarIllumination === 'illuminated'
                ? 'Fully Illuminated'
                : instantConditions.solarIllumination === 'partial-penumbra'
                ? 'Grazing Penumbra'
                : 'Shadowed'}
            </span>
            <span className="text-[11px] font-mono text-[var(--lm-color-text-secondary)]">
              Horizon clearance: {formatAngle(instantSunClearance, { decimals: 2, sign: true })}
            </span>
          </div>
        </div>

        {/* Earth Elevation Card */}
        <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-md)] p-3.5 flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <EarthIcon className="w-4 h-4 text-[var(--lm-color-earth)]" />
              <span className="text-xs font-mono font-semibold text-[var(--lm-color-earth)] uppercase tracking-wider">
                Earth Elevation [DTE]
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--lm-color-earth)] tracking-tight">
              {formatAngle(instantEarthElev, { decimals: 2, sign: true })}
            </div>
            <div className="text-xs text-[var(--lm-color-text-muted)] mt-1">
              Elevation at selected epoch ({currentIsoUtc.substring(11, 16)} UTC)
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-[var(--lm-radius-xs)] text-xs font-mono font-medium ${
                instantConditions.earthVisibility === 'visible'
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                  : instantConditions.earthVisibility === 'indeterminate'
                  ? 'bg-amber-950/70 text-amber-400 border border-amber-800'
                  : 'bg-rose-950/70 text-rose-400 border border-rose-800'
              }`}
            >
              {instantConditions.earthVisibility === 'visible'
                ? 'Geometric Line-of-Sight'
                : instantConditions.earthVisibility === 'indeterminate'
                ? 'Limb Grazing'
                : 'Sub-Horizon'}
            </span>
            <span className="text-[11px] font-mono text-[var(--lm-color-text-secondary)]">
              Clearance: {formatAngle(instantEarthClearance, { decimals: 2, sign: true })} • Range: {formatDistance(instantConditions.rangeKm.kind === 'available' ? instantConditions.rangeKm.value : null, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Time-Series SVG Chart */}
      <div className="relative w-full bg-[var(--lm-color-canvas)] rounded-[var(--lm-radius-md)] border border-[var(--lm-color-border-subtle)] p-2 overflow-x-auto shadow-inner">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[700px] h-56 select-none cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            setIsScrubbing(false);
            setHoveredIndex(null);
          }}
        >
          {/* Sub-horizon Region Shading (< 0° elevation) */}
          <rect
            x={padding.left}
            y={zeroY}
            width={chartW}
            height={padding.top + chartH - zeroY}
            fill="#070c14"
            opacity="0.85"
          />

          {/* Elevation Horizontal Grid Lines & Ticks */}
          {[-10, -5, 0, 5, 10, 15].map((elev) => {
            const y = getY(elev);
            const isZero = elev === 0;
            return (
              <g key={elev}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke={isZero ? '#70D6C5' : 'var(--lm-color-border-subtle)'}
                  strokeWidth={isZero ? 1.5 : 0.8}
                  strokeDasharray={isZero ? '5 4' : '2 3'}
                  strokeOpacity={isZero ? 0.85 : 0.3}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill={isZero ? '#70D6C5' : 'var(--lm-color-text-muted)'}
                  fontSize="9.5"
                  fontWeight={isZero ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {elev > 0 ? `+${elev}°` : `${elev}°`}
                </text>
              </g>
            );
          })}

          {/* Zero Horizon Reference Label */}
          <text
            x={svgWidth - padding.right - 8}
            y={zeroY - 6}
            textAnchor="end"
            fill="#70D6C5"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            opacity="0.85"
          >
            0° Mean Horizon Reference
          </text>

          {/* Sun Elevation Series Path (Solar Gold #F59E0B) */}
          <path
            d={sunPath}
            fill="none"
            stroke="var(--lm-color-sun)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Earth Elevation Series Path (Earth Blue #38BDF8) */}
          <path
            d={earthPath}
            fill="none"
            stroke="var(--lm-color-earth)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Sample Points & Time Axis Ticks */}
          {points.map((p, idx) => {
            const x = getX(idx, points.length);
            const isHovered = hoveredIndex === idx;
            // Density modulation for tick labels
            const tickInterval = windowHours === 24 ? 3 : windowHours === 168 ? 4 : 5;
            const showTick = idx % tickInterval === 0 || idx === points.length - 1;

            return (
              <g key={p.timestampUtc}>
                {p.sunElevationDeg !== null && (
                  <circle
                    cx={x}
                    cy={getY(p.sunElevationDeg)}
                    r={isHovered ? 4.5 : 2.5}
                    fill="var(--lm-color-sun)"
                    stroke="#070b12"
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    className="transition-all"
                  />
                )}
                {p.earthElevationDeg !== null && (
                  <circle
                    cx={x}
                    cy={getY(p.earthElevationDeg)}
                    r={isHovered ? 4.5 : 2.5}
                    fill="var(--lm-color-earth)"
                    stroke="#070b12"
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    className="transition-all"
                  />
                )}

                {/* Time Axis Tick Labels */}
                {showTick && (
                  <g>
                    <line
                      x1={x}
                      y1={svgHeight - padding.bottom}
                      x2={x}
                      y2={svgHeight - padding.bottom + 5}
                      stroke="var(--lm-color-border-subtle)"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={svgHeight - padding.bottom + 18}
                      textAnchor="middle"
                      fill="var(--lm-color-text-muted)"
                      fontSize="9.5"
                      fontFamily="monospace"
                    >
                      {windowHours === 24
                        ? p.timestampUtc.substring(11, 16)
                        : `${p.timestampUtc.substring(5, 10)} ${p.timestampUtc.substring(11, 16)}`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ACTIVE EPOCH CURSOR SCANNER */}
          <g className="cursor-line-group pointer-events-none">
            {/* Vertical Line across chart */}
            <line
              x1={currentCursorX}
              y1={padding.top - 6}
              x2={currentCursorX}
              y2={svgHeight - padding.bottom}
              stroke="var(--lm-color-selected-site)"
              strokeWidth="1.8"
              strokeDasharray="4 2"
            />

            {/* Glowing Active Points at Cursor */}
            {instantSunElev !== null && (
              <circle
                cx={currentCursorX}
                cy={getY(instantSunElev)}
                r="5.5"
                fill="var(--lm-color-sun)"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}
            {instantEarthElev !== null && (
              <circle
                cx={currentCursorX}
                cy={getY(instantEarthElev)}
                r="5.5"
                fill="var(--lm-color-earth)"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}

            {/* Top Cursor Timestamp Badge */}
            <g
              transform={`translate(${Math.max(
                padding.left + 65,
                Math.min(svgWidth - padding.right - 65, currentCursorX)
              )}, ${padding.top - 14})`}
            >
              <rect
                x="-62"
                y="-10"
                width="124"
                height="18"
                rx="3"
                fill="#0a1422"
                stroke="var(--lm-color-selected-site)"
                strokeWidth="1.2"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fill="var(--lm-color-selected-site)"
                fontSize="9.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {currentIsoUtc.substring(0, 10)} {currentIsoUtc.substring(11, 19)}
              </text>
            </g>
          </g>
        </svg>

        {/* Hover / Point Tooltip */}
        {activeTooltipPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-[var(--lm-color-surface-strong)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-2.5 shadow-xl text-xs font-mono-num backdrop-blur-sm"
            style={{
              left: `${Math.min(80, Math.max(10, ((activeTooltipPoint.epochMs - firstPointMs) / timeSpanMs) * 100))}%`,
              top: '12px',
            }}
          >
            <div className="font-semibold text-[var(--lm-color-selected-site)] border-b border-[var(--lm-color-border-subtle)] pb-1 mb-1">
              {activeTooltipPoint.timestampUtc}
            </div>
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--lm-color-sun)]">Sun Elevation:</span>
                <span className="font-semibold">{formatAngle(activeTooltipPoint.sunElevationDeg, { decimals: 2, sign: true })}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--lm-color-earth)]">Earth Elevation:</span>
                <span className="font-semibold">{formatAngle(activeTooltipPoint.earthElevationDeg, { decimals: 2, sign: true })}</span>
              </div>
              <div className="flex justify-between gap-4 text-[var(--lm-color-text-muted)] pt-0.5 border-t border-[var(--lm-color-border-subtle)]">
                <span>Status:</span>
                <span>{activeTooltipPoint.solarIlluminated ? 'Illuminated' : 'Shadowed'} • {activeTooltipPoint.earthVisible ? 'LOS' : 'Obscured'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Series Legend & Instructions Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono-num text-[var(--lm-color-text-muted)] pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-[var(--lm-color-sun)] rounded-full" />
            <span className="text-[var(--lm-color-sun)] font-semibold">
              Sun ({formatAngle(instantSunElev, { decimals: 2, sign: true })})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-[var(--lm-color-earth)] rounded-full" />
            <span className="text-[var(--lm-color-earth)] font-semibold">
              Earth [DTE] ({formatAngle(instantEarthElev, { decimals: 2, sign: true })})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--lm-color-text-disabled)]">
            <span className="w-3.5 border-b border-dashed border-[#70D6C5]" />
            <span>0° Mean Horizon</span>
          </div>
        </div>

        <div className="text-[11px] text-[var(--lm-color-text-secondary)]">
          Click or scrub the chart to jump UTC epoch • Hit Play to simulate
        </div>
      </div>

      {/* 5. Synchronized Accessible Data Table */}
      {showDataTable && (
        <div className="mt-2 border-t border-[var(--lm-color-border-subtle)] pt-3 overflow-x-auto max-h-72">
          <table className="w-full text-xs font-mono-num text-left">
            <thead>
              <tr className="border-b border-[var(--lm-color-border)] text-[var(--lm-color-text-muted)]">
                <th className="py-1.5 px-2.5">Sample Epoch (UTC)</th>
                <th className="py-1.5 px-2.5">Sun Elev (°)</th>
                <th className="py-1.5 px-2.5">Solar Illumination</th>
                <th className="py-1.5 px-2.5">Earth Elev (°)</th>
                <th className="py-1.5 px-2.5">Earth Line-of-Sight</th>
                <th className="py-1.5 px-2.5 text-right">Action</th>
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
                      isSelected
                        ? 'bg-[var(--lm-color-surface-raised)] font-bold text-white'
                        : 'hover:bg-[var(--lm-color-surface-raised)]/40'
                    }`}
                  >
                    <td className="py-1.5 px-2.5 font-medium">{p.timestampUtc}</td>
                    <td className="py-1.5 px-2.5 text-[var(--lm-color-sun)]">
                      {formatAngle(p.sunElevationDeg, { decimals: 2, sign: true })}
                    </td>
                    <td className="py-1.5 px-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono ${
                          p.solarIlluminated
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950/70 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {p.solarIlluminated ? 'Illuminated' : 'Shadowed'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-[var(--lm-color-earth)]">
                      {formatAngle(p.earthElevationDeg, { decimals: 2, sign: true })}
                    </td>
                    <td className="py-1.5 px-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono ${
                          p.earthVisible
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950/70 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {p.earthVisible ? 'Visible Line-of-Sight' : 'Sub-Horizon'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEpochChange(p.timestampUtc);
                        }}
                        className="text-[11px] font-mono text-[var(--lm-color-selected-site)] underline hover:text-white"
                      >
                        Select
                      </button>
                    </td>
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
