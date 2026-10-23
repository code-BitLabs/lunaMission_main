import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BADGE_EDGE_MARGIN_X_PX,
  BADGE_EDGE_MARGIN_Y_PX,
  BADGE_MIN_WIDTH_PX,
  CODE_PILL_ZOOM,
  LEADER_LENGTH_PX,
  TAG_OFFSET_HOVERED_PX,
  TAG_OFFSET_PX,
  UPWARD_SCREEN_ANGLE_RAD,
  badgeText,
  badgeWidthFor,
  clampBadgeAnchor,
  offsetAlongAngle,
  radialAngleFromPole,
  selectedPinAriaLabel,
  shouldShowCodePill,
  unselectedPinAriaLabel,
} from '@/features/spatial/map/model/candidatePinGeometry';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { DEFAULT_PROJECTION_CONFIG, projectLatLon } from '@/domain/coordinates/projection';

const CENTER = DEFAULT_PROJECTION_CONFIG.center;

test('a tag radiates outward from the pole along the site bearing', () => {
  assert.equal(radialAngleFromPole({ x: CENTER + 10, y: CENTER }), 0);
  assert.equal(radialAngleFromPole({ x: CENTER, y: CENTER + 10 }), Math.PI / 2);
  assert.equal(radialAngleFromPole({ x: CENTER, y: CENTER - 10 }), -Math.PI / 2);
});

test('a site plotted on the pole itself points its tag straight up', () => {
  assert.equal(radialAngleFromPole({ x: CENTER, y: CENTER }), UPWARD_SCREEN_ANGLE_RAD);
  // Within the proximity threshold the bearing is noise, so the fallback still applies.
  assert.equal(radialAngleFromPole({ x: CENTER + 0.5, y: CENTER + 0.5 }), UPWARD_SCREEN_ANGLE_RAD);
});

test('offsetting along an angle moves by exactly the requested distance', () => {
  const origin = { x: 100, y: 100 };

  assert.deepEqual(offsetAlongAngle(origin, 0, TAG_OFFSET_PX), { x: 100 + TAG_OFFSET_PX, y: 100 });
  assert.deepEqual(offsetAlongAngle(origin, 0, TAG_OFFSET_HOVERED_PX), {
    x: 100 + TAG_OFFSET_HOVERED_PX,
    y: 100,
  });
  assert.deepEqual(offsetAlongAngle(origin, Math.PI / 2, LEADER_LENGTH_PX), { x: 100, y: 124 });
});

test('badge anchors are clamped inside the drawable area', () => {
  const { svgSize } = DEFAULT_PROJECTION_CONFIG;

  assert.deepEqual(clampBadgeAnchor({ x: -500, y: -500 }), {
    x: BADGE_EDGE_MARGIN_X_PX,
    y: BADGE_EDGE_MARGIN_Y_PX,
  });
  assert.deepEqual(clampBadgeAnchor({ x: svgSize + 500, y: svgSize + 500 }), {
    x: svgSize - BADGE_EDGE_MARGIN_X_PX,
    y: svgSize - BADGE_EDGE_MARGIN_Y_PX,
  });
  assert.deepEqual(clampBadgeAnchor({ x: 200, y: 220 }), { x: 200, y: 220 });
});

test('badge wording shortens the two long landform suffixes', () => {
  const rimmed = CANDIDATE_SITES.find((site) => site.name.includes(' Crater Rim'));
  const mountain = CANDIDATE_SITES.find((site) => site.name.includes(' Mountain'));
  assert.ok(rimmed && mountain, 'the catalog is expected to hold both landform styles');

  assert.equal(badgeText(rimmed!), `${rimmed!.code} • ${rimmed!.name.replace(' Crater Rim', '')}`);
  assert.equal(badgeText(mountain!), `${mountain!.code} • ${mountain!.name.replace(' Mountain', '')}`);

  const untouched = CANDIDATE_SITES.find(
    (site) => !site.name.includes(' Crater Rim') && !site.name.includes(' Mountain')
  );
  if (untouched) assert.equal(badgeText(untouched), `${untouched.code} • ${untouched.name}`);
});

test('badge width grows with the label but never shrinks below the minimum', () => {
  assert.equal(badgeWidthFor('SLR'), BADGE_MIN_WIDTH_PX);
  assert.equal(badgeWidthFor('X'.repeat(40)), 40 * 6.8);
});

test('the code pill appears when zoomed in or hovered', () => {
  assert.equal(shouldShowCodePill(CODE_PILL_ZOOM, false), true);
  assert.equal(shouldShowCodePill(1.0, true), true);
  assert.equal(shouldShowCodePill(1.0, false), false);
});

test('pin labels announce the site, its code and, for an unselected pin, its position', () => {
  for (const site of CANDIDATE_SITES) {
    assert.equal(
      unselectedPinAriaLabel(site),
      `Select candidate ${site.name} (${site.code}) at ${Math.abs(site.coordinates.latitudeDeg).toFixed(
        2
      )}°S, ${site.coordinates.longitudeDeg.toFixed(1)}°E`
    );
    assert.equal(selectedPinAriaLabel(site), `Selected candidate ${site.name} (${site.code})`);
  }
});

test('every catalog site projects inside the map disc', () => {
  for (const site of CANDIDATE_SITES) {
    const pos = projectLatLon(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg);
    assert.ok(Math.hypot(pos.x - CENTER, pos.y - CENTER) <= DEFAULT_PROJECTION_CONFIG.maxRadius);
  }
});
