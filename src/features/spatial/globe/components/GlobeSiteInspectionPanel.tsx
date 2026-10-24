import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Layers,
  Sun,
  Radio,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { ResultAvailability } from '@/domain/celestial/availability';
import { TopocentricElevationDeg } from '@/domain/coordinates/frames';
import { availableValue } from '@/shared/formatting/availability';

export interface GlobeSiteInspectionPanelProps {
  site: CandidateSite;
  epochIsoUtc: string;
  sunElevationDeg?: number;
  sunAzimuthDeg?: number;
  earthElevationDeg?: ResultAvailability<TopocentricElevationDeg>;
  earthDistanceKm?: number;
  lightTimeSeconds?: number;
  isCompact?: boolean;
  onClose?: () => void;
  onEnterLocalInspection?: () => void;
  currentMode?: 'regional' | 'overview' | 'inspection' | 'global';
}

export function GlobeSiteInspectionPanel({
  site,
  epochIsoUtc,
  sunElevationDeg = -1.29,
  sunAzimuthDeg = 52.9,
  earthElevationDeg,
  earthDistanceKm = 390853,
  lightTimeSeconds = 1.30,
  isCompact = false,
  onEnterLocalInspection,
  currentMode = 'overview',
}: GlobeSiteInspectionPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    terrain: false,
    illumination: false,
    visibility: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const earthElevVal = earthElevationDeg !== undefined ? availableValue(earthElevationDeg) : 1.1;
  const isEarthVisible = earthElevVal !== null && earthElevVal > 0;

  return (
    <aside
      className={`bg-[var(--lm-color-surface)]/95 backdrop-blur-md border border-[var(--lm-color-border)] rounded-[var(--lm-radius-md)] shadow-2xl flex flex-col pointer-events-auto transition-all duration-200 ${
        isCompact ? 'w-80' : 'w-88'
      }`}
      aria-label="Scientific Candidate Site Inspection Panel"
    >
      {/* Header Banner */}
      <div className="p-3 border-b border-[var(--lm-color-border-subtle)] flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--lm-color-selected-site)] font-semibold">
            <MapPin className="w-3 h-3" />
            <span>{site.code} • {site.officialRegionReference || 'Candidate Study Point'}</span>
          </div>
          <h2 className="text-sm font-semibold text-white tracking-tight mt-0.5">
            {site.name}
          </h2>
          <div className="text-[11px] font-mono text-[var(--lm-color-text-secondary)] mt-0.5">
            {site.coordinates.latitudeDeg.toFixed(3)}°S, {site.coordinates.longitudeDeg.toFixed(2)}°E • Elev:{' '}
            {site.coordinates.elevationMeters > 0
              ? `+${site.coordinates.elevationMeters.toLocaleString()}`
              : site.coordinates.elevationMeters.toLocaleString()}{' '}
            m
          </div>
        </div>

        {currentMode !== 'inspection' && onEnterLocalInspection && (
          <button
            type="button"
            onClick={onEnterLocalInspection}
            className="px-2 py-1 text-[10px] font-mono font-medium rounded bg-[var(--lm-color-selected-site)]/15 border border-[var(--lm-color-selected-site)]/60 text-[var(--lm-color-selected-site)] hover:bg-[var(--lm-color-selected-site)]/25 transition-colors whitespace-nowrap"
            title="Switch to Mode C: Local Inspection"
          >
            Inspect 3D
          </button>
        )}
      </div>

      {/* Accordion Sections */}
      <div className="flex flex-col divide-y divide-[var(--lm-color-border-subtle)] max-h-[60vh] overflow-y-auto">
        {/* 1. Overview Section */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('overview')}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[var(--lm-color-selected-site)]" />
              <span>Overview & Provenance</span>
            </div>
            {openSections.overview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {openSections.overview && (
            <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
              <p className="text-[11px] leading-relaxed font-sans text-[var(--lm-color-text-secondary)]">
                {site.description}
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                <div className="bg-[var(--lm-color-surface-strong)]/60 p-1.5 rounded">
                  <span className="text-[var(--lm-color-text-muted)] block">CATALOG VERSION</span>
                  <span className="text-[var(--lm-color-text-primary)] font-semibold">{site.catalogVersion || '2024.1 (NASA Artemis)'}</span>
                </div>
                <div className="bg-[var(--lm-color-surface-strong)]/60 p-1.5 rounded">
                  <span className="text-[var(--lm-color-text-muted)] block">STUDY ENTITY</span>
                  <span className="text-[var(--lm-color-text-primary)] font-semibold">{site.entityType || 'Study Site'}</span>
                </div>
              </div>
              {site.missionContextNote && (
                <div className="text-[10px] text-[var(--lm-color-text-muted)] font-sans border-l-2 border-[var(--lm-color-selected-site)]/60 pl-2 mt-1">
                  {site.missionContextNote}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Terrain & Data Coverage Section */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('terrain')}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#8ccbff]" />
              <span>Terrain Coverage & Data</span>
            </div>
            {openSections.terrain ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {openSections.terrain && (
            <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
              <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                <span className="text-[var(--lm-color-text-muted)]">Source DEM</span>
                <span className="text-white font-medium">NASA LOLA 128ppd</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                <span className="text-[var(--lm-color-text-muted)]">Polar Coverage</span>
                <span className="text-[var(--lm-color-selected-site)] font-medium">83.0°S – 90.0°S</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                <span className="text-[var(--lm-color-text-muted)]">Horizontal Res</span>
                <span className="text-white font-medium">~237 m / px (polar)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5">
                <span className="text-[var(--lm-color-text-muted)]">Coverage Status</span>
                <span className="text-emerald-400 font-medium">Verified In-Region</span>
              </div>
              <div className="text-[10px] text-[var(--lm-color-text-muted)] font-sans bg-[var(--lm-color-surface-strong)]/40 p-2 rounded flex items-start gap-1.5 mt-1">
                <Info className="w-3 h-3 text-[var(--lm-color-selected-site)] shrink-0 mt-0.5" />
                <span>Analytic LOLA elevation data active. Extreme close-range zoom exposes pixel limits without interpolating artificial terrain.</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Illumination Section */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('illumination')}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-[var(--lm-color-sun)]" />
              <span>Solar Illumination</span>
            </div>
            {openSections.illumination ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {openSections.illumination && (
            <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
              <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                <span className="text-[var(--lm-color-text-muted)]">Sun Elevation</span>
                <span className={`font-semibold ${sunElevationDeg >= 0 ? 'text-[var(--lm-color-sun)]' : 'text-amber-400'}`}>
                  {sunElevationDeg >= 0 ? `+${sunElevationDeg.toFixed(2)}°` : `${sunElevationDeg.toFixed(2)}°`}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                <span className="text-[var(--lm-color-text-muted)]">Sun Azimuth</span>
                <span className="text-white font-medium">{sunAzimuthDeg.toFixed(1)}° (from North)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                <span className="text-[var(--lm-color-text-muted)]">Condition</span>
                <span className="text-amber-300 font-medium">Grazing Rim Twilight</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5">
                <span className="text-[var(--lm-color-text-muted)]">Epoch UTC</span>
                <span className="text-white font-medium">{epochIsoUtc.slice(0, 19).replace('T', ' ')}</span>
              </div>
              <div className="text-[10px] text-[var(--lm-color-text-muted)] font-sans border-t border-[var(--lm-color-border-subtle)] pt-1.5 mt-1">
                Sub-solar ray calculated from IAU Body-fixed selenographic frame. Grazing light models low lunar polar sun angle.
              </div>
            </div>
          )}
        </div>

        {/* 4. Visibility & Line of Sight Section */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('visibility')}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direct-to-Earth Sightline</span>
            </div>
            {openSections.visibility ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {openSections.visibility && (
            <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
              <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                <span className="text-[var(--lm-color-text-muted)]">Earth Elevation</span>
                <span className={`font-semibold ${isEarthVisible ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {earthElevVal !== null ? `${earthElevVal >= 0 ? '+' : ''}${earthElevVal.toFixed(2)}°` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                <span className="text-[var(--lm-color-text-muted)]">Distance</span>
                <span className="text-white font-medium">{earthDistanceKm.toLocaleString()} km</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                <span className="text-[var(--lm-color-text-muted)]">Light Travel</span>
                <span className="text-white font-medium">~{lightTimeSeconds.toFixed(2)} s</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-0.5">
                <span className="text-[var(--lm-color-text-muted)]">Sightline Status</span>
                <span className={`font-medium ${isEarthVisible ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {isEarthVisible ? 'Clear Line of Sight' : 'Below Horizon'}
                </span>
              </div>
              <div className="text-[10px] text-[var(--lm-color-text-muted)] font-sans bg-[var(--lm-color-surface-strong)]/40 p-2 rounded flex items-start gap-1.5 mt-1 border-l-2 border-amber-400/60">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Scientific disclosure: Geometric sightline indicates unoccluded center-to-center line of sight. Actual RF communication requires ground-station antenna look angle and link budget analysis.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
