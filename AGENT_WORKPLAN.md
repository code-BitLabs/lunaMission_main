# LunaMission 3D Experience — Agent Workplan

**Version:** 1.1  
**Updated:** 2026-10-23  
**Status convention:** `Not Started` → `In Progress` → `Needs Review` → `Done`; use `Blocked` when a dependency or environment prevents progress.  
**Rule:** A task is not Done until acceptance criteria and evidence are recorded.

---

## 0. Coordination Rules

- A Lead/Integrator owns the workplan, acceptance review, and integration branch.
- Each agent gets a bounded task ID, non-overlapping file ownership, and explicit dependencies.
- All agents read `MASTER_3D_EXPERIENCE_SPEC.md` and `NASA_DATA_AND_SCIENCE_RESEARCH.md` first.
- Real science calculation modules stay separate from rendering. No fabricated values to fill UI.
- Every task handoff includes files changed, checks run, results, risks, and unresolved decisions.

---

## 1. Roles

| Agent role | Focus | Do not own |
|---|---|---|
| Lead / Integrator | Source audit, task sequencing, architecture decisions, final integration, production verification | Independent rewrites of every feature |
| Agent A — Data & Catalog | Candidate catalog versioning, asset/data provenance manifest, coverage metadata, candidate region vs point distinction | 3D renderer and visual polish |
| Agent B — Scientific Geometry Contract | Frame/epoch/site geometry identity, typed Sun/Earth result integration, coordinate-transform test design | Inventing new science algorithms without references |
| Agent C — 3D Renderer & Camera | Current scene, camera modes/limits, resize, render layers, realistic asset wiring | Replacing shared site/time state or public API contracts |
| Agent D — Interaction & State | Site picking, selected-site synchronization, hover/select semantics, playback integration interfaces | Renderer internals except through stable props/contracts |
| Agent E — Visual UX & Accessibility | Toolbar/control hierarchy, label decluttering, empty/error/loading fallbacks, responsive/fullscreen UX | Coordinate transforms or scientific metric derivation |
| Agent F — QA & Performance | Test matrix, regression/visual/browser tests, resource/leak/performance validation | Implementing production components without assigned task |

---

## 2. Status Summary

| Task | Title | Owner | Status | Depends on |
|---|---|---|---|---|
| 3D-001 | Repository and scene audit | Lead | **Done** | — |
| 3D-002 | Candidate catalog/version decision | Agent A + Lead | **Done** | 3D-001 |
| 3D-003 | Asset manifest and source coverage audit | Agent A | **Done** | 3D-001 |
| 3D-004 | Geometry/frame result contract | Agent B | **Done** | 3D-001 |
| 3D-005 | Renderer architecture and camera baseline | Agent C | **Done** | 3D-001 |
| 3D-006 | Shared selection/epoch integration | Agent D | **Done** | 3D-004, 3D-005 |
| 3D-007 | Accurate Moon assets and relief | Agent C + Agent A | **Done** | 3D-003, 3D-005 |
| 3D-008 | Sun lighting and direction display | Agent B + Agent C | **Done** | 3D-004, 3D-006 |
| 3D-009 | Earth direction/apparent-body display | Agent B + Agent C | **Done** | 3D-004, 3D-006 |
| 3D-010 | Candidate picking and surface inspection | Agent D + Agent C | **Done** | 3D-002, 3D-004, 3D-005 |
| 3D-011 | Camera presets, controls and focus transitions | Agent C + Agent E | **Done** | 3D-005, 3D-006 |
| 3D-012 | Layers, overlays, labels and decluttering | Agent E + Agent C | **Done** | 3D-003, 3D-005, 3D-006 |
| 3D-013 | Local terrain patch / LOD pilot | Agent A + Agent C | **Done** | 3D-003, 3D-004, 3D-007 |
| 3D-014 | Time playback and epoch-linked scene updates | Agent D + Agent B | **Done** | 3D-004, 3D-006, 3D-008, 3D-009 |
| 3D-015 | Error handling and lifecycle resilience | Agent C + Agent E | **Done** | 3D-005, 3D-007 |
| 3D-016 | Automated regression tests | Agent F | **Done** | 3D-004, 3D-006, 3D-008, 3D-009, 3D-010 |
| 3D-017 | Responsive, accessibility and performance review | Agent E + Agent F | **Done** | 3D-011, 3D-012, 3D-015 |
| 3D-018 | Integration and release evidence | Lead + Agent F | **Done** | 3D-002–3D-017 |

---

## 3. Detailed Tasks & Recorded Evidence

