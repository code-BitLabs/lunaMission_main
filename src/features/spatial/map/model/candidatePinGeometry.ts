/**
 * Radial layout and collision avoidance rules for candidate pins on the 2D polar map.
 *
 * Sites cluster near 90°S, so tags are pushed outward along the radial bearing
 * from the pole and filtered through a deterministic collision-avoidance engine.
 * Selected and hovered sites take top priority, followed by compared candidates,
 * with secondary labels gracefully hidden or abbreviated when crowded.
 */

import { CandidateSite } from '@/domain/sites/candidateSite';
import { DEFAULT_PROJECTION_CONFIG, ProjectedPoint, projectLatLon } from '@/domain/coordinates/projection';

/** Within this many pixels of the pole, the outward bearing is meaningless. */
export const POLE_PROXIMITY_PX = 1.0;
/** Fallback bearing for a site plotted on the pole itself: straight up the screen. */
export const UPWARD_SCREEN_ANGLE_RAD = -Math.PI / 2;

export const TAG_OFFSET_PX = 14;
export const TAG_OFFSET_HOVERED_PX = 18;
export const TAG_OFFSET_SECONDARY_PX = 22;
/** Compact pins stay silent about their code until the map is zoomed in or hovered. */
export const CODE_PILL_ZOOM = 1.15;
export const FULL_LABEL_ZOOM = 2.2;

export const LEADER_LENGTH_PX = 24;
/** Keeps the selected badge inside the map disc rather than under the toolbar. */
export const BADGE_EDGE_MARGIN_X_PX = 50;
export const BADGE_EDGE_MARGIN_Y_PX = 25;

export const BADGE_MIN_WIDTH_PX = 80;
/** Measured advance of one monospace glyph at fontSize 8.5. */
export const BADGE_CHAR_WIDTH_PX = 6.8;

/** Pin palette, so no hex literal is repeated across pin variants. */
export const PIN_COLORS = {
  unselected: '#38bdf8',
  unselectedHovered: '#70d6c5',
  compared: '#818cf8',
  comparedRing: '#a78bfa',
  comparedTagStroke: '#6366f1',
  markerStroke: '#080f1a',
  tagBackdrop: '#050a12',
  tagStroke: '#1e2c3d',
  tagText: '#94a3b8',
  tagTextHovered: '#ffffff',
  badgeBackdrop: '#060e1b',
  accent: 'var(--lm-color-selected-site)',
  badgeStroke: '#ffffff',
} as const;

export type CandidateLabelMode = 'none' | 'code' | 'full';

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Check if two 2D axis-aligned bounding boxes overlap within padding distance. */
export function boxesOverlap(a: BoundingBox, b: BoundingBox, padding = 4): boolean {
  return !(
    a.maxX + padding < b.minX ||
    a.minX - padding > b.maxX ||
    a.maxY + padding < b.minY ||
    a.minY - padding > b.maxY
  );
}

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

export function unselectedPinAriaLabel(site: CandidateSite, isCompared = false): string {
  const prefix = isCompared ? 'Compared candidate' : 'Select candidate';
  return `${prefix} ${site.name} (${site.code}) at ${Math.abs(
    site.coordinates.latitudeDeg
  ).toFixed(2)}°S, ${site.coordinates.longitudeDeg.toFixed(1)}°E`;
}

export function selectedPinAriaLabel(site: CandidateSite): string {
  return `Selected candidate ${site.name} (${site.code})`;
}

export interface PlacedCandidateLabel {
  siteId: string;
  labelMode: CandidateLabelMode;
  tagPos: ProjectedPoint;
  labelText: string;
  box: BoundingBox;
}

/**
 * Deterministic, priority-based collision avoidance for candidate site labels.
 *
 * Priority order:
 * 1. Selected candidate site badge (reserved first, never occluded).
 * 2. Hovered candidate preview tag (reserved second).
 * 3. Compared sites (reserved third).
 * 4. Remaining unselected sites sorted by Artemis III priority and catalog order.
 *
 * If a secondary site's label collides with any higher-priority bounding box,
 * it attempts a secondary radial offset, and if still colliding, collapses to
 * a clean marker dot ('none') without shifting the true geographic coordinate.
 */
