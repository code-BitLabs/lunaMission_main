import * as THREE from 'three';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CANDIDATE_SITES, DEFAULT_COMPARISON_SITE_IDS } from '@/domain/sites/catalog';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';

const SELECTED_COLOR = 0x22d3ee; // High-contrast cyan/turquoise
const COMPARED_COLOR = 0x818cf8; // Purple/indigo for comparison set
const COMPARED_RING_COLOR = 0xa78bfa;
const DIM_COLOR = 0x334155;
const UNSELECTED_BEACON_COLOR = 0x38bdf8; // Muted blue for ordinary candidates

/** Markers float slightly off the surface to avoid z-fighting without floating high above terrain. */
const SURFACE_LIFT = 1.002;
const STALK_HEIGHT = 0.016;
const BADGE_LIFT = 0.018;

// Restrained, precision dimensions so markers never balloon into giant discs
const RING_INNER_RADIUS = 0.0055;
const RING_OUTER_RADIUS = 0.0075;
const RING_SEGMENTS = 32;
const BEACON_RADIUS = 0.0035;
const BEACON_SEGMENTS = 16;
/** Invisible proxy sphere keeps click/touch selection 100% reliable. */
const HIT_PROXY_RADIUS = 0.045;
const HIT_PROXY_SEGMENTS = 10;

const SELECTED_OPACITY = 0.95;
const DIM_OPACITY_AT_BUILD = 0.45;
const DIM_RING_OPACITY = 0.35;
const DIM_STALK_OPACITY = 0.35;
const SELECTED_RING_SCALE = 1.25;
const SELECTED_BEACON_SCALE = 1.2;

/** A marker over this much of the far limb is hidden by the horizon curve. */
const HORIZON_OCCLUSION_DOT = -0.05;

const BADGE_CANVAS_WIDTH = 220;
const BADGE_CANVAS_HEIGHT = 52;
const BADGE_PILL = { x: 4, y: 4, width: 212, height: 44, cornerRadius: 8 } as const;
const BADGE_TEXT_ORIGIN = { x: 110, y: 26 } as const;

function roundedPillPath(ctx: CanvasRenderingContext2D): void {
  const { x, y, width: w, height: h, cornerRadius: r } = BADGE_PILL;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Billboarded compact site badge; only the selected site or hovered site is shown to avoid crowding. */
export function createSiteBadge(text: string, isSelected: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = BADGE_CANVAS_WIDTH;
  canvas.height = BADGE_CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isSelected ? 'rgba(6, 14, 27, 0.95)' : 'rgba(10, 18, 30, 0.88)';
  ctx.strokeStyle = isSelected ? '#22d3ee' : '#475569';
  ctx.lineWidth = isSelected ? 3.0 : 1.5;
  roundedPillPath(ctx);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isSelected ? '#22d3ee' : '#cbd5e1';
  ctx.font = isSelected ? 'bold 20px "JetBrains Mono", monospace' : '18px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, BADGE_TEXT_ORIGIN.x, BADGE_TEXT_ORIGIN.y);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, transparent: true }),
  );
  // Compact restrained scale (0.18 x 0.045 scene units)
  sprite.scale.set(0.18, 0.045, 1);
  return sprite;
}

export interface SiteMarker {
  container: THREE.Group;
  ring: THREE.Mesh;
  beacon: THREE.Mesh;
  hitProxy: THREE.Mesh;
  stalk: THREE.Line;
  badge: THREE.Sprite;
  surfacePos: THREE.Vector3;
  normal: THREE.Vector3;
  site: CandidateSite;
}

export interface SiteMarkerLayer {
  markers: Map<string, SiteMarker>;
  hitTargets: THREE.Object3D[];
}

