import React, { useState } from 'react';
import { Plus, X, ArrowRight, Sun, Globe as EarthIcon, Radio, Layers, ExternalLink } from 'lucide-react';
import { CandidateSite } from '../../types/site';
import { CANDIDATE_SITES } from '../../lib/sites-data';
import { calculateSiteConditions } from '../../lib/celestial';
import { CalculationMode } from '../../types/celestial';
import { Badge } from '../ui/Badge';

interface ComparisonMatrixProps {
  currentIsoUtc: string;
  onSelectSiteForExplore: (site: CandidateSite) => void;
  calculationMode: CalculationMode;
}

export function ComparisonMatrix({
  currentIsoUtc,
  onSelectSiteForExplore,
  calculationMode,
}: ComparisonMatrixProps) {
  // Default sites to compare: Shackleton Rim, Connecting Ridge, Malapert Massif
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([
    'shackleton-rim',
    'connecting-ridge',
    'malapert-massif',
  ]);

  const testDate = new Date(currentIsoUtc);

  const selectedSites = selectedSiteIds
    .map((id) => CANDIDATE_SITES.find((s) => s.id === id))
    .filter((s): s is CandidateSite => s !== undefined);

  // Available sites that can be added
  const availableToAdd = CANDIDATE_SITES.filter((s) => !selectedSiteIds.includes(s.id));

  function handleAddSite(siteId: string) {
    if (selectedSiteIds.length >= 4) return;
    setSelectedSiteIds([...selectedSiteIds, siteId]);
  }

  function handleRemoveSite(siteId: string) {
    if (selectedSiteIds.length <= 1) return; // Keep at least 1 site
    setSelectedSiteIds(selectedSiteIds.filter((id) => id !== siteId));
  }

  // Pre-calculate condition results for each site
  const siteResults = selectedSites.map((site) => ({
    site,
    conditions: calculateSiteConditions(site, testDate, calculationMode),
  }));

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Compare Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg sm:text-xl font-bold text-[var(--lm-color-text-primary)] tracking-tight">
              Compare Candidate Exploration Sites
            </h1>
            <Badge variant="selected">2–4 Sites</Badge>
          </div>
          <p className="text-xs text-[var(--lm-color-text-secondary)]">
            Side-by-side scientific comparison under identical epoch ({currentIsoUtc.replace('T', ' ').replace('Z', ' UTC')}).
          </p>
        </div>

        {/* Add Site Selector */}
        {selectedSiteIds.length < 4 && availableToAdd.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="add-site-select" className="text-xs text-[var(--lm-color-text-muted)] font-mono">
              Add Site:
            </label>
            <select
              id="add-site-select"
              aria-label="Add site to comparison"
              value=""
              onChange={(e) => {
                if (e.target.value) handleAddSite(e.target.value);
              }}
              className="text-xs bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-primary)] rounded-[var(--lm-radius-sm)] px-2.5 py-1.5 focus:outline-none focus:border-[var(--lm-color-focus)] cursor-pointer"
            >
              <option value="" disabled>
                Select location to compare...
              </option>
              {availableToAdd.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({Math.abs(s.coordinates.latitudeDeg)}°S, {s.coordinates.elevationMeters}m)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Comparison Matrix Table */}
      <div className="w-full bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] overflow-x-auto shadow-sm">
        <table className="w-full min-w-[720px] text-left border-collapse font-mono-num text-xs">
          <thead>
            {/* Site Headers Row */}
            <tr className="bg-[var(--lm-color-surface-raised)] border-b border-[var(--lm-color-border)]">
              <th className="p-3.5 w-44 text-[var(--lm-color-text-muted)] font-mono uppercase tracking-wider text-[11px] align-bottom">
                Candidate Location
              </th>
              {siteResults.map(({ site }) => (
                <th key={site.id} className="p-3.5 align-top min-w-[210px] border-l border-[var(--lm-color-border-subtle)]">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--lm-color-selected-site)] font-semibold bg-[var(--lm-color-surface-strong)] px-1.5 py-0.2 rounded border border-[var(--lm-color-selected-site)]/30">
                        {site.code}
                      </span>
                      {selectedSiteIds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSite(site.id)}
                          title={`Remove ${site.name} from comparison`}
                          aria-label={`Remove ${site.name}`}
                          className="p-1 text-[var(--lm-color-text-muted)] hover:text-white rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="font-bold text-sm text-[var(--lm-color-text-primary)] font-sans line-clamp-1">
                      {site.name}
                    </div>
                    <div className="text-[10px] text-[var(--lm-color-text-muted)]">
                      {site.priority}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectSiteForExplore(site)}
                      className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-sans font-medium text-[var(--lm-color-selected-site)] bg-[var(--lm-color-surface-strong)] hover:bg-[var(--lm-color-border)] py-1 px-2 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-selected-site)]/40 transition-colors"
                    >
                      <span>Inspect in Explorer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-secondary)]">
            {/* Coordinates */}
            <tr className="hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors">
              <td className="p-3 text-[var(--lm-color-text-muted)] font-sans font-medium">
                Selenographic Coordinates
              </td>
              {siteResults.map(({ site }) => (
                <td key={site.id} className="p-3 border-l border-[var(--lm-color-border-subtle)] font-mono">
                  {Math.abs(site.coordinates.latitudeDeg).toFixed(2)}°S, {site.coordinates.longitudeDeg.toFixed(2)}°E
                </td>
              ))}
            </tr>

            {/* DEM Elevation */}
            <tr className="hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors">
              <td className="p-3 text-[var(--lm-color-text-muted)] font-sans font-medium">
                LOLA DEM Elevation
              </td>
              {siteResults.map(({ site }) => (
                <td key={site.id} className="p-3 border-l border-[var(--lm-color-border-subtle)] font-bold text-[var(--lm-color-text-primary)]">
                  +{site.coordinates.elevationMeters.toLocaleString()} m
                </td>
              ))}
            </tr>

            {/* Section: Sun Geometry */}
            <tr className="bg-[var(--lm-color-surface-raised)]/70 text-[var(--lm-color-sun)] font-semibold text-[11px] uppercase tracking-wider font-mono">
              <td colSpan={siteResults.length + 1} className="py-2 px-3 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" />
                <span>Sun Geometry at Selected Epoch</span>
              </td>
            </tr>

            {/* Sun Elevation */}
            <tr className="hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors">
              <td className="p-3 text-[var(--lm-color-text-muted)] font-sans font-medium">
                Sun Elevation (°)
              </td>
              {siteResults.map(({ site, conditions }) => (
                <td key={site.id} className="p-3 border-l border-[var(--lm-color-border-subtle)] font-bold text-[var(--lm-color-sun)] text-sm">
                  {conditions.sunElevationDeg.kind === 'available'
                    ? `${conditions.sunElevationDeg.value > 0 ? '+' : ''}${conditions.sunElevationDeg.value}°`
                    : '—'}
                </td>
              ))}
            </tr>

            {/* Sun Azimuth */}
            <tr className="hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors">
              <td className="p-3 text-[var(--lm-color-text-muted)] font-sans font-medium">
                Sun Azimuth (from North)
              </td>
              {siteResults.map(({ site, conditions }) => (
                <td key={site.id} className="p-3 border-l border-[var(--lm-color-border-subtle)] font-mono">
                  {conditions.sunAzimuthDeg.kind === 'available' ? `${conditions.sunAzimuthDeg.value}°` : '—'}
                </td>
              ))}
            </tr>

            {/* Illumination State */}
            <tr className="hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors">
              <td className="p-3 text-[var(--lm-color-text-muted)] font-sans font-medium">
                Illumination Condition
              </td>
              {siteResults.map(({ site, conditions }) => (
                <td key={site.id} className="p-3 border-l border-[var(--lm-color-border-subtle)]">
                  {conditions.solarIllumination === 'illuminated' ? (
                    <Badge variant="success">Fully Illuminated</Badge>
                  ) : conditions.solarIllumination === 'partial-penumbra' ? (
                    <Badge variant="warning">Grazing Penumbra</Badge>
                  ) : (
                    <Badge variant="danger">Shadowed</Badge>
                  )}
                </td>
              ))}
            </tr>

            {/* Section: Earth Geometry & Communication */}
            <tr className="bg-[var(--lm-color-surface-raised)]/70 text-[var(--lm-color-earth)] font-semibold text-[11px] uppercase tracking-wider font-mono">
              <td colSpan={siteResults.length + 1} className="py-2 px-3 flex items-center gap-1.5">
                <EarthIcon className="w-3.5 h-3.5" />
                <span>Earth Geometry & Direct Line-of-Sight</span>
              </td>
            </tr>

            {/* Earth Elevation */}
            <tr className="hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors">
              <td className="p-3 text-[var(--lm-color-text-muted)] font-sans font-medium">
                Earth Center Elevation
              </td>
              {siteResults.map(({ site, conditions }) => (
                <td key={site.id} className="p-3 border-l border-[var(--lm-color-border-subtle)] font-bold text-[var(--lm-color-earth)] text-sm">
                  {conditions.earthElevationDeg.kind === 'available'
                    ? `${conditions.earthElevationDeg.value > 0 ? '+' : ''}${conditions.earthElevationDeg.value}°`
                    : '—'}
                </td>
              ))}
            </tr>

            {/* Geometric Visibility */}
            <tr className="hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors">
              <td className="p-3 text-[var(--lm-color-text-muted)] font-sans font-medium">
                Geometric Line-of-Sight
              </td>
              {siteResults.map(({ site, conditions }) => (
                <td key={site.id} className="p-3 border-l border-[var(--lm-color-border-subtle)]">
                  {conditions.earthVisibility === 'visible' ? (
                    <Badge variant="success">Line-of-Sight Available</Badge>
                  ) : conditions.earthVisibility === 'indeterminate' ? (
                    <Badge variant="warning">Limb Grazing</Badge>
                  ) : (
                    <Badge variant="danger">Sub-Horizon (No LOS)</Badge>
                  )}
                </td>
              ))}
            </tr>

            {/* One-way light time */}
            <tr className="hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors">
              <td className="p-3 text-[var(--lm-color-text-muted)] font-sans font-medium">
                Theoretical Light Time
              </td>
              {siteResults.map(({ site, conditions }) => (
                <td key={site.id} className="p-3 border-l border-[var(--lm-color-border-subtle)] font-mono">
                  {conditions.theoreticalOneWayLightTimeSeconds.kind === 'available'
                    ? `${conditions.theoreticalOneWayLightTimeSeconds.value} s`
                    : '—'}
                </td>
              ))}
            </tr>

            {/* Horizon Dip / Terrain Mask */}
            <tr className="hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors">
              <td className="p-3 text-[var(--lm-color-text-muted)] font-sans font-medium">
                Terrain Horizon Clearance
              </td>
              {siteResults.map(({ site }) => (
                <td key={site.id} className="p-3 border-l border-[var(--lm-color-border-subtle)] font-mono text-[var(--lm-color-text-secondary)]">
                  Horizon Dip: ~{site.meanTerrainHorizonDeg > 0 ? `+${site.meanTerrainHorizonDeg}` : site.meanTerrainHorizonDeg}°
                </td>
              ))}
            </tr>

            {/* Data Coverage Quality */}
            <tr className="hover:bg-[var(--lm-color-surface-raised)]/40 transition-colors">
              <td className="p-3 text-[var(--lm-color-text-muted)] font-sans font-medium">
                DEM Data Resolution
              </td>
              {siteResults.map(({ site }) => (
                <td key={site.id} className="p-3 border-l border-[var(--lm-color-border-subtle)] font-mono text-[11px] text-[var(--lm-color-text-muted)]">
                  {site.coverageStatus}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comparison Caveats Notice */}
      <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-3 text-xs text-[var(--lm-color-text-muted)] leading-relaxed">
        <strong>Scientific Comparison Policy:</strong> LunaMission displays explicit physical parameters and does not compute arbitrary composite rankings or mission scores. Sites represent diverse exploration objectives (continuous illumination, deep PSR volatility access, or direct communications).
      </div>
    </div>
  );
}
