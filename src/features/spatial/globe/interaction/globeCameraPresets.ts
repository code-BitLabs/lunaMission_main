import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';

/** Per-frame easing of a preset change: progress closes the transition, lerp moves the view. */
const TRANSITION_PROGRESS_STEP = 0.035;
const TRANSITION_LERP_FACTOR = 0.075;

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

/** Where each preset parks the camera. */
export function cameraPoseForPreset(preset: CameraPreset, site: CandidateSite): CameraPose {
  if (preset === 'nadir') {
    // Straight down on the South Pole, matching the 2D polar map: +Z (prime meridian) is up.
    return {
      camPos: new THREE.Vector3(0, -NADIR_CAMERA_DISTANCE, 0.0001),
      lookTarget: new THREE.Vector3(0, 0, 0),
      upVector: new THREE.Vector3(0, 0, 1),
    };
  }
  if (preset === 'oblique') {
    // Low perspective view across the south-polar crater rims toward the terminator.
    return {
      camPos: new THREE.Vector3(...OBLIQUE_CAMERA_POSITION),
      lookTarget: new THREE.Vector3(...OBLIQUE_LOOK_TARGET),
      upVector: new THREE.Vector3(...OBLIQUE_UP_VECTOR).normalize(),
    };
  }
  if (preset === 'site') {
    const sitePos = latLonToVector3(
      site.coordinates.latitudeDeg,
      site.coordinates.longitudeDeg,
      MOON_SCENE_RADIUS,
    );
    const siteNormal = sitePos.clone().normalize();
    return {
      camPos: sitePos
        .clone()
        .add(siteNormal.clone().multiplyScalar(SITE_CAMERA_ALTITUDE))
        .add(new THREE.Vector3(0, -SITE_CAMERA_TILT, SITE_CAMERA_TILT)),
      lookTarget: sitePos.clone(),
      upVector: new THREE.Vector3(0, 0, 1),
    };
  }
  if (preset === 'inspection') {
    const sitePos = latLonToVector3(
      site.coordinates.latitudeDeg,
      site.coordinates.longitudeDeg,
      MOON_SCENE_RADIUS,
    );
    const siteNormal = sitePos.clone().normalize();
    return {
      camPos: sitePos
        .clone()
        .add(siteNormal.clone().multiplyScalar(INSPECTION_CAMERA_ALTITUDE))
        .add(new THREE.Vector3(0, -INSPECTION_CAMERA_TILT, INSPECTION_CAMERA_TILT)),
      lookTarget: sitePos.clone(),
      upVector: new THREE.Vector3(0, 0, 1),
    };
  }
  // Global context: complete Moon with safe margins and clear view of southern candidate region
  return {
    camPos: new THREE.Vector3(...GLOBAL_CAMERA_POSITION),
    lookTarget: new THREE.Vector3(...GLOBAL_LOOK_TARGET),
    upVector: new THREE.Vector3(...GLOBAL_UP_VECTOR).normalize(),
  };
}

export interface CameraTransitioner {
  moveTo: (preset: CameraPreset, site: CandidateSite) => void;
  cancel: () => void;
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
    step: (camera, controls) => {
      if (!target) return;
      target.progress = Math.min(1.0, target.progress + TRANSITION_PROGRESS_STEP);
      camera.position.lerp(target.camPos, TRANSITION_LERP_FACTOR);
      camera.up.lerp(target.upVector, TRANSITION_LERP_FACTOR);
      controls.target.lerp(target.lookTarget, TRANSITION_LERP_FACTOR);

      if (target.progress >= 1.0) {
        camera.position.copy(target.camPos);
        camera.up.copy(target.upVector);
        controls.target.copy(target.lookTarget);
        target = null;
      }
    },
  };
}
