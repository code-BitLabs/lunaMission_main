import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Layers, Sun, Globe as EarthIcon } from 'lucide-react';
import { CandidateSite } from '../../types/site';
import { CANDIDATE_SITES } from '../../lib/sites-data';

export interface SouthPoleMapProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  sunAzimuthDeg: number;
  earthAzimuthDeg: number;
  earthElevationDeg?: number;
  subEarthLonDeg?: number;
  subEarthLatDeg?: number;
  sunElevationDeg?: number;
  showGrid?: boolean;
  showPsr?: boolean;
  showVectors?: boolean;
  onToggleGrid?: () => void;
  onTogglePsr?: () => void;
  onToggleVectors?: () => void;
  hideHeader?: boolean;
  hideRibbon?: boolean;
}

interface CraterFeature {
  name: string;
  lat: number;
  lon: number;
  diameterKm: number;
  hasPsr: boolean;
}

const CRATERS: CraterFeature[] = [
  { name: 'Shackleton', lat: -89.9, lon: 0, diameterKm: 21, hasPsr: true },
  { name: 'de Gerlache', lat: -88.5, lon: 271.4, diameterKm: 32, hasPsr: true },
  { name: 'Shoemaker', lat: -88.1, lon: 45, diameterKm: 50, hasPsr: true },
  { name: 'Faustini', lat: -87.3, lon: 77, diameterKm: 39, hasPsr: true },
  { name: 'Haworth', lat: -87.4, lon: 355, diameterKm: 35, hasPsr: true },
  { name: 'Nobile', lat: -85.2, lon: 53.5, diameterKm: 73, hasPsr: true },
  { name: 'Amundsen', lat: -84.5, lon: 82.8, diameterKm: 105, hasPsr: true },
  { name: 'Malapert', lat: -84.9, lon: 12.9, diameterKm: 69, hasPsr: false },
];

