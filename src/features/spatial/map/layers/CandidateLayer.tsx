import { CandidateSite } from '@/domain/sites/candidateSite';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { projectLatLon } from '@/domain/coordinates/projection';
import { SelectedCandidatePin } from '@/features/spatial/map/layers/SelectedCandidatePin';
import { UnselectedCandidatePin } from '@/features/spatial/map/layers/UnselectedCandidatePin';

export interface CandidateLayerProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  hoveredSite: CandidateSite | null;
  onHoverSite: (site: CandidateSite | null) => void;
  zoom: number;
}

/**
 * Candidate sites layer. Unselected pins are compact and are drawn first; the
 * selected pin is drawn last so its halo and badge float above every other layer.
 * Rich metadata stays in the Point Passport rather than stacking on the map.
 */
export function CandidateLayer({
  selectedSite,
  onSelectSite,
  hoveredSite,
  onHoverSite,
  zoom,
}: CandidateLayerProps) {
  const selectedPos = projectLatLon(selectedSite.coordinates.latitudeDeg, selectedSite.coordinates.longitudeDeg);

  return (
    <g className="candidate-layer">
      {CANDIDATE_SITES.filter((site) => site.id !== selectedSite.id).map((site) => (
        <UnselectedCandidatePin
          key={site.id}
          site={site}
          pos={projectLatLon(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg)}
          isHovered={hoveredSite?.id === site.id}
          zoom={zoom}
          onSelect={onSelectSite}
          onHover={onHoverSite}
        />
      ))}

      <SelectedCandidatePin site={selectedSite} pos={selectedPos} />
    </g>
  );
}
