import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CandidateSite } from '../../types/site';
import { CANDIDATE_SITES } from '../../lib/sites-data';
import {
  projectLatLon,
  unprojectCoordinates,
  calculateLunarDistanceKm,
  calculateCustomPointCelestial,
  DEFAULT_PROJECTION_CONFIG,
  SelenographicCoordinate,
} from '../../lib/projection';
import { MapGridLayer } from './layers/MapGridLayer';
import { CraterLayer } from './layers/CraterLayer';
import { CandidateLayer } from './layers/CandidateLayer';
import { SunEarthVectorLayer } from './layers/SunEarthVectorLayer';
import { CustomPointLayer } from './layers/CustomPointLayer';
import { MapScaleBar } from './ui/MapScaleBar';
import { MapToolbar, MapZoomPreset } from './ui/MapToolbar';
import { CustomPointCard } from './ui/CustomPointCard';
import { SiteTelemetryCard } from './ui/SiteTelemetryCard';
import { VectorTelemetryPopover } from './VectorTelemetryPopover';

export interface SouthPoleMapProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  sunAzimuthDeg: number;
  earthAzimuthDeg: number;
  earthElevationDeg?: number;
  subEarthLonDeg?: number;
  subEarthLatDeg?: number;
  subSolarLatDeg?: number;
  subSolarLonDeg?: number;
  sunElevationDeg?: number;
  currentIsoUtc?: string;
  showGrid?: boolean;
  showPsr?: boolean;
  showVectors?: boolean;
  onToggleGrid?: () => void;
  onTogglePsr?: () => void;
  onToggleVectors?: () => void;
  hideHeader?: boolean;
  hideRibbon?: boolean;
}

/**
 * 2D Polar Stereographic Geographic Map (83°S–90°S).
 * Implements a scientifically honest cartographic interaction model:
 * - Geography first: Candidate sites, crater features, Selenographic graticule, and dynamic scale bar.
 * - Topocentric Sun and Earth direction vectors originate from the selected site with elevation tags.
 * - Deterministic radial collision avoidance prevents label stacking at the South Pole.
 * - Synchronized with Point Passport, Time Explorer, and 3D globe across canonical UTC epochs.
 */
