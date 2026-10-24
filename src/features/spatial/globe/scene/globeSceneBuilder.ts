import * as THREE from 'three';
import { CandidateSite } from '@/domain/sites/candidateSite';
import {
  createGlobeScene,
  isWebGlAvailable,
  GlobeScene,
  MOON_SCENE_RADIUS,
  isSoftwareGl,
} from '@/features/spatial/globe/scene/globeScene';
import { MoonSurface, createMoonSurface } from '@/features/spatial/globe/scene/globeSurfaceMaterial';
import { createGraticuleGroup, createPolarFootprintGroup } from '@/features/spatial/globe/scene/globeGraticule';
import { SiteMarker, applyMarkerHorizonOcclusion, createSiteMarkers } from '@/features/spatial/globe/scene/globeSiteMarkers';
import { CameraTransitioner, createCameraTransitioner } from '@/features/spatial/globe/interaction/globeCameraPresets';
import { createMarkerPickingController } from '@/features/spatial/globe/interaction/globePicking';
import { createPolarTerrainFeatures } from '@/features/spatial/globe/scene/globePolarTerrain';

/** Used if the container has not laid out yet; the ResizeObserver corrects it immediately. */
const FALLBACK_CONTAINER_WIDTH = 500;
const FALLBACK_CONTAINER_HEIGHT = 450;

export interface GlobeDiagnosticsMetrics {
  fps: number;
  frameTimeMs: number;
  frameTimeP95Ms: number;
  drawCalls: number;
  triangles: number;
  cameraDistance: number;
  cameraTargetDistance: number;
  cameraNear: number;
  pixelRatio: number;
  isSoftwareGl: boolean;
}

export interface GlobeSceneHandle {
  globe: GlobeScene;
  surfaceMesh: THREE.Mesh;
  graticuleGroup: THREE.Group;
  footprintGroup: THREE.Group;
  vectorsGroup: THREE.Group;
  markers: Map<string, SiteMarker>;
  transitioner: CameraTransitioner;
  setSelectedSiteId?: (id: string) => void;
  setDisplayOptions?: (opts: { showMarkers?: boolean; showLabels?: boolean; showTerrain?: boolean }) => void;
  getDiagnostics?: () => GlobeDiagnosticsMetrics;
  dispose: () => void;
}

export interface GlobeSceneBuildInput {
  container: HTMLDivElement;
  /** Markers are built once, so the opening selection is passed in explicitly. */
  initialSelectedSiteId: string;
  onSurfaceSettled: () => void;
  onSurfaceUnavailable: (message: string) => void;
  onHoverChange: (site: CandidateSite | null) => void;
  /** Hovering must not leave a badge lit on a site the workspace has since selected. */
  isSiteSelected: (siteId: string) => boolean;
  onPick: (site: CandidateSite) => void;
}

/**
 * Builds the WebGL globe: renderer, displaced LROC surface, line overlays,
 * candidate markers, pointer picking, the render loop and the resize binding.
 * Returns a handle that owns its own disposal.
 */
