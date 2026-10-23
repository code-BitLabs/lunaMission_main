import * as THREE from 'three';
import { CandidateSite } from '@/domain/sites/candidateSite';
import {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
} from '@/domain/coordinates/frames';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';

const SUN_VECTOR_COLOR = 0xf3cc70;
const EARTH_VECTOR_COLOR = 0x8ccbff;
/** Amber DTE link: the site cannot see Earth from this instant's geometry. */
const BLOCKED_LINK_COLOR = 0xf59e0b;

const VECTOR_ORIGIN_LIFT = 1.015;
const VECTOR_ARROW_LENGTH = 0.55;
const VECTOR_HEAD_LENGTH = 0.08;
const VECTOR_HEAD_WIDTH = 0.04;

/** Scene-unit orbit radius for the decorative Earth sphere (not a distance). */
const EARTH_SPHERE_DISTANCE = 4.2;
const EARTH_SPHERE_RADIUS = 0.24;
const EARTH_SPHERE_SEGMENTS = 24;
const EARTH_ATMOSPHERE_RADIUS = 0.28;
const EARTH_ATMOSPHERE_OPACITY = 0.35;

const EARTH_SURFACE_COLOR = 0x1d4ed8;
const EARTH_EMISSIVE_COLOR = 0x0f2a63;
const EARTH_SPECULAR_COLOR = 0x60a5fa;
const EARTH_SHININESS = 35;

const LINK_OPEN_DASH = 0.15;
const LINK_OPEN_GAP = 0.06;
const LINK_OPEN_OPACITY = 0.85;
const LINK_BLOCKED_DASH = 0.06;
const LINK_BLOCKED_GAP = 0.08;
const LINK_BLOCKED_OPACITY = 0.45;

export interface CelestialVectorInput {
  showVectors: boolean;
  site: CandidateSite;
  subSolarLatDeg: SelenographicLatitudeDeg;
  subSolarLonDeg: SelenographicLongitudeDeg;
  subEarthLatDeg: SelenographicLatitudeDeg;
  subEarthLonDeg: SelenographicLongitudeDeg;
  /** Topocentric elevation at the site; null means visibility is unknown, not blocked. */
  earthElevationDeg: number | null;
}

/**
 * Empties the layer and releases what each rebuild allocated. `ArrowHelper`
 * shares its line and cone geometries module-wide, so only its materials are
 * disposable; freeing the geometry would blind every arrow in the process.
 */
export function clearCelestialVectors(group: THREE.Group): void {
  group.children.slice().forEach((child) => {
    group.remove(child);
    if (child instanceof THREE.ArrowHelper) {
      (child.line.material as THREE.Material).dispose();
      (child.cone.material as THREE.Material).dispose();
      return;
    }
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else if (material) material.dispose();
  });
}

/** Rebuilds the Sun ray, Earth ray, Earth sphere and the direct-to-Earth link. */
export function renderCelestialVectors(group: THREE.Group, input: CelestialVectorInput): void {
  clearCelestialVectors(group);
  if (!input.showVectors) return;

  const origin = latLonToVector3(
    input.site.coordinates.latitudeDeg,
    input.site.coordinates.longitudeDeg,
    MOON_SCENE_RADIUS * VECTOR_ORIGIN_LIFT,
  );

  const sunDir = latLonToVector3(input.subSolarLatDeg, input.subSolarLonDeg, 1.0).normalize();
  group.add(
    new THREE.ArrowHelper(sunDir, origin, VECTOR_ARROW_LENGTH, SUN_VECTOR_COLOR, VECTOR_HEAD_LENGTH, VECTOR_HEAD_WIDTH),
  );

  const earthDir = latLonToVector3(input.subEarthLatDeg, input.subEarthLonDeg, 1.0).normalize();
  group.add(
    new THREE.ArrowHelper(
      earthDir,
      origin,
      VECTOR_ARROW_LENGTH,
      EARTH_VECTOR_COLOR,
      VECTOR_HEAD_LENGTH,
      VECTOR_HEAD_WIDTH,
    ),
  );

  const earthOrbPos = latLonToVector3(input.subEarthLatDeg, input.subEarthLonDeg, EARTH_SPHERE_DISTANCE);

  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_SPHERE_RADIUS, EARTH_SPHERE_SEGMENTS, EARTH_SPHERE_SEGMENTS),
    new THREE.MeshPhongMaterial({
      color: EARTH_SURFACE_COLOR,
      emissive: EARTH_EMISSIVE_COLOR,
      shininess: EARTH_SHININESS,
      specular: EARTH_SPECULAR_COLOR,
    }),
  );
  earthMesh.position.copy(earthOrbPos);
  group.add(earthMesh);

  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_ATMOSPHERE_RADIUS, EARTH_SPHERE_SEGMENTS, EARTH_SPHERE_SEGMENTS),
    new THREE.MeshBasicMaterial({
      color: EARTH_VECTOR_COLOR,
      transparent: true,
      opacity: EARTH_ATMOSPHERE_OPACITY,
      wireframe: true,
    }),
  );
  atmosphereMesh.position.copy(earthOrbPos);
  group.add(atmosphereMesh);

  const hasLineOfSight = input.earthElevationDeg !== null && input.earthElevationDeg > 0;
  const linkLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([origin, earthOrbPos]),
    new THREE.LineDashedMaterial({
      color: hasLineOfSight ? EARTH_VECTOR_COLOR : BLOCKED_LINK_COLOR,
      dashSize: hasLineOfSight ? LINK_OPEN_DASH : LINK_BLOCKED_DASH,
      gapSize: hasLineOfSight ? LINK_OPEN_GAP : LINK_BLOCKED_GAP,
      transparent: true,
      opacity: hasLineOfSight ? LINK_OPEN_OPACITY : LINK_BLOCKED_OPACITY,
    }),
  );
  linkLine.computeLineDistances();
  group.add(linkLine);
}