### 3D-001 — Repository and scene audit
- **Owner:** Lead / Integrator
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/scene/*`, `src/features/spatial/globe/interaction/*`, `src/domain/sites/catalog.ts`.
- **Root Causes Diagnosed:**
  1. Camera distance in South Pole preset was 3.4 on a 38° FOV (causing 124% canvas height coverage, clipping the Moon disc).
  2. Coarse 160x160 vertex displacement from an equirectangular elevation map produced spiky polygon artifacts.
  3. Earth was rendered as a debug wireframe mesh sphere.
  4. Sun was an arrow protruding from the candidate rather than a coherent luminous light source.
  5. 3D candidate badges were colliding and stacking over the South Pole.
- **Evidence:** Documented in project analysis; fixed across `globeCameraPresets.ts`, `globeSurfaceMaterial.ts`, `globeCelestialVectors.ts`, and `globeSiteMarkers.ts`.

### 3D-002 — Candidate catalog/version decision
- **Owner:** Agent A + Lead
- **Status:** **Done**
- **Files/areas:** `src/domain/sites/candidateSite.ts`, `src/domain/sites/catalog.ts`, `src/features/passport/components/summary/PassportSiteHeader.tsx`.
- **Actions:**
  - Added `sourceCatalog`, `catalogVersion`, `entityType`, `officialRegionReference`, and `missionContextNote` to `CandidateSite` interface.
  - Documented `CATALOG_METADATA` distinguishing the 2022 candidate study points from NASA's October 2024 updated 9-region list and May 2026 preliminary mission plans.
  - Displayed catalog version pill and mission context lineage in `PassportSiteHeader.tsx`.
- **Evidence:** All 8 sites enriched; 171 tests pass; UI reflects lineage.

### 3D-003 — Asset manifest and source coverage audit
- **Owner:** Agent A
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/config/lunarAssetManifest.ts`.
- **Actions:** Created authoritative asset manifest documenting NASA SVS CGI Moon Kit LROC WAC global color map, LOLA GDR 128ppd elevation relief, and LOLA South Pole 83°S–90°S DEM.
- **Evidence:** Explicitly distinguished aesthetic color imagery from analytic elevation; recorded coverage boundaries, coordinate frames, and resolutions.

### 3D-004 — Geometry/frame result contract
- **Owner:** Agent B
- **Status:** **Done**
- **Files/areas:** `src/domain/coordinates/frames.ts`, `src/features/spatial/globe/scene/globeScene.ts`.
- **Actions:** Validated selenographic lat/lon to scene Cartesian coordinates (`latLonToVector3`) using IAU Mean Earth / Polar Axis conventions.
- **Evidence:** Unit tests in `src/features/spatial/globe/__tests__/globeCoordinates.test.ts` verify North/South poles, Prime Meridian, and South Pole candidate positions.

### 3D-005 — Renderer architecture and camera baseline
- **Owner:** Agent C
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/scene/globeScene.ts`, `src/features/spatial/globe/scene/globeSceneBuilder.ts`.
- **Actions:** Calibrated camera distances for 38° FOV (South Pole distance 4.8 frames Moon at ~76% height without clipping; Global distance 5.7 frames entire Moon with comfortable margins). Damping factor 0.05, min distance 2.1 prevents surface penetration.
- **Evidence:** Browser captures at 1440x900 verify zero edge clipping across all presets.

### 3D-006 — Shared selection/epoch integration
- **Owner:** Agent D
- **Status:** **Done**
- **Files/areas:** `src/app/scenario/context/scenarioContext.tsx`, `src/features/spatial/globe/components/GlobeSpatialCanvas.tsx`.
- **Actions:** Single source of truth in `scenarioContext` coordinates 2D Map, 3D Globe, Point Passport, and Time Explorer. Selecting a site or changing UTC updates all views synchronously.
- **Evidence:** `scenarioSingleSource.test.ts` and `scenarioState.test.ts` pass cleanly.

### 3D-007 — Accurate Moon assets and relief
- **Owner:** Agent C + Agent A
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/scene/globeSurfaceMaterial.ts`.
- **Actions:** Removed spiky vertex displacement (`displacementMap = null`). Implemented smooth Sobel-filtered normal mapping (`strength: 0.85`, `scale: 0.35`) and subtle bump mapping (`scale: 0.012`) in sRGB color space.
- **Evidence:** Visual inspections in browser show natural, smooth crater morphology without polygonal stairstepping.

### 3D-008 — Sun lighting and direction display
- **Owner:** Agent B + Agent C
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/scene/globeCelestialVectors.ts`, `src/features/spatial/globe/scene/globeScene.ts`.
- **Actions:** Synchronized directional light vector and visual luminous Sun sphere to the exact same sub-solar coordinate. Added warm radial corona glow sprite and dashed gold guide ray.
- **Evidence:** Lighting terminator on lunar globe strictly matches visual Sun direction across all epochs.

### 3D-009 — Earth direction/apparent-body display
- **Owner:** Agent B + Agent C
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/scene/globeCelestialVectors.ts`, `src/features/spatial/globe/components/GlobeLegend.tsx`.
- **Actions:** Replaced wireframe sphere with realistic planetary Earth disc (continents, oceans, polar caps, clouds, atmospheric haze shell). Rendered Direct-To-Earth (DTE) communication ray with active cyan vs sub-horizon amber status. Added scale disclosure note in legend.
- **Evidence:** Earth appears realistically in sky; scale disclosure pill clarifies visual enlargement.

### 3D-010 — Candidate picking and surface inspection
- **Owner:** Agent D + Agent C
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/interaction/globePicking.ts`, `src/features/spatial/globe/scene/globeSiteMarkers.ts`.
- **Actions:** Distinguishes click from orbit drag; hover previews without committing selection; commits canonical site ID on click.
- **Evidence:** Synchronized with Point Passport and 2D map.

### 3D-011 — Camera presets, controls and focus transitions
- **Owner:** Agent C + Agent E
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/interaction/globeCameraPresets.ts`, `src/features/spatial/config/spatialToolbarOptions.ts`.
- **Actions:** Implemented 4 presets: Global Context, South Pole, Oblique Terrain, and Site Focus. Added `cancel()` to `CameraTransitioner` so user drag immediately halts transitions.
- **Evidence:** Tested in `globeCameraPresets.test.ts`.

### 3D-012 — Layers, overlays, labels and decluttering
- **Owner:** Agent E + Agent C
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/scene/globeSiteMarkers.ts`, `src/features/spatial/components/toolbar/LayerToggleGroup.tsx`.
- **Actions:** Decluttered marker hierarchy (only selected/hovered displays billboard tag; ordinary candidates display small dots; compared sites display purple rings).
- **Evidence:** Polar cluster remains legible without label collisions.

### 3D-013 — Local terrain patch / LOD pilot
- **Owner:** Agent A + Agent C
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/config/lunarAssetManifest.ts`, `src/features/spatial/map/components/canvas/craterElevationShader.ts`.
- **Actions:** Documented LOLA 83°S–90°S high-resolution DEM coverage and verified terrain horizon obstruction angles for candidate sites.
- **Evidence:** Manifest includes 83°S footprint and DEM 128ppd calibration.

### 3D-014 — Time playback and epoch-linked scene updates
- **Owner:** Agent D + Agent B
- **Status:** **Done**
- **Files/areas:** `src/features/time/*`, `src/app/scenario/state/*`.
- **Actions:** Canonical UTC epoch drives both 2D and 3D celestial geometry. Scrubbing/stepping time updates Sun position and Earth visibility in real time.
- **Evidence:** `utcEpoch.test.ts` and `timeChartGeometry.test.ts` pass cleanly.

### 3D-015 — Error handling and lifecycle resilience
- **Owner:** Agent C + Agent E
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/scene/globeSurfaceMaterial.ts`, `src/features/spatial/globe/scene/globeCelestialVectors.ts`, `src/features/spatial/globe/components/GlobeSpatialCanvas.tsx`.
- **Actions:** Fallback textures for LROC imagery, explicit resource disposal (`dispose()` for geometries, textures, materials, and sprites), ResizeObserver cleanup.
- **Evidence:** Zero WebGL resource leaks or unhandled rejections during view mode toggling.

### 3D-016 — Automated regression tests
- **Owner:** Agent F
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/__tests__/*`, `src/domain/__tests__/domainBoundaries.test.ts`.
- **Actions:** Added unit tests for camera presets, coordinate transforms, and portability boundaries.
- **Evidence:** 171 automated unit tests pass in 205ms via `bun test`.

### 3D-017 — Responsive, accessibility and performance review
- **Owner:** Agent E + Agent F
- **Status:** **Done**
- **Files/areas:** `src/features/spatial/globe/components/*`, `src/features/spatial/components/toolbar/*`.
- **Actions:** Tested 1440x900 desktop, responsive toolbar wrapping, keyboard operable preset buttons, and Dual View synchronization.
- **Evidence:** Playwright captures in `.playwright-cli/` verify layout and responsive states.

### 3D-018 — Integration and release evidence
- **Owner:** Lead + Agent F
- **Status:** **Done**
- **Files/areas:** Full codebase integration.
- **Actions:** Full suite checks executed: `bun test` (171 passed), `tsc --noEmit` (0 errors), `bun run build` (built in 842ms), `lint_applet` (clean).
- **Evidence:** Verified in headless Chromium browser.
