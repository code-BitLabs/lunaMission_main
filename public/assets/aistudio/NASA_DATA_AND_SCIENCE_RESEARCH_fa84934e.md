# LunaMission — NASA Data & Scientific Research Register

**Research date:** 2026-10-23  
**Purpose:** Keep the 3D roadmap anchored in real source products and prevent attractive-looking but unsupported data claims.

## 1. High-value sources and what they can support

| Source | What the source supports | Good LunaMission use | Key caveat / implementation condition |
|---|---|---|---|
| NASA SVS CGI Moon Kit — https://svs.gsfc.nasa.gov/4720/ | Global lunar color maps and LOLA-derived displacement/elevation map variants at several sizes/resolutions | Fast global Moon texture; global/coarse displacement for context | NASA says these maps are optimized for aesthetics and scientific apps should use source data. The updated 2025 color map has source coverage 70°N–70°S with polar gap fill; it is not a substitute for polar science products. Verify texture origin/coverage/projection before mapping. |
| NASA PGDA high-resolution LOLA topography — https://pgda.gsfc.nasa.gov/products/78 | 5 m/pixel site DEMs and associated point clouds, count maps, slope maps and uncertainty layers for named south-pole regions | Site-level terrain geometry, local surface analysis, slope/elevation profile, terrain-aware illumination where method validated | Coverage is site-specific, not a continuous 5 m/pixel global DEM. Products are polar stereographic, meters, `MOON_ME` frame tied to DE421 per metadata. Confirm current manifest and coverage before using. Interpolation fraction and uncertainty matter. |
| NASA PDS Geosciences Node LOLA — https://pds-geosciences.wustl.edu/missions/lro/lola.htm | Archived LOLA EDR/RDR/GDR and related topography products | Source-of-truth catalog and reproducible data acquisition | Catalog/archive product versions evolve; pin the exact product/version/checksum used. |
| LROC controlled south-pole NAC average mosaic — https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_POLE_SOUTH_CM_AVG | Controlled 1 m/pixel south-pole image mosaic covering 84–90°S in 40 polar stereographic tiles, centered 90°S, 0°E, lunar radius metadata | High-resolution visual basemap for covered region; optional local texture/inspection | High-res imagery is huge and does not itself provide elevation. The control network detail and tile scheme matter. Tiles require reprojection/texture mapping pipeline; availability is not the same as browser-ready assets. |
| NASA Moon Trek — https://trek.nasa.gov/moon/ | Interactive data layering, imagery/product discovery, source metadata, and analysis tools for distance, elevation plots, lighting and slope | Workflow benchmark and source discovery portal; identify possible science layers | Moon Trek is a portal, not automatically a packaged API or license to scrape its interface. Find actual product endpoints and terms before integrating. |
| NASA south-pole shadows resource — https://science.nasa.gov/resource/shadows-near-the-moons-south-pole/ | Qualitative context for very low solar elevation and long terrain shadows; notes nearby mountains can cast long-range shadows | UX narrative and test design for time-dependent shadow visualization | This NASA visualization is qualitative context, not a per-site numeric ephemeris/terrain dataset. Do not derive metrics from the video. |
| LPI Lunar South Pole Atlas — https://www.lpi.usra.edu/lunar/lunar-south-pole-atlas/ | A curated map comparing candidate-region lists announced in 2022 and 2024, with LOLA DEM/hillshade, 1 km contours, PSR overlay | Candidate-set version awareness and visual reference for candidate region boundaries | LPI atlas image is a compiled map/reference. Use the underlying source products and metadata for computations; do not georeference a screenshot as a precision data layer. |
| NASA 2024 Artemis III site-selection update — https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/ | Updated list of nine candidate Artemis III regions: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2, Slater Plain | Versioned official-region catalog and terminology | The current app's shortlist mixes names associated with earlier lists and custom named points. Store list lineage/date and don't call the current eight-item list the latest official list without source evidence. |
| NASA 2026 Artemis III mission-plan article — https://www.nasa.gov/missions/artemis/artemis-3/nasa-outlines-preliminary-artemis-iii-mission-plans/ | In May 2026, NASA described Artemis III as an Earth-orbit test ahead of Artemis IV crewed lunar landing | Update mission context language in app and README | Mission design and candidate terminology may evolve; check official current sources before declaring a list current. The source does not establish all future landing-region details. |
| NAIF/SPICE time docs — https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/time.html | UTC string representation and conversion to TDB/ET with kernel context | Canonical epoch handling and scientific time conversion contract | UI UTC must not be confused with internal TDB/ET; retain exact time conversion and kernel provenance. |
| NAIF/SPICE SPK docs — https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/spk.html | Target/observer state vectors and optional light-time corrections | Sun/Earth vector source and range/light-time calculations | Correct target, observer, frame and correction choices need tests. Never infer coordinates from screen position. |
| NAIF/SPICE reference-frame docs — https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/FORTRAN/req/frames.html | Body-fixed and inertial reference-frame concepts/transform requirements | Coordinate transformation design | Must inspect actual kernel/frame definitions; don't assume an `IAU_MOON`/`MOON_ME` transform without verification. |
| Three.js OrbitControls — https://threejs.org/docs/pages/OrbitControls.html | Orbit, zoom/dolly, pan, damping, camera distance and angle limits | Camera-control implementation choices | Ensure animation loop calls `update()` when required; configure limits for the actual globe and local scene. |
| Three.js Raycaster — https://threejs.org/docs/pages/Raycaster.html | Object picking by ray intersection | Candidate marker and surface point picking | Manage interaction priority, layers, thresholds and pointer-drag-vs-click discrimination. |
| Three.js cleanup manual — https://threejs.org/manual/pages/cleanup.html | GPU resources such as textures, geometries and materials require explicit disposal when no longer used | Resource lifecycle and leak prevention | Must dispose resources on scene/asset swap and component teardown. |

