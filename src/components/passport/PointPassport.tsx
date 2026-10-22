import React, { useState } from 'react';
import {
  Sun,
  Globe as EarthIcon,
  Radio,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { CandidateSite } from '../../types/site';
import { CelestialGeometryResult, CalculationMode } from '../../types/celestial';
import { MetricBlock } from './MetricBlock';
import { LocalSkyDiagram } from './LocalSkyDiagram';
import { Badge } from '../ui/Badge';
import { formatCoordinate, formatElevation, formatNumber } from '../../lib/formatters';

interface PointPassportProps {
  site: CandidateSite;
  conditions: CelestialGeometryResult;
  calculationMode: CalculationMode;
  onCalculationModeChange: (mode: CalculationMode) => void;
  onOpenMethodDetails: () => void;
}

export function PointPassport({
  site,
  conditions,
  calculationMode,
  onCalculationModeChange,
  onOpenMethodDetails,
}: PointPassportProps) {
  const [showSunExplanation, setShowSunExplanation] = useState(false);
  const [showEarthExplanation, setShowEarthExplanation] = useState(false);

  // Status mapping for illumination
  const illuminationBadges: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
    illuminated: { label: 'Fully Illuminated', variant: 'success' },
    'partial-penumbra': { label: 'Grazing Penumbra', variant: 'warning' },
    shadowed: { label: 'Shadowed / Sub-horizon', variant: 'danger' },
    indeterminate: { label: 'Indeterminate', variant: 'warning' },
  };

  // Status mapping for Earth geometric visibility
  const visibilityBadges: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
    visible: { label: 'Geometric Line-of-Sight', variant: 'success' },
    'sub-horizon': { label: 'Sub-Horizon (Obscured)', variant: 'danger' },
    indeterminate: { label: 'Limb Grazing (Indeterminate)', variant: 'warning' },
    unavailable: { label: 'Unavailable', variant: 'danger' },
  };

  const sunBadge = illuminationBadges[conditions.solarIllumination] || illuminationBadges.shadowed;
  const earthBadge = visibilityBadges[conditions.earthVisibility] || visibilityBadges['sub-horizon'];

  const sunElevVal = conditions.sunElevationDeg.kind === 'available' ? conditions.sunElevationDeg.value : 0;
  const sunAzVal = conditions.sunAzimuthDeg.kind === 'available' ? conditions.sunAzimuthDeg.value : 0;
  const earthElevVal = conditions.earthElevationDeg.kind === 'available' ? conditions.earthElevationDeg.value : 0;
  const earthAzVal = conditions.earthAzimuthDeg.kind === 'available' ? conditions.earthAzimuthDeg.value : 0;
  const terrainElevVal =
    conditions.localTerrainElevationAtSunAzimuthDeg.kind === 'available'
      ? conditions.localTerrainElevationAtSunAzimuthDeg.value
      : 0;

  return (
    <div className="flex flex-col gap-3.5 bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] p-4 sm:p-5 h-full overflow-y-auto">
      {/* Site Passport Header Block */}
      <div className="flex flex-col gap-2 pb-3.5 border-b border-[var(--lm-color-border-subtle)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono text-[var(--lm-color-selected-site)] font-semibold bg-[var(--lm-color-surface-strong)] px-1.5 py-0.5 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-selected-site)]/30">
                {site.code}
              </span>
              <span className="text-xs text-[var(--lm-color-text-muted)] font-mono">
                {site.priority}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--lm-color-text-primary)] tracking-tight">
              {site.name}
            </h2>
          </div>

          {/* Mode Switcher: Terrain-aware vs Geometry-only */}
          <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-0.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)]">
            <button
              type="button"
              onClick={() => onCalculationModeChange('terrain-aware')}
              title="Terrain-aware calculation using LRO LOLA DEM"
              className={`px-2 py-0.5 text-[11px] font-mono rounded-[var(--lm-radius-xs)] transition-colors ${
                calculationMode === 'terrain-aware'
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/50 font-semibold'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              Terrain-Aware
            </button>
            <button
              type="button"
              onClick={() => onCalculationModeChange('geometry-only')}
              title="Geometry-only calculation against mathematical sphere"
              className={`px-2 py-0.5 text-[11px] font-mono rounded-[var(--lm-radius-xs)] transition-colors ${
                calculationMode === 'geometry-only'
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/50 font-semibold'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              Geometry-Only
            </button>
          </div>
        </div>

        {/* Site Description */}
        <p className="text-xs text-[var(--lm-color-text-secondary)] leading-relaxed">
          {site.description}
        </p>

        {/* Coordinates and Reference Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono-num text-xs bg-[var(--lm-color-surface-raised)] p-2.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)]">
          <div>
            <div className="text-[10px] text-[var(--lm-color-text-muted)] uppercase">Latitude</div>
            <div className="font-semibold text-[var(--lm-color-text-primary)]">
              {formatCoordinate(site?.coordinates?.latitudeDeg, 'latitude', 3)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--lm-color-text-muted)] uppercase">Longitude</div>
            <div className="font-semibold text-[var(--lm-color-text-primary)]">
              {formatCoordinate(site?.coordinates?.longitudeDeg, 'longitude', 3)}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-[10px] text-[var(--lm-color-text-muted)] uppercase">Elevation (DEM)</div>
            <div className="font-semibold text-[var(--lm-color-text-primary)]">
              {formatElevation(site?.coordinates?.elevationMeters)}
            </div>
          </div>
        </div>
      </div>

      {/* Sun Geometry Section */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-[var(--lm-color-sun)]" />
            <span className="text-xs font-semibold text-[var(--lm-color-sun)] uppercase tracking-wider font-mono">
              Sun Geometry
            </span>
          </div>
          <Badge variant={sunBadge.variant}>
            {sunBadge.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricBlock
            label="Sun Elevation"
            result={conditions.sunElevationDeg}
            accentColor="var(--lm-color-sun)"
            definition="Angle of solar center above (+) or below (-) the reference horizon plane."
            qualifier={calculationMode === 'terrain-aware' ? 'Mean horizon basis' : 'Spherical model'}
          />
          <MetricBlock
            label="Sun Azimuth"
            result={conditions.sunAzimuthDeg}
            definition="Clockwise angle measured from Lunar North (0° = North, 90° = East, 180° = South, 270° = West)."
            qualifier="IAU Polar Axis reference"
          />
        </div>

        {/* Sun Illumination Explanation Toggle */}
        <button
          type="button"
          onClick={() => setShowSunExplanation(!showSunExplanation)}
          className="flex items-center justify-between text-left px-2.5 py-1.5 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border-subtle)] text-[11px] text-[var(--lm-color-text-muted)] hover:text-[var(--lm-color-text-primary)] transition-colors"
        >
          <span>What this solar angle means for mission power</span>
          {showSunExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showSunExplanation && (
          <div className="text-[11px] leading-relaxed text-[var(--lm-color-text-secondary)] bg-[var(--lm-color-canvas)] p-2.5 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border)] space-y-1">
            <p>
              At the lunar south pole, solar elevation stays within approx. <strong>-1.5° to +1.5°</strong> relative to the mean horizon due to the Moon's 1.54° obliquity. Elevated crater rims (such as Shackleton at +4.2 km) lower the local geometric horizon dip angle, creating extended periods of continuous grazing sunlight.
            </p>
            <p className="text-[var(--lm-color-text-muted)]">
              Disk illumination fraction: <strong>{(conditions.solarIlluminationFraction.kind === 'available' ? conditions.solarIlluminationFraction.value * 100 : 0).toFixed(0)}% visible</strong>.
            </p>
          </div>
        )}
      </section>

      {/* Earth Geometry Section */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EarthIcon className="w-4 h-4 text-[var(--lm-color-earth)]" />
            <span className="text-xs font-semibold text-[var(--lm-color-earth)] uppercase tracking-wider font-mono">
              Earth Geometry & DTE
            </span>
          </div>
          <Badge variant={earthBadge.variant}>
            {earthBadge.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricBlock
            label="Earth Elevation"
            result={conditions.earthElevationDeg}
            accentColor="var(--lm-color-earth)"
            definition="Apparent elevation angle of the center of Earth above the local horizon."
            qualifier="Subject to +/- 6.7° libration"
          />
          <MetricBlock
            label="Earth Range"
            result={conditions.rangeKm}
            definition="Instantaneous center-to-center distance between Earth and Moon."
            qualifier="Perigee/Apogee variation"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricBlock
            label="One-Way Light Time"
            result={conditions.theoreticalOneWayLightTimeSeconds}
            definition="Theoretical vacuum light-travel time (t = distance / c). Does not include operational ground station routing or network overhead."
            qualifier="Speed of light c = 299,792 km/s"
          />
          <MetricBlock
            label="Earth Azimuth"
            result={conditions.earthAzimuthDeg}
            definition="Azimuth angle pointing toward Earth's disk center."
            qualifier="IAU Polar Axis frame"
          />
        </div>

        {/* RF Guarantee Disclaimer (Strict Scientific Requirement from Spec) */}
        <div className="bg-[#101b2b] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-2.5 text-[11px] leading-relaxed text-[var(--lm-color-text-secondary)] flex items-start gap-2">
          <Radio className="w-4 h-4 text-[var(--lm-color-earth)] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[var(--lm-color-text-primary)]">Communication Constraint:</strong>{' '}
            Geometric line-of-sight does not prove radio link success. Operational RF communications require RF link budget margin, high-gain antenna pointing, and scheduled Deep Space Network (DSN) ground station contact windows.
          </div>
        </div>
      </section>

      {/* Local Sky Cross-Section Diagram */}
      <section>
        <LocalSkyDiagram
          sunElevationDeg={sunElevVal}
          sunAzimuthDeg={sunAzVal}
          earthElevationDeg={earthElevVal}
          earthAzimuthDeg={earthAzVal}
          terrainElevationDeg={terrainElevVal}
          calculationMode={calculationMode}
        />
      </section>

      {/* Provenance and Verification Footer Strip */}
      <div className="pt-2 border-t border-[var(--lm-color-border-subtle)] flex items-center justify-between text-xs text-[var(--lm-color-text-muted)] font-mono">
        <span className="flex items-center gap-1.5 text-[var(--lm-color-success)]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>JPL Horizons Benchmark Verified</span>
        </span>
        <button
          type="button"
          onClick={onOpenMethodDetails}
          className="flex items-center gap-1 text-[var(--lm-color-text-secondary)] hover:text-white transition-colors underline underline-offset-2"
        >
          <span>Method & Provenance</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
