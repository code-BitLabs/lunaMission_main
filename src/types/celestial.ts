/**
 * Celestial and Geometric Results Types
 * Strictly enforces scientific integrity, units, explicit availability, and provenance metadata.
 */

export type ResultAvailability<T = number> =
  | { kind: 'available'; value: T; unit: string; qualityNote?: string }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'indeterminate'; reason: string };

export type CalculationMode = 'geometry-only' | 'terrain-aware';
export type ValidationState = 'passed' | 'pending' | 'failed' | 'not-assessed';
export type EarthVisibilityState = 'visible' | 'sub-horizon' | 'indeterminate' | 'unavailable';
export type IlluminationState = 'illuminated' | 'partial-penumbra' | 'shadowed' | 'indeterminate';

export interface MethodProvenance {
  calculationMode: CalculationMode;
  validationState: ValidationState;
  ephemerisSource: string;           // e.g. 'JPL DE421 / Lunar Mean Frame'
  terrainSource: string;             // e.g. 'LRO LOLA DEM 128ppd (NASA PDS)'
  coordinateSystem: string;          // 'IAU/IAG Lunar Mean Earth / Polar Axis'
  timeSystem: 'UTC (Coordinated Universal Time)';
  validationBenchmarkNote?: string;
  isDemoData: boolean;
}

export interface CelestialGeometryResult {
  epochUtc: string;
  julianDate: number;

  // Sun Geometry
  sunElevationDeg: ResultAvailability<number>;
  sunAzimuthDeg: ResultAvailability<number>;
  solarIllumination: IlluminationState;
  solarIlluminationFraction: ResultAvailability<number>; // 0.0 to 1.0 (disk fraction visible)

  // Earth Geometry
  earthElevationDeg: ResultAvailability<number>;
  earthAzimuthDeg: ResultAvailability<number>;
  earthVisibility: EarthVisibilityState;
  rangeKm: ResultAvailability<number>;
  theoreticalOneWayLightTimeSeconds: ResultAvailability<number>; // range / c

  // Local horizon terrain comparison
  localTerrainElevationAtSunAzimuthDeg: ResultAvailability<number>;
  localTerrainElevationAtEarthAzimuthDeg: ResultAvailability<number>;

  // Scientific metadata and qualifiers
  provenance: MethodProvenance;
}

export interface TimelineDataPoint {
  timestampUtc: string;
  epochMs: number;
  sunElevationDeg: number | null;
  earthElevationDeg: number | null;
  solarIlluminated: boolean | null;
  earthVisible: boolean | null;
  hasDataGap?: boolean;
}
