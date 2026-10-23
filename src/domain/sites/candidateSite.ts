/** A candidate exploration site and its terrain-mask summary. */

import { LunarCoordinates } from '@/domain/sites/coordinates';

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