/** Datum ring, telemetry stalk, beacon, hit proxy and billboard badge, per candidate. */
export function createSiteMarkers(selectedSiteId: string): SiteMarkerLayer {
  const markers = new Map<string, SiteMarker>();
  const hitTargets: THREE.Object3D[] = [];

  CANDIDATE_SITES.forEach((site) => {
    const isSelected = site.id === selectedSiteId;
    const isCompared = DEFAULT_COMPARISON_SITE_IDS.includes(site.id);

    const surfacePos = latLonToVector3(
      site.coordinates.latitudeDeg,
      site.coordinates.longitudeDeg,
      MOON_SCENE_RADIUS * SURFACE_LIFT,
    );
    const normal = surfacePos.clone().normalize();
    const beaconPos = surfacePos.clone().add(normal.clone().multiplyScalar(STALK_HEIGHT));
    const badgePos = beaconPos.clone().add(normal.clone().multiplyScalar(BADGE_LIFT));

    const container = new THREE.Group();
    container.userData = { siteId: site.id };

    const ringColor = isSelected
      ? SELECTED_COLOR
      : isCompared
      ? COMPARED_RING_COLOR
      : DIM_COLOR;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(RING_INNER_RADIUS, RING_OUTER_RADIUS, RING_SEGMENTS),
      new THREE.MeshBasicMaterial({
        color: ringColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? SELECTED_OPACITY : isCompared ? 0.8 : DIM_OPACITY_AT_BUILD,
      }),
    );
    ring.position.copy(surfacePos);
    ring.lookAt(surfacePos.clone().add(normal));
    if (isSelected) ring.scale.setScalar(SELECTED_RING_SCALE);
    container.add(ring);

    const stalkColor = isSelected ? SELECTED_COLOR : isCompared ? COMPARED_COLOR : DIM_COLOR;
    const stalk = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([surfacePos, beaconPos]),
      new THREE.LineBasicMaterial({
        color: stalkColor,
        transparent: true,
        opacity: isSelected ? SELECTED_OPACITY : DIM_STALK_OPACITY,
      }),
    );
    container.add(stalk);

    const beaconColor = isSelected
      ? SELECTED_COLOR
      : isCompared
      ? COMPARED_COLOR
      : UNSELECTED_BEACON_COLOR;

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(BEACON_RADIUS, BEACON_SEGMENTS, BEACON_SEGMENTS),
      new THREE.MeshBasicMaterial({ color: beaconColor }),
    );
    beacon.position.copy(beaconPos);
    if (isSelected) beacon.scale.setScalar(SELECTED_BEACON_SCALE);
    container.add(beacon);

    const hitProxy = new THREE.Mesh(
      new THREE.SphereGeometry(HIT_PROXY_RADIUS, HIT_PROXY_SEGMENTS, HIT_PROXY_SEGMENTS),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitProxy.position.copy(beaconPos);
    hitProxy.userData = { siteId: site.id };
    container.add(hitProxy);
    hitTargets.push(hitProxy);

    // Unselected badges stay hidden until hover so labels do not pile up on each other.
    const shortName = site.name.replace(' Crater Rim', '').replace(' Mountain', '');
    const badge = createSiteBadge(`${site.code} • ${shortName}`, isSelected);
    badge.position.copy(badgePos);
    badge.visible = isSelected;
    container.add(badge);

    markers.set(site.id, { container, ring, beacon, hitProxy, stalk, badge, surfacePos, normal, site });
  });

  return { markers, hitTargets };
}

