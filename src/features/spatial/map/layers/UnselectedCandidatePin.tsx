import { CandidateSite } from '@/domain/sites/candidateSite';
import { ProjectedPoint } from '@/domain/coordinates/projection';
import {
  PIN_COLORS,
  TAG_OFFSET_HOVERED_PX,
  TAG_OFFSET_PX,
  offsetAlongAngle,
  radialAngleFromPole,
  shouldShowCodePill,
  unselectedPinAriaLabel,
} from '@/features/spatial/map/model/candidatePinGeometry';

interface UnselectedCandidatePinProps {
  site: CandidateSite;
  pos: ProjectedPoint;
  isHovered: boolean;
  zoom: number;
  onSelect: (site: CandidateSite) => void;
  onHover: (site: CandidateSite | null) => void;
}

/**
 * Compact pin for a candidate that is not selected: dot plus, when there is room
 * for it, a code pill pushed radially away from the pole.
 */
export function UnselectedCandidatePin({
  site,
  pos,
  isHovered,
  zoom,
  onSelect,
  onHover,
}: UnselectedCandidatePinProps) {
  const angleRad = radialAngleFromPole(pos);
  const tag = offsetAlongAngle(pos, angleRad, isHovered ? TAG_OFFSET_HOVERED_PX : TAG_OFFSET_PX);

  return (
    <g
      tabIndex={0}
      role="button"
      aria-label={unselectedPinAriaLabel(site)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(site);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onSelect(site);
        }
      }}
      onMouseEnter={() => onHover(site)}
      onMouseLeave={() => onHover(null)}
      className="cursor-pointer focus:outline-none group"
    >
      {/* Generous Invisible Click Target to guarantee zero missed clicks */}
      <circle cx={pos.x} cy={pos.y} r="18" fill="transparent" />

      {/* Unselected Site Marker Dot */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={isHovered ? '4.8' : '3.6'}
        fill={isHovered ? PIN_COLORS.unselectedHovered : PIN_COLORS.unselected}
        stroke={PIN_COLORS.markerStroke}
        strokeWidth="1.2"
        className="transition-all duration-150"
      />

      {/* Radial Code Tag */}
      {shouldShowCodePill(zoom, isHovered) && (
        <g transform={`translate(${tag.x}, ${tag.y})`} className="pointer-events-none">
          <rect
            x="-16"
            y="-6.5"
            width="32"
            height="13"
            rx="2"
            fill={PIN_COLORS.tagBackdrop}
            fillOpacity={isHovered ? 0.95 : 0.8}
            stroke={isHovered ? PIN_COLORS.accent : PIN_COLORS.tagStroke}
            strokeWidth={isHovered ? 1.0 : 0.7}
          />
          <text
            x="0"
            y="2.5"
            textAnchor="middle"
            fill={isHovered ? PIN_COLORS.tagTextHovered : PIN_COLORS.tagText}
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
}
