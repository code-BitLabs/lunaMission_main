import * as THREE from 'three';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';
import { CRATERS } from '@/features/spatial/map/layers/CraterLayer';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';

/** Conversion constant: Moon radius is 1737.4 km in reality, MOON_SCENE_RADIUS (1.45) in scene units */
const KM_TO_SCENE_UNITS = MOON_SCENE_RADIUS / 1737.4;

export interface PolarTerrainGroup {
  group: THREE.Group;
  updateLandingReticle: (selectedSiteId: string) => void;
  dispose: () => void;
}

/**
 * Creates 3D lunar south-polar topographic features:
 * 1. 3D Crater rims with elevated walls and shadowed interior floors (Shackleton, de Gerlache, Faustini, etc.).
 * 2. Malapert Massif prominent elevated mountain ridge (+5.1 km).
 * 3. Precision landing target reticle (touchdown circle & approach axis) at selected site.
 * 4. Permanently Shadowed Region (PSR) cold-trap baseplates.
 */
export function createPolarTerrainFeatures(initialSelectedSiteId: string): PolarTerrainGroup {
  const group = new THREE.Group();
  group.name = 'PolarTerrainFeatures';

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // 1. Crater Topography: Rim ridge loops and PSR floor disks
  CRATERS.forEach((crater) => {
    const center = latLonToVector3(crater.lat, crater.lon, MOON_SCENE_RADIUS);
    const normal = center.clone().normalize();
    const radiusScene = (crater.diameterKm / 2) * KM_TO_SCENE_UNITS;

    // A. Crater Rim Ridge (Elevated 3D ring with realistic regolith tone)
    const rimPoints: THREE.Vector3[] = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      // Tangent and bitangent
      const arbitrary = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const tangent = normal.clone().cross(arbitrary).normalize();
      const bitangent = normal.clone().cross(tangent).normalize();

      const offset = tangent.clone().multiplyScalar(Math.cos(angle) * radiusScene)
        .add(bitangent.clone().multiplyScalar(Math.sin(angle) * radiusScene));

      // Rim elevation: +1.2 km above mean datum
      const rimElevation = 1.2 * KM_TO_SCENE_UNITS;
      const pt = center.clone().add(offset).add(normal.clone().multiplyScalar(rimElevation));
      rimPoints.push(pt);
    }

    const rimGeo = new THREE.BufferGeometry().setFromPoints(rimPoints);
    geometries.push(rimGeo);

    const rimMat = new THREE.LineBasicMaterial({
      color: 0x475569, // Muted lunar highland basalt tone
      transparent: true,
      opacity: 0.65,
      linewidth: 1.5,
    });
    materials.push(rimMat);
    group.add(new THREE.Line(rimGeo, rimMat));

    // B. Permanently Shadowed Region (PSR) Interior Floor
    if (crater.hasPsr) {
      const floorRadius = radiusScene * 0.72;
      const floorGeo = new THREE.CircleGeometry(floorRadius, 32);
      geometries.push(floorGeo);

      const floorMat = new THREE.MeshBasicMaterial({
        color: 0x030712, // Ultra-dark cold trap absorption
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      });
      materials.push(floorMat);

      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      // Depressed below mean surface by -2.5 km
      const floorPos = center.clone().add(normal.clone().multiplyScalar(-2.5 * KM_TO_SCENE_UNITS));
      floorMesh.position.copy(floorPos);
      floorMesh.lookAt(floorPos.clone().add(normal));
      group.add(floorMesh);
    }
  });

  // 2. Malapert Massif Elevation Landmark
  const malapertSite = CANDIDATE_SITES.find((s) => s.id === 'malapert-massif');
  if (malapertSite) {
    const massifCenter = latLonToVector3(
      malapertSite.coordinates.latitudeDeg,
      malapertSite.coordinates.longitudeDeg,
      MOON_SCENE_RADIUS,
    );
    const normal = massifCenter.clone().normalize();
    const peakHeight = 5.1 * KM_TO_SCENE_UNITS; // +5.1 km elevation peak

    const ridgePoints: THREE.Vector3[] = [];
    const north = new THREE.Vector3(0, 1, 0);
    const ridgeDir = north.clone().cross(normal).normalize();

    // 20 km ridge line
    const halfLen = 10 * KM_TO_SCENE_UNITS;
    ridgePoints.push(massifCenter.clone().add(ridgeDir.clone().multiplyScalar(-halfLen)).add(normal.clone().multiplyScalar(peakHeight * 0.7)));
    ridgePoints.push(massifCenter.clone().add(normal.clone().multiplyScalar(peakHeight)));
    ridgePoints.push(massifCenter.clone().add(ridgeDir.clone().multiplyScalar(halfLen)).add(normal.clone().multiplyScalar(peakHeight * 0.7)));

    const ridgeGeo = new THREE.BufferGeometry().setFromPoints(ridgePoints);
    geometries.push(ridgeGeo);
    const ridgeMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8, // Bright massif crest illuminated by grazing sunlight
      transparent: true,
      opacity: 0.85,
      linewidth: 2.0,
    });
    materials.push(ridgeMat);
    group.add(new THREE.Line(ridgeGeo, ridgeMat));
  }

  // 3. Precision Artemis Landing Target Reticle
  const reticleGroup = new THREE.Group();
  reticleGroup.name = 'LandingTargetReticle';
  group.add(reticleGroup);

  function buildLandingReticle(siteId: string) {
    while (reticleGroup.children.length > 0) {
      const child = reticleGroup.children[0];
      reticleGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) (child as any).material.dispose();
    }

    const site = CANDIDATE_SITES.find((s) => s.id === siteId) || CANDIDATE_SITES[0];
    const sitePos = latLonToVector3(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg, MOON_SCENE_RADIUS * 1.002);
    const normal = sitePos.clone().normalize();

    // 1000 m diameter primary touchdown zone circle
    const landingRadiusScene = 1.0 * KM_TO_SCENE_UNITS; // 1 km radius
    const circlePoints: THREE.Vector3[] = [];
    const arbitrary = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const tangent = normal.clone().cross(arbitrary).normalize();
    const bitangent = normal.clone().cross(tangent).normalize();

    for (let i = 0; i <= 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const pt = sitePos.clone()
        .add(tangent.clone().multiplyScalar(Math.cos(a) * landingRadiusScene))
        .add(bitangent.clone().multiplyScalar(Math.sin(a) * landingRadiusScene));
      circlePoints.push(pt);
    }

    const landingRing = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(circlePoints),
      new THREE.LineDashedMaterial({
        color: 0x22d3ee, // Artemis landing cyan
        dashSize: 0.002,
        gapSize: 0.0015,
        transparent: true,
        opacity: 0.85,
      }),
    );
    landingRing.computeLineDistances();
    reticleGroup.add(landingRing);

    // Crosshairs centered on touchdown point
    const armLen = landingRadiusScene * 1.35;
    const ch1 = [sitePos.clone().add(tangent.clone().multiplyScalar(-armLen)), sitePos.clone().add(tangent.clone().multiplyScalar(armLen))];
    const ch2 = [sitePos.clone().add(bitangent.clone().multiplyScalar(-armLen)), sitePos.clone().add(bitangent.clone().multiplyScalar(armLen))];

    const chMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.7 });
    reticleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ch1), chMat));
    reticleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ch2), chMat));
  }

  buildLandingReticle(initialSelectedSiteId);

  return {
    group,
    updateLandingReticle: (selectedSiteId: string) => {
      buildLandingReticle(selectedSiteId);
    },
    dispose: () => {
      while (reticleGroup.children.length > 0) {
        const child = reticleGroup.children[0];
        reticleGroup.remove(child);
        if ((child as any).geometry) (child as any).geometry.dispose();
        if ((child as any).material) (child as any).material.dispose();
      }
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
