import React from 'react';
import {
  Sun,
  Globe as EarthIcon,
  Radio,
  Clock,
  Compass,
  Zap,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { CandidateSite } from '../../types/site';
import { CelestialGeometryResult, CalculationMode } from '../../types/celestial';
import {
  formatNumber,
  formatAngle,
  formatDistance,
  formatDuration,
  formatElevation,
} from '../../lib/formatters';

interface CanonicalScenarioMetricsProps {
  site: CandidateSite;
  conditions: CelestialGeometryResult;
  calculationMode: CalculationMode;
  onOpenMethodDetails?: () => void;
}

export function CanonicalScenarioMetrics({
  site,
  conditions,
  calculationMode,
  onOpenMethodDetails,
}: CanonicalScenarioMetricsProps) {
  const sunElev = conditions.sunElevationDeg.kind === 'available' ? conditions.sunElevationDeg.value : null;
  const earthElev = conditions.earthElevationDeg.kind === 'available' ? conditions.earthElevationDeg.value : null;
  const terrainElev = conditions.localTerrainElevationAtSunAzimuthDeg.kind === 'available'
    ? conditions.localTerrainElevationAtSunAzimuthDeg.value
    : 0;

  // Solar flux calculation (Solar constant S0 = 1361 W/m2; grazing solar projection S0 * sin(max(0, elev)))
  const solarFlux = sunElev !== null && sunElev > 0
    ? 1361 * Math.sin((sunElev * Math.PI) / 180)
    : 0;

  // Horizon clearance: sun angle minus terrain obstruction
  const clearance = sunElev !== null ? sunElev - terrainElev : null;

  // Illumination fraction
  const illumFraction = conditions.solarIlluminationFraction.kind === 'available'
    ? conditions.solarIlluminationFraction.value * 100
    : null;

  const rangeVal = conditions.rangeKm.kind === 'available' ? conditions.rangeKm.value : null;
  const lightTimeVal = conditions.theoreticalOneWayLightTimeSeconds.kind === 'available'
    ? conditions.theoreticalOneWayLightTimeSeconds.value
    : null;

  return (
    <section className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] p-4 sm:p-5 flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--lm-color-border-subtle)] pb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-[var(--lm-color-text-secondary)] uppercase tracking-wider font-mono">
            Canonical Scenario Key Metrics
          </h3>
          <span className="text-[10px] font-mono text-[var(--lm-color-selected-site)] bg-[var(--lm-color-surface-strong)] px-2 py-0.5 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-selected-site)]/30">
            Validated JPL DE421
          </span>
        </div>

        {onOpenMethodDetails && (
          <button
            type="button"
            onClick={onOpenMethodDetails}
            className="text-[11px] font-mono text-[var(--lm-color-text-muted)] hover:text-white transition-colors underline underline-offset-2"
          >
            Method Definitions & Units
          </button>
        )}
      </div>

      {/* 8-Card Responsive Scientific Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* 1. Sun Elevation */}
        <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3 flex flex-col justify-between">
          <div className="text-[11px] text-[var(--lm-color-text-secondary)] flex items-center gap-1 font-medium">
            <Sun className="w-3.5 h-3.5 text-[var(--lm-color-sun)]" />
            <span>Sun Elevation</span>
          </div>
          <div className="my-1.5 font-bold font-mono-num text-lg sm:text-xl text-[var(--lm-color-sun)]">
            {formatAngle(sunElev, { decimals: 3, sign: true })}
          </div>
          <div className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate">
            {calculationMode === 'terrain-aware' ? 'Mean horizon basis' : 'Spherical Ideal'}
          </div>
        </div>

        {/* 2. Solar Disc Illumination */}
        <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3 flex flex-col justify-between">
          <div className="text-[11px] text-[var(--lm-color-text-secondary)] flex items-center gap-1 font-medium">
            <Zap className="w-3.5 h-3.5 text-[var(--lm-color-sun)]" />
            <span>Solar Disc Illumination</span>
          </div>
          <div className="my-1.5 font-bold font-mono-num text-lg sm:text-xl text-[var(--lm-color-text-primary)]">
            {illumFraction !== null ? `${formatNumber(illumFraction, { decimals: 1 })}%` : '—'}
          </div>
          <div className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate">
            {conditions.solarIllumination === 'illuminated'
              ? 'Direct Sunlight'
              : conditions.solarIllumination === 'partial-penumbra'
              ? 'Grazing Penumbra'
              : 'Sub-Horizon Shadow'}
          </div>
        </div>

        {/* 3. Incident Solar Flux */}
        <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3 flex flex-col justify-between">
          <div className="text-[11px] text-[var(--lm-color-text-secondary)] flex items-center gap-1 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Incident Solar Flux</span>
          </div>
          <div className="my-1.5 font-bold font-mono-num text-lg sm:text-xl text-[var(--lm-color-text-primary)]">
            {formatNumber(solarFlux, { decimals: 1 })} <span className="text-xs font-mono font-normal text-[var(--lm-color-text-muted)]">W/m²</span>
          </div>
          <div className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate">
            Lambertian Projection (S₀ · sin θ)
          </div>
        </div>

        {/* 4. Earth Elevation */}
        <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3 flex flex-col justify-between">
          <div className="text-[11px] text-[var(--lm-color-text-secondary)] flex items-center gap-1 font-medium">
            <EarthIcon className="w-3.5 h-3.5 text-[var(--lm-color-earth)]" />
            <span>Earth Elevation</span>
          </div>
          <div className="my-1.5 font-bold font-mono-num text-lg sm:text-xl text-[var(--lm-color-earth)]">
            {formatAngle(earthElev, { decimals: 3, sign: true })}
          </div>
          <div className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate">
            {conditions.earthVisibility === 'visible' ? 'Geometric LOS' : 'Terrain Blocked / Sub-horizon'}
          </div>
        </div>

        {/* 5. Theoretical 1-Way Light Time */}
        <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3 flex flex-col justify-between">
          <div className="text-[11px] text-[var(--lm-color-text-secondary)] flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-[var(--lm-color-text-secondary)]" />
            <span>Theoretical 1-Way Light Time</span>
          </div>
          <div className="my-1.5 font-bold font-mono-num text-lg sm:text-xl text-[var(--lm-color-text-primary)]">
            {formatDuration(lightTimeVal, 4)}
          </div>
          <div className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate">
            τ = d / c (Vacuum line-of-sight)
          </div>
        </div>

        {/* 6. Earth-Moon Distance */}
        <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3 flex flex-col justify-between">
          <div className="text-[11px] text-[var(--lm-color-text-secondary)] flex items-center gap-1 font-medium">
            <Radio className="w-3.5 h-3.5 text-[var(--lm-color-text-secondary)]" />
            <span>Earth-Moon Distance</span>
          </div>
          <div className="my-1.5 font-bold font-mono-num text-lg sm:text-xl text-[var(--lm-color-text-primary)]">
            {formatDistance(rangeVal, 0)}
          </div>
          <div className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate">
            Topocentric Center Distance
          </div>
        </div>

        {/* 7. Terrain Horizon Clearance */}
        <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3 flex flex-col justify-between">
          <div className="text-[11px] text-[var(--lm-color-text-secondary)] flex items-center gap-1 font-medium">
            <Compass className="w-3.5 h-3.5 text-[var(--lm-color-selected-site)]" />
            <span>Terrain Horizon Clearance</span>
          </div>
          <div className={`my-1.5 font-bold font-mono-num text-lg sm:text-xl ${clearance !== null && clearance >= 0 ? 'text-[var(--lm-color-selected-site)]' : 'text-[var(--lm-color-danger)]'}`}>
            {formatAngle(clearance, { decimals: 3, sign: true })}
          </div>
          <div className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate">
            {clearance !== null && clearance > 0 ? 'Clear Margin' : 'Terrain Obstructed'}
          </div>
        </div>

        {/* 8. PSR Classification */}
        <div className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3 flex flex-col justify-between">
          <div className="text-[11px] text-[var(--lm-color-text-secondary)] flex items-center gap-1 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>PSR Classification</span>
          </div>
          <div className="my-1.5 font-bold font-mono text-sm sm:text-base text-[var(--lm-color-text-primary)] leading-tight">
            {site.priority.includes('Shadow') ? 'Permanent Shadow' : 'Periodically Illuminated'}
          </div>
          <div className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate">
            {site.coverageStatus}
          </div>
        </div>
      </div>
    </section>
  );
}
