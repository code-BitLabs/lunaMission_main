import React, { type CSSProperties, type RefObject } from 'react';
import type { CandidateSite } from '@/domain/sites/candidateSite';
import type { ResultAvailability } from '@/domain/celestial/availability';
import {
  DEFAULT_PROJECTION_CONFIG,
  type CustomPointCelestialAngles,
  type ProjectedPoint,
} from '@/domain/coordinates/projection';
import type {
  TopocentricAzimuthDeg,
  TopocentricElevationDeg,
} from '@/domain/coordinates/frames';
import { MapGridLayer } from '@/features/spatial/map/layers/MapGridLayer';
import { CraterLayer } from '@/features/spatial/map/layers/CraterLayer';
import { CandidateLayer } from '@/features/spatial/map/layers/CandidateLayer';
import { SunEarthVectorLayer } from '@/features/spatial/map/layers/SunEarthVectorLayer';
import { CustomPointLayer } from '@/features/spatial/map/layers/CustomPointLayer';

const { svgSize: SVG_SIZE, center: CENTER, maxRadius: MAX_RADIUS } = DEFAULT_PROJECTION_CONFIG;

/** Which map overlays are painted. Owned by the workspace so one toolbar drives map and globe. */
export interface MapLayerVisibility {
  showGrid: boolean;
  showShadowRegions: boolean;
  showCraters: boolean;
  showVectors: boolean;
}

/** Topocentric horizon-frame angles at the selected site. */
export interface SiteVectorAngles {
  sunAzimuthDeg: ResultAvailability<TopocentricAzimuthDeg>;
  sunElevationDeg: ResultAvailability<TopocentricElevationDeg>;
  earthAzimuthDeg: ResultAvailability<TopocentricAzimuthDeg>;
  earthElevationDeg: ResultAvailability<TopocentricElevationDeg>;
}

/** Unselected candidate under the cursor, with its own preview vectors. */
export interface MapHoverPreview {
  site: CandidateSite;
  pos: ProjectedPoint;
  celestial: CustomPointCelestialAngles;
}

export interface MapGestureHandlers {
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseMove: (event: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onWheel: (event: React.WheelEvent) => void;
  onClick: (event: React.MouseEvent) => void;
}

export interface MapCanvasProps {
  svgRef: RefObject<SVGSVGElement | null>;
  /** Current zoom, used for label decluttering by the overlay layers. */
  zoom: number;
  /** Zoom/pan transform for the pannable group. */
  viewportStyle: CSSProperties;
  layers: MapLayerVisibility;
  selectedSite: CandidateSite;
  sitePos: ProjectedPoint;
  siteVectors: SiteVectorAngles;
  /** Cursor hover as reported by the site layer, including the selected site. */
  hoveredSite: CandidateSite | null;
  hoverPreview: MapHoverPreview | null;
  customPoint: { pos: ProjectedPoint; distanceKm: number } | null;
  onSelectSite: (site: CandidateSite) => void;
  onHoverSite: (site: CandidateSite | null) => void;
  onOpenVectorPopover: (target: 'sun' | 'earth') => void;
  gestures: MapGestureHandlers;
}

/**
 * The stereographic drawing surface: basin disc, graticule, craters, vectors,
 * inspection point and candidate pins, all inside one zoom/pan transform group.
 */
export function MapCanvas({
  svgRef,
  zoom,
  viewportStyle,
  layers,
  selectedSite,
  sitePos,
  siteVectors,
  hoveredSite,
  hoverPreview,
  customPoint,
  onSelectSite,
  onHoverSite,
  onOpenVectorPopover,
  gestures,
}: MapCanvasProps) {
  return (
    <div
      className="w-full h-full flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden min-h-0"
      onMouseDown={gestures.onMouseDown}
      onMouseMove={gestures.onMouseMove}
      onMouseUp={gestures.onMouseUp}
      onMouseLeave={gestures.onMouseLeave}
      onWheel={gestures.onWheel}
      onClick={gestures.onClick}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full select-none"
      >
        <defs>
          {/* PSR Diagonal Hatch Pattern */}
          <pattern
            id="psr-hatch"
            width="6"
            height="6"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="#4a6585"
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
          </pattern>

          {/* Radial Terrain Gradient for Polar Basin */}
          <radialGradient id="pole-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#141d2c" />
            <stop offset="70%" stopColor="#0d1422" />
            <stop offset="100%" stopColor="#070b12" />
          </radialGradient>
        </defs>

        {/* Zoomable / Pannable Map Container */}
        <g style={viewportStyle}>
          {/* Lunar South-Pole Basin Disc (83°S Boundary) */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={MAX_RADIUS}
            fill="url(#pole-gradient)"
            stroke="var(--lm-color-border)"
            strokeWidth="1.5"
          />

          {/* 1. Graticule Layer (Latitudes & Meridians) */}
          <MapGridLayer showGrid={layers.showGrid} zoom={zoom} />

          {/* 2. Terrain & Crater Layer (Subdued rims & PSRs) */}
          <CraterLayer
            showCraters={layers.showCraters}
            showShadowRegions={layers.showShadowRegions}
            zoom={zoom}
          />

          {/* 3. Topocentric Sun & Earth Vector Layer (Dashed lines with elevation tags to boundary) */}
          <SunEarthVectorLayer
            visible={layers.showVectors}
            selectedSite={selectedSite}
            sitePos={sitePos}
            sunAzimuthDeg={siteVectors.sunAzimuthDeg}
            sunElevationDeg={siteVectors.sunElevationDeg}
            earthAzimuthDeg={siteVectors.earthAzimuthDeg}
            earthElevationDeg={siteVectors.earthElevationDeg}
            hoveredSite={hoverPreview ? hoverPreview.site : null}
            hoveredSitePos={hoverPreview?.pos}
            hoveredSunAzimuthDeg={hoverPreview?.celestial.sunAzimuthDeg}
            hoveredEarthAzimuthDeg={hoverPreview?.celestial.earthAzimuthDeg}
            onOpenVectorPopover={onOpenVectorPopover}
          />

          {/* 4. Custom Inspection Point Layer */}
          <CustomPointLayer
            customPos={customPoint ? customPoint.pos : null}
            selectedSitePos={sitePos}
            distanceKm={customPoint ? customPoint.distanceKm : null}
          />

          {/* 5. Candidate Sites Layer (Collision-aware pins & tags) */}
          <CandidateLayer
            selectedSite={selectedSite}
            onSelectSite={onSelectSite}
            hoveredSite={hoveredSite}
            onHoverSite={onHoverSite}
            zoom={zoom}
          />
        </g>
      </svg>
    </div>
  );
}
