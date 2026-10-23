import { useCallback } from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { SouthPoleMap } from '@/features/spatial/ui/SouthPoleMap';
import { LunarGlobe3D } from '@/features/spatial/ui/LunarGlobe3D';
import { VisualizationErrorBoundary } from '@/features/spatial/components/panels/VisualizationErrorBoundary';
import { ViewportPanel } from '@/features/spatial/components/panels/ViewportPanel';
import { CameraPreset, SpatialLayer, SpatialPreferences } from '@/features/spatial/model/spatialPreferences';
import { SpatialViewMode } from '@/features/spatial/model/spatialViewMode';
import { useScenarioCommands, useScenarioModel } from '@/app/scenario/context/scenarioContext';

export interface SpatialViewportProps {
  viewMode: SpatialViewMode;
  preferences: SpatialPreferences;
  onToggleLayer: (layer: SpatialLayer) => void;
  onCameraPresetChange: (preset: CameraPreset) => void;
  onGlobeFallbackTo2D: () => void;
}

/**
 * The spatial panels. Each visualization is declared exactly once and placed
 * differently per view mode; the 2D-only, 3D-only and dual layouts share the
 * same elements, scenario values and preference handlers.
 */
export function SpatialViewport({
  viewMode,
  preferences,
  onToggleLayer,
  onCameraPresetChange,
  onGlobeFallbackTo2D,
}: SpatialViewportProps) {
  const { selectSite } = useScenarioCommands();
  const { site: selectedSite, conditions, ephemeris } = useScenarioModel();

  const handleSelectSite = useCallback((site: CandidateSite) => selectSite(site.id), [selectSite]);

  const map = (
    <SouthPoleMap
      preferences={preferences}
      onToggleLayer={onToggleLayer}
      hideHeader={viewMode !== 'map2d'}
      hideRibbon
    />
  );

  const globe = (
    <VisualizationErrorBoundary
      fallbackTitle="3D Lunar Globe Encountered an Error"
      onFallbackTo2D={onGlobeFallbackTo2D}
    >
      <LunarGlobe3D
        selectedSite={selectedSite}
        onSelectSite={handleSelectSite}
        subSolarLatDeg={ephemeris.subSolarLatDeg}
        subSolarLonDeg={ephemeris.subSolarLonDeg}
        subEarthLatDeg={ephemeris.subEarthLatDeg}
        subEarthLonDeg={ephemeris.subEarthLonDeg}
        earthElevationDeg={conditions.earthElevationDeg}
        showGrid={preferences.showGrid}
        showShadowRegions={preferences.showShadowRegions}
        showVectors={preferences.showVectors}
        onToggleGrid={() => onToggleLayer('grid')}
        onToggleShadowRegions={() => onToggleLayer('shadowRegions')}
        onToggleVectors={() => onToggleLayer('vectors')}
        cameraPreset={preferences.cameraPreset}
        onCameraPresetChange={onCameraPresetChange}
        hideHeader
        hideRibbon
      />
    </VisualizationErrorBoundary>
  );

  if (viewMode === 'map2d') {
    return <div className="w-full h-full min-h-0 flex-1">{map}</div>;
  }

  if (viewMode === 'globe3d') {
    return <div className="w-full h-full min-h-0 flex-1">{globe}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full h-full min-h-0 flex-1 p-2 overflow-y-auto md:overflow-hidden bg-[var(--lm-color-canvas)]">
      <ViewportPanel
        title="2D Polar Map"
        subtitle="83°S–90°S Stereographic"
        subtitleClassName="text-[var(--lm-color-text-muted)]"
      >
        {map}
      </ViewportPanel>

      <ViewportPanel
        title="3D Moon Globe"
        subtitle="NASA LROC / LOLA DEM"
        subtitleClassName="text-[var(--lm-color-selected-site)]"
      >
        {globe}
      </ViewportPanel>
    </div>
  );
}
