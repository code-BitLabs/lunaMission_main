import React from 'react';

export interface GlobeLegendProps {
  earthElevationDisplay: string;
  /** Ribbon sits lower when the globe's own candidate ribbon is hidden. */
  isCompact: boolean;
}

/** Orientation key and provenance line for the 3D view. */
export function GlobeLegend({ earthElevationDisplay, isCompact }: GlobeLegendProps) {
  return (
    <div
      className={`absolute ${isCompact ? 'bottom-3' : 'bottom-14'} left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none`}
    >
      <div className="bg-[var(--lm-color-surface)]/85 backdrop-blur-xs px-2.5 py-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] text-[10px] font-mono text-[var(--lm-color-text-muted)] flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--lm-color-sun)] inline-block"></span>
          <span>Sun Vector</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--lm-color-earth)] inline-block"></span>
          <span>Earth [Geometric Sightline] ({earthElevationDisplay})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-b border-dashed border-[var(--lm-color-selected-site)] inline-block"></span>
          <span>83°S Footprint</span>
        </span>
      </div>

      <div className="hidden lg:flex items-center gap-2 bg-[var(--lm-color-surface)]/85 backdrop-blur-xs px-2.5 py-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] text-[10px] font-mono text-[var(--lm-color-text-muted)]">
        <span className="text-amber-400 font-semibold">Scale & Model Note:</span>
        <span>Bodies enlarged for visibility • Ray directions from site (not to physical distance scale) • Earth disc is illustrative</span>
      </div>

      <div className="hidden sm:block bg-[var(--lm-color-surface)]/85 backdrop-blur-xs px-2.5 py-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] text-[10px] font-mono text-[var(--lm-color-text-muted)]">
        Source: NASA GSFC CGI Moon Kit (LROC WAC / LOLA DEM)
      </div>
    </div>
  );
}
