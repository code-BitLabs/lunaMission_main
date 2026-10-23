import * as THREE from 'three';
import { CandidateSite } from '@/domain/sites/candidateSite';
import {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
} from '@/domain/coordinates/frames';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';

const SUN_VECTOR_COLOR = 0xf59e0b;
const EARTH_VECTOR_COLOR = 0x38bdf8;
/** Warning amber DTE link when Earth is below the local geometric horizon. */
const BLOCKED_LINK_COLOR = 0xf59e0b;
/** Muted slate link when Earth elevation is unavailable/unknown. */
const UNKNOWN_LINK_COLOR = 0x94a3b8;

const VECTOR_ORIGIN_LIFT = 1.018;

/** Visual display distances for apparent sky-direction targets (clearly disclosed in legend as not to physical scale). */
const SUN_SPHERE_DISTANCE = 5.2;
const SUN_SPHERE_RADIUS = 0.22;
const SUN_CORONA_SPRITE_SIZE = 0.85;

const EARTH_SPHERE_DISTANCE = 4.8;
const EARTH_SPHERE_RADIUS = 0.18;
const EARTH_ATMOSPHERE_RADIUS = 0.192;
const EARTH_ATMOSPHERE_OPACITY = 0.25;

const LINK_OPEN_DASH = 0.14;
const LINK_OPEN_GAP = 0.05;
const LINK_OPEN_OPACITY = 0.9;
const LINK_BLOCKED_DASH = 0.05;
const LINK_BLOCKED_GAP = 0.07;
const LINK_BLOCKED_OPACITY = 0.5;

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

/** Generates a high-quality, realistic planetary Earth texture with oceans, continents, and cloud bands. */
function createEarthCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 256);
  oceanGrad.addColorStop(0, '#10264d');
  oceanGrad.addColorStop(0.5, '#163b75');
  oceanGrad.addColorStop(1, '#0e203f');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 512, 256);

  // Continents: natural earth tones (Eurasia, Africa, Americas, Australia, Antarctica)
  ctx.fillStyle = '#2d5a3f'; // Vegetation green

  // Eurasia & Africa approximate landmass
  ctx.beginPath();
  ctx.ellipse(310, 85, 80, 45, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(285, 140, 42, 55, 0.1, 0, Math.PI * 2); // Africa
  ctx.fill();

  ctx.fillStyle = '#655d42'; // Sahara / arid belt
  ctx.beginPath();
  ctx.ellipse(285, 115, 38, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Americas
  ctx.fillStyle = '#2d5a3f';
  ctx.beginPath();
  ctx.ellipse(140, 80, 50, 40, 0.3, 0, Math.PI * 2); // North America
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(175, 165, 32, 50, 0.25, 0, Math.PI * 2); // South America
  ctx.fill();

  // Australia
  ctx.beginPath();
  ctx.ellipse(400, 175, 28, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Polar ice caps
  ctx.fillStyle = '#eaf2fd';
  ctx.fillRect(0, 0, 512, 18);
  ctx.fillRect(0, 238, 512, 18);

  // Atmospheric cloud bands (translucent swirling bands)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
  for (let i = 0; i < 7; i++) {
    const y = 45 + i * 26;
    ctx.beginPath();
    ctx.ellipse(100 + i * 45, y, 65, 10, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(340 + i * 25, y + 6, 75, 12, -0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/** Generates a warm luminous radial corona glow sprite for the Sun. */
function createSunCoronaSprite(): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.2, 'rgba(255, 236, 179, 0.9)');
  gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.45)');
  gradient.addColorStop(0.85, 'rgba(245, 158, 11, 0.12)');
  gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  sprite.scale.set(SUN_CORONA_SPRITE_SIZE, SUN_CORONA_SPRITE_SIZE, 1);
  return sprite;
}

/** Creates a high-legibility billboard label tag in 3D scene space. */
function createCelestialLabel(text: string, colorHex: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 220;
  canvas.height = 56;
  const ctx = canvas.getContext('2d')!;

  // Dark translucent background with colored border
  ctx.fillStyle = 'rgba(6, 14, 27, 0.92)';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  const r = 10;
  const w = 214;
  const h = 50;
  const x = 3;
  const y = 3;
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
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colorHex;
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 110, 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, transparent: true })
  );
  sprite.scale.set(0.32, 0.08, 1);
  return sprite;
}

/** Empties the layer and disposes all allocated textures, geometries, and materials. */
export function clearCelestialVectors(group: THREE.Group): void {
  group.children.slice().forEach((child) => {
    group.remove(child);
    if (child instanceof THREE.Sprite) {
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
      return;
    }
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      if (child.geometry) child.geometry.dispose();
      const material = child.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) {
        material.forEach((m) => {
          if ('map' in m && m.map) (m.map as THREE.Texture).dispose();
          m.dispose();
        });
      } else if (material) {
        if ('map' in material && material.map) (material.map as THREE.Texture).dispose();
        material.dispose();
      }
    }
  });
}