export function resolveCandidateLabelPlacements({
  sites,
  selectedSite,
  hoveredSite,
  comparedSiteIds = [],
  zoom,
}: {
  sites: CandidateSite[];
  selectedSite: CandidateSite;
  hoveredSite: CandidateSite | null;
  comparedSiteIds?: readonly string[];
  zoom: number;
}): Map<string, PlacedCandidateLabel> {
  const results = new Map<string, PlacedCandidateLabel>();
  const occupiedBoxes: BoundingBox[] = [];

  // 1. Reserve Selected Site Badge & Marker Disc
  const selectedPos = projectLatLon(
    selectedSite.coordinates.latitudeDeg,
    selectedSite.coordinates.longitudeDeg
  );
  const selectedAngle = radialAngleFromPole(selectedPos);
  const selectedBadgeAnchor = clampBadgeAnchor(offsetAlongAngle(selectedPos, selectedAngle, LEADER_LENGTH_PX));
  const selectedText = badgeText(selectedSite);
  const selectedWidth = badgeWidthFor(selectedText);

  const selectedBadgeBox: BoundingBox = {
    minX: selectedBadgeAnchor.x - selectedWidth / 2 - 2,
    maxX: selectedBadgeAnchor.x + selectedWidth / 2 + 2,
    minY: selectedBadgeAnchor.y - 11,
    maxY: selectedBadgeAnchor.y + 11,
  };
  occupiedBoxes.push(selectedBadgeBox);

  // Reserve area around selected marker pin
  occupiedBoxes.push({
    minX: selectedPos.x - 14,
    maxX: selectedPos.x + 14,
    minY: selectedPos.y - 14,
    maxY: selectedPos.y + 14,
  });

  results.set(selectedSite.id, {
    siteId: selectedSite.id,
    labelMode: 'full',
    tagPos: selectedBadgeAnchor,
    labelText: selectedText,
    box: selectedBadgeBox,
  });

  // 2. Reserve Hovered Site Tag (if not selected)
  if (hoveredSite && hoveredSite.id !== selectedSite.id) {
    const hPos = projectLatLon(hoveredSite.coordinates.latitudeDeg, hoveredSite.coordinates.longitudeDeg);
    const hAngle = radialAngleFromPole(hPos);
    const hTag = offsetAlongAngle(hPos, hAngle, TAG_OFFSET_HOVERED_PX);
    const hText = hoveredSite.code;
    const hBox: BoundingBox = {
      minX: hTag.x - 18,
      maxX: hTag.x + 18,
      minY: hTag.y - 8,
      maxY: hTag.y + 8,
    };
    occupiedBoxes.push(hBox);

    results.set(hoveredSite.id, {
      siteId: hoveredSite.id,
      labelMode: 'code',
      tagPos: hTag,
      labelText: hText,
      box: hBox,
    });
  }

  // At low regional zoom (< 1.15), keep the map uncluttered: unselected pins are marker dots only
  if (zoom < CODE_PILL_ZOOM) {
    for (const site of sites) {
      if (site.id !== selectedSite.id && site.id !== hoveredSite?.id) {
        const pos = projectLatLon(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg);
        results.set(site.id, {
          siteId: site.id,
          labelMode: 'none',
          tagPos: pos,
          labelText: site.code,
          box: { minX: pos.x - 4, maxX: pos.x + 4, minY: pos.y - 4, maxY: pos.y + 4 },
        });
      }
    }
    return results;
  }

  // 3. Prioritize remaining unselected candidates
  const unselectedSites = sites.filter(
    (s) => s.id !== selectedSite.id && s.id !== hoveredSite?.id
  );

  unselectedSites.sort((a, b) => {
    const aComp = comparedSiteIds.includes(a.id) ? 1 : 0;
    const bComp = comparedSiteIds.includes(b.id) ? 1 : 0;
    if (aComp !== bComp) return bComp - aComp;

    const aArtemis = a.priority.includes('Artemis') ? 1 : 0;
    const bArtemis = b.priority.includes('Artemis') ? 1 : 0;
    if (aArtemis !== bArtemis) return bArtemis - aArtemis;

    return 0;
  });

  for (const site of unselectedSites) {
    const pos = projectLatLon(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg);
    const angle = radialAngleFromPole(pos);

    // Try full label at high zoom (>= 2.2) if room permits
    const tryFull = zoom >= FULL_LABEL_ZOOM;
    const text = tryFull ? badgeText(site) : site.code;
    const width = tryFull ? badgeWidthFor(text) : 34;

    // Test standard offset
    const tag1 = offsetAlongAngle(pos, angle, TAG_OFFSET_PX);
    const box1: BoundingBox = {
      minX: tag1.x - width / 2,
      maxX: tag1.x + width / 2,
      minY: tag1.y - 7,
      maxY: tag1.y + 7,
    };

    const collides1 = occupiedBoxes.some((occ) => boxesOverlap(box1, occ));

    if (!collides1) {
      occupiedBoxes.push(box1);
      results.set(site.id, {
        siteId: site.id,
        labelMode: tryFull ? 'full' : 'code',
        tagPos: tag1,
        labelText: text,
        box: box1,
      });
      continue;
    }

    // Try secondary extended offset with compact code text
    const codeWidth = 34;
    const tag2 = offsetAlongAngle(pos, angle, TAG_OFFSET_SECONDARY_PX);
    const box2: BoundingBox = {
      minX: tag2.x - codeWidth / 2,
      maxX: tag2.x + codeWidth / 2,
      minY: tag2.y - 7,
      maxY: tag2.y + 7,
    };

    const collides2 = occupiedBoxes.some((occ) => boxesOverlap(box2, occ));

    if (!collides2) {
      occupiedBoxes.push(box2);
      results.set(site.id, {
        siteId: site.id,
        labelMode: 'code',
        tagPos: tag2,
        labelText: site.code,
        box: box2,
      });
    } else {
      // Suppress label rather than clutter or overlap
      results.set(site.id, {
        siteId: site.id,
        labelMode: 'none',
        tagPos: pos,
        labelText: site.code,
        box: { minX: pos.x - 4, maxX: pos.x + 4, minY: pos.y - 4, maxY: pos.y + 4 },
      });
    }
  }

  return results;
}
