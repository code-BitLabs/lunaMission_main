import React from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { ResultAvailability } from '@/domain/celestial/availability';
import { availableValue } from '@/shared/formatting/availability';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';
import {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
  TopocentricElevationDeg,
} from '@/domain/coordinates/frames';
import {
  GlobeLoadingOverlay,
  GlobeTextureErrorBanner,
  GlobeUnavailablePanel,
} from '@/features/spatial/globe/components/GlobeStatusOverlay';
import { GlobeControlsOverlay } from '@/features/spatial/globe/components/GlobeControlsOverlay';
import { GlobeHoverCard } from '@/features/spatial/globe/components/GlobeHoverCard';
import { GlobeLegend } from '@/features/spatial/globe/components/GlobeLegend';
import { GlobeCandidateRibbon } from '@/features/spatial/globe/components/GlobeCandidateRibbon';
import { useGlobeScene } from '@/features/spatial/globe/hooks/useGlobeScene';

export interface LunarGlobe3DProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  /** Selenographic body-fixed frame (global ephemeris), used to place Sun/Earth in space. */
  subSolarLatDeg: SelenographicLatitudeDeg;
  subSolarLonDeg: SelenographicLongitudeDeg;
  subEarthLatDeg: SelenographicLatitudeDeg;
  subEarthLonDeg: SelenographicLongitudeDeg;
  /** Topocentric horizon frame at selectedSite; drives the DTE link styling. */
  earthElevationDeg?: ResultAvailability<TopocentricElevationDeg>;
  /** Display preferences owned by the workspace, so one toolbar drives map and globe. */
  showGrid: boolean;
  showShadowRegions: boolean;
  showVectors: boolean;
  onToggleGrid: () => void;
  onToggleShadowRegions: () => void;
  onToggleVectors: () => void;
  /** The globe is embedded in the workspace, which supplies its own toolbar and ribbon. */
  hideHeader?: boolean;
  hideRibbon?: boolean;
  /** Owned by the workspace so the toolbar and the globe's own buttons agree. */
  cameraPreset: CameraPreset;
  onCameraPresetChange: (preset: CameraPreset) => void;
}

/**
 * The 3D lunar globe: layout and status surfaces only. Scene construction,
 * epoch binding and disposal live in `useGlobeScene`, and each scene concern
 * lives in its own module under `globe/`.
 */
export function LunarGlobe3D(props: LunarGlobe3DProps) {
  const {
    selectedSite,
    subSolarLatDeg,
    subSolarLonDeg,
    subEarthLatDeg,
    subEarthLonDeg,
    earthElevationDeg,
    showGrid,
    showShadowRegions,
    showVectors,
    onToggleGrid,
    onToggleShadowRegions,
    onToggleVectors,
    hideHeader = false,
    hideRibbon = false,
    cameraPreset,
    onCameraPresetChange,
    onSelectSite,
  } = props;

  // Unknown elevation must never be presented as "0°" or as a clear line of sight.
  const earthElevationValue = earthElevationDeg === undefined ? null : availableValue(earthElevationDeg);
  const earthElevationDisplay =
    earthElevationValue === null
      ? '—'
      : `${earthElevationValue >= 0 ? '+' : ''}${earthElevationValue.toFixed(1)}° elev`;

  const { containerRef, status, hoveredSite, applyCameraPreset } = useGlobeScene({
    selectedSite,
    onSelectSite,
    subSolarLatDeg,
    subSolarLonDeg,
    subEarthLatDeg,
    subEarthLonDeg,
    earthElevationDeg: earthElevationValue,
    showGrid,
    showShadowRegions,
    showVectors,
    cameraPreset,
    onCameraPresetChange,
  });

  if (status.kind === 'unsupported') return <GlobeUnavailablePanel />;

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] overflow-hidden select-none min-h-0">
      {!hideHeader && (
        <GlobeControlsOverlay
          cameraPreset={cameraPreset}
          onSelectPreset={(preset) => applyCameraPreset(preset, selectedSite)}
          showGrid={showGrid}
          showShadowRegions={showShadowRegions}
          showVectors={showVectors}
          onToggleGrid={onToggleGrid}
          onToggleShadowRegions={onToggleShadowRegions}
          onToggleVectors={onToggleVectors}
        />
      )}

      {status.kind === 'loading' && <GlobeLoadingOverlay />}
      {status.kind === 'textureError' && <GlobeTextureErrorBanner message={status.message} />}

      {/* WebGL mount point: the renderer appends and removes its own canvas here. */}
      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing min-h-0" />

      {hoveredSite && <GlobeHoverCard site={hoveredSite} />}

      <GlobeLegend earthElevationDisplay={earthElevationDisplay} isCompact={hideRibbon} />

      {!hideRibbon && (
        <GlobeCandidateRibbon
          selectedSiteId={selectedSite.id}
          onSelectSite={(site) => {
            onSelectSite(site);
            applyCameraPreset('site', site);
          }}
        />
      )}
    </div>
  );
}