## 2. Critical findings that affect product decisions

### 2.1 The app's current candidate label needs provenance/versioning

The app currently shows a shortlist including Shackleton Crater Rim, Connecting Ridge, de Gerlache Rim 1, Peak Near Shackleton, Malapert Massif, Haworth Crater Rim, Nobile Rim 1, and Amundsen Crater Rim. That is not the exact nine-region list in NASA's October 28, 2024 update. NASA's update lists Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2, and Slater Plain. The current UI may be using a legacy list, custom site points, or a mixture; inspect its actual data before changing it.

**Required product behavior:** every catalog entry has `source`, `sourceVersion/date`, `entityType` (region polygon vs candidate point vs custom inspection), `displayName`, `coordinates/geometry`, and `status`. Provide an explicit catalog selector or label such as `Legacy candidate shortlist` vs `NASA Artemis III regions (Oct 2024)`. Do not silently relabel an old shortlist as current.

NASA's May 2026 page describes Artemis III as an Earth-orbit test ahead of Artemis IV's planned crewed lunar landing. Therefore, keep mission label language source/version aware and recheck official NASA information at delivery time. Do not promote the UI's existing `Artemis III Candidate` chip without verifying the list's relationship to current mission context.

### 2.2 Global artistic texture and local science DEM are different asset classes

NASA SVS provides a convenient CGI Moon Kit. The current 2025 color map is an aesthetic visualization asset; the page describes source coverage gaps at high latitudes and says scientific applications should use source data. It also offers displacement maps derived from LOLA global data at variants such as 4, 16 and 64 pixels per degree.

Separately, NASA PGDA provides 5 m/pixel south-polar site DEMs with elevation, count, slope and uncertainty products for selected regions. LROC provides high-resolution polar imagery mosaics, including controlled 1 m/pixel products across 84–90°S.

**Design consequence:** build a global context mesh first, then add a properly georeferenced local terrain patch/mesh for regions with verified coverage. Do not advertise the global texture as high-resolution terrain. Do not load enormous research GeoTIFFs directly into the browser without a preprocessing and tiling strategy.

### 2.3 Realistic lunar south-pole illumination should not look like Earth sunrise

NASA's south-pole shadows resource explains that at the lunar poles the Sun remains very near the horizon and long shadows sweep around the terrain; nearby mountains can cast shadows over long distances. This is why the 3D view needs a low-elevation camera/lighting-aware experience, accurate vector direction, and terrain-based shadows only when the DEM/method supports them.

**Design consequence:** avoid a generic high Sun angle in the South Pole camera preset. The direction must come from the selected epoch/site, not a fixed spotlight rotation. If the surface mesh is too coarse to cast meaningful local shadows, label the shading as visual context instead of terrain-aware analysis.

### 2.4 A physical-scale Sun/Earth/Moon scene won't fit a normal terrain view

The Sun and Earth are far away relative to the lunar radius. A 3D scene that places a full globe Earth nearby can look like a toy solar system. Use an apparent-direction representation or a dedicated context panel with explicit scale notes. The local sky should show elevation/azimuth; the Moon globe should show geographic position and body orientation. Do not conflate either with a physical-space path on the lunar surface.

## 3. Recommended data roadmap

