/**
 * Point-level analysis for the 2D map: what the Sun and Earth look like from an
 * arbitrary selenographic coordinate, how far it is from the reference site or the
 * pole, and which published candidate is nearest. Pure so the interaction layer
 * stays rendering-only and the numbers can be unit-tested.
 */

import type { CandidateSite } from '@/domain/sites/candidateSite';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import type {
  CustomPointCelestialAngles,
  ProjectedPoint,
  SelenographicCoordinate,
} from '@/domain/coordinates/projection';
import {
  calculateCustomPointCelestial,
  calculateLunarDistanceKm,
  projectLatLon,
} from '@/domain/coordinates/projection';
import type {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
} from '@/domain/coordinates/frames';

/** The geographic South Pole, as a map-domain coordinate. */
export const SOUTH_POLE_COORDINATE: SelenographicCoordinate = {
  latitudeDeg: -90.0,
  longitudeDeg: 0.0,
};

/** Sub-solar and sub-Earth points for one UTC epoch (global ephemeris). */
export interface SubPoints {
  subSolarLatDeg: SelenographicLatitudeDeg;
  subSolarLonDeg: SelenographicLongitudeDeg;
  subEarthLatDeg: SelenographicLatitudeDeg;
  subEarthLonDeg: SelenographicLongitudeDeg;
}

export interface CustomPointAnalysis {
  /** Great-circle distance from the site the map is centred on. */
  distanceKm: number;
  celestial: CustomPointCelestialAngles;
  nearestSite: CandidateSite;
  nearestDistanceKm: number;
  pos: ProjectedPoint;
}

export function celestialAt(
  point: SelenographicCoordinate,
  subPoints: SubPoints,
): CustomPointCelestialAngles {
  return calculateCustomPointCelestial(
    point,
    subPoints.subSolarLatDeg,
    subPoints.subSolarLonDeg,
    subPoints.subEarthLatDeg,
    subPoints.subEarthLonDeg,
  );
}

/** Geodesic distance from the exact South Pole (90.0°S). */
export function distanceFromSouthPoleKm(coordinates: SelenographicCoordinate): number {
  return calculateLunarDistanceKm(coordinates, SOUTH_POLE_COORDINATE);
}

/** Geodesic distance from a published candidate site to an arbitrary point. */
export function distanceToSite(point: SelenographicCoordinate, site: CandidateSite): number {
  return calculateLunarDistanceKm(site.coordinates, point);
}

/** Closest published candidate to an arbitrary point, with its distance. */
export function nearestCandidate(point: SelenographicCoordinate): {
  site: CandidateSite;
  distanceKm: number;
} {
  let nearestSite = CANDIDATE_SITES[0];
  let nearestDistanceKm = calculateLunarDistanceKm(point, nearestSite.coordinates);
  for (let i = 1; i < CANDIDATE_SITES.length; i++) {
    const distanceKm = calculateLunarDistanceKm(point, CANDIDATE_SITES[i].coordinates);
    if (distanceKm < nearestDistanceKm) {
      nearestDistanceKm = distanceKm;
      nearestSite = CANDIDATE_SITES[i];
    }
  }
  return { site: nearestSite, distanceKm: nearestDistanceKm };
}

export function analyzeCustomPoint(
  point: SelenographicCoordinate,
  referenceSite: CandidateSite,
  subPoints: SubPoints,
): CustomPointAnalysis {
  const { site, distanceKm: nearestDistanceKm } = nearestCandidate(point);
  return {
    distanceKm: distanceToSite(point, referenceSite),
    celestial: celestialAt(point, subPoints),
    nearestSite: site,
    nearestDistanceKm,
    pos: projectLatLon(point.latitudeDeg, point.longitudeDeg),
  };
}

/** Projected position plus topocentric angles for a hovered, unselected candidate. */
export function analyzeHoveredSite(
  site: CandidateSite,
  subPoints: SubPoints,
): { celestial: CustomPointCelestialAngles; pos: ProjectedPoint } {
  return {
    celestial: celestialAt(site.coordinates, subPoints),
    pos: projectLatLon(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg),
  };
}