export function SouthPoleMap({
  selectedSite,
  onSelectSite,
  sunAzimuthDeg,
  earthAzimuthDeg,
  earthElevationDeg = 0,
  subEarthLonDeg = 0,
  subEarthLatDeg = 0,
  sunElevationDeg = 0,
  showGrid: propShowGrid,
  showPsr: propShowPsr,
  showVectors: propShowVectors,
  onToggleGrid,
  onTogglePsr,
  onToggleVectors,
  hideHeader = false,
  hideRibbon = false,
}: SouthPoleMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  // Local layer state if not controlled externally
  const [localShowGrid, setLocalShowGrid] = useState(true);
  const [localShowPsr, setLocalShowPsr] = useState(true);
  const [localShowVectors, setLocalShowVectors] = useState(true);

  const showGrid = propShowGrid !== undefined ? propShowGrid : localShowGrid;
  const showPsr = propShowPsr !== undefined ? propShowPsr : localShowPsr;
  const showVectors = propShowVectors !== undefined ? propShowVectors : localShowVectors;

  const toggleGrid = onToggleGrid || (() => setLocalShowGrid((v) => !v));
  const togglePsr = onTogglePsr || (() => setLocalShowPsr((v) => !v));
  const toggleVectors = onToggleVectors || (() => setLocalShowVectors((v) => !v));

  const [hoveredSite, setHoveredSite] = useState<CandidateSite | null>(null);

  // Map coordinate conversion: Polar Stereographic
  // Center is (cx, cy) = (300, 300) in SVG 600x600 box for crisp rendering
  // Pole (-90°) is at center. Outer boundary is 83°S.
  const SVG_SIZE = 600;
  const CENTER = SVG_SIZE / 2;
  const MAX_RADIUS = 265; // Represents 83°S
  const DEG_SPAN = 7; // From 90°S to 83°S

  function project(lat: number, lon: number): { x: number; y: number } {
    const colat = Math.max(0, 90 - Math.abs(lat));
    const r = (colat / DEG_SPAN) * MAX_RADIUS;
    // lon 0° points UP (North on page / 0° Prime Meridian facing Earth)
    // Positive lon goes clockwise (East)
    const angleRad = (lon - 90) * (Math.PI / 180);
    const x = CENTER + r * Math.cos(angleRad);
    const y = CENTER + r * Math.sin(angleRad);
    return { x, y };
  }

  function handleReset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  // Calculate direction arrow endpoints for Sun and Earth from the Pole
  const sunArrowAngleRad = (sunAzimuthDeg - 90) * (Math.PI / 180);
  const sunRayLength = MAX_RADIUS + 15;
  const sunX = CENTER + sunRayLength * Math.cos(sunArrowAngleRad);
  const sunY = CENTER + sunRayLength * Math.sin(sunArrowAngleRad);

  const effectiveEarthLon = subEarthLonDeg !== undefined ? subEarthLonDeg : earthAzimuthDeg;
  const earthArrowAngleRad = (effectiveEarthLon - 90) * (Math.PI / 180);
  const earthRayLength = MAX_RADIUS + 15;
  const earthX = CENTER + earthRayLength * Math.cos(earthArrowAngleRad);
  const earthY = CENTER + earthRayLength * Math.sin(earthArrowAngleRad);

  // Calculate site-specific topocentric vectors emitting directly from selected site
  const sitePos = project(selectedSite.coordinates.latitudeDeg, selectedSite.coordinates.longitudeDeg);
  const siteSunAngleRad = (sunAzimuthDeg - 90) * (Math.PI / 180);
  const siteSunX = sitePos.x + 38 * Math.cos(siteSunAngleRad);
  const siteSunY = sitePos.y + 38 * Math.sin(siteSunAngleRad);

  const siteEarthAngleRad = (earthAzimuthDeg - 90) * (Math.PI / 180);
  const siteEarthX = sitePos.x + 38 * Math.cos(siteEarthAngleRad);
  const siteEarthY = sitePos.y + 38 * Math.sin(siteEarthAngleRad);

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] overflow-hidden select-none min-h-0">
      {/* Optional Map Header and Layers Bar (rendered only if not hidden by unified workspace) */}
      {!hideHeader && (
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-[var(--lm-color-surface)]/90 backdrop-blur-xs px-2.5 py-1.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
            <span className="text-xs font-semibold text-[var(--lm-color-text-primary)]">
              Polar Stereographic Map
            </span>
            <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] border-l border-[var(--lm-color-border)] pl-2">
              83°S – 90°S
            </span>
          </div>

          {/* Layer Toggles */}
          <div className="pointer-events-auto flex items-center gap-1 bg-[var(--lm-color-surface)]/90 backdrop-blur-xs p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
            <button
              type="button"
              onClick={toggleGrid}
              title="Toggle Polar Coordinates Grid"
              className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                showGrid
                  ? 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)]'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={togglePsr}
              title="Toggle Permanently Shadowed Regions (PSR)"
              className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                showPsr
                  ? 'bg-[var(--lm-color-surface-raised)] text-[#8CCBFF] border border-[var(--lm-color-border)]'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              PSR
            </button>
            <button
              type="button"
              onClick={toggleVectors}
              title="Toggle Celestial Vectors (Sun & Earth Direction)"
              className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                showVectors
                  ? 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-sun)] border border-[var(--lm-color-border)]'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              Vectors
            </button>
          </div>
        </div>
      )}

      {/* Map Zoom & Pan Control Floating Palette */}
      <div className={`absolute ${hideRibbon ? 'bottom-3' : 'bottom-14'} right-3 z-10 flex flex-col gap-1 pointer-events-auto bg-[var(--lm-color-surface)]/90 backdrop-blur-xs p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-md`}>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3.5, z + 0.3))}
          title="Zoom In"
          aria-label="Zoom in"
          className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.7, z - 0.3))}
          title="Zoom Out"
          aria-label="Zoom out"
          className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          title="Reset Map Orientation and Zoom"
          aria-label="Reset map"
          className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Scale and Reference Legend */}
      <div className={`absolute ${hideRibbon ? 'bottom-3' : 'bottom-14'} left-3 z-10 flex items-center gap-3 pointer-events-none bg-[var(--lm-color-surface)]/85 backdrop-blur-xs px-2.5 py-1.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] text-[11px] font-mono-num text-[var(--lm-color-text-muted)]`}>
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-1 bg-slate-400 border border-slate-600 rounded-xs" />
          <span>50 km</span>
        </div>
        <div className="border-l border-[var(--lm-color-border)] pl-2 flex items-center gap-2">
          <span className="flex items-center gap-1 text-[var(--lm-color-sun)]">
            <span className="w-2 h-2 rounded-full bg-[var(--lm-color-sun)]" /> Sun
          </span>
          <span className="flex items-center gap-1 text-[var(--lm-color-earth)]">
            <span className="w-2 h-2 rounded-full bg-[var(--lm-color-earth)]" /> Earth
          </span>
        </div>
      </div>

      {/* SVG Canvas Map Container - Full Width & Height */}
      <div
        className="w-full h-full flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden min-h-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full select-none"
        >
          <defs>
            {/* PSR Hatch Pattern */}
            <pattern id="psr-hatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#4a6585" strokeWidth="1.2" strokeOpacity="0.4" />
            </pattern>

            {/* Radial Terrain Gradient */}
            <radialGradient id="pole-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#151e2d" />
              <stop offset="70%" stopColor="#0d1422" />
              <stop offset="100%" stopColor="#080c14" />
            </radialGradient>
          </defs>

          {/* Interactive Zoomable / Pannable Map Layer */}
          <g
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: `${CENTER}px ${CENTER}px`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Lunar South-Pole Basin Disc */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={MAX_RADIUS}
              fill="url(#pole-gradient)"
              stroke="var(--lm-color-border)"
              strokeWidth="1.5"
            />

            {/* Latitude Grid Circles */}
            {showGrid && (
              <g className="grid-latitudes" stroke="var(--lm-color-border-subtle)" strokeDasharray="3 4" fill="none">
                {/* 88°S */}
                <circle cx={CENTER} cy={CENTER} r={(2 / DEG_SPAN) * MAX_RADIUS} strokeWidth="0.8" />
                <text x={CENTER + 4} y={CENTER - (2 / DEG_SPAN) * MAX_RADIUS + 10} fill="var(--lm-color-text-disabled)" fontSize="9" fontFamily="monospace">88°S</text>

                {/* 86°S */}
                <circle cx={CENTER} cy={CENTER} r={(4 / DEG_SPAN) * MAX_RADIUS} strokeWidth="0.8" />
                <text x={CENTER + 4} y={CENTER - (4 / DEG_SPAN) * MAX_RADIUS + 10} fill="var(--lm-color-text-disabled)" fontSize="9" fontFamily="monospace">86°S</text>

                {/* 84°S */}
                <circle cx={CENTER} cy={CENTER} r={(6 / DEG_SPAN) * MAX_RADIUS} strokeWidth="0.8" />
                <text x={CENTER + 4} y={CENTER - (6 / DEG_SPAN) * MAX_RADIUS + 10} fill="var(--lm-color-text-disabled)" fontSize="9" fontFamily="monospace">84°S</text>
              </g>
            )}

            {/* Longitude Spoke Meridians */}
            {showGrid && (
              <g className="grid-meridians" stroke="var(--lm-color-border-subtle)" strokeWidth="0.8" strokeDasharray="2 4">
                {/* 0° Prime Meridian (Pointing Up towards Earth) */}
                <line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER - MAX_RADIUS} />
                <text x={CENTER + 4} y={CENTER - MAX_RADIUS + 14} fill="var(--lm-color-text-muted)" fontSize="9.5" fontWeight="600" fontFamily="monospace">0° (To Earth)</text>

                {/* 90° East */}
                <line x1={CENTER} y1={CENTER} x2={CENTER + MAX_RADIUS} y2={CENTER} />
                <text x={CENTER + MAX_RADIUS - 32} y={CENTER - 5} fill="var(--lm-color-text-disabled)" fontSize="9" fontFamily="monospace">90°E</text>

                {/* 180° Meridian */}
                <line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER + MAX_RADIUS} />
                <text x={CENTER + 4} y={CENTER + MAX_RADIUS - 8} fill="var(--lm-color-text-disabled)" fontSize="9" fontFamily="monospace">180°</text>

                {/* 270° East (90° West) */}
                <line x1={CENTER} y1={CENTER} x2={CENTER - MAX_RADIUS} y2={CENTER} />
                <text x={CENTER - MAX_RADIUS + 8} y={CENTER - 5} fill="var(--lm-color-text-disabled)" fontSize="9" fontFamily="monospace">270°E</text>
              </g>
            )}

            {/* Major Crater Features with optional Permanently Shadowed Regions (PSR) - Subdued Background Hierarchy */}
            <g className="craters">
              {CRATERS.map((crater) => {
                const pos = project(crater.lat, crater.lon);
                // Scale km to svg pixels: 1 degree latitude = ~30.3 km
                const radiusPx = Math.max(8, (crater.diameterKm / 2 / 30.3 / DEG_SPAN) * MAX_RADIUS);

                return (
                  <g key={crater.name} className="crater-group select-none pointer-events-none">
                    {/* Crater Rim Elevation Profile */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radiusPx}
                      fill="#0a101b"
                      fillOpacity="0.4"
                      stroke="#223348"
                      strokeWidth="0.85"
                      strokeOpacity="0.45"
                    />
                    {/* Crater Floor / Interior */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radiusPx * 0.75}
                      fill={showPsr && crater.hasPsr ? 'url(#psr-hatch)' : '#060a12'}
                      stroke="#142130"
                      strokeWidth="0.6"
                      strokeOpacity="0.4"
                    />
                    {/* Subdued Crater Name Label */}
                    <text
                      x={pos.x}
                      y={pos.y + radiusPx + 9}
                      textAnchor="middle"
                      fill="var(--lm-color-text-disabled)"
                      fontSize="7.5"
                      fontFamily="monospace"
                      opacity="0.45"
                    >
                      {crater.name}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Celestial Direction Vectors (Sun and Earth rays) */}
            {showVectors && (
              <g className="celestial-vectors">
                {/* 1. Global Sun Vector from Pole (Solar Gold) */}
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={sunX}
                  y2={sunY}
                  stroke="var(--lm-color-sun)"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                  opacity="0.9"
                />
                <circle cx={sunX} cy={sunY} r="4.5" fill="var(--lm-color-sun)" />
                <text
                  x={sunX}
                  y={sunY + 3}
                  dx={sunX > CENTER ? 8 : -8}
                  textAnchor={sunX > CENTER ? 'start' : 'end'}
                  fill="var(--lm-color-sun)"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  ☀ Sun ({sunElevationDeg >= 0 ? '+' : ''}{sunElevationDeg.toFixed(1)}°)
                </text>

                {/* 2. Global Earth Vector from Pole (Earth Blue) */}
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={earthX}
                  y2={earthY}
                  stroke={earthElevationDeg > 0 ? 'var(--lm-color-earth)' : '#f59e0b'}
                  strokeWidth="1.6"
                  strokeDasharray={earthElevationDeg > 0 ? '4 3' : '2 3'}
                  opacity="0.9"
                />
                <circle
                  cx={earthX}
                  cy={earthY}
                  r="4.5"
                  fill={earthElevationDeg > 0 ? 'var(--lm-color-earth)' : '#f59e0b'}
                />
                <text
                  x={earthX}
                  y={earthY + 3}
                  dx={earthX > CENTER ? 8 : -8}
                  textAnchor={earthX > CENTER ? 'start' : 'end'}
                  fill={earthElevationDeg > 0 ? 'var(--lm-color-earth)' : '#f59e0b'}
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  ⊕ Earth ({earthElevationDeg >= 0 ? '+' : ''}{earthElevationDeg.toFixed(1)}°)
                </text>

                {/* 3. Site Topocentric Vectors emitting from the candidate site */}
                <g className="site-topocentric-rays">
                  <line
                    x1={sitePos.x}
                    y1={sitePos.y}
                    x2={siteSunX}
                    y2={siteSunY}
                    stroke="var(--lm-color-sun)"
                    strokeWidth="1.8"
                    opacity="0.85"
                  />
                  <circle cx={siteSunX} cy={siteSunY} r="2.5" fill="var(--lm-color-sun)" />

                  <line
                    x1={sitePos.x}
                    y1={sitePos.y}
                    x2={siteEarthX}
                    y2={siteEarthY}
                    stroke={earthElevationDeg > 0 ? 'var(--lm-color-earth)' : '#f59e0b'}
                    strokeWidth="1.8"
                    strokeDasharray={earthElevationDeg > 0 ? undefined : '2 2'}
                    opacity="0.95"
                  />
                  <circle
                    cx={siteEarthX}
                    cy={siteEarthY}
                    r="2.5"
                    fill={earthElevationDeg > 0 ? 'var(--lm-color-earth)' : '#f59e0b'}
                  />
                </g>
              </g>
            )}

            {/* Exact South Pole Marker */}
            <circle cx={CENTER} cy={CENTER} r="3.5" fill="#ffffff" opacity="0.95" />
            <text x={CENTER + 7} y={CENTER + 3} fill="#ffffff" fontSize="8.5" fontWeight="600" fontFamily="monospace">
              90.0°S
            </text>

            {/* Candidate Site Pins - Highest Hierarchy with Guaranteed Hit Target */}
            <g className="candidate-sites">
              {CANDIDATE_SITES.map((site) => {
                const pos = project(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg);
                const isSelected = site.id === selectedSite.id;
                const isHovered = hoveredSite?.id === site.id;
                const displayName = site.name.replace(' Crater Rim', '').replace(' Mountain', '');

                return (
                  <g
                    key={site.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select site ${site.name} (${site.code}) at ${Math.abs(site.coordinates.latitudeDeg)}°S, ${site.coordinates.longitudeDeg}°E`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSite(site);
                    }}
                    onMouseDown={(e) => {
                      // Prevent map drag when clicking directly on a candidate site
                      e.stopPropagation();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectSite(site);
                      }
                    }}
                    onMouseEnter={() => setHoveredSite(site)}
                    onMouseLeave={() => setHoveredSite(null)}
                    className="cursor-pointer focus:outline-none group focus-visible:outline-2 focus-visible:outline-[var(--lm-color-selected-site)]"
                  >
                    {/* Generous Invisible Click Target to guarantee zero missed clicks */}
                    <circle cx={pos.x} cy={pos.y} r="20" fill="transparent" />

                    {/* Selected Site Marker Target Rings */}
                    {isSelected && (
                      <g className="selected-site-rings">
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="16"
                          fill="none"
                          stroke="var(--lm-color-selected-site)"
                          strokeWidth="1.8"
                          strokeDasharray="3 2"
                          opacity="0.9"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="22"
                          fill="var(--lm-color-selected-site)"
                          opacity="0.12"
                        />
                      </g>
                    )}

                    {/* Site Marker Center Jewel Pin */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? '6' : isHovered ? '5.2' : '4.2'}
                      fill={isSelected ? 'var(--lm-color-selected-site)' : isHovered ? '#70d6c5' : '#38bdf8'}
                      stroke={isSelected ? '#ffffff' : '#080f1a'}
                      strokeWidth={isSelected ? '1.8' : '1.5'}
                      className="transition-all duration-150"
                    />

                    {/* Leader Line for Selected or Hovered Site */}
                    {(isSelected || isHovered) && (
                      <line
                        x1={pos.x}
                        y1={pos.y - (isSelected ? 6 : 5)}
                        x2={pos.x}
                        y2={pos.y - 12}
                        stroke={isSelected ? 'var(--lm-color-selected-site)' : '#4a6585'}
                        strokeWidth="1.2"
                      />
                    )}

                    {/* High-Contrast Scientific Site Badge Tag */}
                    {isSelected ? (
                      <g className="selected-site-badge">
                        <rect
                          x={pos.x - 44}
                          y={pos.y - 28}
                          width="88"
                          height="16"
                          rx="3"
                          fill="#09121f"
                          stroke="var(--lm-color-selected-site)"
                          strokeWidth="1.3"
                          className="drop-shadow-md"
                        />
                        <text
                          x={pos.x}
                          y={pos.y - 17}
                          textAnchor="middle"
                          fill="var(--lm-color-selected-site)"
                          fontSize="9.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {site.code} • {displayName}
                        </text>
                      </g>
                    ) : (
                      <g className="unselected-site-tag">
                        <rect
                          x={pos.x - 22}
                          y={pos.y - 20}
                          width="44"
                          height="12"
                          rx="2"
                          fill="#060c16"
                          fillOpacity={isHovered ? '0.95' : '0.8'}
                          stroke={isHovered ? 'var(--lm-color-selected-site)' : '#1e2c3d'}
                          strokeWidth={isHovered ? '1' : '0.7'}
                        />
                        <text
                          x={pos.x}
                          y={pos.y - 11}
                          textAnchor="middle"
                          fill={isHovered ? '#ffffff' : '#94a3b8'}
                          fontSize="8"
                          fontWeight={isHovered ? '600' : '400'}
                          fontFamily="monospace"
                        >
                          {site.code}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Candidate Quick Selection Ribbon below Map (rendered only if not hidden by unified workspace) */}
      {!hideRibbon && (
        <div className="bg-[var(--lm-color-surface)] border-t border-[var(--lm-color-border-subtle)] p-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[11px] font-mono text-[var(--lm-color-text-muted)] shrink-0 uppercase tracking-wider">
            Candidate Sites:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {CANDIDATE_SITES.map((site) => {
              const isSelected = site.id === selectedSite.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => onSelectSite(site)}
                  className={`px-2.5 py-1 text-xs font-mono-num rounded-[var(--lm-radius-sm)] transition-colors ${
                    isSelected
                      ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)] font-semibold shadow-xs'
                      : 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] border border-[var(--lm-color-border)] hover:text-white hover:bg-[var(--lm-color-surface-strong)]'
                  }`}
                >
                  {site.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
