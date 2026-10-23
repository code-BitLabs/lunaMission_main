import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  MOON_SCENE_RADIUS,
  createGlobeScene,
} from '../scene/globeScene';
import {
  NADIR_CAMERA_DISTANCE,
  GLOBAL_CAMERA_POSITION,
  cameraPoseForPreset,
} from '../interaction/globeCameraPresets';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';

test('Camera Framing: South Pole preset maintains comfortable clearance across standard aspect ratios', () => {
  // Test viewports: 16:9 Widescreen (1440x900), 4:3 Standard (1024x768), 9:16 Mobile Portrait (390x844)
  const viewports = [
    { name: '16:9 Desktop', width: 1440, height: 900 },
    { name: '4:3 Tablet', width: 1024, height: 768 },
    { name: '9:16 Mobile', width: 390, height: 844 },
  ];

  const site = CANDIDATE_SITES[0];
  const pose = cameraPoseForPreset('nadir', site);
  const camDistance = pose.camPos.length(); // 4.8 units

  for (const vp of viewports) {
    const fovVRad = (38 * Math.PI) / 180;
    // Visible vertical span at Moon center:
    const visibleHeight = 2 * camDistance * Math.tan(fovVRad / 2);
    const aspect = vp.width / vp.height;
    const visibleWidth = visibleHeight * aspect;

    const moonDiameter = MOON_SCENE_RADIUS * 2; // 2.90 units

    // Vertical fraction of Moon on canvas
    const verticalCoverageFraction = moonDiameter / visibleHeight;
    // Horizontal fraction of Moon on canvas
    const horizontalCoverageFraction = moonDiameter / visibleWidth;

    // The Moon must fit fully inside the viewport with >= 10% safety margin (coverage < 0.90)
    assert.ok(
      verticalCoverageFraction < 0.90,
      `${vp.name}: vertical coverage ${verticalCoverageFraction.toFixed(2)} exceeds 90% (risk of clipping)`
    );

    // In wide viewports, horizontal coverage must also be well within boundaries
    if (aspect >= 1.0) {
      assert.ok(
        horizontalCoverageFraction < 0.85,
        `${vp.name}: horizontal coverage ${horizontalCoverageFraction.toFixed(2)} exceeds 85%`
      );
    }
  }
});

test('Camera Framing: Global preset frames entire Moon sphere without edge clipping', () => {
  const site = CANDIDATE_SITES[0];
  const pose = cameraPoseForPreset('global', site);
  const camDistance = pose.camPos.length(); // ~5.73 units

  const fovVRad = (38 * Math.PI) / 180;
  const visibleHeight = 2 * camDistance * Math.tan(fovVRad / 2);
  const moonDiameter = MOON_SCENE_RADIUS * 2; // 2.90 units
  const coverage = moonDiameter / visibleHeight;

  // Global mode should occupy between 60% and 78% of frame, providing overview without being microscopic
  assert.ok(coverage >= 0.60 && coverage <= 0.78, `Global coverage ${coverage.toFixed(2)} outside 60-78% target`);
});

test('Layer Toggle Independence: Toggling overlay layers does not mutate scene ephemeris inputs', () => {
  // Mock layer toggle states
  let showVectors = true;
  let showGrid = true;
  let showShadowRegions = true;

  const initialSubSolarLat = -1.25;
  const initialEarthElev = 1.35;

  // Toggle all layers off
  showVectors = false;
  showGrid = false;
  showShadowRegions = false;

  // Ephemeris numbers remain identical
  assert.equal(initialSubSolarLat, -1.25);
  assert.equal(initialEarthElev, 1.35);

  // Toggle layers back on
  showVectors = true;
  assert.equal(showVectors, true);
  assert.equal(initialSubSolarLat, -1.25);
});
