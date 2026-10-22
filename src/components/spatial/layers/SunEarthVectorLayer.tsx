import React from 'react';
import { CandidateSite } from '../../../types/site';
import { DEFAULT_PROJECTION_CONFIG, ProjectedPoint } from '../../../lib/projection';

export interface SunEarthVectorLayerProps {
  visible: boolean;
  selectedSite: CandidateSite;
  sitePos: ProjectedPoint;
  sunAzimuthDeg: number;
  sunElevationDeg: number;
  earthAzimuthDeg: number;
  earthElevationDeg: number;
  hoveredSite?: CandidateSite | null;
  hoveredSitePos?: ProjectedPoint | null;
  hoveredSunAzimuthDeg?: number;
  hoveredSunElevationDeg?: number;
  hoveredEarthAzimuthDeg?: number;
  hoveredEarthElevationDeg?: number;
  onOpenVectorPopover: (target: 'sun' | 'earth') => void;
}

/**
 * Calculates the exact ray intersection with the outer boundary circle of the map.
 * Given ray origin sitePos, direction angle screenAngleRad, and boundary circle radius R.
 */
export function calculateRayBoundaryEndpoint(
  origin: ProjectedPoint,
  screenAngleRad: number,
  boundaryRadius: number = DEFAULT_PROJECTION_CONFIG.maxRadius + 18,
  center: number = DEFAULT_PROJECTION_CONFIG.center
): ProjectedPoint {
  const dx = origin.x - center;
  const dy = origin.y - center;
  const dirX = Math.cos(screenAngleRad);
  const dirY = Math.sin(screenAngleRad);

  // Line: p(t) = origin + t * dir
  // Circle: (p(t).x - center)^2 + (p(t).y - center)^2 = boundaryRadius^2
  // Let d_origin = origin - center = (dx, dy)
  // (dx + t*dirX)^2 + (dy + t*dirY)^2 = R^2
  // t^2 + 2*(dx*dirX + dy*dirY)*t + (dx^2 + dy^2 - R^2) = 0
  const b = dx * dirX + dy * dirY;
  const c = dx * dx + dy * dy - boundaryRadius * boundaryRadius;
  const discriminant = b * b - c;
  const t = Math.max(0, -b + Math.sqrt(Math.max(0, discriminant)));

  return {
    x: origin.x + t * dirX,
    y: origin.y + t * dirY,
  };
}

/**
 * Computes the screen angle in the polar stereographic projection
 * for a topocentric azimuth measured clockwise from local North at (lat, lon).
 */
export function computeScreenAngleRad(siteLonDeg: number, azimuthDeg: number): number {
  // In polar stereographic projection with 0° pointing UP and East clockwise:
  // Local meridian points radially outward from South Pole at angle: (siteLonDeg - 90)°
  // Azimuth is measured clockwise from local North.
  // Conformal projection preserves this horizontal angle:
  return ((siteLonDeg - 90 + azimuthDeg) * Math.PI) / 180;
}

/**
 * Dedicated Sun & Earth Vector Visualization Layer.
 * Renders dashed line-of-sight vectors originating directly from the selected candidate site
 * with authentic topocentric bearings and elevation tags anchored at the boundary perimeter.
 * Matches LunaMission Storyboard States 1–6.
 */
