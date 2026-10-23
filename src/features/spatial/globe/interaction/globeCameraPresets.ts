import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';

/** Per-frame easing of a preset change: progress closes the transition, lerp moves the view. */
const TRANSITION_PROGRESS_STEP = 0.04;
const TRANSITION_LERP_FACTOR = 0.08;

const NADIR_CAMERA_DISTANCE = 3.4;
const OBQUITE_CAMERA_POSITION: readonly [number, number, number] = [0, -2.6, 2.2];
const OBQUITE_LOOK_TARGET: readonly [number, number, number] = [0, -1.2, 0];
const OBQUITE_UP_VECTOR: readonly [number, number, number] = [0, 0.6, 0.8];
/** Height above the surface, and the poleward tilt, of the site-focused camera. */
const SITE_CAMERA_ALTITUDE = 0.7;
const SITE_CAMERA_TILT = 0.2;
const GLOBAL_CAMERA_DISTANCE = 4.8;

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
    // Low view across the pole's crater rims toward the terminator.
    return {
      camPos: new THREE.Vector3(...OBQUITE_CAMERA_POSITION),
      lookTarget: new THREE.Vector3(...OBQUITE_LOOK_TARGET),
      upVector: new THREE.Vector3(...OBQUITE_UP_VECTOR).normalize(),
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
        .add(new THREE.Vector3(0, SITE_CAMERA_TILT, SITE_CAMERA_TILT)),
      lookTarget: sitePos.clone(),
      upVector: new THREE.Vector3(0, 0, 1),
    };
  }
  return {
    camPos: new THREE.Vector3(0, 0, GLOBAL_CAMERA_DISTANCE),
    lookTarget: new THREE.Vector3(0, 0, 0),
    upVector: new THREE.Vector3(0, 1, 0),
  };
}

export interface CameraTransitioner {
  moveTo: (preset: CameraPreset, site: CandidateSite) => void;
  /** Advances an in-flight transition; idles at zero cost between preset changes. */
  step: (camera: THREE.PerspectiveCamera, controls: OrbitControls) => void;
}

/** Eased camera moves between presets, owned by the globe's render loop. */
export function createCameraTransitioner(): CameraTransitioner {
  let target: (CameraPose & { progress: number }) | null = null;

  return {
    moveTo: (preset, site) => {
      target = { ...cameraPoseForPreset(preset, site), progress: 0 };
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
