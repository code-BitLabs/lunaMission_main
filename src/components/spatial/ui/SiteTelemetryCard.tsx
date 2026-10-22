import React from 'react';
import { CandidateSite } from '../../../types/site';
import { Sun, Globe as EarthIcon } from 'lucide-react';

export interface SiteTelemetryCardProps {
  site: CandidateSite;
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  earthElevationDeg: number;
  earthAzimuthDeg: number;
  distanceFromPoleKm: number;
  visible?: boolean;
}

/**
 * Concise telemetry HUD overlay displayed on the 2D polar map.
 * Corresponds to Panels 3 & 6 in the LunaMission Storyboard.
 */
export function SiteTelemetryCard({
  site,
  sunElevationDeg,
  sunAzimuthDeg,
  earthElevationDeg,
  earthAzimuthDeg,
  distanceFromPoleKm,
  visible = true,
}: SiteTelemetryCardProps) {
  if (!visible) return null;

  const isSunPositive = sunElevationDeg >= 0;
  const isEarthPositive = earthElevationDeg > 0;

  return (
    <div
      role="region"
      aria-label={`Site Telemetry: ${site.name}`}
      className="hidden sm:block absolute top-12 right-3 z-15 bg-[var(--lm-color-surface-raised)]/90 backdrop-blur-md border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-sm)] px-2.5 py-2 shadow-md text-left select-none pointer-events-none w-44"
    >
      <div className="flex items-baseline justify-between border-b border-[var(--lm-color-border-subtle)] pb-1 mb-1.5">
        <span className="text-[11px] font-bold font-mono text-[var(--lm-color-selected-site)]">
          {site.code}
        </span>
        <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate ml-1 max-w-[100px]">
          {site.name}
        </span>
      </div>

      <div className="space-y-1 text-[10.5px] font-mono">
        {/* Sun Row */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[var(--lm-color-sun)]">
            <Sun className="w-2.5 h-2.5" />
            <span>Sun:</span>
          </span>
          <span className="font-semibold text-[var(--lm-color-sun)]">
            {isSunPositive ? '+' : ''}{sunElevationDeg.toFixed(1)}°
            <span className="text-[9px] text-[var(--lm-color-text-muted)] ml-1 font-normal">
              {sunAzimuthDeg.toFixed(0)}°
            </span>
          </span>
        </div>

        {/* Earth Row */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[var(--lm-color-earth)]">
            <EarthIcon className="w-2.5 h-2.5" />
            <span>Earth:</span>
          </span>
          <span className={`font-semibold ${isEarthPositive ? 'text-[var(--lm-color-earth)]' : 'text-amber-400'}`}>
            {isEarthPositive ? '+' : ''}{earthElevationDeg.toFixed(1)}°
            <span className="text-[9px] text-[var(--lm-color-text-muted)] ml-1 font-normal">
              {earthAzimuthDeg.toFixed(0)}°
            </span>
          </span>
        </div>

        {/* Distance from Pole */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--lm-color-border-subtle)] text-[10px] text-[var(--lm-color-text-muted)]">
          <span>Pole Dist:</span>
          <span className="font-semibold text-[var(--lm-color-text-secondary)]">
            {distanceFromPoleKm.toFixed(1)} km
          </span>
        </div>
      </div>
    </div>
  );
}
