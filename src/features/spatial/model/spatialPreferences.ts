/**
 * Spatial workspace display preferences: how the map and globe are drawn, as
 * opposed to what site and instant they are drawing.
 *
 * These values are shared because one toolbar controls both visualizations at
 * once, so exactly one owner holds them. The 2D map's permanently shadowed
 * region overlay and the 3D globe's polar footprint are the same concept seen
 * in two projections, so they share the `shadowRegions` layer instead of
 * carrying two names.
 */

export type CameraPreset = 'nadir' | 'oblique' | 'site' | 'inspection' | 'global';

export type SpatialLayer = 'grid' | 'shadowRegions' | 'craters' | 'vectors';

export interface SpatialPreferences {
  showGrid: boolean;
  showShadowRegions: boolean;
  showCraters: boolean;
  showVectors: boolean;
  cameraPreset: CameraPreset;
}

export type SpatialPreferenceAction =
  | { type: 'layer/toggled'; layer: SpatialLayer }
  | { type: 'cameraPreset/selected'; preset: CameraPreset };

/** Opening state: geography and vectors on, nadir camera aligned with the 2D map. */
export const DEFAULT_SPATIAL_PREFERENCES: SpatialPreferences = {
  showGrid: true,
  showShadowRegions: true,
  showCraters: true,
  showVectors: true,
  cameraPreset: 'nadir',
};

/** The preferences field that backs each layer. */
export type SpatialLayerKey = 'showGrid' | 'showShadowRegions' | 'showCraters' | 'showVectors';

/** Layer name → its field, so a toggle touches exactly one concept. */
export const LAYER_PREFERENCE_KEYS: Record<SpatialLayer, SpatialLayerKey> = {
  grid: 'showGrid',
  shadowRegions: 'showShadowRegions',
  craters: 'showCraters',
  vectors: 'showVectors',
};

export function isLayerVisible(preferences: SpatialPreferences, layer: SpatialLayer): boolean {
  return preferences[LAYER_PREFERENCE_KEYS[layer]];
}

export function spatialPreferencesReducer(
  state: SpatialPreferences,
  action: SpatialPreferenceAction
): SpatialPreferences {
  switch (action.type) {
    case 'layer/toggled': {
      const key = LAYER_PREFERENCE_KEYS[action.layer];
      return { ...state, [key]: !state[key] };
    }
    case 'cameraPreset/selected':
      return state.cameraPreset === action.preset ? state : { ...state, cameraPreset: action.preset };
    default:
      return state;
  }
}
