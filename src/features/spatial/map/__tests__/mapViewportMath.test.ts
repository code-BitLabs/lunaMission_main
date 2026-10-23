import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANDIDATES_PAN_Y_PX,
  CANDIDATES_ZOOM,
  REGIONAL_ZOOM,
  SITE_ZOOM,
  WHEEL_ZOOM_IN_FACTOR,
  WHEEL_ZOOM_OUT_FACTOR,
  ZOOM_MAX,
  ZOOM_MIN,
  clampZoom,
  coordinateFromPointer,
  dragOrigin,
  draggedPan,
  presetViewport,
  steppedZoom,
  wheelZoom,
} from '@/features/spatial/map/model/mapViewportMath';
import { DEFAULT_PROJECTION_CONFIG } from '@/domain/coordinates/projection';

const CENTER = DEFAULT_PROJECTION_CONFIG.center;

test('zoom stays inside the documented range', () => {
  assert.equal(clampZoom(0.2), ZOOM_MIN);
  assert.equal(clampZoom(9), ZOOM_MAX);
  assert.equal(clampZoom(1.7), 1.7);
});

test('toolbar steps move by one step and stop at the limits', () => {
  assert.equal(steppedZoom(1.0, 1), 1.35);
  assert.equal(steppedZoom(1.0, -1), ZOOM_MIN, 'the step below the floor lands on the floor');
  assert.equal(steppedZoom(ZOOM_MAX, 1), ZOOM_MAX);
  assert.equal(steppedZoom(ZOOM_MIN, -1), ZOOM_MIN);
});

test('wheel zoom multiplies and keeps the two-decimal readout exact', () => {
  assert.equal(wheelZoom(1.0, -100), WHEEL_ZOOM_IN_FACTOR);
  assert.equal(wheelZoom(1.0, 100), WHEEL_ZOOM_OUT_FACTOR);
  assert.equal(wheelZoom(4.4, -100), ZOOM_MAX, 'magnifying past the ceiling lands on it');
  assert.equal(wheelZoom(0.9, 100), ZOOM_MIN);
});

test('camera presets describe a full camera, not just a zoom', () => {
  const sitePos = { x: CENTER + 40, y: CENTER + 30 };

  assert.deepEqual(presetViewport('regional', sitePos, CENTER), { zoom: REGIONAL_ZOOM, pan: { x: 0, y: 0 } });
  assert.deepEqual(presetViewport('candidates', sitePos, CENTER), {
    zoom: CANDIDATES_ZOOM,
    pan: { x: 0, y: CANDIDATES_PAN_Y_PX },
  });
  assert.deepEqual(presetViewport('site', sitePos, CENTER), {
    zoom: SITE_ZOOM,
    pan: { x: (CENTER - sitePos.x) * SITE_ZOOM, y: (CENTER - sitePos.y) * SITE_ZOOM },
  });
});

test('the site preset pans the selected site onto the map centre', () => {
  const sitePos = { x: 340, y: 260 };
  const { pan, zoom } = presetViewport('site', sitePos, CENTER);

  // The CSS transform is translate(pan) then scale(zoom) about the centre, so the
  // site lands on `center` when the pan is the site-to-centre offset at that zoom.
  const landedX = (sitePos.x - CENTER) * zoom + pan.x + CENTER;
  const landedY = (sitePos.y - CENTER) * zoom + pan.y + CENTER;

  assert.ok(Math.abs(landedX - CENTER) < 1e-9, `x landed at ${landedX}`);
  assert.ok(Math.abs(landedY - CENTER) < 1e-9, `y landed at ${landedY}`);
});

test('pointer inversion returns the centre to the pole and undoes pan and zoom', () => {
  const svgSize = DEFAULT_PROJECTION_CONFIG.svgSize;
  const rect = { left: 100, top: 50, width: svgSize, height: svgSize };
  const identity = { zoom: 1, pan: { x: 0, y: 0 } };

  const pole = coordinateFromPointer({
    clientX: rect.left + CENTER,
    clientY: rect.top + CENTER,
    rect,
    svgSize,
    center: CENTER,
    viewport: identity,
  });
  assert.ok(pole);
  assert.equal(Math.round(pole!.latitudeDeg), -90);

  // A magnified, panned frame must map back to the same selenographic point.
  const viewport = { zoom: 2, pan: { x: -20, y: 15 } };
  const untransformed = { x: CENTER + 25, y: CENTER - 18 };
  const screen = {
    clientX: rect.left + CENTER + (untransformed.x - CENTER) * viewport.zoom + viewport.pan.x,
    clientY: rect.top + CENTER + (untransformed.y - CENTER) * viewport.zoom + viewport.pan.y,
  };
  const zoomed = coordinateFromPointer({ ...screen, rect, svgSize, center: CENTER, viewport });
  const flat = coordinateFromPointer({
    clientX: rect.left + untransformed.x,
    clientY: rect.top + untransformed.y,
    rect,
    svgSize,
    center: CENTER,
    viewport: identity,
  });

  assert.ok(zoomed && flat);
  assert.equal(zoomed!.latitudeDeg, flat!.latitudeDeg);
  assert.equal(zoomed!.longitudeDeg, flat!.longitudeDeg);
});

test('pointer inversion refuses positions outside the mapped disc', () => {
  const svgSize = DEFAULT_PROJECTION_CONFIG.svgSize;
  assert.equal(
    coordinateFromPointer({
      clientX: 0,
      clientY: 0,
      rect: { left: 0, top: 0, width: svgSize, height: svgSize },
      svgSize,
      center: CENTER,
      viewport: { zoom: 1, pan: { x: 0, y: 0 } },
    }),
    null,
  );
});

test('a drag keeps the map under the cursor from mousedown to mousemove', () => {
  const viewport = { zoom: 1.5, pan: { x: 12, y: -7 } };
  const origin = dragOrigin(viewport, 300, 210);

  assert.deepEqual(origin, { x: 300 - viewport.pan.x, y: 210 - viewport.pan.y });
  assert.deepEqual(draggedPan(origin, 300, 210), viewport.pan, 'no jump when the drag starts');
  assert.deepEqual(draggedPan(origin, 315, 200), { x: 27, y: -17 });
});
