import { useCallback, useMemo, useReducer } from 'react';
import {
  CameraPreset,
  DEFAULT_SPATIAL_PREFERENCES,
  SpatialLayer,
  SpatialPreferences,
  spatialPreferencesReducer,
} from '@/features/spatial/model/spatialPreferences';

export interface SpatialPreferenceControls {
  preferences: SpatialPreferences;
  toggleLayer: (layer: SpatialLayer) => void;
  selectCameraPreset: (preset: CameraPreset) => void;
}

/**
 * Single owner of the workspace display preferences. Both the toolbar and the
 * per-view overlays read and write through this one instance, so toggling a
 * layer in dual view changes both panels at once.
 */
export function useSpatialPreferences(): SpatialPreferenceControls {
  const [preferences, dispatch] = useReducer(spatialPreferencesReducer, DEFAULT_SPATIAL_PREFERENCES);

  const toggleLayer = useCallback(
    (layer: SpatialLayer) => dispatch({ type: 'layer/toggled', layer }),
    [dispatch],
  );
  const selectCameraPreset = useCallback(
    (preset: CameraPreset) => dispatch({ type: 'cameraPreset/selected', preset }),
    [dispatch],
  );

  return useMemo(
    () => ({ preferences, toggleLayer, selectCameraPreset }),
    [preferences, toggleLayer, selectCameraPreset],
  );
}
