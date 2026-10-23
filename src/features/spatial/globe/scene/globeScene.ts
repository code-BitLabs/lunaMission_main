import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
} from '@/domain/coordinates/frames';

/** The globe is modelled in scene units, not metres; this is the Moon sphere radius. */
export const MOON_SCENE_RADIUS = 1.45;

const SCENE_BACKGROUND = 0x070b12;
const CAMERA_FOV_DEG = 38;
const CAMERA_NEAR = 0.05;
const CAMERA_FAR = 100;
/** Nadir opening pose: straight down on 90°S, +Z (prime meridian) held up, Moon occupying ~76% of frame. */
const INITIAL_CAMERA_POSITION: readonly [number, number, number] = [0, -4.8, 0.0001];
const INITIAL_CAMERA_UP: readonly [number, number, number] = [0, 0, 1];
const CONTROL_DAMPING_FACTOR = 0.05;
const CONTROL_MIN_DISTANCE = 2.1;
const CONTROL_MAX_DISTANCE = 9.5;

const SUN_LIGHT_COLOR = 0xfff8e7;
const SUN_LIGHT_INTENSITY = 2.5;
const SUN_SHADOW_MAP_SIZE = 1024;
const SUN_SHADOW_CAMERA_EXTENT = 2.5;
const SUN_SHADOW_NEAR = 0.5;
const SUN_SHADOW_FAR = 30;
const SUN_SHADOW_BIAS = -0.0002;
const EARTHSHINE_LIGHT_COLOR = 0x8ccbff;
const EARTHSHINE_LIGHT_INTENSITY = 0.20;
const AMBIENT_SPACE_LIGHT_COLOR = 0x0c1424;
const AMBIENT_SPACE_LIGHT_INTENSITY = 0.16;
/** Directional lights sit far along their body-fixed direction so rays read as parallel. */
const SUN_LIGHT_DISTANCE = 18.0;
const EARTHSHINE_LIGHT_DISTANCE = 15.0;
/** Opening pose before the first epoch is applied: Earth-side +Z. */
const EARTHSHINE_INITIAL_DISTANCE = 10;

/**
 * Selenographic lat/lon → scene Cartesian.
 * Lat: +90° North (+Y), -90° South (-Y). Lon: 0° prime meridian facing Earth (+Z),
 * +90° East (+X), 270° West (-X).
 */
export function latLonToVector3(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = lonDeg * (Math.PI / 180);
  const x = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);
  return new THREE.Vector3(x, y, z);
}

export interface GlobeScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  sunLight: THREE.DirectionalLight;
  earthLight: THREE.DirectionalLight;
}

/** False when the host cannot give the globe a WebGL context at all. */
export function isWebGlAvailable(): boolean {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl') || probe.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

/** Renderer, camera, controls and the three lights, sized to the mount container. */
export function createGlobeScene(width: number, height: number): GlobeScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_BACKGROUND);

  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV_DEG,
    width / height,
    CAMERA_NEAR,
    CAMERA_FAR,
  );
  camera.position.set(...INITIAL_CAMERA_POSITION);
  camera.up.set(...INITIAL_CAMERA_UP);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = CONTROL_DAMPING_FACTOR;
  controls.minDistance = CONTROL_MIN_DISTANCE;
  controls.maxDistance = CONTROL_MAX_DISTANCE;
  controls.target.set(0, 0, 0);

  const sunLight = new THREE.DirectionalLight(SUN_LIGHT_COLOR, SUN_LIGHT_INTENSITY);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = SUN_SHADOW_MAP_SIZE;
  sunLight.shadow.mapSize.height = SUN_SHADOW_MAP_SIZE;
  sunLight.shadow.camera.near = SUN_SHADOW_NEAR;
  sunLight.shadow.camera.far = SUN_SHADOW_FAR;
  sunLight.shadow.camera.left = -SUN_SHADOW_CAMERA_EXTENT;
  sunLight.shadow.camera.right = SUN_SHADOW_CAMERA_EXTENT;
  sunLight.shadow.camera.top = SUN_SHADOW_CAMERA_EXTENT;
  sunLight.shadow.camera.bottom = -SUN_SHADOW_CAMERA_EXTENT;
  sunLight.shadow.bias = SUN_SHADOW_BIAS;
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(AMBIENT_SPACE_LIGHT_COLOR, AMBIENT_SPACE_LIGHT_INTENSITY);
  scene.add(ambientLight);

  const earthLight = new THREE.DirectionalLight(EARTHSHINE_LIGHT_COLOR, EARTHSHINE_LIGHT_INTENSITY);
  earthLight.position.set(0, 0, EARTHSHINE_INITIAL_DISTANCE);
  scene.add(earthLight);

  return { scene, camera, renderer, controls, sunLight, earthLight };
}

/** Aim the Sun and Earthshine lights at the sub-solar and sub-Earth points of the epoch. */
export function syncCelestialLighting(
  scene: GlobeScene,
  subSolarLatDeg: SelenographicLatitudeDeg,
  subSolarLonDeg: SelenographicLongitudeDeg,
  subEarthLatDeg: SelenographicLatitudeDeg,
  subEarthLonDeg: SelenographicLongitudeDeg,
): void {
  scene.sunLight.position.copy(latLonToVector3(subSolarLatDeg, subSolarLonDeg, SUN_LIGHT_DISTANCE));
  scene.earthLight.position.copy(
    latLonToVector3(subEarthLatDeg, subEarthLonDeg, EARTHSHINE_LIGHT_DISTANCE),
  );
}