/**
 * Renders the Sun (luminous light source + corona) and Earth (realistic planetary disc + atmosphere)
 * strictly synchronized with canonical ephemeris coordinates and observer sightlines.
 */
export function renderCelestialVectors(group: THREE.Group, input: CelestialVectorInput): void {
  clearCelestialVectors(group);
  if (!input.showVectors) return;

  const origin = latLonToVector3(
    input.site.coordinates.latitudeDeg,
    input.site.coordinates.longitudeDeg,
    MOON_SCENE_RADIUS * VECTOR_ORIGIN_LIFT,
  );

  // ----------------------------------------------------
  // 1. SUN: Luminous celestial body & directional ray
  // ----------------------------------------------------
  const sunOrbPos = latLonToVector3(input.subSolarLatDeg, input.subSolarLonDeg, SUN_SPHERE_DISTANCE);

  // Luminous Sun sphere
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_SPHERE_RADIUS, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe082 })
  );
  sunMesh.position.copy(sunOrbPos);
  group.add(sunMesh);

  // Corona glow sprite
  const coronaSprite = createSunCoronaSprite();
  coronaSprite.position.copy(sunOrbPos);
  group.add(coronaSprite);

  // Sun Label
  const sunLabel = createCelestialLabel('☀ SUN', '#f59e0b');
  sunLabel.position.copy(sunOrbPos.clone().add(new THREE.Vector3(0, 0.32, 0)));
  group.add(sunLabel);

  // Sun Direction Ray (dashed gold ray pointing from Sun toward Moon)
  const sunRay = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([sunOrbPos, origin]),
    new THREE.LineDashedMaterial({
      color: SUN_VECTOR_COLOR,
      dashSize: 0.16,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.65,
    })
  );
  sunRay.computeLineDistances();
  group.add(sunRay);

  // ----------------------------------------------------
  // 2. EARTH: Recognizable planetary sphere + atmosphere
  // ----------------------------------------------------
  const earthOrbPos = latLonToVector3(input.subEarthLatDeg, input.subEarthLonDeg, EARTH_SPHERE_DISTANCE);
  const earthTexture = createEarthCanvasTexture();

  // Planetary Earth sphere
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_SPHERE_RADIUS, 36, 36),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.05,
    })
  );
  earthMesh.position.copy(earthOrbPos);
  // Orient Earth texture so equator aligns horizontally
  earthMesh.rotation.y = -Math.PI / 2;
  group.add(earthMesh);

  // Soft atmospheric haze (smooth translucent outer shell, NO WIREFRAME)
  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_ATMOSPHERE_RADIUS, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: EARTH_ATMOSPHERE_OPACITY,
    })
  );
  atmosphereMesh.position.copy(earthOrbPos);
  group.add(atmosphereMesh);

  // Line of sight: Above horizon is active blue; confirmed below horizon is amber warning; unknown is neutral slate
  const isElevationKnown = input.earthElevationDeg !== null;
  const hasLineOfSight = isElevationKnown && input.earthElevationDeg > 0;

  const earthStatusText = !isElevationKnown
    ? '⊕ EARTH [ELEVATION UNKNOWN]'
    : hasLineOfSight
      ? '⊕ EARTH • GEOMETRIC SIGHTLINE'
      : '⊕ EARTH [SUB-HORIZON]';

  const earthLabelColor = !isElevationKnown
    ? '#94a3b8'
    : hasLineOfSight
      ? '#38bdf8'
      : '#f59e0b';

  const earthLabel = createCelestialLabel(earthStatusText, earthLabelColor);
  earthLabel.position.copy(earthOrbPos.clone().add(new THREE.Vector3(0, 0.28, 0)));
  group.add(earthLabel);

  // Direct-To-Earth geometric sightline ray
  const linkColor = !isElevationKnown
    ? UNKNOWN_LINK_COLOR
    : hasLineOfSight
      ? EARTH_VECTOR_COLOR
      : BLOCKED_LINK_COLOR;

  const linkDash = hasLineOfSight ? LINK_OPEN_DASH : LINK_BLOCKED_DASH;
  const linkGap = hasLineOfSight ? LINK_OPEN_GAP : LINK_BLOCKED_GAP;
  const linkOpacity = !isElevationKnown ? 0.35 : hasLineOfSight ? LINK_OPEN_OPACITY : LINK_BLOCKED_OPACITY;

  const linkLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([origin, earthOrbPos]),
    new THREE.LineDashedMaterial({
      color: linkColor,
      dashSize: linkDash,
      gapSize: linkGap,
      transparent: true,
      opacity: linkOpacity,
    })
  );
  linkLine.computeLineDistances();
  group.add(linkLine);
}
