import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SPATIAL_PREFERENCES,
  SpatialPreferences,
  spatialPreferencesReducer,
} from '@/features/spatial/model/spatialPreferences';

test('spatialPreferences: defaults match the opening workspace', () => {
  assert.deepEqual(DEFAULT_SPATIAL_PREFERENCES, {
    showGrid: true,
    showShadowRegions: true,
    showCraters: true,
    showVectors: true,
    cameraPreset: 'nadir',
  });
});

test('spatialPreferences: each layer toggles independently', () => {
  const gridOff = spatialPreferencesReducer(DEFAULT_SPATIAL_PREFERENCES, { type: 'layer/toggled', layer: 'grid' });
  assert.equal(gridOff.showGrid, false);
  assert.equal(gridOff.showShadowRegions, true);
  assert.equal(gridOff.showCraters, true);
  assert.equal(gridOff.showVectors, true);

  const shadowsOff = spatialPreferencesReducer(gridOff, { type: 'layer/toggled', layer: 'shadowRegions' });
  assert.equal(shadowsOff.showShadowRegions, false);
  assert.equal(shadowsOff.showGrid, false);

  const cratersOff = spatialPreferencesReducer(shadowsOff, { type: 'layer/toggled', layer: 'craters' });
  assert.equal(cratersOff.showCraters, false);

  const vectorsOff = spatialPreferencesReducer(cratersOff, { type: 'layer/toggled', layer: 'vectors' });
  assert.equal(vectorsOff.showVectors, false);

  // Toggling twice returns to the original state and never mutates it.
  const backOn = spatialPreferencesReducer(vectorsOff, { type: 'layer/toggled', layer: 'vectors' });
  assert.equal(backOn.showVectors, true);
  assert.equal(vectorsOff.showVectors, false);
});

test('spatialPreferences: camera preset selection replaces the previous preset', () => {
  const oblique = spatialPreferencesReducer(DEFAULT_SPATIAL_PREFERENCES, {
    type: 'cameraPreset/selected',
    preset: 'oblique',
  });
  assert.equal(oblique.cameraPreset, 'oblique');

  const site = spatialPreferencesReducer(oblique, { type: 'cameraPreset/selected', preset: 'site' });
  assert.equal(site.cameraPreset, 'site');
  assert.equal(oblique.cameraPreset, 'oblique');

  // Re-selecting the active preset keeps state identity so consumers do not re-render.
  assert.equal(spatialPreferencesReducer(site, { type: 'cameraPreset/selected', preset: 'site' }), site);
});

test('spatialPreferences: unknown action leaves preferences unchanged', () => {
  const state: SpatialPreferences = DEFAULT_SPATIAL_PREFERENCES;
  // Cast stands in for an action produced elsewhere; the reducer must not guess.
  const unchanged = spatialPreferencesReducer(state, { type: 'unknown/nothing' } as never);
  assert.equal(unchanged, state);
});
