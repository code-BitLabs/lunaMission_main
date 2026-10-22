import React, { useEffect, useRef } from 'react';
import { Sun, Globe as EarthIcon, X, Compass, ExternalLink } from 'lucide-react';
import { CandidateSite } from '../../types/site';

export interface VectorTelemetryPopoverProps {
  target: 'sun' | 'earth';
  selectedSite: CandidateSite;
  elevationDeg: number;
  azimuthDeg: number;
  subLatDeg?: number;
  subLonDeg?: number;
  currentIsoUtc?: string;
  onClose: () => void;
}

export function VectorTelemetryPopover({
  target,
  selectedSite,
  elevationDeg,
  azimuthDeg,
  subLatDeg = 0,
  subLonDeg = 0,
  currentIsoUtc,
  onClose,
}: VectorTelemetryPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isSun = target === 'sun';
  const isPositive = elevationDeg >= 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${isSun ? 'Sun' : 'Earth'} Vector Telemetry`}
      className="absolute top-14 left-4 z-40 max-w-sm w-80 bg-[var(--lm-color-surface-raised)]/95 backdrop-blur-md border border-[var(--lm-color-border)] rounded-[var(--lm-radius-md)] p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-text"
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--lm-color-border-subtle)]">
        <div className="flex items-center gap-2">
          {isSun ? (
            <div className="p-1 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-sun)]/15 text-[var(--lm-color-sun)]">
              <Sun className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-earth)]/15 text-[var(--lm-color-earth)]">
              <EarthIcon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold text-[var(--lm-color-text-primary)]">
              {isSun ? 'Topocentric Solar Vector' : 'Direct-to-Earth (DTE) Vector'}
            </h4>
            <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)]">
              Origin: {selectedSite.code} ({selectedSite.name})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close telemetry popover"
          className="p-1 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-muted)] hover:text-white hover:bg-[var(--lm-color-surface-strong)] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 my-3">
        <div className="bg-[var(--lm-color-surface)] p-2 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
          <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] uppercase tracking-wider block">
            Elevation (Horizon)
          </span>
          <span
            className={`text-sm font-bold font-mono-num ${
              isSun
                ? isPositive
                  ? 'text-[var(--lm-color-sun)]'
                  : 'text-amber-400'
                : isPositive
                ? 'text-[var(--lm-color-earth)]'
                : 'text-rose-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {elevationDeg.toFixed(2)}°
          </span>
          <span className="text-[9px] text-[var(--lm-color-text-muted)] block mt-0.5">
            {isPositive ? 'Above geometric 0° horizon' : 'Below geometric 0° horizon'}
          </span>
        </div>

        <div className="bg-[var(--lm-color-surface)] p-2 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
          <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] uppercase tracking-wider block">
            Azimuth (Bearing)
          </span>
          <span className="text-sm font-bold font-mono-num text-[var(--lm-color-text-primary)]">
            {azimuthDeg.toFixed(1)}°
          </span>
          <span className="text-[9px] text-[var(--lm-color-text-muted)] block mt-0.5">
            Clockwise from lunar North
          </span>
        </div>
      </div>

      {/* Ephemeris Sub-body Coordinates */}
      <div className="bg-[var(--lm-color-surface)] px-2.5 py-2 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)] space-y-1 text-[11px] font-mono">
        <div className="flex justify-between items-center text-[var(--lm-color-text-secondary)]">
          <span>Sub-{isSun ? 'Solar' : 'Earth'} Lat:</span>
          <span className="font-semibold text-[var(--lm-color-text-primary)]">
            {subLatDeg >= 0 ? '+' : ''}
            {subLatDeg.toFixed(2)}°
          </span>
        </div>
        <div className="flex justify-between items-center text-[var(--lm-color-text-secondary)]">
          <span>Sub-{isSun ? 'Solar' : 'Earth'} Lon:</span>
          <span className="font-semibold text-[var(--lm-color-text-primary)]">
            {subLonDeg.toFixed(2)}°
          </span>
        </div>
        {currentIsoUtc && (
          <div className="flex justify-between items-center text-[var(--lm-color-text-muted)] pt-1 border-t border-[var(--lm-color-border-subtle)] text-[10px]">
            <span>Canonical Epoch:</span>
            <span>{currentIsoUtc.replace('T', ' ').replace('Z', ' UTC')}</span>
          </div>
        )}
      </div>

      {/* Scientific Reference Note */}
      <div className="mt-2 text-[10px] text-[var(--lm-color-text-muted)] leading-relaxed flex items-start gap-1">
        <Compass className="w-3 h-3 text-[var(--lm-color-selected-site)] shrink-0 mt-0.5" />
        <span>
          Reference: IAU/IAG Mean Earth/Polar Axis frame. Geometric elevation relative to local spherical tangent plane at site elevation.
        </span>
      </div>
    </div>
  );
}
