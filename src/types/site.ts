/**
 * Lunar South-Pole Candidate Site Types
 * Grounded in NASA Artemis candidate exploration regions and LRO scientific literature.
 */

export interface LunarCoordinates {
  latitudeDeg: number;       // e.g. -89.900 (negative is South)
  longitudeDeg: number;      // 0.000 to 360.000 or -180 to +180 East
  elevationMeters: number;   // Relative to reference lunar sphere of 1737.4 km radius
  convention: string;        // 'IAU/IAG Lunar Mean Earth/Polar Axis'
}

export type CandidateSitePriority = 'Artemis III Candidate' | 'VIPER Target Region' | 'Permanent Shadow Boundary' | 'Benchmark Calibration Site';

export interface CandidateSite {
  id: string;
  code: string;              // e.g. 'SITE-001'
  name: string;              // e.g. 'Shackleton Crater Rim'
  coordinates: LunarCoordinates;
  priority: CandidateSitePriority;
  description: string;
  // Local horizon terrain profile elevation angles (degrees) relative to mean sphere at sample azimuths
  // Negative values mean dip into depression, positive values mean obstruction by adjacent massifs/rims
  meanTerrainHorizonDeg: number;
  maxTerrainObstructionDeg: number;
  coverageStatus: 'High (LOLA DEM 128ppd)' | 'Moderate (LOLA 60ppd)' | 'Benchmark Validated';
  isDemoFixture?: boolean;
}