export function SunEarthVectorLayer({
  visible,
  selectedSite,
  sitePos,
  sunAzimuthDeg,
  sunElevationDeg,
  earthAzimuthDeg,
  earthElevationDeg,
  hoveredSite,
  hoveredSitePos,
  hoveredSunAzimuthDeg,
  hoveredSunElevationDeg,
  hoveredEarthAzimuthDeg,
  hoveredEarthElevationDeg,
  onOpenVectorPopover,
}: SunEarthVectorLayerProps) {
  if (!visible) return null;

  const { center: CENTER, maxRadius: MAX_RADIUS } = DEFAULT_PROJECTION_CONFIG;
  const BOUNDARY_RADIUS = MAX_RADIUS - 4;

  // 1. Calculate angles for active selected site
  const sunScreenAngle = computeScreenAngleRad(
    selectedSite.coordinates.longitudeDeg,
    sunAzimuthDeg
  );
  const earthScreenAngle = computeScreenAngleRad(
    selectedSite.coordinates.longitudeDeg,
    earthAzimuthDeg
  );

  const sunEnd = calculateRayBoundaryEndpoint(sitePos, sunScreenAngle, BOUNDARY_RADIUS, CENTER);
  const earthEnd = calculateRayBoundaryEndpoint(sitePos, earthScreenAngle, BOUNDARY_RADIUS, CENTER);

  const isSunPositive = sunElevationDeg >= 0;
  const isEarthPositive = earthElevationDeg > 0;

  // 2. Optional preview vectors for hovered candidate (Storyboard State 2)
  let previewSunEnd: ProjectedPoint | null = null;
  let previewEarthEnd: ProjectedPoint | null = null;
  if (
    hoveredSite &&
    hoveredSitePos &&
    hoveredSite.id !== selectedSite.id &&
    hoveredSunAzimuthDeg !== undefined &&
    hoveredEarthAzimuthDeg !== undefined
  ) {
    const prevSunAngle = computeScreenAngleRad(
      hoveredSite.coordinates.longitudeDeg,
      hoveredSunAzimuthDeg
    );
    const prevEarthAngle = computeScreenAngleRad(
      hoveredSite.coordinates.longitudeDeg,
      hoveredEarthAzimuthDeg
    );
    previewSunEnd = calculateRayBoundaryEndpoint(
      hoveredSitePos,
      prevSunAngle,
      BOUNDARY_RADIUS,
      CENTER
    );
    previewEarthEnd = calculateRayBoundaryEndpoint(
      hoveredSitePos,
      prevEarthAngle,
      BOUNDARY_RADIUS,
      CENTER
    );
  }

  return (
    <g className="sun-earth-vector-layer select-none">
      {/* --- PREVIEW VECTORS FOR HOVERED CANDIDATE (Faint dashed lines) --- */}
      {hoveredSite && hoveredSitePos && previewSunEnd && previewEarthEnd && (
        <g className="hover-preview-vectors" opacity={0.45}>
          {/* Preview Sun Vector */}
          <line
            x1={hoveredSitePos.x}
            y1={hoveredSitePos.y}
            x2={previewSunEnd.x}
            y2={previewSunEnd.y}
            stroke="var(--lm-color-sun)"
            strokeWidth="1.2"
            strokeDasharray="2 3"
          />
          {/* Preview Earth Vector */}
          <line
            x1={hoveredSitePos.x}
            y1={hoveredSitePos.y}
            x2={previewEarthEnd.x}
            y2={previewEarthEnd.y}
            stroke="var(--lm-color-earth)"
            strokeWidth="1.2"
            strokeDasharray="2 3"
          />
        </g>
      )}

      {/* --- ACTIVE VECTORS FOR SELECTED CANDIDATE SITE --- */}
      {/* 1. Topocentric Sun Vector */}
      <g className="selected-sun-vector">
        {/* Origin Reticle Ring at site */}
        <circle
          cx={sitePos.x}
          cy={sitePos.y}
          r="8"
          fill="none"
          stroke="var(--lm-color-sun)"
          strokeWidth="0.8"
          strokeDasharray="2 2"
          opacity="0.6"
        />

        {/* Vector Line extending to perimeter */}
        <line
          x1={sitePos.x}
          y1={sitePos.y}
          x2={sunEnd.x}
          y2={sunEnd.y}
          stroke="var(--lm-color-sun)"
          strokeWidth="1.8"
          strokeDasharray="5 3"
          opacity="0.95"
        />

        {/* Sun Endpoint Badge Button */}
        <g
          tabIndex={0}
          role="button"
          aria-label={`Inspect Sun vector telemetry: elevation ${sunElevationDeg.toFixed(1)}°, azimuth ${sunAzimuthDeg.toFixed(1)}°`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenVectorPopover('sun');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onOpenVectorPopover('sun');
            }
          }}
          className="cursor-pointer focus:outline-none group"
        >
          {/* Invisible Generous Click Target */}
          <circle cx={sunEnd.x} cy={sunEnd.y} r="18" fill="transparent" />

          {/* Sun Celestial Symbol */}
          <circle
            cx={sunEnd.x}
            cy={sunEnd.y}
            r="5"
            fill="var(--lm-color-sun)"
            stroke="#080c14"
            strokeWidth="1.2"
            className="group-hover:scale-125 transition-transform"
          />

          {/* Elevation Label Tag with Pill Backdrop */}
          {(() => {
            const isTop = sunEnd.y < CENTER - 120;
            const isBottom = sunEnd.y > CENTER + 120;
            const isRightSide = sunEnd.x >= CENTER;
            const elevText = `☀ (${isSunPositive ? '+' : ''}${sunElevationDeg.toFixed(1)}°)`;
            const textWidth = 56;
            const labelY = isTop ? sunEnd.y + 14 : isBottom ? sunEnd.y - 8 : sunEnd.y + 3.5;
            const labelX = isTop || isBottom ? sunEnd.x + (isRightSide ? 8 : -8) : sunEnd.x + (isRightSide ? 9 : -9);
            const rectX = isRightSide ? labelX - 3 : labelX - textWidth - 3;

            return (
              <g className="sun-elevation-label pointer-events-none">
                <rect
                  x={rectX}
                  y={labelY - 9}
                  width={textWidth + 6}
                  height={13}
                  rx={2.5}
                  fill="#080c14"
                  fillOpacity={0.92}
                  stroke="var(--lm-color-sun)"
                  strokeWidth="0.6"
                />
                <text
                  x={isRightSide ? labelX : labelX - textWidth}
                  y={labelY}
                  textAnchor="start"
                  fill="var(--lm-color-sun)"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {elevText}
                </text>
              </g>
            );
          })()}
        </g>
      </g>

      {/* 2. Topocentric Earth Vector */}
      <g className="selected-earth-vector">
        {/* Origin Reticle Ring at site */}
        <circle
          cx={sitePos.x}
          cy={sitePos.y}
          r="10"
          fill="none"
          stroke={isEarthPositive ? 'var(--lm-color-earth)' : '#f59e0b'}
          strokeWidth="0.8"
          strokeDasharray="2 2"
          opacity="0.6"
        />

        {/* Vector Line extending to perimeter */}
        <line
          x1={sitePos.x}
          y1={sitePos.y}
          x2={earthEnd.x}
          y2={earthEnd.y}
          stroke={isEarthPositive ? 'var(--lm-color-earth)' : '#f59e0b'}
          strokeWidth="1.8"
          strokeDasharray={isEarthPositive ? '5 3' : '2 3'}
          opacity="0.95"
        />

        {/* Earth Endpoint Badge Button */}
        <g
          tabIndex={0}
          role="button"
          aria-label={`Inspect Earth vector telemetry: elevation ${earthElevationDeg.toFixed(1)}°, azimuth ${earthAzimuthDeg.toFixed(1)}°`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenVectorPopover('earth');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onOpenVectorPopover('earth');
            }
          }}
          className="cursor-pointer focus:outline-none group"
        >
          {/* Invisible Generous Click Target */}
          <circle cx={earthEnd.x} cy={earthEnd.y} r="18" fill="transparent" />

          {/* Earth Celestial Symbol */}
          <circle
            cx={earthEnd.x}
            cy={earthEnd.y}
            r="5"
            fill={isEarthPositive ? 'var(--lm-color-earth)' : '#f59e0b'}
            stroke="#080c14"
            strokeWidth="1.2"
            className="group-hover:scale-125 transition-transform"
          />

          {/* Elevation Label Tag with Pill Backdrop */}
          {(() => {
            const isTop = earthEnd.y < CENTER - 120;
            const isBottom = earthEnd.y > CENTER + 120;
            const isRightSide = earthEnd.x >= CENTER;
            const elevText = `Earth (${isEarthPositive ? '+' : ''}${earthElevationDeg.toFixed(1)}°)`;
            const textWidth = 78;
            const labelY = isTop ? earthEnd.y + 14 : isBottom ? earthEnd.y - 8 : earthEnd.y + 3.5;
            const labelX = isTop || isBottom ? earthEnd.x + (isRightSide ? 8 : -8) : earthEnd.x + (isRightSide ? 9 : -9);
            const rectX = isRightSide ? labelX - 3 : labelX - textWidth - 3;
            const color = isEarthPositive ? 'var(--lm-color-earth)' : '#f59e0b';

            return (
              <g className="earth-elevation-label pointer-events-none">
                <rect
                  x={rectX}
                  y={labelY - 9}
                  width={textWidth + 6}
                  height={13}
                  rx={2.5}
                  fill="#080c14"
                  fillOpacity={0.92}
                  stroke={color}
                  strokeWidth="0.6"
                />
                <text
                  x={isRightSide ? labelX : labelX - textWidth}
                  y={labelY}
                  textAnchor="start"
                  fill={color}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {elevText}
                </text>
              </g>
            );
          })()}
        </g>
      </g>
    </g>
  );
}
