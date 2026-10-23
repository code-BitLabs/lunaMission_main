import {
  CameraPreset,
  SpatialLayer,
  SpatialPreferences,
} from '@/features/spatial/model/spatialPreferences';
import { SpatialViewMode } from '@/features/spatial/model/spatialViewMode';
import { ViewModeSelector } from '@/features/spatial/components/toolbar/ViewModeSelector';
import { CameraPresetSelector } from '@/features/spatial/components/toolbar/CameraPresetSelector';
import { LayerToggleGroup } from '@/features/spatial/components/toolbar/LayerToggleGroup';
import { FullscreenToggle } from '@/features/spatial/components/toolbar/FullscreenToggle';

export interface SpatialToolbarProps {
  viewMode: SpatialViewMode;
  onViewModeChange: (mode: SpatialViewMode) => void;
  preferences: SpatialPreferences;
  onToggleLayer: (layer: SpatialLayer) => void;
  onCameraPresetChange: (preset: CameraPreset) => void;
  isFullscreenActive: boolean;
  onToggleFullscreen: () => void;
}

/**
 * Workspace toolbar. One set of controls drives both visualizations at once,
 * so the shared preference owner passes state down and receives intents back.
 */
export function SpatialToolbar({
  viewMode,
  onViewModeChange,
  preferences,
  onToggleLayer,
  onCameraPresetChange,
  isFullscreenActive,
  onToggleFullscreen,
}: SpatialToolbarProps) {
  const cameraPresetsApply = viewMode === 'globe3d' || viewMode === 'dual';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ViewModeSelector viewMode={viewMode} onViewModeChange={onViewModeChange} />

      {cameraPresetsApply && (
        <CameraPresetSelector preferences={preferences} onCameraPresetChange={onCameraPresetChange} />
      )}

      <LayerToggleGroup preferences={preferences} onToggleLayer={onToggleLayer} />

      <FullscreenToggle isFullscreenActive={isFullscreenActive} onToggleFullscreen={onToggleFullscreen} />
    </div>
  );
}