| Priority | Layer/data | First useful version | Data and method gates |
|---|---|---|---|
| P0 | Global Moon albedo/color | Verified color texture with correct longitude/UV orientation | Source/version/attribution; distinguish aesthetic source from science raster |
| P0 | Global elevation/displacement | Coarse real LOLA elevation map if projection/vertical units are confirmed | NoData handling, elevation convention, mesh orientation, correct relief scale |
| P0 | Candidate regions and point catalog | Versioned GeoJSON/typed catalog, separate region polygons and named points | Official list version/source; coordinate frame/datum; region vs point semantics |
| P0 | Sun/Earth state vectors | Existing validated service returns frame/time/observer/target metadata | SPICE kernel coverage and frame/epoch tests |
| P1 | South-pole high-resolution basemap | Tiled LROC polar imagery for the study region | Projection-aware tiles; attribution; coverage masks; no inference of elevation from image |
| P1 | Local site DEM | A compatible LOLA site DEM, slope map and uncertainty products | Site coverage, coordinate frame, pixel scale, vertical units, NoData and uncertainty |
| P1 | Local terrain shadows/visibility | A named ray/horizon/illumination method over supported DEM mesh/data | Known benchmark cases and method tolerance; distinguish geometry-only from terrain-aware |
| P1 | Local-sky graph | Same result object as metric cards; local topocentric frame | Azimuth convention, horizon model, epoch identity |
| P2 | Slope/elevation profile | User-drawn line sampled over DEM | Projection mapping, sample distance, units, missing coverage |
| P2 | PSR layer | Product-backed permanent-shadow overlay | Product source/version/epoch/method; do not infer from a dark base texture |
| P2 | Timeline/opportunity windows | Samples computed at named UTC epochs | Step resolution, event definition, sampling limitations and no fabricated interpolation |
| P3 | Thermal/volatile/rock-hazard layers | Only if a suitable source product and analysis methodology are identified | Distinct source, uncertainty, spatial resolution, date and method; no unsupported suitability scoring |

## 4. Data manifest schema concept

Use this as a conceptual contract, not necessarily a finalized Zod schema:

```ts
interface SpatialAssetManifest {
  id: string;
  label: string;
  provider: string;
  sourceUrl: string;
  productId?: string;
  productVersion?: string;
  retrievedAt?: string;
  visualPurpose: 'visual-context' | 'scientific-analysis' | 'both';
  coordinateFrame: string;
  projection: string;
  bounds: { minLat: number; maxLat: number; westLon: number; eastLon: number };
  spatialResolution?: { value: number; unit: 'm/px' | 'px/degree' };
  verticalUnits?: string;
  noDataPolicy: string;
  attribution: string;
  checksum?: string;
  coverageStatus: 'verified' | 'partial' | 'unknown';
  validationReferences: string[];
}
```

Do not fill unknown fields with plausible guesses. `coverageStatus: 'unknown'` is preferable to inventing certainty.

## 5. What to build versus what to defer

Build first:
- correct global/south-pole/site camera modes;
- real selected-site picking and shared state;
- color and elevation data provenance;
- Sun light direction driven by scientific geometry;
- Earth apparent-direction marker and correct scale semantics;
- camera reset/focus, bounded orbit and zoom, resize handling;
- explicit layers and error/loading fallback;
- 2D/3D parity and tests.

Defer until source products and validation are available:
- full mission suitability scores;
- lighting-continuity/annual illumination claims without validated sampling;
- global terrain-aware line-of-sight on a coarse global mesh;
- thermal state, water-ice availability, radiation safety, landing hazard guarantees;
- physically scaled Sun and Earth in the same small Moon viewport;
- AI-generated science conclusions.

## 6. Links for agent research

- NASA CGI Moon Kit: https://svs.gsfc.nasa.gov/4720/
- NASA PGDA high-resolution LOLA topography: https://pgda.gsfc.nasa.gov/products/78
- PDS LOLA archive: https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- LROC controlled 1 m/pixel south-pole mosaic: https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_POLE_SOUTH_CM_AVG
- NASA Moon Trek: https://trek.nasa.gov/moon/
- NASA south-pole shadow visualization: https://science.nasa.gov/resource/shadows-near-the-moons-south-pole/
- NASA 2024 Artemis III region update: https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/
- NASA 2026 preliminary Artemis III mission plan: https://www.nasa.gov/missions/artemis/artemis-3/nasa-outlines-preliminary-artemis-iii-mission-plans/
- LPI Lunar South Pole Atlas: https://www.lpi.usra.edu/lunar/lunar-south-pole-atlas/
- NAIF SPICE time docs: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/time.html
- NAIF SPICE SPK docs: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/spk.html
- NAIF reference frames: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/FORTRAN/req/frames.html
- Three.js OrbitControls: https://threejs.org/docs/pages/OrbitControls.html
- Three.js Raycaster: https://threejs.org/docs/pages/Raycaster.html
- Three.js cleanup: https://threejs.org/manual/pages/cleanup.html
