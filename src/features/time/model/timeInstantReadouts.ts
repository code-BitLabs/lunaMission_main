import { availableValue, differenceOrNull } from '@/shared/formatting/availability';
import type { CelestialGeometryResult } from '@/domain/celestial/geometryResult';
import type { EarthVisibilityState, IlluminationState } from '@/domain/celestial/observationStates';

/**
 * The numbers the Time Explorer headlines: current-instant elevations and how
 * far each body sits above the local terrain. Everything is flattened from the
 * shared scenario result, never re-derived, and an unavailable input keeps the
 * derived value unavailable rather than inventing a zero clearance.
 */
export interface TimeInstantReadouts {
  sunElevationDeg: number | null;
  earthElevationDeg: number | null;
  sunClearanceDeg: number | null;
  earthClearanceDeg: number | null;
  rangeKm: number | null;
  solarIllumination: IlluminationState;
  earthVisibility: EarthVisibilityState;
}

export function readInstantReadouts(conditions: CelestialGeometryResult): TimeInstantReadouts {
  const sunElevationDeg = availableValue(conditions.sunElevationDeg);
  const earthElevationDeg = availableValue(conditions.earthElevationDeg);
  return {
    sunElevationDeg,
    earthElevationDeg,
    sunClearanceDeg: differenceOrNull(sunElevationDeg, availableValue(conditions.localTerrainElevationAtSunAzimuthDeg)),
    earthClearanceDeg: differenceOrNull(earthElevationDeg, availableValue(conditions.localTerrainElevationAtEarthAzimuthDeg)),
    rangeKm: availableValue(conditions.rangeKm),
    solarIllumination: conditions.solarIllumination,
    earthVisibility: conditions.earthVisibility,
  };
}

/**
 * Badges collapse the domain's four-state vocabularies into the three the card
 * shows; the fall-throughs are the states the current model cannot reach, kept
 * so the wording never changes if it starts to.
 */
export function solarIlluminationLabel(state: IlluminationState): string {
  if (state === 'illuminated') return 'Fully Illuminated';
  if (state === 'partial-penumbra') return 'Grazing Penumbra';
  return 'Shadowed';
}

export function earthVisibilityLabel(state: EarthVisibilityState): string {
  if (state === 'visible') return 'Geometric Line-of-Sight';
  if (state === 'indeterminate') return 'Limb Grazing';
  return 'Sub-Horizon';
}

/**
 * Shared badge classes. The exact strings are part of the rendered output —
 * merging the three text runs changes Chromium's rasterisation by a pixel.
 */
export const STATUS_BADGE_BASE =
  'px-2 py-0.5 rounded-[var(--lm-radius-xs)] text-xs font-mono font-medium';

export function statusBadgeTone(tone: 'positive' | 'caution' | 'negative'): string {
  if (tone === 'positive') return 'bg-emerald-950/70 text-emerald-400 border border-emerald-800';
  if (tone === 'caution') return 'bg-amber-950/70 text-amber-400 border border-amber-800';
  return 'bg-rose-950/70 text-rose-400 border border-rose-800';
}

export function solarIlluminationTone(state: IlluminationState): 'positive' | 'caution' | 'negative' {
  if (state === 'illuminated') return 'positive';
  if (state === 'partial-penumbra') return 'caution';
  return 'negative';
}

export function earthVisibilityTone(state: EarthVisibilityState): 'positive' | 'caution' | 'negative' {
  if (state === 'visible') return 'positive';
  if (state === 'indeterminate') return 'caution';
  return 'negative';
}
