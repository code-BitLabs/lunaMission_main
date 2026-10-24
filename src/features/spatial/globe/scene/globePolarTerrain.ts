import * as THREE from 'three';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';
import { CRATERS } from '@/features/spatial/map/layers/CraterLayer';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';

/** Conversion constant: Moon radius is 1737.4 km in reality, MOON_SCENE_RADIUS (1.45) in scene units */
const KM_TO_SCENE_UNITS = MOON_SCENE_RADIUS / 1737.4;

export interface PolarTerrainGroup {
  group: THREE.Group;
  updateSelectedSite: (selectedSiteId: string) => void;
  dispose: () => void;
}

/**
 * Creates scientifically grounded 3D lunar south-polar topographic reference features:
 * 1. Crater Morphology Outlines: Elevated 3D rim boundaries derived from IAU/LOLA crater catalog (Shackleton, de Gerlache, etc.).
 *    Explicitly labeled as illustrative morphological catalog bounds, without unverified flat baseplates.
 * 2. Malapert Massif Elevation Landmark: Prominent +5.1 km mountain ridge crest.
 * 3. Candidate Coordinate Benchmark: Calibrated selenographic datum crosshair at the selected candidate's verified coordinates.
 */
export function createPolarTerrainFeatures(initialSelectedSiteId: string): PolarTerrainGroup {
  const group = new THREE.Group();
  group.name = 'PolarTerrainFeatures';

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // 1. Crater Morphology Outlines from IAU/LOLA Crater Catalog
  CRATERS.forEach((crater) => {
    const center = latLonToVector3(crater.lat, crater.lon, MOON_SCENE_RADIUS);
    const normal = center.clone().normalize();
    const radiusScene = (crater.diameterKm / 2) * KM_TO_SCENE_UNITS;

    // Rim Ridge Loop (Illustrative IAU Catalog boundary profile)
    const rimPoints: THREE.Vector3[] = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const arbitrary = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const tangent = normal.clone().cross(arbitrary).normalize();
      const bitangent = normal.clone().cross(tangent).normalize();

      const offset = tangent.clone().multiplyScalar(Math.cos(angle) * radiusScene)
        .add(bitangent.clone().multiplyScalar(Math.sin(angle) * radiusScene));

      // Subtle elevation (+0.8 km) to trace rim topography cleanly over the terrain map
      const rimElevation = 0.8 * KM_TO_SCENE_UNITS;
      const pt = center.clone().add(offset).add(normal.clone().multiplyScalar(rimElevation));
      rimPoints.push(pt);
    }

    const rimGeo = new THREE.BufferGeometry().setFromPoints(rimPoints);
    geometries.push(rimGeo);

    const rimMat = new THREE.LineBasicMaterial({
      color: 0x64748b, // Subdued slate tone
      transparent: true,
      opacity: 0.60,
      linewidth: 1.5,
    });
    materials.push(rimMat);
    group.add(new THREE.Line(rimGeo, rimMat));
  });

  // 2. Malapert Massif Elevation Landmark (+5.1 km crest)
  const malapertSite = CANDIDATE_SITES.find((s) => s.id === 'malapert-massif');
  if (malapertSite) {
    const massifCenter = latLonToVector3(
      malapertSite.coordinates.latitudeDeg,
      malapertSite.coordinates.longitudeDeg,
      MOON_SCENE_RADIUS,
    );
    const normal = massifCenter.clone().normalize();
    const peakHeight = 5.1 * KM_TO_SCENE_UNITS;

    const ridgePoints: THREE.Vector3[] = [];
    const north = new THREE.Vector3(0, 1, 0);
    const ridgeDir = north.clone().cross(normal).normalize();

    const halfLen = 10 * KM_TO_SCENE_UNITS;
    ridgePoints.push(massifCenter.clone().add(ridgeDir.clone().multiplyScalar(-halfLen)).add(normal.clone().multiplyScalar(peakHeight * 0.7)));
    ridgePoints.push(massifCenter.clone().add(normal.clone().multiplyScalar(peakHeight)));
    ridgePoints.push(massifCenter.clone().add(ridgeDir.clone().multiplyScalar(halfLen)).add(normal.clone().multiplyScalar(peakHeight * 0.7)));

    const ridgeGeo = new THREE.BufferGeometry().setFromPoints(ridgePoints);
    geometries.push(ridgeGeo);
    const ridgeMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.80,
      linewidth: 2.0,
    });
    materials.push(ridgeMat);
    group.add(new THREE.Line(ridgeGeo, ridgeMat));
  }

  // 3. Candidate Coordinate Benchmark (IAU 2000 ME Selenographic Datum)
  const benchmarkGroup = new THREE.Group();
  benchmarkGroup.name = 'CandidateCoordinateBenchmark';
  group.add(benchmarkGroup);

  function buildBenchmark(siteId: string) {
    while (benchmarkGroup.children.length > 0) {
      const child = benchmarkGroup.children[0];
      benchmarkGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) (child as any).material.dispose();
    }

    const site = CANDIDATE_SITES.find((s) => s.id === siteId) || CANDIDATE_SITES[0];
    const sitePos = latLonToVector3(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg, MOON_SCENE_RADIUS * 1.001);
    const normal = sitePos.clone().normalize();

    // Tangent frame at site
    const poleAxis = new THREE.Vector3(0, 1, 0);
    let north = poleAxis.clone().sub(normal.clone().multiplyScalar(poleAxis.dot(normal)));
    if (north.lengthSq() < 1e-6) {
      const pm = new THREE.Vector3(0, 0, 1);
      north = pm.clone().sub(normal.clone().multiplyScalar(pm.dot(normal)));
    }
    north.normalize();
    const east = new THREE.Vector3().crossVectors(north, normal).normalize();

    // Subtle crosshair tick marks (1.5 km span) indicating the coordinate datum
    const crosshairSpan = 1.5 * KM_TO_SCENE_UNITS;
    const crosshairPoints: THREE.Vector3[] = [
      sitePos.clone().add(north.clone().multiplyScalar(-crosshairSpan)),
      sitePos.clone().add(north.clone().multiplyScalar(crosshairSpan)),
      sitePos.clone().add(east.clone().multiplyScalar(-crosshairSpan)),
      sitePos.clone().add(east.clone().multiplyScalar(crosshairSpan)),
    ];

    const crossGeo = new THREE.BufferGeometry().setFromPoints(crosshairPoints);
    const crossMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee, // Laser cyan datum
      transparent: true,
      opacity: 0.85,
      linewidth: 1.5,
    });
    benchmarkGroup.add(new THREE.LineSegments(crossGeo, crossMat));
  }

  buildBenchmark(initialSelectedSiteId);

  return {
    group,
    updateSelectedSite: (siteId: string) => {
      buildBenchmark(siteId);
    },
    dispose: () => {
      while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        if ((child as any).geometry) (child as any).geometry.dispose();
        if ((child as any).material) (child as any).material.dispose();
      }
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
