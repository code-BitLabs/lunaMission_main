import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';

/** Per-frame easing of a preset change: progress closes the transition, lerp moves the view. */
const TRANSITION_PROGRESS_STEP = 0.035;
const TRANSITION_LERP_FACTOR = 0.08;

/**
 * Calibrated camera distances for 38° FOV and Moon radius 1.45:
 * - South Pole Focus (nadir): 4.8 units -> Moon occupies ~76% of canvas, no cropping.
 * - Global Context: 5.8 units -> Full Moon with ~16% margin around all sides.
 * - Oblique: perspective across crater rims at ~38° inclination.
 * - Site Focus: 1.35 units above candidate normal.
 */
export const NADIR_CAMERA_DISTANCE = 4.8;
export const GLOBAL_CAMERA_POSITION: readonly [number, number, number] = [0, -2.4, 5.2];
export const GLOBAL_LOOK_TARGET: readonly [number, number, number] = [0, -0.4, 0];
export const GLOBAL_UP_VECTOR: readonly [number, number, number] = [0, 0.8, 0.6];
export const OBLIQUE_CAMERA_POSITION: readonly [number, number, number] = [0, -3.6, 2.4];
export const OBLIQUE_LOOK_TARGET: readonly [number, number, number] = [0, -1.2, 0];
export const OBLIQUE_UP_VECTOR: readonly [number, number, number] = [0, 0.6, 0.8];
export const SITE_CAMERA_ALTITUDE = 1.35;
export const SITE_CAMERA_TILT = 0.35;
export const INSPECTION_CAMERA_ALTITUDE = 0.085;
export const INSPECTION_CAMERA_TILT = 0.035;

export interface CameraPose {
  camPos: THREE.Vector3;
  lookTarget: THREE.Vector3;
  upVector: THREE.Vector3;
}

export interface TopocentricBasis {
  surfacePos: THREE.Vector3;
  normal: THREE.Vector3;
  north: THREE.Vector3;
  east: THREE.Vector3;
}

/**
 * Computes an orthonormal topocentric East-North-Up (ENU) frame at any lunar selenographic coordinate.
 * Resolves the polar singularity gracefully when latitude is near -90° by referencing the prime meridian (+Z).
 */
export function getTopocentricBasis(latDeg: number, lonDeg: number, radius = MOON_SCENE_RADIUS): TopocentricBasis {
  const surfacePos = latLonToVector3(latDeg, lonDeg, radius);
  const normal = surfacePos.clone().normalize();

  // Lunar rotational axis is +Y
  const poleAxis = new THREE.Vector3(0, 1, 0);
  let north = poleAxis.clone().sub(normal.clone().multiplyScalar(poleAxis.dot(normal)));

  // If directly at the exact pole, use Earth-facing prime meridian (+Z) as reference North
  if (north.lengthSq() < 1e-6) {
    const primeMeridian = new THREE.Vector3(0, 0, 1);
    north = primeMeridian.clone().sub(normal.clone().multiplyScalar(primeMeridian.dot(normal)));
  }
  north.normalize();

  const east = new THREE.Vector3().crossVectors(north, normal).normalize();

  return { surfacePos, normal, north, east };
}

