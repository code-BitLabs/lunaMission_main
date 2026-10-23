import * as THREE from 'three';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';

const SELECTED_COLOR = 0x70d6c5;
const DIM_COLOR = 0x4a6585;
const UNSELECTED_BEACON_COLOR = 0x38bdf8;

/** Markers float just off the displaced surface so relief never swallows them. */
const SURFACE_LIFT = 1.006;
const STALK_HEIGHT = 0.055;
const BADGE_LIFT = 0.04;

const RING_INNER_RADIUS = 0.016;
const RING_OUTER_RADIUS = 0.024;
const RING_SEGMENTS = 24;
const BEACON_RADIUS = 0.014;
const BEACON_SEGMENTS = 14;
/** Generous invisible proxy sphere keeps click selection reliable. */
const HIT_PROXY_RADIUS = 0.075;
const HIT_PROXY_SEGMENTS = 10;

const SELECTED_OPACITY = 0.95;
const DIM_OPACITY_AT_BUILD = 0.55;
const DIM_RING_OPACITY = 0.5;
const DIM_STALK_OPACITY = 0.45;
const SELECTED_RING_SCALE = 1.6;
const SELECTED_BEACON_SCALE = 1.5;

/** A marker over this much of the far limb is hidden by the horizon curve. */
const HORIZON_OCCLUSION_DOT = -0.05;

const BADGE_CANVAS_WIDTH = 280;
const BADGE_CANVAS_HEIGHT = 70;
const BADGE_PILL = { x: 5, y: 8, width: 270, height: 54, cornerRadius: 12 } as const;
const BADGE_TEXT_ORIGIN = { x: 140, y: 35 } as const;

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

/** Billboarded site-code pill; the selected site's variant is drawn high-contrast. */
export function createSiteBadge(text: string, isSelected: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = BADGE_CANVAS_WIDTH;
  canvas.height = BADGE_CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isSelected ? 'rgba(10, 18, 30, 0.94)' : 'rgba(12, 19, 32, 0.88)';
  ctx.strokeStyle = isSelected ? '#70D6C5' : '#4A6585';
  ctx.lineWidth = isSelected ? 3.5 : 1.5;
  roundedPillPath(ctx);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isSelected ? '#70D6C5' : '#F1F5F9';
  ctx.font = isSelected ? 'bold 22px "JetBrains Mono", monospace' : '20px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, BADGE_TEXT_ORIGIN.x, BADGE_TEXT_ORIGIN.y);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, depthTest: true, depthWrite: false, transparent: true }),
  );
  sprite.scale.set(0.26, 0.065, 1);
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

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(RING_INNER_RADIUS, RING_OUTER_RADIUS, RING_SEGMENTS),
      new THREE.MeshBasicMaterial({
        color: isSelected ? SELECTED_COLOR : DIM_COLOR,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? SELECTED_OPACITY : DIM_OPACITY_AT_BUILD,
      }),
    );
    ring.position.copy(surfacePos);
    ring.lookAt(surfacePos.clone().add(normal));
    container.add(ring);

    const stalk = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([surfacePos, beaconPos]),
      new THREE.LineBasicMaterial({
        color: isSelected ? SELECTED_COLOR : DIM_COLOR,
        transparent: true,
        opacity: isSelected ? SELECTED_OPACITY : DIM_STALK_OPACITY,
      }),
    );
    container.add(stalk);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(BEACON_RADIUS, BEACON_SEGMENTS, BEACON_SEGMENTS),
      new THREE.MeshBasicMaterial({ color: isSelected ? SELECTED_COLOR : UNSELECTED_BEACON_COLOR }),
    );
    beacon.position.copy(beaconPos);
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
    const badge = createSiteBadge(site.code, isSelected);
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
    const { ring, beacon, stalk, badge, container, surfacePos, normal, site } = marker;

    (ring.material as THREE.MeshBasicMaterial).color.setHex(isSelected ? SELECTED_COLOR : DIM_COLOR);
    (ring.material as THREE.MeshBasicMaterial).opacity = isSelected ? SELECTED_OPACITY : DIM_RING_OPACITY;
    ring.scale.setScalar(isSelected ? SELECTED_RING_SCALE : 1.0);

    (beacon.material as THREE.MeshBasicMaterial).color.setHex(isSelected ? SELECTED_COLOR : UNSELECTED_BEACON_COLOR);
    beacon.scale.setScalar(isSelected ? SELECTED_BEACON_SCALE : 1.0);

    (stalk.material as THREE.LineBasicMaterial).color.setHex(isSelected ? SELECTED_COLOR : DIM_COLOR);
    (stalk.material as THREE.LineBasicMaterial).opacity = isSelected ? SELECTED_OPACITY : DIM_STALK_OPACITY;

    badge.visible = isSelected;

    if (isSelected) {
      container.remove(badge);
      badge.material.dispose();
      const selectedBadge = createSiteBadge(site.code, true);
      const beaconPos = surfacePos.clone().add(normal.clone().multiplyScalar(STALK_HEIGHT));
      selectedBadge.position.copy(beaconPos.clone().add(normal.clone().multiplyScalar(BADGE_LIFT)));
      selectedBadge.visible = true;
      container.add(selectedBadge);
      markers.set(siteId, { ...marker, badge: selectedBadge });
    }
  });
}

/** Back-face culling: hide markers that have rotated past the lunar horizon. */
export function applyMarkerHorizonOcclusion(
  markers: Map<string, SiteMarker>,
  cameraPosition: THREE.Vector3,
  scratch: THREE.Vector3,
): void {
  markers.forEach(({ container, surfacePos, normal }) => {
    scratch.copy(cameraPosition).sub(surfacePos).normalize();
    container.visible = normal.dot(scratch) >= HORIZON_OCCLUSION_DOT;
  });
}
