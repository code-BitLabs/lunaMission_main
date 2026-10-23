import React, { useCallback, useMemo, useState } from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { projectLatLon, type SelenographicCoordinate } from '@/domain/coordinates/projection';
import { useScenarioCommands, useScenarioModel } from '@/app/scenario/context/scenarioContext';
import type { SpatialLayer, SpatialPreferences } from '@/features/spatial/model/spatialPreferences';
import { MapCanvas, type MapHoverPreview } from '@/features/spatial/map/components/MapCanvas';
import { MapToolbar } from '@/features/spatial/map/components/MapToolbar';
import { MapScaleBar } from '@/features/spatial/map/components/MapScaleBar';
import { MapCandidateRibbon } from '@/features/spatial/map/components/MapCandidateRibbon';
import { MapOverlayCards } from '@/features/spatial/map/components/MapOverlayCards';
import { useMapViewport } from '@/features/spatial/map/hooks/useMapViewport';
import {
  analyzeCustomPoint,
  analyzeHoveredSite,
  distanceFromSouthPoleKm,
  distanceToSite,
  type SubPoints,
} from '@/features/spatial/map/model/mapPointAnalysis';

export interface SouthPoleMapProps {
  /** Display preferences owned by the workspace, so one toolbar drives map and globe. */
  preferences: SpatialPreferences;
  onToggleLayer: (layer: SpatialLayer) => void;
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
 *
 * This component is composition: it holds hover/selection state, derives numbers
 * through the spatial analysis modules, and delegates the camera to `useMapViewport`.
 */
export function SouthPoleMap({
  preferences,
  onToggleLayer,
  hideHeader = false,
  hideRibbon = false,
}: SouthPoleMapProps) {
  const { site: selectedSite, conditions, ephemeris } = useScenarioModel();
  const { selectSite } = useScenarioCommands();

  const [hoveredSite, setHoveredSite] = useState<CandidateSite | null>(null);
  const [activeVectorPopover, setActiveVectorPopover] = useState<'sun' | 'earth' | null>(null);
  const [customInspectPoint, setCustomInspectPoint] = useState<SelenographicCoordinate | null>(null);

  const sitePos = useMemo(
    () => projectLatLon(selectedSite.coordinates.latitudeDeg, selectedSite.coordinates.longitudeDeg),
    [selectedSite],
  );
  const viewport = useMapViewport(sitePos);

  const subPoints = useMemo<SubPoints>(
    () => ({
      subSolarLatDeg: ephemeris.subSolarLatDeg,
      subSolarLonDeg: ephemeris.subSolarLonDeg,
      subEarthLatDeg: ephemeris.subEarthLatDeg,
      subEarthLonDeg: ephemeris.subEarthLonDeg,
    }),
    [ephemeris],
  );

  // Geodesic distance of selected site from the exact South Pole (90.0°S)
  const distanceFromPoleKm = useMemo(
    () => distanceFromSouthPoleKm(selectedSite.coordinates),
    [selectedSite],
  );

  // Topocentric celestial angles and projected position for hovered preview candidate (Storyboard State 2)
  const hoverPreview = useMemo<MapHoverPreview | null>(() => {
    if (!hoveredSite || hoveredSite.id === selectedSite.id) return null;
    return { site: hoveredSite, ...analyzeHoveredSite(hoveredSite, subPoints) };
  }, [hoveredSite, selectedSite, subPoints]);

  // Custom inspected point: distance, celestial angles and the nearest published candidate
  const customPointData = useMemo(
    () => (customInspectPoint ? analyzeCustomPoint(customInspectPoint, selectedSite, subPoints) : null),
    [customInspectPoint, selectedSite, subPoints],
  );

  const cursorDistanceKm = useMemo(
    () => (viewport.cursorCoord ? distanceToSite(viewport.cursorCoord, selectedSite) : null),
    [viewport.cursorCoord, selectedSite],
  );

  const handleSelectSite = useCallback((site: CandidateSite) => selectSite(site.id), [selectSite]);

  // Map surface click for custom coordinate exploration; a drag is not a click.
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      if (viewport.isDragging) return;
      const coord = viewport.coordinateFromEvent(event);
      if (coord) setCustomInspectPoint(coord);
    },
    [viewport],
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] overflow-hidden select-none min-h-0">
      {/* Scientific Map Toolbar & Layer Controls */}
      <MapToolbar
        zoom={viewport.zoom}
        onZoomIn={viewport.zoomIn}
        onZoomOut={viewport.zoomOut}
        onReset={viewport.resetViewport}
        onApplyPreset={viewport.applyPreset}
        activePreset={viewport.activePreset}
        showGrid={preferences.showGrid}
        showShadowRegions={preferences.showShadowRegions}
        showCraters={preferences.showCraters}
        showVectors={preferences.showVectors}
        onToggleGrid={() => onToggleLayer('grid')}
        onToggleShadowRegions={() => onToggleLayer('shadowRegions')}
        onToggleCraters={() => onToggleLayer('craters')}
        onToggleVectors={() => onToggleLayer('vectors')}
        hideHeader={hideHeader}
      />

      {/* Projection-Accurate Dynamic Scale Bar & Live Coordinates */}
      <MapScaleBar
        zoom={viewport.zoom}
        cursorCoord={viewport.cursorCoord}
        cursorDistanceKm={cursorDistanceKm}
        selectedSite={selectedSite}
        hideRibbon={hideRibbon}
      />

      <MapOverlayCards
        hoveredSite={hoveredSite}
        hoverPreview={hoverPreview}
        activeVectorPopover={activeVectorPopover}
        distanceFromPoleKm={distanceFromPoleKm}
        customPoint={
          customInspectPoint && customPointData
            ? { coord: customInspectPoint, analysis: customPointData }
            : null
        }
        onSelectNearest={handleSelectSite}
        onClearCustomPoint={() => setCustomInspectPoint(null)}
        onCloseVectorPopover={() => setActiveVectorPopover(null)}
      />

      <MapCanvas
        svgRef={viewport.svgRef}
        zoom={viewport.zoom}
        viewportStyle={viewport.viewportStyle}
        layers={{
          showGrid: preferences.showGrid,
          showShadowRegions: preferences.showShadowRegions,
          showCraters: preferences.showCraters,
          showVectors: preferences.showVectors,
        }}
        selectedSite={selectedSite}
        sitePos={sitePos}
        siteVectors={{
          sunAzimuthDeg: conditions.sunAzimuthDeg,
          sunElevationDeg: conditions.sunElevationDeg,
          earthAzimuthDeg: conditions.earthAzimuthDeg,
          earthElevationDeg: conditions.earthElevationDeg,
        }}
        hoveredSite={hoveredSite}
        hoverPreview={hoverPreview}
        customPoint={customPointData ? { pos: customPointData.pos, distanceKm: customPointData.distanceKm } : null}
        onSelectSite={handleSelectSite}
        onHoverSite={setHoveredSite}
        onOpenVectorPopover={setActiveVectorPopover}
        gestures={{
          onMouseDown: viewport.handleMouseDown,
          onMouseMove: viewport.handleMouseMove,
          onMouseUp: viewport.handleMouseUp,
          onMouseLeave: viewport.handleMouseLeave,
          onWheel: viewport.handleWheel,
          onClick: handleCanvasClick,
        }}
      />

      {/* Candidate Quick Selection Ribbon below Map (if not hidden) */}
      {!hideRibbon && (
        <MapCandidateRibbon selectedSite={selectedSite} onSelectSite={handleSelectSite} />
      )}
    </div>
  );
}
