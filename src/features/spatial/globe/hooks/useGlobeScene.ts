import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';
import {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
} from '@/domain/coordinates/frames';
import { GlobeStatus } from '@/features/spatial/globe/scene/globeStatus';
import {
  GlobeSceneHandle,
  GlobeDiagnosticsMetrics,
  buildGlobeScene,
} from '@/features/spatial/globe/scene/globeSceneBuilder';
import { useGlobeSceneSync } from '@/features/spatial/globe/hooks/useGlobeSceneSync';

/** Color mosaic and DEM relief both settle before the loading overlay lifts. */
const SURFACE_TEXTURE_COUNT = 2;

export interface UseGlobeSceneInput {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  subSolarLatDeg: SelenographicLatitudeDeg;
  subSolarLonDeg: SelenographicLongitudeDeg;
  subEarthLatDeg: SelenographicLatitudeDeg;
  subEarthLonDeg: SelenographicLongitudeDeg;
  /** Topocentric elevation unwrapped from its availability wrapper; null is unknown. */
  earthElevationDeg: number | null;
  showGrid: boolean;
  showShadowRegions: boolean;
  showVectors: boolean;
  cameraPreset: CameraPreset;
  onCameraPresetChange: (preset: CameraPreset) => void;
}

export interface UseGlobeSceneResult {
  containerRef: RefObject<HTMLDivElement | null>;
  status: GlobeStatus;
  hoveredSite: CandidateSite | null;
  applyCameraPreset: (preset: CameraPreset, site: CandidateSite) => void;
  getDiagnostics: () => GlobeDiagnosticsMetrics | null;
}

/**
 * Owns the WebGL globe's lifetime: it builds the scene once against the mount
 * container, exposes the loading and hover state the layout renders, and
 * disposes GPU resources on unmount. No markup here.
 *
 * The scene outlives every render, so the values its event handlers need are
 * read through refs rather than captured when it was built.
 */
export function useGlobeScene(input: UseGlobeSceneInput): UseGlobeSceneResult {
  const {
    selectedSite,
    onSelectSite,
    subSolarLatDeg,
    subSolarLonDeg,
    subEarthLatDeg,
    subEarthLonDeg,
    earthElevationDeg,
    showGrid,
    showShadowRegions,
    showVectors,
    cameraPreset,
    onCameraPresetChange,
  } = input;

  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<GlobeSceneHandle | null>(null);
  const selectedSiteIdRef = useRef(selectedSite.id);
  const pickSiteRef = useRef<(site: CandidateSite) => void>(() => {});
  const handledPresetRef = useRef<CameraPreset>(cameraPreset);

  const [status, setStatus] = useState<GlobeStatus>({ kind: 'loading' });
  const [hoveredSite, setHoveredSite] = useState<CandidateSite | null>(null);

  const moveCameraToPreset = useCallback((preset: CameraPreset, site: CandidateSite) => {
    handleRef.current?.transitioner.moveTo(preset, site);
  }, []);

  /**
   * The workspace owns the selected preset, so a click here records the choice
   * and then moves the camera. Presets chosen elsewhere arrive through the
   * `cameraPreset` value and are handled by the effect below.
   */
  const applyCameraPreset = useCallback(
    (preset: CameraPreset, site: CandidateSite) => {
      handledPresetRef.current = preset;
      onCameraPresetChange(preset);
      moveCameraToPreset(preset, site);
    },
    [onCameraPresetChange, moveCameraToPreset],
  );

  // Mount-only by design: rebuilding WebGL on a parent re-render is the cost this hook exists to avoid.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let settledTextures = 0;
    const handle = buildGlobeScene({
      container,
      initialSelectedSiteId: selectedSiteIdRef.current,
      onSurfaceSettled: () => {
        settledTextures += 1;
        if (settledTextures >= SURFACE_TEXTURE_COUNT) setStatus({ kind: 'ready' });
      },
      onSurfaceUnavailable: (message) => setStatus({ kind: 'textureError', message }),
      onHoverChange: setHoveredSite,
      isSiteSelected: (siteId) => siteId === selectedSiteIdRef.current,
      onPick: (site) => pickSiteRef.current(site),
    });
    if (!handle) {
      setStatus({ kind: 'unsupported' });
      return;
    }

    handleRef.current = handle;
    return () => {
      handleRef.current = null;
      handle.dispose();
    };
  }, []);

  useEffect(() => {
    pickSiteRef.current = (site) => {
      onSelectSite(site);
      if (cameraPreset === 'site' || cameraPreset === 'inspection') {
        applyCameraPreset(cameraPreset, site);
      }
    };
  }, [onSelectSite, cameraPreset, applyCameraPreset]);

  useEffect(() => {
    if (handledPresetRef.current === cameraPreset) return;
    handledPresetRef.current = cameraPreset;
    moveCameraToPreset(cameraPreset, selectedSite);
  }, [cameraPreset, moveCameraToPreset, selectedSite]);

  useGlobeSceneSync({
    handleRef,
    selectedSiteIdRef,
    selectedSite,
    subSolarLatDeg,
    subSolarLonDeg,
    subEarthLatDeg,
    subEarthLonDeg,
    earthElevationDeg,
    showVectors,
    showGrid,
    showShadowRegions,
    cameraPreset,
    applyCameraPreset,
  });

  const getDiagnostics = useCallback(() => {
    return handleRef.current?.getDiagnostics?.() ?? null;
  }, []);

  return { containerRef, status, hoveredSite, applyCameraPreset, getDiagnostics };
}
