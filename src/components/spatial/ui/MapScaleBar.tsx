import React, { useMemo } from 'react';
import { calculateScaleBar, SelenographicCoordinate } from '../../../lib/projection';
import { CandidateSite } from '../../../types/site';

export interface MapScaleBarProps {
  zoom: number;
  cursorCoord: SelenographicCoordinate | null;
  cursorDistanceKm: number | null;
  selectedSite: CandidateSite;
  hideRibbon?: boolean;
}

/**
 * Dynamic Projection-Derived Scale Bar & Coordinate Readout.
 * Automatically recalibrates distance and pixel bar width as the map is zoomed.
 */
export function MapScaleBar({
  zoom,
  cursorCoord,
  cursorDistanceKm,
  selectedSite,
  hideRibbon = false,
}: MapScaleBarProps) {
  const scale = useMemo(() => calculateScaleBar(zoom), [zoom]);

  return (
    <div
      className={`absolute ${
        hideRibbon ? 'bottom-3' : 'bottom-13'
      } left-3 z-20 flex flex-wrap items-center gap-2.5 pointer-events-none bg-[var(--lm-color-surface)]/92 backdrop-blur-md px-2.5 py-1.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] text-[11px] font-mono-num text-[var(--lm-color-text-muted)] shadow-sm`}
    >
      {/* Dynamic Scale Bar */}
      <div className="flex items-center gap-1.5">
        <div
          className="h-1 bg-slate-300 border border-slate-600 rounded-xs transition-all duration-150"
          style={{ width: `${scale.widthPx}px` }}
        />
        <span className="font-semibold text-[var(--lm-color-text-secondary)]">{scale.distanceKm} km</span>
      </div>

      {/* Legend Identifiers */}
      <div className="border-l border-[var(--lm-color-border)] pl-2 flex items-center gap-2">
        <span className="flex items-center gap-1 text-[var(--lm-color-selected-site)]">
          <span className="w-2 h-2 rounded-full bg-[var(--lm-color-selected-site)] ring-1 ring-white" />
          <span>Selected</span>
        </span>
        <span className="flex items-center gap-1 text-[#38bdf8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
          <span>Candidate</span>
        </span>
      </div>

      {/* Real-time Cursor Selenographic Coordinate Tracker */}
      {cursorCoord && (
        <div className="border-l border-[var(--lm-color-border)] pl-2 hidden sm:flex items-center gap-1.5 text-[var(--lm-color-text-secondary)]">
          <span className="text-[10px] uppercase font-mono text-[var(--lm-color-text-muted)]">Cursor:</span>
          <span>
            {Math.abs(cursorCoord.latitudeDeg).toFixed(2)}°S, {cursorCoord.longitudeDeg.toFixed(2)}°E
          </span>
          {cursorDistanceKm !== null && (
            <span className="text-[10px] text-[var(--lm-color-selected-site)]">
              ({cursorDistanceKm.toFixed(1)} km from {selectedSite.code})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
