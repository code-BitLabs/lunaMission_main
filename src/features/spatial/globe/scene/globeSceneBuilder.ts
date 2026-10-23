import * as THREE from 'three';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { createGlobeScene, isWebGlAvailable, GlobeScene } from '@/features/spatial/globe/scene/globeScene';
import { MoonSurface, createMoonSurface } from '@/features/spatial/globe/scene/globeSurfaceMaterial';
import { createGraticuleGroup, createPolarFootprintGroup } from '@/features/spatial/globe/scene/globeGraticule';
import { SiteMarker, applyMarkerHorizonOcclusion, createSiteMarkers } from '@/features/spatial/globe/scene/globeSiteMarkers';
import { CameraTransitioner, createCameraTransitioner } from '@/features/spatial/globe/interaction/globeCameraPresets';
import { createMarkerPickingController } from '@/features/spatial/globe/interaction/globePicking';

/** Used if the container has not laid out yet; the ResizeObserver corrects it immediately. */
const FALLBACK_CONTAINER_WIDTH = 500;
const FALLBACK_CONTAINER_HEIGHT = 450;

export interface GlobeSceneHandle {
  globe: GlobeScene;
  graticuleGroup: THREE.Group;
  footprintGroup: THREE.Group;
  vectorsGroup: THREE.Group;
  markers: Map<string, SiteMarker>;
  transitioner: CameraTransitioner;
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

  // User manual drag/orbit immediately interrupts in-flight camera transitions
  const handleControlsStart = () => {
    transitioner.cancel();
  };
  globe.controls.addEventListener('start', handleControlsStart);

  let animationId = 0;
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    transitioner.step(globe.camera, globe.controls);
    applyMarkerHorizonOcclusion(markers, globe.camera.position, occlusionScratch);
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
    graticuleGroup,
    footprintGroup,
    vectorsGroup,
    markers,
    transitioner,
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
    },
  };
}
