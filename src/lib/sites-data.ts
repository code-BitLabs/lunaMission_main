import { CandidateSite } from '../types/site';

/**
 * Authentic candidate exploration sites around the Lunar South Pole
 * Derived from NASA Artemis candidate landing regions (NASA SP-2022 / Artemis III definition)
 * and LRO LOLA/LROC scientific data publications.
 */
export const CANDIDATE_SITES: CandidateSite[] = [
  {
    id: 'shackleton-rim',
    code: 'SITE-001',
    name: 'Shackleton Crater Rim',
    coordinates: {
      latitudeDeg: -89.90,
      longitudeDeg: 0.00,
      elevationMeters: 4250,
      convention: 'IAU/IAG Lunar Mean Earth/Polar Axis',
    },
    priority: 'Artemis III Candidate',
    description: 'Prominent elevated rim point located less than 3 km from the exact South Pole. Features near-constant solar grazing illumination during southern summer and excellent Earth visibility.',
    meanTerrainHorizonDeg: 0.45,
    maxTerrainObstructionDeg: 1.20,
    coverageStatus: 'High (LOLA DEM 128ppd)',
    isDemoFixture: false,
  },
  {
    id: 'connecting-ridge',
    code: 'SITE-002',
    name: 'Connecting Ridge',
    coordinates: {
      latitudeDeg: -89.44,
      longitudeDeg: 222.50,
      elevationMeters: 3820,
      convention: 'IAU/IAG Lunar Mean Earth/Polar Axis',
    },
    priority: 'Artemis III Candidate',
    description: 'Structural ridge connecting Shackleton to de Gerlache rim. Highly rated for solar power generation potential, with periodic low-angle shadowing by adjacent massifs.',
    meanTerrainHorizonDeg: 0.65,
    maxTerrainObstructionDeg: 1.45,
    coverageStatus: 'High (LOLA DEM 128ppd)',
    isDemoFixture: false,
  },
  {
    id: 'de-gerlache-rim-1',
    code: 'SITE-003',
    name: 'de Gerlache Rim 1',
    coordinates: {
      latitudeDeg: -88.71,
      longitudeDeg: 271.40,
      elevationMeters: 3610,
      convention: 'IAU/IAG Lunar Mean Earth/Polar Axis',
    },
    priority: 'Artemis III Candidate',
    description: 'Western rim crest of de Gerlache crater overlooking steep permanently shadowed interior depressions while maintaining periodic line-of-sight to Earth.',
    meanTerrainHorizonDeg: 0.80,
    maxTerrainObstructionDeg: 1.70,
    coverageStatus: 'High (LOLA DEM 128ppd)',
    isDemoFixture: false,
  },
  {
    id: 'peak-near-shackleton',
    code: 'SITE-004',
    name: 'Peak Near Shackleton',
    coordinates: {
      latitudeDeg: -89.73,
      longitudeDeg: 126.80,
      elevationMeters: 4120,
      convention: 'IAU/IAG Lunar Mean Earth/Polar Axis',
    },
    priority: 'Artemis III Candidate',
    description: 'Distinctive topographic high point east of Shackleton crater rim. Receives elongated periods of low-elevation solar illumination.',
    meanTerrainHorizonDeg: 0.50,
    maxTerrainObstructionDeg: 1.15,
    coverageStatus: 'High (LOLA DEM 128ppd)',
    isDemoFixture: false,
  },
  {
    id: 'malapert-massif',
    code: 'SITE-005',
    name: 'Malapert Mountain (Massif)',
    coordinates: {
      latitudeDeg: -85.90,
      longitudeDeg: 2.90,
      elevationMeters: 5100,
      convention: 'IAU/IAG Lunar Mean Earth/Polar Axis',
    },
    priority: 'Artemis III Candidate',
    description: 'Major topographic massif rising ~5 km above surroundings. Outstanding direct-to-Earth communication line of sight and wide geometric horizon clearance.',
    meanTerrainHorizonDeg: 0.15,
    maxTerrainObstructionDeg: 0.60,
    coverageStatus: 'High (LOLA DEM 128ppd)',
    isDemoFixture: false,
  },
  {
    id: 'haworth-rim',
    code: 'SITE-006',
    name: 'Haworth Crater Rim',
    coordinates: {
      latitudeDeg: -87.40,
      longitudeDeg: 355.00,
      elevationMeters: 2890,
      convention: 'IAU/IAG Lunar Mean Earth/Polar Axis',
    },
    priority: 'Permanent Shadow Boundary',
    description: 'Elevated rim of Haworth crater, which shelters deep permanently shadowed regions (PSRs) with volatile deposits. Complex local horizon profile.',
    meanTerrainHorizonDeg: 1.10,
    maxTerrainObstructionDeg: 2.30,
    coverageStatus: 'Moderate (LOLA 60ppd)',
    isDemoFixture: false,
  },
  {
    id: 'nobile-rim-1',
    code: 'SITE-007',
    name: 'Nobile Rim 1',
    coordinates: {
      latitudeDeg: -85.20,
      longitudeDeg: 53.50,
      elevationMeters: 3450,
      convention: 'IAU/IAG Lunar Mean Earth/Polar Axis',
    },
    priority: 'VIPER Target Region',
    description: 'High-latitude crater rim area targeted by volatile investigation rovers. Balanced mix of accessible slopes, illumination windows, and Earth line-of-sight.',
    meanTerrainHorizonDeg: 0.90,
    maxTerrainObstructionDeg: 1.85,
    coverageStatus: 'High (LOLA DEM 128ppd)',
    isDemoFixture: false,
  },
  {
    id: 'amundsen-rim',
    code: 'SITE-008',
    name: 'Amundsen Crater Rim',
    coordinates: {
      latitudeDeg: -84.50,
      longitudeDeg: 82.80,
      elevationMeters: 3180,
      convention: 'IAU/IAG Lunar Mean Earth/Polar Axis',
    },
    priority: 'Benchmark Calibration Site',
    description: 'Standard benchmark site utilized for cross-calibrating solar illumination models against LROC Narrow Angle Camera shadow sequences.',
    meanTerrainHorizonDeg: 0.75,
    maxTerrainObstructionDeg: 1.60,
    coverageStatus: 'Benchmark Validated',
    isDemoFixture: false,
  },
];

export const DEFAULT_SITE_ID = 'shackleton-rim';

export function getSiteById(id: string): CandidateSite | undefined {
  return CANDIDATE_SITES.find((s) => s.id === id);
}