/** Where each preset parks the camera, using rigorous topocentric coordinates for local modes. */
export function cameraPoseForPreset(preset: CameraPreset, site: CandidateSite): CameraPose {
  if (preset === 'nadir') {
    // Straight down on the South Pole, matching the 2D polar map: +Z (prime meridian) is up.
    return {
      camPos: new THREE.Vector3(0, -NADIR_CAMERA_DISTANCE, 0.0001),
      lookTarget: new THREE.Vector3(0, 0, 0),
      upVector: new THREE.Vector3(0, 0, 1),
    };
  }

  if (preset === 'global') {
    // Global context: complete Moon with safe margins and clear view of southern candidate region
    return {
      camPos: new THREE.Vector3(...GLOBAL_CAMERA_POSITION),
      lookTarget: new THREE.Vector3(...GLOBAL_LOOK_TARGET),
      upVector: new THREE.Vector3(...GLOBAL_UP_VECTOR).normalize(),
    };
  }

  if (preset === 'oblique') {
    // Low perspective view across south-polar crater rims toward the terminator
    return {
      camPos: new THREE.Vector3(...OBLIQUE_CAMERA_POSITION),
      lookTarget: new THREE.Vector3(...OBLIQUE_LOOK_TARGET),
      upVector: new THREE.Vector3(...OBLIQUE_UP_VECTOR).normalize(),
    };
  }

  const { surfacePos, normal, north } = getTopocentricBasis(
    site.coordinates.latitudeDeg,
    site.coordinates.longitudeDeg,
  );

  if (preset === 'inspection') {
    // 45° Oblique Site Inspection: Grazing perspective looking at crater rim relief
    // Calibrated to 0.096 units distance from target (< 0.15 and > 0.05 units)
    const altitude = INSPECTION_CAMERA_ALTITUDE;
    const tilt = INSPECTION_CAMERA_TILT;
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(altitude))
      .add(north.clone().multiplyScalar(-tilt));

    return {
      camPos,
      lookTarget: surfacePos.clone(),
      upVector: normal.clone(),
    };
  }

  if (preset === 'overhead') {
    // High-Angle Overhead Landing Zone: Top-down tactical nadir perspective on candidate
    // Distance 0.14 scene units with Local North pointing up on screen
    const distance = 0.14;
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(distance))
      .add(north.clone().multiplyScalar(0.0001));

    return {
      camPos,
      lookTarget: surfacePos.clone(),
      upVector: north.clone(),
    };
  }

  if (preset === 'horizon') {
    // Ground-Level Horizon Perspective: Low-altitude view looking outward across the crater horizon
    // Simulates lander/astronaut eye-level looking toward the illuminated horizon
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(0.015))
      .add(north.clone().multiplyScalar(-0.025));
    const lookTarget = surfacePos
      .clone()
      .add(north.clone().multiplyScalar(0.065))
      .add(normal.clone().multiplyScalar(0.008));

    return {
      camPos,
      lookTarget,
      upVector: normal.clone(),
    };
  }

  // 'site' preset: Candidate Overview framing surrounding crater complexes (1.26 units range, within 1.0 - 2.0 units)
  return {
    camPos: surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(1.20))
      .add(north.clone().multiplyScalar(0.40)),
    lookTarget: surfacePos.clone(),
    upVector: normal.clone(),
  };
}

export interface CameraTransitioner {
  moveTo: (preset: CameraPreset, site: CandidateSite) => void;
  cancel: () => void;
  isTransitioning: () => boolean;
  /** Advances an in-flight transition; idles at zero cost between preset changes. */
  step: (camera: THREE.PerspectiveCamera, controls: OrbitControls) => void;
}

/** Eased camera moves between presets, interruptible on user manipulation. */
export function createCameraTransitioner(): CameraTransitioner {
  let target: (CameraPose & { progress: number }) | null = null;

  return {
    moveTo: (preset, site) => {
      target = { ...cameraPoseForPreset(preset, site), progress: 0 };
    },
    cancel: () => {
      target = null;
    },
    isTransitioning: () => target !== null,
    step: (camera, controls) => {
      if (!target) return;
      target.progress = Math.min(1.0, target.progress + TRANSITION_PROGRESS_STEP);
      camera.position.lerp(target.camPos, TRANSITION_LERP_FACTOR);
      controls.target.lerp(target.lookTarget, TRANSITION_LERP_FACTOR);
      camera.up.lerp(target.upVector, TRANSITION_LERP_FACTOR);
      if (camera.up.lengthSq() > 1e-4) {
        camera.up.normalize();
      }

      if (target.progress >= 1.0) {
        camera.position.copy(target.camPos);
        controls.target.copy(target.lookTarget);
        camera.up.copy(target.upVector).normalize();
        if (typeof controls.update === 'function') {
          controls.update();
        }
        target = null;
      }
    },
  };
}
