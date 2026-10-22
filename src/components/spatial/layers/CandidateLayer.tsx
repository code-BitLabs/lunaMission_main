import React from 'react';
import { CandidateSite } from '../../../types/site';
import { CANDIDATE_SITES } from '../../../lib/sites-data';
import { projectLatLon, DEFAULT_PROJECTION_CONFIG } from '../../../lib/projection';

export interface CandidateLayerProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  hoveredSite: CandidateSite | null;
  onHoverSite: (site: CandidateSite | null) => void;
  zoom: number;
}

/**
 * High-priority Candidate Sites Layer.
 * Implements deterministic radial collision avoidance:
 * - Unselected sites use compact, restrained pins and offset radial code tags.
 * - Selected site is rendered on top with a restrained halo and outward radial leader badge.
 * - Rich metadata is kept in the Point Passport, avoiding stacking clutter at the South Pole.
 */
export function CandidateLayer({
  selectedSite,
  onSelectSite,
  hoveredSite,
  onHoverSite,
  zoom,
}: CandidateLayerProps) {
  const { center: CENTER } = DEFAULT_PROJECTION_CONFIG;

  // Compute projected position of the selected site
  const selectedPos = projectLatLon(
    selectedSite.coordinates.latitudeDeg,
    selectedSite.coordinates.longitudeDeg
  );

  return (
    <g className="candidate-layer">
      {/* 1. Unselected Candidate Pins */}
      {CANDIDATE_SITES.filter((site) => site.id !== selectedSite.id).map((site) => {
        const pos = projectLatLon(
          site.coordinates.latitudeDeg,
          site.coordinates.longitudeDeg
        );
        const isHovered = hoveredSite?.id === site.id;

        // Radial angle away from pole (radiates outward to prevent collisions)
        const poleDist = Math.hypot(pos.x - CENTER, pos.y - CENTER);
        const angleRad = poleDist < 1.0 ? -Math.PI / 2 : Math.atan2(pos.y - CENTER, pos.x - CENTER);

        // Radial offset for tag
        const tagDist = isHovered ? 18 : 14;
        const tagX = pos.x + Math.cos(angleRad) * tagDist;
        const tagY = pos.y + Math.sin(angleRad) * tagDist;

        // Show code pill when zoomed in (zoom >= 1.3) or hovered
        const showCodePill = zoom >= 1.3 || isHovered;

        return (
          <g
            key={site.id}
            tabIndex={0}
            role="button"
            aria-label={`Select candidate ${site.name} (${site.code}) at ${Math.abs(
              site.coordinates.latitudeDeg
            ).toFixed(2)}°S, ${site.coordinates.longitudeDeg.toFixed(1)}°E`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSite(site);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onSelectSite(site);
              }
            }}
            onMouseEnter={() => onHoverSite(site)}
            onMouseLeave={() => onHoverSite(null)}
            className="cursor-pointer focus:outline-none group"
          >
            {/* Generous Invisible Click Target to guarantee zero missed clicks */}
            <circle cx={pos.x} cy={pos.y} r="18" fill="transparent" />

            {/* Unselected Site Marker Dot */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isHovered ? '4.8' : '3.6'}
              fill={isHovered ? '#70d6c5' : '#38bdf8'}
              stroke="#080f1a"
              strokeWidth="1.2"
              className="transition-all duration-150"
            />

            {/* Radial Code Tag */}
            {showCodePill && (
              <g transform={`translate(${tagX}, ${tagY})`} className="pointer-events-none">
                <rect
                  x="-16"
                  y="-6.5"
                  width="32"
                  height="13"
                  rx="2"
                  fill="#050a12"
                  fillOpacity={isHovered ? 0.95 : 0.8}
                  stroke={isHovered ? 'var(--lm-color-selected-site)' : '#1e2c3d'}
                  strokeWidth={isHovered ? 1.0 : 0.7}
                />
                <text
                  x="0"
                  y="2.5"
                  textAnchor="middle"
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
                  fontSize="7"
                  fontWeight={isHovered ? 'bold' : '500'}
                  fontFamily="monospace"
                >
                  {site.code}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* 2. Selected Candidate Pin (Rendered Last so it floats above everything else) */}
      {(() => {
        // Compute outward radial direction from pole for leader line
        const poleDist = Math.hypot(selectedPos.x - CENTER, selectedPos.y - CENTER);
        const angleRad = poleDist < 1.0 ? -Math.PI / 2 : Math.atan2(selectedPos.y - CENTER, selectedPos.x - CENTER);
        const leaderDist = 24;
        let badgeX = selectedPos.x + Math.cos(angleRad) * leaderDist;
        let badgeY = selectedPos.y + Math.sin(angleRad) * leaderDist;

        // Keep badge inside the map bounds
        badgeX = Math.max(50, Math.min(DEFAULT_PROJECTION_CONFIG.svgSize - 50, badgeX));
        badgeY = Math.max(25, Math.min(DEFAULT_PROJECTION_CONFIG.svgSize - 25, badgeY));

        const shortName = selectedSite.name.replace(' Crater Rim', '').replace(' Mountain', '');
        const labelText = `${selectedSite.code} • ${shortName}`;
        const badgeWidth = Math.max(80, labelText.length * 6.8);

        return (
          <g
            key={selectedSite.id}
            tabIndex={0}
            role="button"
            aria-label={`Selected candidate ${selectedSite.name} (${selectedSite.code})`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="cursor-default focus:outline-none"
          >
            {/* Generous Target */}
            <circle cx={selectedPos.x} cy={selectedPos.y} r="20" fill="transparent" />

            {/* Restrained Selection Halo (Clean, single 12px ring) */}
            <circle
              cx={selectedPos.x}
              cy={selectedPos.y}
              r="13"
              fill="none"
              stroke="var(--lm-color-selected-site)"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              opacity="0.9"
            />

            {/* Selected Marker Dot (High-contrast teal with white border) */}
            <circle
              cx={selectedPos.x}
              cy={selectedPos.y}
              r="5.5"
              fill="var(--lm-color-selected-site)"
              stroke="#ffffff"
              strokeWidth="1.6"
            />

            {/* Restrained Leader Line */}
            <line
              x1={selectedPos.x}
              y1={selectedPos.y}
              x2={badgeX}
              y2={badgeY}
              stroke="var(--lm-color-selected-site)"
              strokeWidth="1.3"
              opacity="0.85"
            />

            {/* High-Contrast Selected Badge Tag */}
            <g transform={`translate(${badgeX}, ${badgeY})`}>
              <rect
                x={-badgeWidth / 2}
                y="-9"
                width={badgeWidth}
                height="18"
                rx="3.5"
                fill="#060e1b"
                stroke="var(--lm-color-selected-site)"
                strokeWidth="1.3"
                className="drop-shadow-md"
              />
              <text
                x="0"
                y="3.2"
                textAnchor="middle"
                fill="var(--lm-color-selected-site)"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {labelText}
              </text>
            </g>
          </g>
        );
      })()}
    </g>
  );
}
