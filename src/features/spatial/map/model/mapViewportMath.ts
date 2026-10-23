/**
 * Pure viewport maths for the 2D polar map: pointer-to-selenographic inversion,
 * zoom clamping and the fixed camera presets. Kept out of the component so the
 * interaction model is testable without a DOM.
 */

import type { ProjectedPoint, SelenographicCoordinate } from '@/domain/coordinates/projection';
import { unprojectCoordinates } from '@/domain/coordinates/projection';
import type { MapZoomPreset } from '@/features/spatial/map/components/MapToolbar';

export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 4.5;
/** Toolbar step, in zoom units per click. */
export const ZOOM_STEP = 0.35;
/** Wheel multipliers: scroll up magnifies, scroll down shrinks. */
export const WHEEL_ZOOM_IN_FACTOR = 1.14;
export const WHEEL_ZOOM_OUT_FACTOR = 0.88;

/** Regional view is the unmapped 1:1 frame; the other two are explicit cameras. */
export const REGIONAL_ZOOM = 1.0;
export const CANDIDATES_ZOOM = 1.85;
export const SITE_ZOOM = 2.8;
/** Candidate-cluster pan for CANDIDATES_ZOOM, in screen pixels. */
export const CANDIDATES_PAN_Y_PX = 35;

/** Zoom after a clamp, so an out-of-range request becomes the nearest limit. */
export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/** Toolbar step: a plain additive change. */
export function steppedZoom(zoom: number, direction: 1 | -1): number {
  return clampZoom(zoom + direction * ZOOM_STEP);
}

/** Wheel zoom, rounded to 2 dp because the readout reports the value verbatim. */
export function wheelZoom(zoom: number, deltaY: number): number {
  const factor = deltaY < 0 ? WHEEL_ZOOM_IN_FACTOR : WHEEL_ZOOM_OUT_FACTOR;
  return clampZoom(Number((zoom * factor).toFixed(2)));
}

export interface MapViewport {
  zoom: number;
  pan: { x: number; y: number };
}

/** Camera for a named preset, centred on `sitePos` for the site-level view. */
export function presetViewport(preset: MapZoomPreset, sitePos: ProjectedPoint, center: number): MapViewport {
  switch (preset) {
    case 'candidates':
      return { zoom: CANDIDATES_ZOOM, pan: { x: 0, y: CANDIDATES_PAN_Y_PX } };
    case 'site':
      return {
        zoom: SITE_ZOOM,
        pan: { x: (center - sitePos.x) * SITE_ZOOM, y: (center - sitePos.y) * SITE_ZOOM },
      };
    case 'regional':
      return { zoom: REGIONAL_ZOOM, pan: { x: 0, y: 0 } };
  }
}

export interface PointerMapping {
  /** Client coordinates of the pointer, as reported by the DOM event. */
  clientX: number;
  clientY: number;
  /** svg.getBoundingClientRect(), cached by the caller. */
  rect: { left: number; top: number; width: number; height: number };
  /** Rendered svg extent, in viewBox units. */
  svgSize: number;
  center: number;
  viewport: MapViewport;
}

/**
 * Inverts the CSS-painted rect and the zoom/pan transform back into
 * untransformed svg space, then into selenographic coordinates.
 */
export function coordinateFromPointer({
  clientX,
  clientY,
  rect,
  svgSize,
  center,
  viewport,
}: PointerMapping): SelenographicCoordinate | null {
  const svgX = ((clientX - rect.left) * svgSize) / rect.width;
  const svgY = ((clientY - rect.top) * svgSize) / rect.height;
  const untransformedX = (svgX - center - viewport.pan.x) / viewport.zoom + center;
  const untransformedY = (svgY - center - viewport.pan.y) / viewport.zoom + center;
  return unprojectCoordinates(untransformedX, untransformedY);
}

/** Drag origin: the pointer offset that keeps the current pan under the cursor. */
export function dragOrigin(viewport: MapViewport, clientX: number, clientY: number): { x: number; y: number } {
  return { x: clientX - viewport.pan.x, y: clientY - viewport.pan.y };
}

/** Pan while dragging, relative to `dragOrigin`. */
export function draggedPan(origin: { x: number; y: number }, clientX: number, clientY: number): { x: number; y: number } {
  return { x: clientX - origin.x, y: clientY - origin.y };
}