/** Re-styles every marker for the new selection and re-renders the chosen badge. */
export function updateSiteMarkerSelection(markers: Map<string, SiteMarker>, selectedSiteId: string): void {
  markers.forEach((marker, siteId) => {
    const isSelected = siteId === selectedSiteId;
    const isCompared = DEFAULT_COMPARISON_SITE_IDS.includes(siteId);
    const { ring, beacon, stalk, badge, container, surfacePos, normal, site } = marker;

    const ringColor = isSelected ? SELECTED_COLOR : isCompared ? COMPARED_RING_COLOR : DIM_COLOR;
    (ring.material as THREE.MeshBasicMaterial).color.setHex(ringColor);
    (ring.material as THREE.MeshBasicMaterial).opacity = isSelected ? SELECTED_OPACITY : isCompared ? 0.8 : DIM_RING_OPACITY;
    ring.scale.setScalar(isSelected ? SELECTED_RING_SCALE : 1.0);

    const beaconColor = isSelected ? SELECTED_COLOR : isCompared ? COMPARED_COLOR : UNSELECTED_BEACON_COLOR;
    (beacon.material as THREE.MeshBasicMaterial).color.setHex(beaconColor);
    beacon.scale.setScalar(isSelected ? SELECTED_BEACON_SCALE : 1.0);

    const stalkColor = isSelected ? SELECTED_COLOR : isCompared ? COMPARED_COLOR : DIM_COLOR;
    (stalk.material as THREE.LineBasicMaterial).color.setHex(stalkColor);
    (stalk.material as THREE.LineBasicMaterial).opacity = isSelected ? SELECTED_OPACITY : DIM_STALK_OPACITY;

    badge.visible = isSelected;

    if (isSelected) {
      container.remove(badge);
      if (badge.material.map) badge.material.map.dispose();
      badge.material.dispose();
      const shortName = site.name.replace(' Crater Rim', '').replace(' Mountain', '');
      const selectedBadge = createSiteBadge(`${site.code} • ${shortName}`, true);
      const beaconPos = surfacePos.clone().add(normal.clone().multiplyScalar(STALK_HEIGHT));
      selectedBadge.position.copy(beaconPos.clone().add(normal.clone().multiplyScalar(BADGE_LIFT)));
      selectedBadge.visible = true;
      container.add(selectedBadge);
      markers.set(siteId, { ...marker, badge: selectedBadge });
    }
  });
}

export interface MarkerDisplayOptions {
  showMarkers?: boolean;
  showLabels?: boolean;
}

/**
 * Scale-aware culling and sizing:
 * - Hides limb/backface markers past horizon curve.
 * - At local inspection scale (close camera distance), hides non-selected candidates completely
 *   so the local crater rim and surface relief are 100% unobstructed.
 * - Dynamically scales marker beacon, ring, and stalk to camera distance so they never balloon into giant discs.
 */
export function applyMarkerHorizonOcclusion(
  markers: Map<string, SiteMarker>,
  cameraPosition: THREE.Vector3,
  targetPosition: THREE.Vector3,
  selectedSiteId: string,
  scratch: THREE.Vector3,
  options?: MarkerDisplayOptions,
): void {
  const showMarkers = options?.showMarkers ?? true;
  const showLabels = options?.showLabels ?? true;

  if (!showMarkers) {
    markers.forEach(({ container }) => {
      container.visible = false;
    });
    return;
  }

  const distToTarget = cameraPosition.distanceTo(targetPosition);
  const isLocalInspection = distToTarget < 0.65;

  markers.forEach(({ container, ring, beacon, stalk, surfacePos, normal, badge, site }) => {
    const isSelected = site.id === selectedSiteId;

    // In local inspection mode, hide all distant unselected markers to prevent visual clutter
    if (isLocalInspection && !isSelected) {
      container.visible = false;
      return;
    }

    scratch.copy(cameraPosition).sub(surfacePos);
    const dist = scratch.length();
    scratch.normalize();
    const isFrontFacing = normal.dot(scratch) >= HORIZON_OCCLUSION_DOT;

    container.visible = isFrontFacing;
    if (!isFrontFacing) return;

    // Scale marker geometry proportionally to camera distance to maintain delicate, sharp pin appearance
    const scaleFactor = isLocalInspection
      ? Math.min(1.0, Math.max(0.18, dist / 1.5))
      : Math.min(1.15, Math.max(0.35, dist / 3.8));

    const finalScale = isSelected ? scaleFactor * 1.15 : scaleFactor * 0.75;
    ring.scale.setScalar(finalScale);
    beacon.scale.setScalar(finalScale);
    stalk.scale.set(finalScale, finalScale, finalScale);

    // Badge visibility: only shown if labels are enabled and not excessively zoomed in
    const shouldShowBadge = showLabels && isSelected && (!isLocalInspection || distToTarget >= 0.28);
    badge.visible = shouldShowBadge;
    if (shouldShowBadge) {
      const badgeScale = Math.min(1.0, Math.max(0.35, dist / 2.0));
      badge.scale.set(0.14 * badgeScale, 0.035 * badgeScale, 1);
    }
  });
}
