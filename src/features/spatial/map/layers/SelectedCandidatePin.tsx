import { CandidateSite } from '@/domain/sites/candidateSite';
import { ProjectedPoint } from '@/domain/coordinates/projection';
import {
  LEADER_LENGTH_PX,
  PIN_COLORS,
  badgeText,
  badgeWidthFor,
  clampBadgeAnchor,
  offsetAlongAngle,
  radialAngleFromPole,
  selectedPinAriaLabel,
} from '@/features/spatial/map/model/candidatePinGeometry';

interface SelectedCandidatePinProps {
  site: CandidateSite;
  pos: ProjectedPoint;
}

/**
 * The selected candidate: halo, marker, and a leader line out to a badge that
 * names it. Rendered last so it floats above every other layer.
 */
export function SelectedCandidatePin({ site, pos }: SelectedCandidatePinProps) {
  const badge = clampBadgeAnchor(offsetAlongAngle(pos, radialAngleFromPole(pos), LEADER_LENGTH_PX));
  const labelText = badgeText(site);
  const badgeWidth = badgeWidthFor(labelText);

  return (
    <g
      tabIndex={0}
      role="button"
      aria-label={selectedPinAriaLabel(site)}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="cursor-default focus:outline-none"
    >
      {/* Generous Target */}
      <circle cx={pos.x} cy={pos.y} r="20" fill="transparent" />

      {/* Restrained Selection Halo (Clean, single 12px ring) */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r="13"
        fill="none"
        stroke={PIN_COLORS.accent}
        strokeWidth="1.5"
        strokeDasharray="3 2"
        opacity="0.9"
      />

      {/* Selected Marker Dot (High-contrast teal with white border) */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r="5.5"
        fill={PIN_COLORS.accent}
        stroke={PIN_COLORS.badgeStroke}
        strokeWidth="1.6"
      />

      {/* Restrained Leader Line */}
      <line
        x1={pos.x}
        y1={pos.y}
        x2={badge.x}
        y2={badge.y}
        stroke={PIN_COLORS.accent}
        strokeWidth="1.3"
        opacity="0.85"
      />

      {/* High-Contrast Selected Badge Tag */}
      <g transform={`translate(${badge.x}, ${badge.y})`}>
        <rect
          x={-badgeWidth / 2}
          y="-9"
          width={badgeWidth}
          height="18"
          rx="3.5"
          fill={PIN_COLORS.badgeBackdrop}
          stroke={PIN_COLORS.accent}
          strokeWidth="1.3"
          className="drop-shadow-md"
        />
        <text
          x="0"
          y="3.2"
          textAnchor="middle"
          fill={PIN_COLORS.accent}
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {labelText}
        </text>
      </g>
    </g>
  );
}
