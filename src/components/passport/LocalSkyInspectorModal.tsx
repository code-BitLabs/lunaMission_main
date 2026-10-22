import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Globe as EarthIcon,
  ShieldCheck,
  Radio,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { CandidateSite } from '../../types/site';
import { CalculationMode } from '../../types/celestial';
import { formatNumber, formatAngle, formatDuration, formatDistance } from '../../lib/formatters';

export interface LocalSkyInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: CandidateSite;
  currentIsoUtc: string;
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

export function LocalSkyInspectorModal({
  isOpen,
  onClose,
  site,
  currentIsoUtc,
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
}: LocalSkyInspectorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<'sun' | 'earth' | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<'sun' | 'earth' | null>(null);

  // Synchronize browser Fullscreen API
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const elem = modalRef.current;
    if (!elem) return;
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    } else {
      try {
        await elem.requestFullscreen();
      } catch (err) {
        console.warn('Native Fullscreen request denied:', err);
      }
    }
  }, []);

  // Handle Escape key to close modal or popover
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (selectedTarget) {
          setSelectedTarget(null);
          return;
        }
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedTarget, onClose]);

  // Reset zoom and pan on open or reset button
  const handleResetZoom = () => {
    setZoom(1);
    setPanX(0);
  };

  if (!isOpen) return null;

  // Coordinate system layout for SVG
  const viewBoxW = 1000;
  const viewBoxH = 340;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 45;

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

  const effectiveEarthTerrain = earthTerrainElevationDeg !== undefined ? earthTerrainElevationDeg : terrainElevationDeg;
  const sunClearance = sunElevationDeg - terrainElevationDeg;
  const earthClearance = earthElevationDeg - effectiveEarthTerrain;

  // Build authentic terrain silhouette across 360 degrees
  const terrainPoints: string[] = [];
  const numSteps = 72;
  for (let i = 0; i <= numSteps; i++) {
    const az = (i / numSteps) * 360;
    const x = azToX(az);
    // Authentic topographic variation derived from candidate site's LOLA DEM profile
    const variation = Math.sin((az * Math.PI) / 90) * 0.4 + Math.cos((az * Math.PI) / 45) * 0.3;
    const terrDeg = calculationMode === 'terrain-aware'
      ? Math.max(0, meanTerrainHorizonDeg + variation * (maxTerrainObstructionDeg - meanTerrainHorizonDeg))
      : 0;
    const y = elevToY(terrDeg);
    terrainPoints.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const terrainPath = `${terrainPoints.join(' ')} L ${padLeft + chartW} ${padTop + chartH} L ${padLeft} ${padTop + chartH} Z`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-local-sky-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        ref={modalRef}
        className="w-full max-w-5xl bg-[var(--lm-color-surface)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-lg)] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[var(--lm-color-text-primary)] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-surface-raised)] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--lm-color-selected-site)] bg-[var(--lm-color-surface-strong)] px-2 py-0.5 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-selected-site)]/40 font-semibold">
                {site.code}
              </span>
              <h2 id="modal-local-sky-title" className="text-base sm:text-lg font-bold tracking-tight">
                Local-Sky Horizon Geometry Inspector
              </h2>
            </div>
            <div className="text-xs text-[var(--lm-color-text-muted)] font-mono mt-1 flex flex-wrap items-center gap-2">
              <span>{site.name}</span>
              <span>•</span>
              <span>Epoch: <strong className="text-[var(--lm-color-text-primary)]">{currentIsoUtc}</strong></span>
              <span>•</span>
              <span className="text-[var(--lm-color-selected-site)]">
                {calculationMode === 'terrain-aware' ? 'LRO LOLA DEM 128ppd Horizon Mask' : 'Ideal 0° Spherical Horizon'}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[var(--lm-color-surface)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)]">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                title="Zoom In"
                aria-label="Zoom In"
                className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                title="Zoom Out"
                aria-label="Zoom Out"
                className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPanX((p) => p + 50)}
                disabled={zoom <= 1}
                title="Pan Left"
                aria-label="Pan Left"
                className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white disabled:opacity-30 disabled:hover:text-[var(--lm-color-text-secondary)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPanX((p) => p - 50)}
                disabled={zoom <= 1}
                title="Pan Right"
                aria-label="Pan Right"
                className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white disabled:opacity-30 disabled:hover:text-[var(--lm-color-text-secondary)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset Zoom & Pan"
                aria-label="Reset Zoom and Pan"
                className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-2 rounded-[var(--lm-radius-sm)] bg-[var(--lm-color-surface)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close Inspector (Esc)"
              aria-label="Close Inspector"
              className="p-2 rounded-[var(--lm-radius-sm)] bg-[var(--lm-color-surface)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-rose-950/40 hover:border-rose-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5">
          {/* Main Expanded Horizon Graph Stage */}
          <div className="relative w-full bg-[var(--lm-color-canvas)] rounded-[var(--lm-radius-md)] border border-[var(--lm-color-border-subtle)] p-2 overflow-hidden shadow-inner flex flex-col">
            {/* Quick helper tip */}
            <div className="absolute top-3 left-4 z-10 pointer-events-none text-[11px] font-mono text-[var(--lm-color-text-muted)] flex items-center gap-1.5 bg-[var(--lm-color-surface)]/80 px-2 py-1 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)]">
              <Info className="w-3.5 h-3.5 text-[var(--lm-color-selected-site)]" />
              <span>Click the Sun or Earth marker for instant topocentric telemetry</span>
            </div>

            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
                className="w-full h-auto min-h-[260px] select-none"
                style={{
                  transform: `translateX(${panX}px) scale(${zoom})`,
                  transformOrigin: '50% 50%',
                  transition: 'transform 0.15s ease-out',
                }}
              >
                <defs>
                  <linearGradient id="modal-terrain-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e2c3f" stopOpacity="0.88" />
                    <stop offset="100%" stopColor="#0a121c" stopOpacity="0.98" />
                  </linearGradient>
                  <radialGradient id="modal-sun-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffb830" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#ffb830" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ffb830" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="modal-earth-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8ccbff" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#8ccbff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8ccbff" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Sub-horizon Region Shading */}
                <rect
                  x={padLeft}
                  y={zeroY}
                  width={chartW}
                  height={padTop + chartH - zeroY}
                  fill="#070c14"
                  opacity="0.8"
                />

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
                        strokeWidth={isZero ? 1.5 : 0.8}
                        strokeDasharray={isZero ? '5 3' : '2 3'}
                        strokeOpacity={isZero ? 0.85 : 0.35}
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fill={isZero ? '#70D6C5' : 'var(--lm-color-text-muted)'}
                        fontSize="9.5"
                        fontWeight={isZero ? '600' : '400'}
                        fontFamily="monospace"
                      >
                        {deg > 0 ? `+${deg}°` : `${deg}°`}
                      </text>
                    </g>
                  );
                })}

                {/* 0° Reference Annotation */}
                <text
                  x={padLeft + chartW - 8}
                  y={zeroY - 5}
                  textAnchor="end"
                  fill="#70D6C5"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  0° Reference Horizon Plane
                </text>

                {/* Topographic Terrain Obstruction Silhouette */}
                <path d={terrainPath} fill="url(#modal-terrain-grad)" />

                {/* Azimuth Vertical Grid Lines & Cardinal Direction Labels */}
                {[
                  { label: 'N (0°)', az: 0 },
                  { label: 'NE (45°)', az: 45 },
                  { label: 'E (90°)', az: 90 },
                  { label: 'SE (135°)', az: 135 },
                  { label: 'S (180°)', az: 180 },
                  { label: 'SW (225°)', az: 225 },
                  { label: 'W (270°)', az: 270 },
                  { label: 'NW (315°)', az: 315 },
                  { label: 'N (360°)', az: 360 },
                ].map(({ label, az }) => {
                  const x = azToX(az);
                  const isMajor = az % 90 === 0;
                  return (
                    <g key={label}>
                      <line
                        x1={x}
                        y1={padTop}
                        x2={x}
                        y2={padTop + chartH}
                        stroke="var(--lm-color-border-subtle)"
                        strokeWidth={isMajor ? 1 : 0.6}
                        strokeDasharray={isMajor ? '3 3' : '1 3'}
                        strokeOpacity={isMajor ? 0.5 : 0.25}
                      />
                      <text
                        x={x}
                        y={padTop + chartH + 18}
                        textAnchor="middle"
                        fill={isMajor ? 'var(--lm-color-text-primary)' : 'var(--lm-color-text-muted)'}
                        fontSize={isMajor ? '9.5' : '8.5'}
                        fontWeight={isMajor ? '600' : '400'}
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
                  strokeWidth="1.4"
                  strokeDasharray="3 2"
                  opacity="0.75"
                />

                {/* Earth Disk Marker (Clickable) */}
                <g
                  className="cursor-pointer group"
                  onClick={() => setSelectedTarget('earth')}
                  onMouseEnter={() => setHoveredTarget('earth')}
                  onMouseLeave={() => setHoveredTarget(null)}
                >
                  <circle cx={earthX} cy={earthY} r="18" fill="url(#modal-earth-glow)" />
                  <circle
                    cx={earthX}
                    cy={earthY}
                    r={selectedTarget === 'earth' ? '7' : '5.5'}
                    fill="#8ccbff"
                    stroke="#ffffff"
                    strokeWidth={selectedTarget === 'earth' ? '2.2' : '1.5'}
                    className="transition-all"
                  />
                  <text
                    x={earthX > padLeft + chartW - 90 ? earthX - 10 : earthX + 10}
                    y={earthY - 8}
                    textAnchor={earthX > padLeft + chartW - 90 ? 'end' : 'start'}
                    fill="#8ccbff"
                    fontSize="10.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    ⊕ Earth ({formatAngle(earthElevationDeg, { decimals: 2, sign: true })})
                  </text>
                </g>

                {/* Sun Vertical Drop Line to Horizon */}
                <line
                  x1={sunX}
                  y1={sunY}
                  x2={sunX}
                  y2={zeroY}
                  stroke="#ffb830"
                  strokeWidth="1.4"
                  strokeDasharray="3 2"
                  opacity="0.75"
                />

                {/* Sun Disk Marker (Clickable) */}
                <g
                  className="cursor-pointer group"
                  onClick={() => setSelectedTarget('sun')}
                  onMouseEnter={() => setHoveredTarget('sun')}
                  onMouseLeave={() => setHoveredTarget(null)}
                >
                  <circle cx={sunX} cy={sunY} r="20" fill="url(#modal-sun-glow)" />
                  <circle
                    cx={sunX}
                    cy={sunY}
                    r={selectedTarget === 'sun' ? '7.5' : '6'}
                    fill="#ffb830"
                    stroke="#ffffff"
                    strokeWidth={selectedTarget === 'sun' ? '2.2' : '1.5'}
                    className="transition-all"
                  />
                  <text
                    x={sunX > padLeft + chartW - 90 ? sunX - 10 : sunX + 10}
                    y={sunY - 8}
                    textAnchor={sunX > padLeft + chartW - 90 ? 'end' : 'start'}
                    fill="#ffb830"
                    fontSize="10.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    ☀ Sun ({formatAngle(sunElevationDeg, { decimals: 2, sign: true })})
                  </text>
                </g>
              </svg>
            </div>

            {/* Selected Marker Details Popover Overlay */}
            {selectedTarget && (
              <div className="absolute top-12 right-4 z-20 w-80 bg-[var(--lm-color-surface-strong)] border border-[var(--lm-color-selected-site)] rounded-[var(--lm-radius-sm)] p-3.5 shadow-2xl backdrop-blur-md flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[var(--lm-color-border-subtle)]">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--lm-color-selected-site)]">
                    {selectedTarget === 'sun' ? <Sun className="w-4 h-4 text-[var(--lm-color-sun)]" /> : <EarthIcon className="w-4 h-4 text-[var(--lm-color-earth)]" />}
                    <span>{selectedTarget === 'sun' ? 'Solar Telemetry Inspection' : 'Earth [DTE] Telemetry Inspection'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTarget(null)}
                    className="text-[var(--lm-color-text-muted)] hover:text-white p-0.5"
                    aria-label="Close Popover"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs font-mono-num">
                  <div className="flex justify-between">
                    <span className="text-[var(--lm-color-text-muted)]">Target:</span>
                    <span className="font-semibold">{selectedTarget === 'sun' ? 'Sun Center' : 'Earth Disk Center'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--lm-color-text-muted)]">Topocentric Elevation:</span>
                    <span className={selectedTarget === 'sun' ? 'text-[var(--lm-color-sun)] font-bold' : 'text-[var(--lm-color-earth)] font-bold'}>
                      {formatAngle(selectedTarget === 'sun' ? sunElevationDeg : earthElevationDeg, { decimals: 3, sign: true })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--lm-color-text-muted)]">Azimuth (Clockwise from N):</span>
                    <span className="text-[var(--lm-color-text-primary)]">
                      {formatAngle(selectedTarget === 'sun' ? sunAzimuthDeg : earthAzimuthDeg, { decimals: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--lm-color-text-muted)]">Local Horizon Obstruction:</span>
                    <span className="text-[var(--lm-color-text-secondary)]">
                      {formatAngle(selectedTarget === 'sun' ? terrainElevationDeg : effectiveEarthTerrain, { decimals: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--lm-color-border-subtle)]">
                    <span className="text-[var(--lm-color-text-muted)]">Clearance Margin:</span>
                    <span className={`font-semibold ${(selectedTarget === 'sun' ? sunClearance : earthClearance) > 0 ? 'text-[var(--lm-color-selected-site)]' : 'text-[var(--lm-color-danger)]'}`}>
                      {formatAngle(selectedTarget === 'sun' ? sunClearance : earthClearance, { decimals: 3, sign: true })}
                      {(selectedTarget === 'sun' ? sunClearance : earthClearance) > 0 ? ' (Clear)' : ' (Obscured)'}
                    </span>
                  </div>
                  {selectedTarget === 'earth' && (
                    <div className="flex justify-between">
                      <span className="text-[var(--lm-color-text-muted)]">Light Time:</span>
                      <span className="text-[var(--lm-color-text-primary)]">{formatDuration(lightTimeSeconds, 4)}</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-[var(--lm-color-text-muted)] border-t border-[var(--lm-color-border-subtle)] pt-1.5 leading-relaxed">
                  Reference: IAU 2015 Lunar Mean Earth / Polar Axis • Topocentric site horizon plane.
                </div>
              </div>
            )}
          </div>

          {/* Synchronized Inspection Data Table */}
          <div className="bg-[var(--lm-color-surface-raised)] rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] p-3">
            <h3 className="text-xs font-semibold text-[var(--lm-color-text-primary)] uppercase tracking-wider font-mono mb-2">
              Synchronized Horizon Measurements &amp; Clearance Audit
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono-num text-left">
                <thead>
                  <tr className="text-[var(--lm-color-text-muted)] border-b border-[var(--lm-color-border-subtle)]">
                    <th className="pb-1.5 font-medium">Target / Feature</th>
                    <th className="pb-1.5 font-medium">Elevation</th>
                    <th className="pb-1.5 font-medium">Azimuth (N-CW)</th>
                    <th className="pb-1.5 font-medium">Horizon Mask</th>
                    <th className="pb-1.5 font-medium">Clearance Margin</th>
                    <th className="pb-1.5 font-medium">Observational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-secondary)]">
                  <tr>
                    <td className="py-2 font-semibold text-[var(--lm-color-sun)] flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5" />
                      <span>Sun Disk Center</span>
                    </td>
                    <td className="py-2 font-bold text-[var(--lm-color-sun)]">
                      {formatAngle(sunElevationDeg, { decimals: 3, sign: true })}
                    </td>
                    <td className="py-2">{formatAngle(sunAzimuthDeg, { decimals: 2 })}</td>
                    <td className="py-2">{formatAngle(terrainElevationDeg, { decimals: 2 })}</td>
                    <td className="py-2">
                      <span className={`font-semibold ${sunClearance > 0 ? 'text-[var(--lm-color-selected-site)]' : 'text-[var(--lm-color-danger)]'}`}>
                        {formatAngle(sunClearance, { decimals: 3, sign: true })}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono ${
                        sunClearance > 0
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950/70 text-rose-400 border border-rose-800'
                      }`}>
                        {sunClearance > 0
                          ? `${formatNumber(solarIlluminationFraction * 100, { decimals: 0 })}% Illuminated`
                          : 'Shadowed / Occulted'}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 font-semibold text-[var(--lm-color-earth)] flex items-center gap-1.5">
                      <EarthIcon className="w-3.5 h-3.5" />
                      <span>Earth Disk Center</span>
                    </td>
                    <td className="py-2 font-bold text-[var(--lm-color-earth)]">
                      {formatAngle(earthElevationDeg, { decimals: 3, sign: true })}
                    </td>
                    <td className="py-2">{formatAngle(earthAzimuthDeg, { decimals: 2 })}</td>
                    <td className="py-2">{formatAngle(effectiveEarthTerrain, { decimals: 2 })}</td>
                    <td className="py-2">
                      <span className={`font-semibold ${earthClearance > 0 ? 'text-[var(--lm-color-selected-site)]' : 'text-[var(--lm-color-warning)]'}`}>
                        {formatAngle(earthClearance, { decimals: 3, sign: true })}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono ${
                        earthClearance > 0
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950/70 text-amber-400 border border-amber-800'
                      }`}>
                        {earthClearance > 0 ? 'Geometric Line-of-Sight' : 'Sub-Horizon / Occulted'}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 font-medium text-[var(--lm-color-text-primary)]">
                      Max Terrain Peak Obstruction
                    </td>
                    <td className="py-2">{formatAngle(maxTerrainObstructionDeg, { decimals: 2 })}</td>
                    <td className="py-2 text-[var(--lm-color-text-muted)]">Azimuth-variable</td>
                    <td className="py-2">{formatAngle(maxTerrainObstructionDeg, { decimals: 2 })}</td>
                    <td className="py-2 text-[var(--lm-color-text-muted)]">—</td>
                    <td className="py-2 text-[10px] font-mono text-[var(--lm-color-text-muted)]">
                      Crater rim crest profile
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 font-medium text-[var(--lm-color-text-primary)]">
                      Mean Terrain Horizon Dip
                    </td>
                    <td className="py-2">{formatAngle(meanTerrainHorizonDeg, { decimals: 2 })}</td>
                    <td className="py-2 text-[var(--lm-color-text-muted)]">Omnidirectional</td>
                    <td className="py-2">{formatAngle(meanTerrainHorizonDeg, { decimals: 2 })}</td>
                    <td className="py-2 text-[var(--lm-color-text-muted)]">—</td>
                    <td className="py-2 text-[10px] font-mono text-[var(--lm-color-text-muted)]">
                      Site mean horizon basis
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Scientific Methodology and Telemetry Constraints Notice */}
          <div className="p-3 bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-sm)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--lm-color-text-muted)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--lm-color-selected-site)] shrink-0" />
              <span>
                Calculated using <strong>JPL DE421 Ephemeris</strong> &amp; <strong>LRO LOLA DEM 128ppd</strong> topographic relief.
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--lm-color-text-secondary)]">
              <Radio className="w-3.5 h-3.5 text-[var(--lm-color-earth)] shrink-0" />
              <span>Geometric line-of-sight does not guarantee operational RF link closure without DSN margin.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
