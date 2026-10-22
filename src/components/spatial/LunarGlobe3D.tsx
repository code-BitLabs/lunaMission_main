import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Compass,
  AlertCircle,
  Loader2,
  Grid,
  Sun,
  Globe as EarthIcon,
  Maximize2,
  Eye,
  Crosshair,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { CandidateSite } from '../../types/site';
import { CANDIDATE_SITES } from '../../lib/sites-data';

export type CameraPreset = 'nadir' | 'oblique' | 'site' | 'global';

export interface LunarGlobe3DProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  subSolarLatDeg: number;
  subSolarLonDeg: number;
  showGrid?: boolean;
  showPolarFootprint?: boolean;
  showVectors?: boolean;
  onToggleGrid?: () => void;
  onTogglePolarFootprint?: () => void;
  onToggleVectors?: () => void;
  hideHeader?: boolean;
  hideRibbon?: boolean;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
}

// Convert selenographic latitude/longitude to 3D Cartesian coordinates on sphere
// Lat: +90° North (+Y), -90° South (-Y)
// Lon: 0° Prime Meridian facing Earth (+Z), +90° East (+X), 270° West (-X)
export function latLonToVector3(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = lonDeg * (Math.PI / 180);
  const x = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);
  return new THREE.Vector3(x, y, z);
}