export function SouthPoleMap({
  selectedSite,
  onSelectSite,
  sunAzimuthDeg,
  earthAzimuthDeg,
  earthElevationDeg = 0,
  subEarthLonDeg = 0,
  subEarthLatDeg = 0,
  subSolarLatDeg = 0,
  subSolarLonDeg = 0,
  sunElevationDeg = 0,
  currentIsoUtc,
  showGrid: propShowGrid,
  showPsr: propShowPsr,
  showVectors: propShowVectors,
  onToggleGrid,
  onTogglePsr,
  onToggleVectors,
  hideHeader = false,
  hideRibbon = false,
}: SouthPoleMapProps) {
  // Viewport transforms
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activePreset, setActivePreset] = useState<MapZoomPreset | 'custom'>('regional');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Layer toggles
  const [localShowGrid, setLocalShowGrid] = useState(true);
  const [localShowPsr, setLocalShowPsr] = useState(true);
  const [localShowCraters, setLocalShowCraters] = useState(true);
  const [localShowVectors, setLocalShowVectors] = useState(true);

  const showGrid = propShowGrid !== undefined ? propShowGrid : localShowGrid;
  const showPsr = propShowPsr !== undefined ? propShowPsr : localShowPsr;
  const showVectors = propShowVectors !== undefined ? propShowVectors : localShowVectors;

  const toggleGrid = onToggleGrid || (() => setLocalShowGrid((v) => !v));
  const togglePsr = onTogglePsr || (() => setLocalShowPsr((v) => !v));
  const toggleVectors = onToggleVectors || (() => setLocalShowVectors((v) => !v));

  // Interactive hover & selection states
  const [hoveredSite, setHoveredSite] = useState<CandidateSite | null>(null);
  const [activeVectorPopover, setActiveVectorPopover] = useState<'sun' | 'earth' | null>(null);
  const [cursorCoord, setCursorCoord] = useState<SelenographicCoordinate | null>(null);
  const [customInspectPoint, setCustomInspectPoint] = useState<SelenographicCoordinate | null>(null);

  const SVG_SIZE = DEFAULT_PROJECTION_CONFIG.svgSize;
  const CENTER = DEFAULT_PROJECTION_CONFIG.center;
  const MAX_RADIUS = DEFAULT_PROJECTION_CONFIG.maxRadius;

  // Selected site projected point
  const sitePos = useMemo(() => {
    return projectLatLon(
      selectedSite.coordinates.latitudeDeg,
      selectedSite.coordinates.longitudeDeg
    );
  }, [selectedSite]);

  // Geodesic distance of selected site from the exact South Pole (90.0°S)
  const distanceFromPoleKm = useMemo(() => {
    return calculateLunarDistanceKm(selectedSite.coordinates, {
      latitudeDeg: -90.0,
      longitudeDeg: 0.0,
    });
  }, [selectedSite]);

  // Topocentric celestial angles and projected position for hovered preview candidate (Storyboard State 2)
  const hoveredCelestial = useMemo(() => {
    if (!hoveredSite || hoveredSite.id === selectedSite.id) return null;
    const celestial = calculateCustomPointCelestial(
      hoveredSite.coordinates,
      subSolarLatDeg,
      subSolarLonDeg,
      subEarthLatDeg,
      subEarthLonDeg
    );
    const pos = projectLatLon(
      hoveredSite.coordinates.latitudeDeg,
      hoveredSite.coordinates.longitudeDeg
    );
    return { celestial, pos };
  }, [hoveredSite, selectedSite, subSolarLatDeg, subSolarLonDeg, subEarthLatDeg, subEarthLonDeg]);

  // View extent preset handler
  const handleApplyPreset = useCallback((preset: MapZoomPreset) => {
    setActivePreset(preset);
    if (preset === 'regional') {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
    } else if (preset === 'candidates') {
      setZoom(1.85);
      // Center slightly toward the Artemis candidates cluster near the pole
      setPan({ x: 0, y: 35 });
    } else if (preset === 'site') {
      const targetZoom = 2.8;
      setZoom(targetZoom);
      setPan({
        x: (CENTER - sitePos.x) * targetZoom,
        y: (CENTER - sitePos.y) * targetZoom,
      });
    }
  }, [sitePos, CENTER]);

  // Reset to default regional view
  const handleReset = useCallback(() => {
    handleApplyPreset('regional');
  }, [handleApplyPreset]);

  // Mouse drag panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setActivePreset('custom');
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }

    // Update cursor selenographic coordinate readout
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const svgX = (clientX * SVG_SIZE) / rect.width;
      const svgY = (clientY * SVG_SIZE) / rect.height;

      const untransformedX = (svgX - CENTER - pan.x) / zoom + CENTER;
      const untransformedY = (svgY - CENTER - pan.y) / zoom + CENTER;

      const coord = unprojectCoordinates(untransformedX, untransformedY);
      setCursorCoord(coord);
    }
  }, [isDragging, zoom, pan, SVG_SIZE, CENTER]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setCursorCoord(null);
  }, []);

  // Smooth wheel zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setActivePreset('custom');
    const factor = e.deltaY < 0 ? 1.14 : 0.88;
    setZoom((z) => Math.min(4.5, Math.max(0.8, Number((z * factor).toFixed(2)))));
  }, []);

  // Map surface click for custom coordinate exploration
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const svgX = (clientX * SVG_SIZE) / rect.width;
      const svgY = (clientY * SVG_SIZE) / rect.height;

      const untransformedX = (svgX - CENTER - pan.x) / zoom + CENTER;
      const untransformedY = (svgY - CENTER - pan.y) / zoom + CENTER;

      const coord = unprojectCoordinates(untransformedX, untransformedY);
      if (coord) {
        setCustomInspectPoint(coord);
      }
    }
  }, [isDragging, pan, zoom, SVG_SIZE, CENTER]);

  // Custom inspected point calculations
  const customPointData = useMemo(() => {
    if (!customInspectPoint) return null;
    const distanceKm = calculateLunarDistanceKm(
      selectedSite.coordinates,
      customInspectPoint
    );
    const celestial = calculateCustomPointCelestial(
      customInspectPoint,
      subSolarLatDeg,
      subSolarLonDeg,
      subEarthLatDeg,
      subEarthLonDeg
    );

    let nearestSite = CANDIDATE_SITES[0];
    let minCandidateDist = calculateLunarDistanceKm(
      customInspectPoint,
      nearestSite.coordinates
    );
    for (let i = 1; i < CANDIDATE_SITES.length; i++) {
      const d = calculateLunarDistanceKm(
        customInspectPoint,
        CANDIDATE_SITES[i].coordinates
      );
      if (d < minCandidateDist) {
        minCandidateDist = d;
        nearestSite = CANDIDATE_SITES[i];
      }
    }

    return {
      distanceKm,
      celestial,
      nearestSite,
      minCandidateDist,
      pos: projectLatLon(customInspectPoint.latitudeDeg, customInspectPoint.longitudeDeg),
    };
  }, [customInspectPoint, selectedSite, subSolarLatDeg, subSolarLonDeg, subEarthLatDeg, subEarthLonDeg]);

  // Cursor distance from active site
  const cursorDistanceKm = useMemo(() => {
    if (!cursorCoord) return null;
    return calculateLunarDistanceKm(selectedSite.coordinates, cursorCoord);
  }, [cursorCoord, selectedSite]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] overflow-hidden select-none min-h-0">
      {/* Scientific Map Toolbar & Layer Controls */}
      <MapToolbar
        zoom={zoom}
        onZoomIn={() => {
          setActivePreset('custom');
          setZoom((z) => Math.min(4.5, z + 0.35));
        }}
        onZoomOut={() => {
          setActivePreset('custom');
          setZoom((z) => Math.max(0.8, z - 0.35));
        }}
        onReset={handleReset}
        onApplyPreset={handleApplyPreset}
        activePreset={activePreset}
        showGrid={showGrid}
        showPsr={showPsr}
        showCraters={localShowCraters}
        showVectors={showVectors}
        onToggleGrid={toggleGrid}
        onTogglePsr={togglePsr}
        onToggleCraters={() => setLocalShowCraters((v) => !v)}
        onToggleVectors={toggleVectors}
        hideHeader={hideHeader}
      />

      {/* Projection-Accurate Dynamic Scale Bar & Live Coordinates */}
      <MapScaleBar
        zoom={zoom}
        cursorCoord={cursorCoord}
        cursorDistanceKm={cursorDistanceKm}
        selectedSite={selectedSite}
        hideRibbon={hideRibbon}
      />

      {/* On-Map Site Telemetry HUD (Panels 3 & 6 in Storyboard) */}
      <SiteTelemetryCard
        site={selectedSite}
        sunElevationDeg={sunElevationDeg}
        sunAzimuthDeg={sunAzimuthDeg}
        earthElevationDeg={earthElevationDeg}
        earthAzimuthDeg={earthAzimuthDeg}
        distanceFromPoleKm={distanceFromPoleKm}
        visible={!activeVectorPopover && !customInspectPoint && !hoveredSite}
      />

      {/* Hover Preview Card for Unselected Candidate (Panel 2 in Storyboard) */}
      {hoveredSite && hoveredSite.id !== selectedSite.id && hoveredCelestial && (
        <div
          role="region"
          aria-label={`Preview Candidate: ${hoveredSite.name}`}
          className="hidden sm:block absolute top-12 right-3 z-15 bg-[var(--lm-color-surface-raised)]/95 backdrop-blur-md border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] px-2.5 py-2 shadow-lg text-left select-none pointer-events-none w-46"
        >
          <div className="flex items-baseline justify-between border-b border-[var(--lm-color-border-subtle)] pb-1 mb-1.5">
            <span className="text-[11px] font-bold font-mono text-sky-400">
              {hoveredSite.code}
            </span>
            <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate ml-1 max-w-[110px]">
              {hoveredSite.name}
            </span>
          </div>
          <div className="space-y-0.5 text-[10.5px] font-mono text-[var(--lm-color-text-secondary)]">
            <div className="flex justify-between">
              <span className="text-[var(--lm-color-text-muted)]">Elev:</span>
              <span className="font-semibold text-[var(--lm-color-text-primary)]">
                +{hoveredSite.coordinates.elevationMeters.toLocaleString()} m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--lm-color-text-muted)]">Lat:</span>
              <span>{Math.abs(hoveredSite.coordinates.latitudeDeg).toFixed(2)}°S</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--lm-color-text-muted)]">Lon:</span>
              <span>{hoveredSite.coordinates.longitudeDeg.toFixed(1)}°E</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[var(--lm-color-border-subtle)] text-[10px]">
              <span className="text-[var(--lm-color-sun)]">Sun:</span>
              <span className="text-[var(--lm-color-sun)] font-semibold">
                {hoveredCelestial.celestial.sunElevationDeg >= 0 ? '+' : ''}{hoveredCelestial.celestial.sunElevationDeg.toFixed(1)}°
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[var(--lm-color-earth)]">Earth:</span>
              <span className="text-[var(--lm-color-earth)] font-semibold">
                {hoveredCelestial.celestial.earthElevationDeg >= 0 ? '+' : ''}{hoveredCelestial.celestial.earthElevationDeg.toFixed(1)}°
              </span>
            </div>
          </div>
          <div className="mt-1.5 text-[9px] text-[var(--lm-color-selected-site)] font-mono">
            Click to select candidate
          </div>
        </div>
      )}

      {/* Vector Telemetry Popover for Sun / Earth Endpoint Click */}
      {activeVectorPopover && (
        <VectorTelemetryPopover
          target={activeVectorPopover}
          selectedSite={selectedSite}
          elevationDeg={activeVectorPopover === 'sun' ? sunElevationDeg : earthElevationDeg}
          azimuthDeg={activeVectorPopover === 'sun' ? sunAzimuthDeg : earthAzimuthDeg}
          subLatDeg={activeVectorPopover === 'sun' ? subSolarLatDeg : subEarthLatDeg}
          subLonDeg={activeVectorPopover === 'sun' ? subSolarLonDeg : subEarthLonDeg}
          currentIsoUtc={currentIsoUtc}
          onClose={() => setActiveVectorPopover(null)}
        />
      )}

      {/* Custom Point Inspection Overlay Card */}
      {customPointData && customInspectPoint && (
        <CustomPointCard
          coord={customInspectPoint}
          distanceKm={customPointData.distanceKm}
          sunElevationDeg={customPointData.celestial.sunElevationDeg}
          sunAzimuthDeg={customPointData.celestial.sunAzimuthDeg}
          earthElevationDeg={customPointData.celestial.earthElevationDeg}
          earthAzimuthDeg={customPointData.celestial.earthAzimuthDeg}
          nearestSite={customPointData.nearestSite}
          nearestDistanceKm={customPointData.minCandidateDist}
          onSelectNearest={onSelectSite}
          onClose={() => setCustomInspectPoint(null)}
        />
      )}

      {/* Interactive SVG Canvas */}
      <div
        className="w-full h-full flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden min-h-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full select-none"
        >
          <defs>
            {/* PSR Diagonal Hatch Pattern */}
            <pattern
              id="psr-hatch"
              width="6"
              height="6"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="#4a6585"
                strokeWidth="1.2"
                strokeOpacity="0.45"
              />
            </pattern>

            {/* Radial Terrain Gradient for Polar Basin */}
            <radialGradient id="pole-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#141d2c" />
              <stop offset="70%" stopColor="#0d1422" />
              <stop offset="100%" stopColor="#070b12" />
            </radialGradient>
          </defs>

          {/* Zoomable / Pannable Map Container */}
          <g
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: `${CENTER}px ${CENTER}px`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Lunar South-Pole Basin Disc (83°S Boundary) */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={MAX_RADIUS}
              fill="url(#pole-gradient)"
              stroke="var(--lm-color-border)"
              strokeWidth="1.5"
            />

            {/* 1. Graticule Layer (Latitudes & Meridians) */}
            <MapGridLayer showGrid={showGrid} zoom={zoom} />

            {/* 2. Terrain & Crater Layer (Subdued rims & PSRs) */}
            <CraterLayer
              showCraters={localShowCraters}
              showPsr={showPsr}
              zoom={zoom}
            />

            {/* 3. Topocentric Sun & Earth Vector Layer (Dashed lines with elevation tags to boundary) */}
            <SunEarthVectorLayer
              visible={showVectors}
              selectedSite={selectedSite}
              sitePos={sitePos}
              sunAzimuthDeg={sunAzimuthDeg}
              sunElevationDeg={sunElevationDeg}
              earthAzimuthDeg={earthAzimuthDeg}
              earthElevationDeg={earthElevationDeg}
              hoveredSite={hoveredSite}
              hoveredSitePos={hoveredCelestial?.pos}
              hoveredSunAzimuthDeg={hoveredCelestial?.celestial.sunAzimuthDeg}
              hoveredSunElevationDeg={hoveredCelestial?.celestial.sunElevationDeg}
              hoveredEarthAzimuthDeg={hoveredCelestial?.celestial.earthAzimuthDeg}
              hoveredEarthElevationDeg={hoveredCelestial?.celestial.earthElevationDeg}
              onOpenVectorPopover={setActiveVectorPopover}
            />

            {/* 4. Custom Inspection Point Layer */}
            <CustomPointLayer
              customPos={customPointData ? customPointData.pos : null}
              selectedSitePos={sitePos}
              distanceKm={customPointData ? customPointData.distanceKm : null}
            />

            {/* 5. Candidate Sites Layer (Collision-aware pins & tags) */}
            <CandidateLayer
              selectedSite={selectedSite}
              onSelectSite={onSelectSite}
              hoveredSite={hoveredSite}
              onHoverSite={setHoveredSite}
              zoom={zoom}
            />
          </g>
        </svg>
      </div>

      {/* Candidate Quick Selection Ribbon below Map (if not hidden) */}
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