export function buildGlobeScene(input: GlobeSceneBuildInput): GlobeSceneHandle | null {
  const { container } = input;
  if (!isWebGlAvailable()) return null;

  const globe = createGlobeScene(
    container.clientWidth || FALLBACK_CONTAINER_WIDTH,
    container.clientHeight || FALLBACK_CONTAINER_HEIGHT,
  );
  container.appendChild(globe.renderer.domElement);

  const surface = createMoonSurface({
    onTextureSettled: input.onSurfaceSettled,
    onSurfaceUnavailable: input.onSurfaceUnavailable,
  });

  const globeGroup = new THREE.Group();
  globeGroup.add(surface.mesh);
  globe.scene.add(globeGroup);

  const footprintGroup = createPolarFootprintGroup();
  globeGroup.add(footprintGroup);

  const polarTerrain = createPolarTerrainFeatures(input.initialSelectedSiteId);
  globeGroup.add(polarTerrain.group);

  const graticuleGroup = createGraticuleGroup();
  globeGroup.add(graticuleGroup);

  const vectorsGroup = new THREE.Group();
  globeGroup.add(vectorsGroup);

  const { markers, hitTargets } = createSiteMarkers(input.initialSelectedSiteId);
  markers.forEach((marker) => globeGroup.add(marker.container));

  const picking = createMarkerPickingController(container, globe.renderer.domElement, globe.camera, hitTargets, {
    onHoverEnter: (site) => {
      // Unselected badges reveal on hover; the selected site's badge is always drawn.
      const marker = markers.get(site.id);
      if (marker && !marker.badge.visible) marker.badge.visible = true;
      input.onHoverChange(site);
    },
    onHoverExit: (siteId) => {
      const marker = markers.get(siteId);
      if (marker && !input.isSiteSelected(siteId)) marker.badge.visible = false;
      input.onHoverChange(null);
    },
    onHoverCursorChange: (isPointer) => {
      container.style.cursor = isPointer ? 'pointer' : 'grab';
    },
    onPick: input.onPick,
  });
  picking.attach();

  const occlusionScratch = new THREE.Vector3();
  const transitioner = createCameraTransitioner();
  let currentSelectedSiteId = input.initialSelectedSiteId;
  let displayOptions = { showMarkers: true, showLabels: true, showTerrain: true };

  // User manual drag/orbit immediately interrupts in-flight camera transitions
  const handleControlsStart = () => {
    transitioner.cancel();
  };
  globe.controls.addEventListener('start', handleControlsStart);

  let animationId = 0;
  const frameTimes: number[] = [];
  let lastFrameTimestamp = performance.now();
  let lastStatsUpdate = performance.now();
  let cachedMetrics: GlobeDiagnosticsMetrics = {
    fps: 60,
    frameTimeMs: 16.6,
    frameTimeP95Ms: 16.6,
    drawCalls: 0,
    triangles: 0,
    cameraDistance: 4.8,
    cameraTargetDistance: 0,
    cameraNear: 0.05,
    pixelRatio: globe.renderer.getPixelRatio(),
    isSoftwareGl,
  };

  const animate = () => {
    animationId = requestAnimationFrame(animate);

    const now = performance.now();
    const dt = now - lastFrameTimestamp;
    lastFrameTimestamp = now;
    if (dt > 0 && dt < 200) {
      frameTimes.push(dt);
      if (frameTimes.length > 60) frameTimes.shift();
    }

    if (now - lastStatsUpdate > 250) {
      lastStatsUpdate = now;
      if (frameTimes.length > 0) {
        const sorted = [...frameTimes].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? median;
        const avgDt = frameTimes.reduce((sum, v) => sum + v, 0) / frameTimes.length;
        cachedMetrics = {
          fps: Math.round(1000 / (avgDt || 16.6)),
          frameTimeMs: Math.round(median * 10) / 10,
          frameTimeP95Ms: Math.round(p95 * 10) / 10,
          drawCalls: globe.renderer.info.render.calls,
          triangles: globe.renderer.info.render.triangles,
          cameraDistance: Math.round(globe.camera.position.length() * 100) / 100,
          cameraTargetDistance: Math.round(globe.camera.position.distanceTo(globe.controls.target) * 100) / 100,
          cameraNear: globe.camera.near,
          pixelRatio: globe.renderer.getPixelRatio(),
          isSoftwareGl,
        };
      }
    }

    transitioner.step(globe.camera, globe.controls);

    // Anti-penetration collision guard: prevent camera from penetrating inside Moon sphere (radius 1.45)
    const distToCenter = globe.camera.position.length();
    const MIN_SAFE_ALTITUDE = 0.015;
    if (distToCenter < MOON_SCENE_RADIUS + MIN_SAFE_ALTITUDE) {
      globe.camera.position.setLength(MOON_SCENE_RADIUS + MIN_SAFE_ALTITUDE);
    }

    // Dynamic scale-aware near clipping plane adjustment
    const distToTarget = globe.camera.position.distanceTo(globe.controls.target);
    const targetNear = distToTarget < 0.20 ? 0.002 : distToTarget < 0.8 ? 0.01 : 0.05;
    if (Math.abs(globe.camera.near - targetNear) > 0.001) {
      globe.camera.near = targetNear;
      globe.camera.updateProjectionMatrix();
    }

    applyMarkerHorizonOcclusion(
      markers,
      globe.camera.position,
      globe.controls.target,
      currentSelectedSiteId,
      occlusionScratch,
      displayOptions,
    );
    globe.controls.update();
    globe.renderer.render(globe.scene, globe.camera);
  };
  animationId = requestAnimationFrame(animate);

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        globe.camera.aspect = width / height;
        globe.camera.updateProjectionMatrix();
        globe.renderer.setSize(width, height);
      }
    }
  });
  resizeObserver.observe(container);

  return {
    globe,
    surfaceMesh: surface.mesh,
    graticuleGroup,
    footprintGroup,
    vectorsGroup,
    markers,
    transitioner,
    setSelectedSiteId: (id: string) => {
      currentSelectedSiteId = id;
      polarTerrain.updateLandingReticle(id);
    },
    setDisplayOptions: (opts: { showMarkers?: boolean; showLabels?: boolean; showTerrain?: boolean }) => {
      displayOptions = { ...displayOptions, ...opts };
      if (opts.showTerrain !== undefined) {
        surface.mesh.visible = opts.showTerrain;
      }
    },
    getDiagnostics: () => cachedMetrics,
    dispose: () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      picking.detach();
      globe.controls.removeEventListener('start', handleControlsStart);
      if (container.contains(globe.renderer.domElement)) {
        container.removeChild(globe.renderer.domElement);
      }
      globe.controls.dispose();
      globe.renderer.dispose();
      surface.dispose();
      polarTerrain.dispose();
    },
  };
}