// Generate high-resolution normal map from grayscale DEM heightmap in-memory
function generateNormalMapFromImage(image: HTMLImageElement, strength = 2.2): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const w = canvas.width;
  const h = canvas.height;

  // Extract luminance array
  const heights = new Float32Array(w * h);
  for (let i = 0; i < heights.length; i++) {
    const idx = i * 4;
    // Normalized height 0.0 - 1.0
    heights[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255.0;
  }

  // Sobel filter to compute surface normals
  for (let y = 0; y < h; y++) {
    const yAbove = (y > 0 ? y - 1 : y) * w;
    const yBelow = (y < h - 1 ? y + 1 : y) * w;
    const yCenter = y * w;

    for (let x = 0; x < w; x++) {
      const xLeft = x > 0 ? x - 1 : x;
      const xRight = x < w - 1 ? x + 1 : x;

      // Sobel horizontal gradient
      const dx =
        (heights[yAbove + xRight] + 2 * heights[yCenter + xRight] + heights[yBelow + xRight]) -
        (heights[yAbove + xLeft] + 2 * heights[yCenter + xLeft] + heights[yBelow + xLeft]);

      // Sobel vertical gradient
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

export function LunarGlobe3D({
  selectedSite,
  onSelectSite,
  subSolarLatDeg,
  subSolarLonDeg,
  showGrid: propShowGrid,
  showPolarFootprint: propShowPolarFootprint,
  showVectors: propShowVectors,
  onToggleGrid,
  onTogglePolarFootprint,
  onToggleVectors,
  hideHeader = false,
  hideRibbon = false,
  cameraPreset: propCameraPreset,
  onCameraPresetChange,
}: LunarGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Layer toggles
  const [localShowGrid, setLocalShowGrid] = useState(false);
  const [localShowPolarFootprint, setLocalShowPolarFootprint] = useState(true);
  const [localShowVectors, setLocalShowVectors] = useState(true);
  const [localActivePreset, setLocalActivePreset] = useState<CameraPreset>('nadir');
  const [hoveredSite, setHoveredSite] = useState<CandidateSite | null>(null);

  const showGrid = propShowGrid !== undefined ? propShowGrid : localShowGrid;
  const showPolarFootprint = propShowPolarFootprint !== undefined ? propShowPolarFootprint : localShowPolarFootprint;
  const showVectors = propShowVectors !== undefined ? propShowVectors : localShowVectors;
  const activePreset = propCameraPreset !== undefined ? propCameraPreset : localActivePreset;

  const toggleGrid = onToggleGrid || (() => setLocalShowGrid((v) => !v));
  const togglePolarFootprint = onTogglePolarFootprint || (() => setLocalShowPolarFootprint((v) => !v));
  const toggleVectors = onToggleVectors || (() => setLocalShowVectors((v) => !v));

  // Three.js scene refs
  const sceneContextRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    moonMesh: THREE.Mesh;
    globeGroup: THREE.Group;
    sunLight: THREE.DirectionalLight;
    earthLight: THREE.DirectionalLight;
    gridGroup: THREE.Group;
    polarFootprintGroup: THREE.Group;
    vectorsGroup: THREE.Group;
    markersMap: Map<
      string,
      {
        container: THREE.Group;
        ring: THREE.Mesh;
        beacon: THREE.Mesh;
        stalk: THREE.Line;
        badge: THREE.Sprite;
        site: CandidateSite;
      }
    >;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    isTransitioning: boolean;
    transitionTarget: {
      camPos: THREE.Vector3;
      lookTarget: THREE.Vector3;
      upVector: THREE.Vector3;
      progress: number;
    } | null;
  } | null>(null);

  // Helper to create text sprite for scientific site pins and polar labels
  const createTextBadge = useCallback((text: string, isSelected: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Background pill
    ctx.fillStyle = isSelected ? 'rgba(12, 19, 32, 0.92)' : 'rgba(7, 11, 18, 0.85)';
    ctx.strokeStyle = isSelected ? '#70D6C5' : '#4A6585';
    ctx.lineWidth = isSelected ? 3 : 1.5;

    const r = 12;
    const x = 4;
    const y = 8;
    const w = 248;
    const h = 48;

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
    ctx.fill();
    ctx.stroke();

    // Text label
    ctx.fillStyle = isSelected ? '#70D6C5' : '#F1F5F9';
    ctx.font = isSelected ? 'bold 20px "JetBrains Mono", monospace' : '18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: true,
      depthWrite: false,
      transparent: true,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.24, 0.06, 1);
    return sprite;
  }, []);

  // Set up camera preset positioning
  const applyCameraPreset = useCallback(
    (preset: CameraPreset, site = selectedSite) => {
      const ctx = sceneContextRef.current;
      if (!ctx) return;

      if (onCameraPresetChange) {
        onCameraPresetChange(preset);
      } else {
        setLocalActivePreset(preset);
      }

      const moonRadius = 1.45;

      let targetCamPos: THREE.Vector3;
      let targetLook: THREE.Vector3;
      let targetUp: THREE.Vector3;

      if (preset === 'nadir') {
        // Direct Nadir view of South Pole (matching 2D polar map orientation)
        // Looking up from negative Y (-90°), with Up vector along +Z (0° Earth Prime Meridian)
        targetCamPos = new THREE.Vector3(0, -3.4, 0.0001);
        targetLook = new THREE.Vector3(0, 0, 0);
        targetUp = new THREE.Vector3(0, 0, 1);
      } else if (preset === 'oblique') {
        // Perspective view looking across the South Pole towards the terminator
        targetCamPos = new THREE.Vector3(0, -2.6, 2.2);
        targetLook = new THREE.Vector3(0, -1.2, 0);
        targetUp = new THREE.Vector3(0, 0.6, 0.8).normalize();
      } else if (preset === 'site') {
        // Focus on selected candidate site
        const sitePos = latLonToVector3(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg, moonRadius);
        const siteNormal = sitePos.clone().normalize();
        targetCamPos = sitePos.clone().add(siteNormal.clone().multiplyScalar(0.7)).add(new THREE.Vector3(0, 0.2, 0.2));
        targetLook = sitePos.clone();
        targetUp = new THREE.Vector3(0, 0, 1);
      } else {
        // Global Earth-facing view
        targetCamPos = new THREE.Vector3(0, 0, 4.8);
        targetLook = new THREE.Vector3(0, 0, 0);
        targetUp = new THREE.Vector3(0, 1, 0);
      }

      ctx.transitionTarget = {
        camPos: targetCamPos,
        lookTarget: targetLook,
        upVector: targetUp,
        progress: 0,
      };
      ctx.isTransitioning = true;
    },
    [selectedSite, onCameraPresetChange]
  );

  // Sync external cameraPreset changes
  useEffect(() => {
    if (propCameraPreset && propCameraPreset !== localActivePreset) {
      applyCameraPreset(propCameraPreset, selectedSite);
    }
  }, [propCameraPreset, applyCameraPreset, selectedSite, localActivePreset]);

  // Main Scene Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        setIsLoading(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      setIsLoading(false);
      return;
    }

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    // Three.js Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b12);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 100);
    // Initial camera: South Pole Nadir
    camera.position.set(0, -3.4, 0.0001);
    camera.up.set(0, 0, 1);
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

    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.6;
    controls.maxDistance = 8.5;
    controls.target.set(0, 0, 0);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const moonRadius = 1.45;
    // 160x160 sphere geometry provides accurate displacement for mountain peaks and crater rims
    const moonGeometry = new THREE.SphereGeometry(moonRadius, 160, 160);

    // Load authentic NASA LROC Color Map and LOLA DEM Elevation
    const textureLoader = new THREE.TextureLoader();
    let texturesToLoad = 2;
    let texturesLoadedCount = 0;

    function handleTextureLoaded() {
      texturesLoadedCount++;
      if (texturesLoadedCount >= texturesToLoad) {
        setIsLoading(false);
      }
    }

    // 1. Color Texture: NASA LROC WAC Global Mosaic (2048x1024)
    const colorTexture = textureLoader.load(
      '/assets/lunar/lroc_color_2k.jpg',
      handleTextureLoaded,
      undefined,
      (err) => {
        console.warn('NASA LROC color texture failed to load, falling back to pole mosaic', err);
        textureLoader.load('/assets/lunar/lroc_color_poles_1k.jpg', handleTextureLoaded, undefined, () => {
          setLoadingError('Failed to load NASA LROC surface textures');
          setIsLoading(false);
        });
      }
    );

    // 2. Elevation Map: NASA LOLA DEM (1024x512)
    const topoImage = new Image();
    topoImage.src = '/assets/lunar/ldem_topo.jpg';
    let topoTexture: THREE.Texture | null = null;
    let normalTexture: THREE.CanvasTexture | null = null;

    // Photometric Regolith Material:
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: colorTexture,
      roughness: 0.94,
      metalness: 0.01,
      color: new THREE.Color(0xd2d2d2),
    });

    topoImage.onload = () => {
      topoTexture = new THREE.Texture(topoImage);
      topoTexture.needsUpdate = true;
      topoTexture.wrapS = THREE.RepeatWrapping;
      topoTexture.wrapT = THREE.ClampToEdgeWrapping;

      normalTexture = generateNormalMapFromImage(topoImage, 2.4);

      moonMaterial.displacementMap = topoTexture;
      moonMaterial.displacementScale = 0.026;
      moonMaterial.displacementBias = -0.013;

      moonMaterial.normalMap = normalTexture;
      moonMaterial.normalScale = new THREE.Vector2(1.8, 1.8);
      moonMaterial.needsUpdate = true;

      handleTextureLoaded();
    };

    topoImage.onerror = () => {
      console.warn('LOLA DEM image load failed');
      handleTextureLoaded();
    };

    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    // Align texture Prime Meridian (center of equirectangular map) with +Z axis
    moonMesh.rotation.y = -Math.PI / 2;
    moonMesh.castShadow = true;
    moonMesh.receiveShadow = true;
    globeGroup.add(moonMesh);

    // ----------------------------------------------------
    // Lighting Setup: Physically Grounded Lunar Illumination
    // ----------------------------------------------------
    // 1. Direct Sun Light: matches sub-solar position computed from current UTC epoch
    const sunLight = new THREE.DirectionalLight(0xfff6e5, 2.7);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.camera.left = -2.5;
    sunLight.shadow.camera.right = 2.5;
    sunLight.shadow.camera.top = 2.5;
    sunLight.shadow.camera.bottom = -2.5;
    sunLight.shadow.bias = -0.0002;
    scene.add(sunLight);

    // 2. Earthshine / Ambient Space Light
    const ambientLight = new THREE.AmbientLight(0x0a1220, 0.14);
    scene.add(ambientLight);

    // 3. Earth Direct Reflection
    const earthLight = new THREE.DirectionalLight(0x8ccbff, 0.22);
    earthLight.position.set(0, 0, 10);
    scene.add(earthLight);

    // ----------------------------------------------------
    // 2D Polar Map Boundary Footprint & Polar Graticule
    // ----------------------------------------------------
    const polarFootprintGroup = new THREE.Group();
    globeGroup.add(polarFootprintGroup);

    // 1. Primary Boundary Ring: 83°S (exact coverage of 2D Polar Stereographic Map)
    const boundaryLat = -83;
    const boundaryPoints: THREE.Vector3[] = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const lon = (i / segments) * 360;
      boundaryPoints.push(latLonToVector3(boundaryLat, lon, moonRadius * 1.008));
    }
    const boundaryGeo = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundaryMat = new THREE.LineDashedMaterial({
      color: 0x70d6c5,
      dashSize: 0.04,
      gapSize: 0.02,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.85,
    });
    const boundaryLine = new THREE.Line(boundaryGeo, boundaryMat);
    boundaryLine.computeLineDistances();
    polarFootprintGroup.add(boundaryLine);

    // 2. Concentric Polar Latitude Rings: 85°S, 88°S
    const innerLats = [-85, -88];
    innerLats.forEach((lat) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const lon = (i / segments) * 360;
        pts.push(latLonToVector3(lat, lon, moonRadius * 1.004));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0x4a6585,
        transparent: true,
        opacity: 0.45,
      });
      polarFootprintGroup.add(new THREE.Line(geo, mat));
    });

    // 3. South Pole Crosshair (90°S)
    const poleCrossPoints = [
      latLonToVector3(-89.5, 0, moonRadius * 1.01),
      latLonToVector3(-89.5, 180, moonRadius * 1.01),
      latLonToVector3(-89.5, 90, moonRadius * 1.01),
      latLonToVector3(-89.5, 270, moonRadius * 1.01),
    ];
    const crossGeo1 = new THREE.BufferGeometry().setFromPoints([poleCrossPoints[0], poleCrossPoints[1]]);
    const crossGeo2 = new THREE.BufferGeometry().setFromPoints([poleCrossPoints[2], poleCrossPoints[3]]);
    const crossMat = new THREE.LineBasicMaterial({ color: 0x70d6c5, transparent: true, opacity: 0.75 });
    polarFootprintGroup.add(new THREE.Line(crossGeo1, crossMat));
    polarFootprintGroup.add(new THREE.Line(crossGeo2, crossMat));

    // ----------------------------------------------------
    // Selenographic Coordinate Grid (Full Globe)
    // ----------------------------------------------------
    const gridGroup = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({ color: 0x334b6b, transparent: true, opacity: 0.28 });
    const primeMat = new THREE.LineBasicMaterial({ color: 0x8ccbff, transparent: true, opacity: 0.5 });

    // Latitude circles
    const globalLats = [0, -30, -60, -75];
    globalLats.forEach((lat) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const lon = (i / 64) * 360;
        pts.push(latLonToVector3(lat, lon, moonRadius * 1.002));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(geo, gridMat));
    });

    // Meridians
    const meridians = [0, 90, 180, 270];
    meridians.forEach((lon) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const lat = -90 + (i / 64) * 180;
        pts.push(latLonToVector3(lat, lon, moonRadius * 1.002));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(geo, lon === 0 ? primeMat : gridMat));
    });
    gridGroup.visible = showGrid;
    globeGroup.add(gridGroup);

    // ----------------------------------------------------
    // Celestial Vectors Group (Sun & Earth Direction Rays)
    // ----------------------------------------------------
    const vectorsGroup = new THREE.Group();
    globeGroup.add(vectorsGroup);

    // ----------------------------------------------------
    // Candidate Site Scientific Markers in 3D
    // ----------------------------------------------------
    const markersMap = new Map<
      string,
      {
        container: THREE.Group;
        ring: THREE.Mesh;
        beacon: THREE.Mesh;
        stalk: THREE.Line;
        badge: THREE.Sprite;
        site: CandidateSite;
      }
    >();

    CANDIDATE_SITES.forEach((site) => {
      const isSelected = site.id === selectedSite.id;
      const surfacePos = latLonToVector3(
        site.coordinates.latitudeDeg,
        site.coordinates.longitudeDeg,
        moonRadius * 1.006
      );
      const normal = surfacePos.clone().normalize();
      const stalkHeight = 0.055;
      const beaconPos = surfacePos.clone().add(normal.clone().multiplyScalar(stalkHeight));

      const markerContainer = new THREE.Group();
      markerContainer.userData = { siteId: site.id };

      // 1. Surface Datum Target Ring
      const ringGeo = new THREE.RingGeometry(0.016, 0.024, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x70d6c5 : 0x8ccbff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(surfacePos);
      ringMesh.lookAt(surfacePos.clone().add(normal));
      markerContainer.add(ringMesh);

      // 2. Vertical Telemetry Stalk
      const stalkGeo = new THREE.BufferGeometry().setFromPoints([surfacePos, beaconPos]);
      const stalkMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x70d6c5 : 0x64748b,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.5,
      });
      const stalkLine = new THREE.Line(stalkGeo, stalkMat);
      markerContainer.add(stalkLine);

      // 3. Top Beacon Marker Sphere
      const beaconGeo = new THREE.SphereGeometry(0.014, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x70d6c5 : 0x8ccbff,
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.copy(beaconPos);
      markerContainer.add(beaconMesh);

      // 4. Billboarded Scientific Label Badge
      const badge = createTextBadge(site.code, isSelected);
      badge.position.copy(beaconPos.clone().add(normal.clone().multiplyScalar(0.035)));
      markerContainer.add(badge);

      globeGroup.add(markerContainer);
      markersMap.set(site.id, {
        container: markerContainer,
        ring: ringMesh,
        beacon: beaconMesh,
        stalk: stalkLine,
        badge,
        site,
      });
    });

    // ----------------------------------------------------
    // User Interaction & Raycasting
    // ----------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    sceneContextRef.current = {
      scene,
      camera,
      renderer,
      controls,
      moonMesh,
      globeGroup,
      sunLight,
      earthLight,
      gridGroup,
      polarFootprintGroup,
      vectorsGroup,
      markersMap,
      raycaster,
      mouse,
      isTransitioning: false,
      transitionTarget: null,
    };

    let isMouseDown = false;
    let downPos = { x: 0, y: 0 };

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return;
      isMouseDown = true;
      downPos = { x: e.clientX, y: e.clientY };
    }

    function onPointerUp(e: PointerEvent) {
      if (!isMouseDown) return;
      isMouseDown = false;

      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (dist < 6 && containerRef.current && sceneContextRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const targets: THREE.Object3D[] = [];
        markersMap.forEach(({ beacon, ring }) => {
          targets.push(beacon);
          targets.push(ring);
        });

        const hits = raycaster.intersectObjects(targets, false);
        if (hits.length > 0) {
          const hitParent = hits[0].object.parent;
          if (hitParent && hitParent.userData.siteId) {
            const foundSite = CANDIDATE_SITES.find((s) => s.id === hitParent.userData.siteId);
            if (foundSite) {
              onSelectSite(foundSite);
            }
          }
        }
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!containerRef.current || !sceneContextRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targets: THREE.Object3D[] = [];
      markersMap.forEach(({ beacon, ring }) => {
        targets.push(beacon);
        targets.push(ring);
      });

      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        const hitParent = hits[0].object.parent;
        if (hitParent && hitParent.userData.siteId) {
          const found = CANDIDATE_SITES.find((s) => s.id === hitParent.userData.siteId);
          setHoveredSite(found || null);
          return;
        }
      }
      setHoveredSite(null);
    }

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointermove', onPointerMove);

    // ----------------------------------------------------
    // Animation Render Loop
    // ----------------------------------------------------
    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      const ctx = sceneContextRef.current;
      if (!ctx) return;

      // Handle camera transition lerp
      if (ctx.isTransitioning && ctx.transitionTarget) {
        const tt = ctx.transitionTarget;
        tt.progress = Math.min(1.0, tt.progress + 0.04);
        ctx.camera.position.lerp(tt.camPos, 0.08);
        ctx.camera.up.lerp(tt.upVector, 0.08);
        ctx.controls.target.lerp(tt.lookTarget, 0.08);

        if (tt.progress >= 1.0) {
          ctx.camera.position.copy(tt.camPos);
          ctx.camera.up.copy(tt.upVector);
          ctx.controls.target.copy(tt.lookTarget);
          ctx.isTransitioning = false;
          ctx.transitionTarget = null;
        }
      }

      ctx.controls.update();
      ctx.renderer.render(ctx.scene, ctx.camera);
    }
    animate();

    // Resize Handler with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && sceneContextRef.current) {
          sceneContextRef.current.camera.aspect = newW / newH;
          sceneContextRef.current.camera.updateProjectionMatrix();
          sceneContextRef.current.renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointermove', onPointerMove);
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
      controls.dispose();
      renderer.dispose();
      moonGeometry.dispose();
      moonMaterial.dispose();
      colorTexture.dispose();
      if (topoTexture) topoTexture.dispose();
      if (normalTexture) normalTexture.dispose();
    };
  }, [createTextBadge, onSelectSite]);

  // Synchronize Sub-Solar Position (grazing sunlight vector matching canonical epoch)
  useEffect(() => {
    const ctx = sceneContextRef.current;
    if (!ctx) return;

    const sunPos = latLonToVector3(subSolarLatDeg, subSolarLonDeg, 18.0);
    ctx.sunLight.position.copy(sunPos);
  }, [subSolarLatDeg, subSolarLonDeg]);

  // Update 3D Celestial Vectors (Sun beam & Earth LOS line)
  useEffect(() => {
    const ctx = sceneContextRef.current;
    if (!ctx) return;

    const group = ctx.vectorsGroup;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (!showVectors) return;

    const moonRadius = 1.45;
    const origin = latLonToVector3(
      selectedSite.coordinates.latitudeDeg,
      selectedSite.coordinates.longitudeDeg,
      moonRadius * 1.015
    );

    // 1. Sun Direction Ray (Golden #F3CC70)
    const sunDir = latLonToVector3(subSolarLatDeg, subSolarLonDeg, 1.0).normalize();
    const sunArrowLen = 0.55;
    const sunArrow = new THREE.ArrowHelper(sunDir, origin, sunArrowLen, 0xf3cc70, 0.08, 0.04);
    group.add(sunArrow);

    // 2. Direct-to-Earth Line of Sight (Cyan #8CCBFF)
    const earthDir = latLonToVector3(0, 0, 1.0).normalize();
    const earthArrowLen = 0.55;
    const earthArrow = new THREE.ArrowHelper(earthDir, origin, earthArrowLen, 0x8ccbff, 0.08, 0.04);
    group.add(earthArrow);
  }, [selectedSite, subSolarLatDeg, subSolarLonDeg, showVectors]);

  // Synchronize Site Marker Highlights when selected site changes
  useEffect(() => {
    const ctx = sceneContextRef.current;
    if (!ctx) return;

    ctx.markersMap.forEach(({ ring, beacon, stalk, badge, container, site }) => {
      const isSelected = site.id === selectedSite.id;

      (ring.material as THREE.MeshBasicMaterial).color.setHex(isSelected ? 0x70d6c5 : 0x8ccbff);
      (ring.material as THREE.MeshBasicMaterial).opacity = isSelected ? 0.95 : 0.5;
      ring.scale.setScalar(isSelected ? 1.5 : 1.0);

      (beacon.material as THREE.MeshBasicMaterial).color.setHex(isSelected ? 0x70d6c5 : 0x8ccbff);
      beacon.scale.setScalar(isSelected ? 1.4 : 1.0);

      (stalk.material as THREE.LineBasicMaterial).color.setHex(isSelected ? 0x70d6c5 : 0x64748b);
      (stalk.material as THREE.LineBasicMaterial).opacity = isSelected ? 0.95 : 0.45;

      container.remove(badge);
      badge.material.dispose();
      const newBadge = createTextBadge(site.code, isSelected);
      const moonRadius = 1.45;
      const surfacePos = latLonToVector3(
        site.coordinates.latitudeDeg,
        site.coordinates.longitudeDeg,
        moonRadius * 1.006
      );
      const normal = surfacePos.clone().normalize();
      const beaconPos = surfacePos.clone().add(normal.clone().multiplyScalar(0.055));
      newBadge.position.copy(beaconPos.clone().add(normal.clone().multiplyScalar(0.035)));
      container.add(newBadge);
      ctx.markersMap.get(site.id)!.badge = newBadge;
    });
  }, [selectedSite.id, createTextBadge]);

  // Synchronize Layer Toggles
  useEffect(() => {
    const ctx = sceneContextRef.current;
    if (!ctx) return;
    ctx.gridGroup.visible = showGrid;
    ctx.polarFootprintGroup.visible = showPolarFootprint;
  }, [showGrid, showPolarFootprint]);

  if (!webGlSupported) {
    return (
      <div className="w-full h-full min-h-[460px] flex flex-col items-center justify-center p-6 bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-lg)] text-center">
        <AlertCircle className="w-8 h-8 text-[var(--lm-color-warning)] mb-3" />
        <h3 className="text-base font-semibold text-[var(--lm-color-text-primary)]">
          WebGL Acceleration Unavailable
        </h3>
        <p className="text-xs text-[var(--lm-color-text-secondary)] max-w-sm mt-1 mb-4 leading-relaxed">
          The 3D lunar globe requires WebGL. Please use the high-precision 2D South-Pole Map or candidate selection ribbon below.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] overflow-hidden select-none min-h-0">
      {/* 3D Header Bar (rendered only if not hidden by unified workspace) */}
      {!hideHeader && (
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-[var(--lm-color-surface)]/90 backdrop-blur-xs px-2.5 py-1.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
            <span className="text-xs font-semibold text-[var(--lm-color-text-primary)]">
              NASA LRO Lunar Visualization
            </span>
            <span className="text-[10px] font-mono text-[var(--lm-color-selected-site)] border-l border-[var(--lm-color-border)] pl-2">
              LROC Color + LOLA DEM Relief
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5 bg-[var(--lm-color-surface)]/90 backdrop-blur-xs p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
            {/* Camera View Presets */}
            <div className="flex items-center gap-1 border-r border-[var(--lm-color-border)] pr-1.5">
              <button
                type="button"
                onClick={() => applyCameraPreset('nadir')}
                title="South Pole Nadir"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  activePreset === 'nadir'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-[var(--lm-color-selected-site)]" />
                <span>Nadir</span>
              </button>

              <button
                type="button"
                onClick={() => applyCameraPreset('oblique')}
                title="Perspective view across South Pole crater rims and relief"
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  activePreset === 'oblique'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Oblique</span>
              </button>

              <button
                type="button"
                onClick={() => applyCameraPreset('site')}
                title="Fly to and focus on selected candidate site"
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  activePreset === 'site'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Site</span>
              </button>

              <button
                type="button"
                onClick={() => applyCameraPreset('global')}
                title="Global Lunar Sphere Overview"
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  activePreset === 'global'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]'
                }`}
              >
                Global
              </button>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={togglePolarFootprint}
                title="Toggle 2D Polar Map Boundary Circle (83°S Footprint)"
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  showPolarFootprint
                    ? 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/40 font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
              >
                2D Extent
              </button>

              <button
                type="button"
                onClick={toggleVectors}
                title="Toggle Celestial Direction Rays"
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  showVectors
                    ? 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/40 font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
              >
                Vectors
              </button>

              <button
                type="button"
                onClick={toggleGrid}
                title="Toggle Selenographic Coordinate Graticule"
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  showGrid
                    ? 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)]'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--lm-color-canvas)]/85 backdrop-blur-xs text-center p-4">
          <Loader2 className="w-8 h-8 text-[var(--lm-color-selected-site)] animate-spin mb-2.5" />
          <div className="text-xs font-semibold text-[var(--lm-color-text-primary)]">
            Loading NASA LRO Scientific Surface Model...
          </div>
          <div className="text-[11px] text-[var(--lm-color-text-muted)] font-mono mt-1">
            Applying LROC photometric albedo & LOLA DEM topographic relief
          </div>
        </div>
      )}

      {/* Error Notice */}
      {loadingError && (
        <div className="absolute top-14 left-3 right-3 z-20 flex items-center gap-2 p-2 rounded-[var(--lm-radius-sm)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-warning)]/40 text-xs text-[var(--lm-color-warning)]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadingError}</span>
        </div>
      )}

      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing min-h-0" />

      {/* Hovered Candidate Site Tooltip */}
      {hoveredSite && (
        <div className="absolute top-16 left-3 z-20 pointer-events-none bg-[var(--lm-color-surface-strong)]/95 border border-[var(--lm-color-selected-site)] p-2.5 rounded-[var(--lm-radius-sm)] shadow-lg backdrop-blur-xs">
          <div className="text-xs font-semibold text-[var(--lm-color-selected-site)]">
            {hoveredSite.name} ({hoveredSite.code})
          </div>
          <div className="text-[11px] font-mono text-[var(--lm-color-text-secondary)] mt-0.5">
            {Math.abs(hoveredSite.coordinates.latitudeDeg).toFixed(2)}°S,{' '}
            {hoveredSite.coordinates.longitudeDeg.toFixed(2)}°E • Elevation: {hoveredSite.coordinates.elevationMeters > 0 ? '+' : ''}
            {hoveredSite.coordinates.elevationMeters.toLocaleString()} m
          </div>
          <div className="text-[10px] text-[var(--lm-color-text-muted)] mt-1">
            Click to inspect point passport
          </div>
        </div>
      )}

      {/* Scientific Overlay Legend / Orientation Helper */}
      <div className={`absolute ${hideRibbon ? 'bottom-3' : 'bottom-14'} left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none`}>
        <div className="bg-[var(--lm-color-surface)]/85 backdrop-blur-xs px-2.5 py-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] text-[10px] font-mono text-[var(--lm-color-text-muted)] flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--lm-color-sun)] inline-block"></span>
            <span>Sun Vector</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--lm-color-earth)] inline-block"></span>
            <span>Earth LOS (Prime Meridian 0°)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-[var(--lm-color-selected-site)] inline-block"></span>
            <span>83°S Footprint</span>
          </span>
        </div>

        <div className="hidden sm:block bg-[var(--lm-color-surface)]/85 backdrop-blur-xs px-2.5 py-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] text-[10px] font-mono text-[var(--lm-color-text-muted)]">
          Source: NASA GSFC CGI Moon Kit (LROC WAC / LOLA DEM 128ppd)
        </div>
      </div>

      {/* Candidate Quick Selection Ribbon below Globe (rendered only if not hidden by unified workspace) */}
      {!hideRibbon && (
        <div className="bg-[var(--lm-color-surface)] border-t border-[var(--lm-color-border-subtle)] p-2.5 flex items-center gap-2 overflow-x-auto z-10 shrink-0">
          <span className="text-[11px] font-mono text-[var(--lm-color-text-muted)] shrink-0 uppercase tracking-wider">
            Candidate Sites:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {CANDIDATE_SITES.map((site) => {
              const isSelected = site.id === selectedSite.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => {
                    onSelectSite(site);
                    applyCameraPreset('site', site);
                  }}
                  className={`px-2.5 py-1 text-xs font-mono-num rounded-[var(--lm-radius-sm)] transition-colors ${
                    isSelected
                      ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)] font-semibold shadow-xs'
                      : 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] border border-[var(--lm-color-border)] hover:text-white hover:bg-[var(--lm-color-surface-strong)]'
                  }`}
                >
                  {site.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
