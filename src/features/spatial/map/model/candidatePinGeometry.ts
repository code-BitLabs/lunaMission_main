/**
 * Radial layout rules for the candidate pins on the 2D polar map.
 *
 * Sites cluster near 90°S, so every tag is pushed outward along the bearing
 * from the pole instead of stacking: two labels at the same place are unreadable,
 * and the pole itself has no bearing, which the proximity fallback handles.
 */

import { CandidateSite } from '@/domain/sites/candidateSite';
import { DEFAULT_PROJECTION_CONFIG, ProjectedPoint } from '@/domain/coordinates/projection';

/** Within this many pixels of the pole, the outward bearing is meaningless. */
export const POLE_PROXIMITY_PX = 1.0;
/** Fallback bearing for a site plotted on the pole itself: straight up the screen. */
export const UPWARD_SCREEN_ANGLE_RAD = -Math.PI / 2;

export const TAG_OFFSET_PX = 14;
export const TAG_OFFSET_HOVERED_PX = 18;
/** Compact pins stay silent about their code until the map is zoomed in or hovered. */
export const CODE_PILL_ZOOM = 1.3;

export const LEADER_LENGTH_PX = 24;
/** Keeps the selected badge inside the map disc rather than under the toolbar. */
export const BADGE_EDGE_MARGIN_X_PX = 50;
export const BADGE_EDGE_MARGIN_Y_PX = 25;

export const BADGE_MIN_WIDTH_PX = 80;
/** Measured advance of one monospace glyph at fontSize 8.5. */
export const BADGE_CHAR_WIDTH_PX = 6.8;

/** Pin palette, so no hex literal is repeated across the two pin variants. */
export const PIN_COLORS = {
  unselected: '#38bdf8',
  unselectedHovered: '#70d6c5',
  markerStroke: '#080f1a',
  tagBackdrop: '#050a12',
  tagStroke: '#1e2c3d',
  tagText: '#94a3b8',
  tagTextHovered: '#ffffff',
  badgeBackdrop: '#060e1b',
  accent: 'var(--lm-color-selected-site)',
  badgeStroke: '#ffffff',
} as const;

/** Bearing from the map centre through a plotted point, measured on screen. */
export function radialAngleFromPole(pos: ProjectedPoint): number {
  const { center } = DEFAULT_PROJECTION_CONFIG;
  const poleDist = Math.hypot(pos.x - center, pos.y - center);
  return poleDist < POLE_PROXIMITY_PX ? UPWARD_SCREEN_ANGLE_RAD : Math.atan2(pos.y - center, pos.x - center);
}

/** A point `distancePx` from `pos` along `angleRad`. */
export function offsetAlongAngle(pos: ProjectedPoint, angleRad: number, distancePx: number): ProjectedPoint {
  return { x: pos.x + Math.cos(angleRad) * distancePx, y: pos.y + Math.sin(angleRad) * distancePx };
}

/** Clamps a badge anchor so the badge stays inside the drawable SVG area. */
export function clampBadgeAnchor(pos: ProjectedPoint): ProjectedPoint {
  const { svgSize } = DEFAULT_PROJECTION_CONFIG;
  return {
    x: Math.max(BADGE_EDGE_MARGIN_X_PX, Math.min(svgSize - BADGE_EDGE_MARGIN_X_PX, pos.x)),
    y: Math.max(BADGE_EDGE_MARGIN_Y_PX, Math.min(svgSize - BADGE_EDGE_MARGIN_Y_PX, pos.y)),
  };
}

/** Badge wording: the published code plus a shortened name. */
export function badgeText(site: CandidateSite): string {
  const shortName = site.name.replace(' Crater Rim', '').replace(' Mountain', '');
  return `${site.code} • ${shortName}`;
}

export function badgeWidthFor(text: string): number {
  return Math.max(BADGE_MIN_WIDTH_PX, text.length * BADGE_CHAR_WIDTH_PX);
}

/** Whether the compact code pill is legible enough to be worth showing. */
export function shouldShowCodePill(zoom: number, isHovered: boolean): boolean {
  return zoom >= CODE_PILL_ZOOM || isHovered;
}

export function unselectedPinAriaLabel(site: CandidateSite): string {
  return `Select candidate ${site.name} (${site.code}) at ${Math.abs(
    site.coordinates.latitudeDeg
  ).toFixed(2)}°S, ${site.coordinates.longitudeDeg.toFixed(1)}°E`;
}

export function selectedPinAriaLabel(site: CandidateSite): string {
  return `Selected candidate ${site.name} (${site.code})`;
}
