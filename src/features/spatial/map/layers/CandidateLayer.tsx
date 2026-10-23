import React, { useMemo } from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CANDIDATE_SITES, DEFAULT_COMPARISON_SITE_IDS } from '@/domain/sites/catalog';
import { projectLatLon } from '@/domain/coordinates/projection';
import { SelectedCandidatePin } from '@/features/spatial/map/layers/SelectedCandidatePin';
import { UnselectedCandidatePin } from '@/features/spatial/map/layers/UnselectedCandidatePin';
import { resolveCandidateLabelPlacements } from '@/features/spatial/map/model/candidatePinGeometry';

export interface CandidateLayerProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  hoveredSite: CandidateSite | null;
  onHoverSite: (site: CandidateSite | null) => void;
  zoom: number;
  comparedSiteIds?: readonly string[];
}

/**
 * Candidate sites layer with collision-aware progressive labeling and state differentiation:
 * - Selected candidate: drawn last with prominent halo, leader line, and boundary-clamped badge.
 * - Hovered candidate: high-contrast halo and preview vectors without altering selection.
 * - Compared candidates: distinct purple orbital indicator and accessible tags.
 * - Ordinary candidates: clean, minimal pins with collision-avoiding progressive labels.
 */
export function CandidateLayer({
  selectedSite,
  onSelectSite,
  hoveredSite,
  onHoverSite,
  zoom,
  comparedSiteIds: propComparedSiteIds,
}: CandidateLayerProps) {
  const activeComparedSiteIds = propComparedSiteIds ?? DEFAULT_COMPARISON_SITE_IDS;

  const selectedPos = useMemo(
    () => projectLatLon(selectedSite.coordinates.latitudeDeg, selectedSite.coordinates.longitudeDeg),
    [selectedSite]
  );

  const labelPlacements = useMemo(
    () =>
      resolveCandidateLabelPlacements({
        sites: CANDIDATE_SITES,
        selectedSite,
        hoveredSite,
        comparedSiteIds: activeComparedSiteIds,
        zoom,
      }),
    [selectedSite, hoveredSite, activeComparedSiteIds, zoom]
  );

  return (
    <g className="candidate-layer">
      {CANDIDATE_SITES.filter((site) => site.id !== selectedSite.id).map((site) => {
        const placement = labelPlacements.get(site.id);
        const isCompared = activeComparedSiteIds.includes(site.id);

        return (
          <UnselectedCandidatePin
            key={site.id}
            site={site}
            pos={projectLatLon(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg)}
            isHovered={hoveredSite?.id === site.id}
            isCompared={isCompared}
            labelMode={placement?.labelMode}
            tagPos={placement?.tagPos}
            labelText={placement?.labelText}
            zoom={zoom}
            onSelect={onSelectSite}
            onHover={onHoverSite}
          />
        );
      })}

      <SelectedCandidatePin site={selectedSite} pos={selectedPos} />
    </g>
  );
}
