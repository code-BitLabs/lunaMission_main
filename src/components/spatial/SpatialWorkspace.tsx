import React, { useState } from 'react';
import { Map as MapIcon, Globe as GlobeIcon, Columns } from 'lucide-react';
import { CandidateSite } from '../../types/site';
import { SouthPoleMap } from './SouthPoleMap';
import { LunarGlobe3D } from './LunarGlobe3D';

export type SpatialViewMode = 'map2d' | 'dual' | 'globe3d';

interface SpatialWorkspaceProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  sunAzimuthDeg: number;
  earthAzimuthDeg: number;
  subSolarLatDeg: number;
  subSolarLonDeg: number;
}

export function SpatialWorkspace({
  selectedSite,
  onSelectSite,
  sunAzimuthDeg,
  earthAzimuthDeg,
  subSolarLatDeg,
  subSolarLonDeg,
}: SpatialWorkspaceProps) {
  const [viewMode, setViewMode] = useState<SpatialViewMode>('map2d');

  return (
    <div className="flex flex-col h-full gap-2">
      {/* View Mode Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--lm-color-text-secondary)] uppercase tracking-wider font-mono">
            Spatial Workspace
          </span>
          <span className="text-xs text-[var(--lm-color-text-muted)] font-mono">
            [
            {viewMode === 'map2d' && '2D Polar Stereographic'}
            {viewMode === 'dual' && 'Dual 2D Map + 3D Moon'}
            {viewMode === 'globe3d' && '3D NASA LRO Moon Globe'}
            ]
          </span>
        </div>

        {/* View Mode Switch Buttons: 2D, Dual, 3D */}
        <div className="flex items-center gap-1 bg-[var(--lm-color-surface)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode('map2d')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-xs)] transition-colors ${
              viewMode === 'map2d'
                ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold shadow-xs'
                : 'text-[var(--lm-color-text-muted)] hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>2D Map</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('dual')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-xs)] transition-colors ${
              viewMode === 'dual'
                ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold shadow-xs'
                : 'text-[var(--lm-color-text-muted)] hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dual (2D + 3D)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('globe3d')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-xs)] transition-colors ${
              viewMode === 'globe3d'
                ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold shadow-xs'
                : 'text-[var(--lm-color-text-muted)] hover:text-white'
            }`}
          >
            <GlobeIcon className="w-3.5 h-3.5" />
            <span>3D Moon Globe</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 min-h-[460px] lg:min-h-0 h-full overflow-hidden">
        {viewMode === 'map2d' && (
          <SouthPoleMap
            selectedSite={selectedSite}
            onSelectSite={onSelectSite}
            sunAzimuthDeg={sunAzimuthDeg}
            earthAzimuthDeg={earthAzimuthDeg}
          />
        )}

        {viewMode === 'globe3d' && (
          <LunarGlobe3D
            selectedSite={selectedSite}
            onSelectSite={onSelectSite}
            subSolarLatDeg={subSolarLatDeg}
            subSolarLonDeg={subSolarLonDeg}
          />
        )}

        {viewMode === 'dual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
            <div className="h-full min-h-[440px]">
              <SouthPoleMap
                selectedSite={selectedSite}
                onSelectSite={onSelectSite}
                sunAzimuthDeg={sunAzimuthDeg}
                earthAzimuthDeg={earthAzimuthDeg}
              />
            </div>
            <div className="h-full min-h-[440px]">
              <LunarGlobe3D
                selectedSite={selectedSite}
                onSelectSite={onSelectSite}
                subSolarLatDeg={subSolarLatDeg}
                subSolarLonDeg={subSolarLonDeg}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
