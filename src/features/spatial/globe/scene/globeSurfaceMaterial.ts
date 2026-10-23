import * as THREE from 'three';
import { MOON_SCENE_RADIUS } from '@/features/spatial/globe/scene/globeScene';

const LROC_COLOR_TEXTURE_URL = '/assets/lunar/lroc_color_2k.jpg';
const LROC_POLAR_FALLBACK_TEXTURE_URL = '/assets/lunar/lroc_color_poles_1k.jpg';
const LOLA_DEM_TEXTURE_URL = '/assets/lunar/ldem_topo.jpg';

/** 160x160 sphere geometry gives enough vertices for mountain peaks and crater rims. */
const MOON_SPHERE_SEGMENTS = 160;
const REGOLITH_ROUGHNESS = 0.94;
const REGOLITH_METALNESS = 0.01;
const REGOLITH_TINT = 0xd2d2d2;
const DEM_DISPLACEMENT_SCALE = 0.026;
const DEM_DISPLACEMENT_BIAS = -0.013;
const NORMAL_MAP_STRENGTH = 2.4;
const NORMAL_SCALE = 1.8;
/** Prime meridian sits at the centre of the equirectangular maps, which is +Z here. */
const TEXTURE_PRIME_MERIDIAN_ROTATION_Y = -Math.PI / 2;

/** Normal map built in memory from a grayscale DEM through a Sobel gradient. */
function generateNormalMapFromImage(image: HTMLImageElement, strength: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const w = canvas.width;
  const h = canvas.height;

  const heights = new Float32Array(w * h);
  for (let i = 0; i < heights.length; i++) {
    const idx = i * 4;
    heights[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255.0;
  }

  for (let y = 0; y < h; y++) {
    const yAbove = (y > 0 ? y - 1 : y) * w;
    const yBelow = (y < h - 1 ? y + 1 : y) * w;
    const yCenter = y * w;

    for (let x = 0; x < w; x++) {
      const xLeft = x > 0 ? x - 1 : x;
      const xRight = x < w - 1 ? x + 1 : x;

      const dx =
        (heights[yAbove + xRight] + 2 * heights[yCenter + xRight] + heights[yBelow + xRight]) -
        (heights[yAbove + xLeft] + 2 * heights[yCenter + xLeft] + heights[yBelow + xLeft]);

      const dy =
        (heights[yBelow + xLeft] + 2 * heights[yBelow + x] + heights[yBelow + xRight]) -
        (heights[yAbove + xLeft] + 2 * heights[yAbove + x] + heights[yAbove + xRight]);

      const nx = -dx * strength;
      const ny = -dy * strength;
      const nz = 1.0;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const outIdx = (yCenter + x) * 4;

      data[outIdx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      data[outIdx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      data[outIdx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      data[outIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export interface MoonSurfaceHandlers {
  /** One call per texture that resolved, including the polar-map fallback. */
  onTextureSettled: () => void;
  /** Both color maps failed: the globe renders without LROC surface imagery. */
  onSurfaceUnavailable: (message: string) => void;
}

export interface MoonSurface {
  mesh: THREE.Mesh;
  dispose: () => void;
}

/** NASA LROC color mosaic plus LOLA DEM relief applied to the Moon sphere. */
export function createMoonSurface({ onTextureSettled, onSurfaceUnavailable }: MoonSurfaceHandlers): MoonSurface {
  const textureLoader = new THREE.TextureLoader();

  const colorTexture = textureLoader.load(LROC_COLOR_TEXTURE_URL, onTextureSettled, undefined, (err) => {
    console.warn('NASA LROC color texture failed to load, falling back to pole mosaic', err);
    textureLoader.load(LROC_POLAR_FALLBACK_TEXTURE_URL, onTextureSettled, undefined, () => {
      onSurfaceUnavailable('Failed to load NASA LROC surface textures');
    });
  });

  const material = new THREE.MeshStandardMaterial({
    map: colorTexture,
    roughness: REGOLITH_ROUGHNESS,
    metalness: REGOLITH_METALNESS,
    color: new THREE.Color(REGOLITH_TINT),
  });

  const topoImage = new Image();
  topoImage.src = LOLA_DEM_TEXTURE_URL;
  let topoTexture: THREE.Texture | null = null;
  let normalTexture: THREE.CanvasTexture | null = null;

  topoImage.onload = () => {
    topoTexture = new THREE.Texture(topoImage);
    topoTexture.needsUpdate = true;
    topoTexture.wrapS = THREE.RepeatWrapping;
    topoTexture.wrapT = THREE.ClampToEdgeWrapping;

    normalTexture = generateNormalMapFromImage(topoImage, NORMAL_MAP_STRENGTH);

    material.displacementMap = topoTexture;
    material.displacementScale = DEM_DISPLACEMENT_SCALE;
    material.displacementBias = DEM_DISPLACEMENT_BIAS;

    material.normalMap = normalTexture;
    material.normalScale = new THREE.Vector2(NORMAL_SCALE, NORMAL_SCALE);
    material.needsUpdate = true;

    onTextureSettled();
  };

  topoImage.onerror = () => {
    console.warn('LOLA DEM image load failed');
    onTextureSettled();
  };

  const geometry = new THREE.SphereGeometry(MOON_SCENE_RADIUS, MOON_SPHERE_SEGMENTS, MOON_SPHERE_SEGMENTS);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.y = TEXTURE_PRIME_MERIDIAN_ROTATION_Y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return {
    mesh,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      colorTexture.dispose();
      if (topoTexture) topoTexture.dispose();
      if (normalTexture) normalTexture.dispose();
    },
  };
}
