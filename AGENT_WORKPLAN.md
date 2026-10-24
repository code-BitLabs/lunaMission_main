# LunaMission 3D Experience — Agent Workplan & Verification Report

**Version:** 2.0 (Master Implementation Release)  
**Updated:** 2026-10-24  
**Status:** **All Phases Complete & Verified**  
**Core Standard:** Real science calculation modules separate from rendering. Zero fabricated values. Scale-aware navigation bounded by source resolution.

---

## 1. Executive Summary & Deliverables

| Deliverable | Status | Evidence & Metrics |
|---|---|---|
| **Root Causes Diagnosed & Fixed** | **Done** | Fixed bloated 3D marker discs, overlapping badges, polar orbit drift, unconstrained zoom clipping, and confusing concentric rings. |
| **Three Exploration Scales** | **Done** | Mode A (Regional South Pole), Mode B (Candidate Overview), Mode C (Local Inspection) + Global Context & Oblique Relief. |
| **Independent 3D Laboratory** | **Done** | Route `/scenario/3d-lab` mounted with full viewport, real scenario context, HUD diagnostics, and Zen view dock collapse. |
| **Scientific Site Intel Panel** | **Done** | Modular 4-part scientific inspection accordion: Overview, Terrain Coverage, Illumination, and Visibility/DTE link. |
| **Independent Layer Controls** | **Done** | Discrete toggles for Terrain, Sites, Labels, Vectors (Sun/Earth), Footprint (83°S LOLA extent), and Grid. |
| **Automated Test Matrix** | **Done** | **197 automated tests passing** across 33 test suites (`bun test`). Zero lint/type errors (`tsc --noEmit`). |
| **Browser End-to-End Verification** | **Done** | Complete 11-step Playwright browser automation sequence passing in headless Chromium with screenshots saved to `.playwright-cli/`. |

---

## 2. Root Cause Diagnostics & Confirmed Fixes

1. **Bloated Marker Discs at Extreme Zoom (Fixed)**:
   - *Problem*: In close zoom ($d < 0.6\text{ u}$), markers with fixed world geometry (`radius = 0.010 - 0.018\text{ u}`) ballooned into giant cyan/purple discs covering entire craters.
   - *Root Cause*: World-space mesh dimensions did not scale down with camera-to-target distance, and unselected candidates remained visible when zoomed into local sites.
   - *Fix*: Created scale-adaptive geometry in `globeSiteMarkers.ts`. At local inspection scale ($d < 0.65\text{ u}$), all non-selected candidates are automatically culled, and the selected site marker dynamically scales down to maintain a crisp, delicate pin appearance.
   - *Evidence*: `lab-3d-5-local-inspection.png` and `lab-3d-7-malapert-inspection.png` show clear, unobstructed crater relief.

2. **Confusing Concentric Circles & Dashed Rings (Fixed)**:
   - *Problem*: Polar scene rendered multiple arbitrary dashed rings at -85° and -88° latitude with no documented meaning.
   - *Root Cause*: Decorative rings added in `createPolarFootprintGroup()` created visual clutter.
   - *Fix*: Streamlined `globeGraticule.ts` to show strictly the **verified 83.0°S LOLA DEM coverage boundary** and the true 90°S South Pole crosshair.
   - *Evidence*: Tested in `globeLifecycleAndFraming.test.ts` and verified in `lab-3d-3-southpole.png`.

3. **Camera Instability and Arbitrary Offsets Near South Pole (Fixed)**:
   - *Problem*: Local inspection preset used fixed world offsets `(0, -0.035, 0.035)`, causing oblique angles to point in arbitrary directions depending on the candidate's latitude.
   - *Root Cause*: Lack of a local topocentric coordinate frame for site camera positioning.
   - *Fix*: Re-derived `cameraPoseForPreset` in `globeCameraPresets.ts` using the site surface normal and local meridian tangent plane. The camera parks at an oblique grazing altitude ($0.085\text{ u}$ normal, $0.045\text{ u}$ tangent) with `upVector = siteNormal`, enabling smooth 360° orbit rotation without gimbal lock.
   - *Evidence*: Tested in `globeCameraOrbitStability.test.ts` and `lab-3d-6-deep-orbit.png`.

4. **Dynamic Near-Plane Slicing and Anti-Penetration Guard (Fixed)**:
   - *Problem*: Camera either sliced through terrain at close range (near-plane clipping) or penetrated into the Moon sphere.
   - *Root Cause*: Static `camera.near = 0.05` was too large for sub-kilometer inspection.
   - *Fix*: Implemented dynamic near clipping plane adjustment ($near = 0.002\text{ u}$ when $dist < 0.20\text{ u}$) and spherical boundary collision guard preventing camera altitude from dipping below $R_{moon} + 0.015\text{ u}$.
   - *Evidence*: Validated in `globeDeepZoom.test.ts`.

---

## 3. The Three Deliberate Exploration Scales

- **Mode A — Regional South Pole**:
  - *Camera*: Nadir orientation centered on 90°S ($d = 4.8\text{ u}$), matching the 2D Polar Stereographic map. Prime meridian (+Z) held up.
  - *Content*: Full polar relief, 83°S LOLA DEM coverage boundary, non-overlapping candidate pins, and global coordinate graticule.
- **Mode B — Candidate Overview**:
  - *Camera*: Centered on selected site ($d \approx 1.25\text{ u}$) framing the surrounding crater rim and massif.
  - *Content*: Emphasized candidate pin, subtle distant markers, and floating Site Intel panel displaying catalog lineage and provenance.
- **Mode C — Local Inspection**:
  - *Camera*: Oblique grazing view ($d \approx 0.096\text{ u}$, ~28° elevation angle), orbiting around the local surface normal.
  - *Content*: High-contrast relief and illumination terminator. Non-selected candidates hidden to prevent visual clutter.
- **Global Context & Oblique Relief**:
  - Global overview ($d = 5.8\text{ u}$) framing the entire lunar sphere with comfortable margin, and regional oblique perspective view across crater rims.

---

## 4. Verification & Performance Evidence

- **Unit Test Suite**: `bun test` passes **197 tests across 33 test files** with 0 failures in <300 ms.
- **TypeScript & Lint**: `tsc --noEmit` and `lint_applet` pass with 0 errors.
- **Production Build**: `vite build` compiles cleanly with zero warnings.
- **Browser Automation (`scripts/verify-3d-lab.ts`)**:
  - `lab-3d-1-initial-nadir.png`: Nadir polar opening with telemetry HUD.
  - `lab-3d-2-global.png`: Global Moon view with full sphere clearance.
  - `lab-3d-3-southpole.png`: Mode A Regional South Pole with verified 83°S footprint.
  - `lab-3d-4-candidate-overview.png`: Mode B Candidate Overview with Site Intel panel.
  - `lab-3d-5-local-inspection.png`: Mode C Local Inspection with deep grazing rim view.
  - `lab-3d-6-deep-orbit.png`: Orbit rotation around candidate site at deepest zoom.
  - `lab-3d-7-malapert-inspection.png`: Immediate camera refocus to Malapert Massif (SITE-005) without bloated discs.
  - `lab-3d-8-layer-toggles.png`: Independent layer controls toggled.
  - `lab-3d-9-time-step.png`: Dynamic lighting terminator updated after +6h ephemeris step.
  - `lab-3d-10-reset-camera.png`: Reset Camera restores default nadir orientation and Shackleton Rim.
  - `observatory-with-3d-lab-btn.png`: Main observatory interface with direct 3D Lab toggle button.

---

## 5. Files Changed & Responsibilities

| File Path | Responsibility |
|---|---|
| `src/features/spatial/globe/scene/globeSiteMarkers.ts` | Scale-adaptive markers, delicate pin geometry, and automatic culling of non-selected candidates during local inspection. |
| `src/features/spatial/globe/scene/globeGraticule.ts` | Clean polar graticule displaying the verified 83°S LOLA coverage boundary and 90°S crosshair without arbitrary concentric rings. |
| `src/features/spatial/globe/interaction/globeCameraPresets.ts` | Topocentric local frame derivation for site and inspection presets with 360° orbit stability. |
| `src/features/spatial/globe/scene/globeSceneBuilder.ts` | Dynamic near-plane adjustment, anti-penetration guard, display options management, and frame diagnostic metrics. |
| `src/features/spatial/globe/scene/globeSceneInputs.ts` | Synchronization of selected site, celestial ephemeris, and layer display options to active scene handle. |
| `src/features/spatial/globe/hooks/useGlobeSceneSync.ts` | Reactive synchronization of scenario state, inspection preset re-focusing, and display layer flags. |
| `src/features/spatial/globe/hooks/useGlobeScene.ts` | WebGL lifecycle hook with support for independent layer controls. |
| `src/features/spatial/ui/LunarGlobe3D.tsx` | High-level 3D container component accepting layer toggles and diagnostics HUD configuration. |
| `src/features/spatial/globe/components/GlobeSiteInspectionPanel.tsx` | Modular scientific site inspection accordion with Overview, Terrain, Illumination, and Visibility sections. |
| `src/features/spatial/lab/Scenario3DLab.tsx` | Standalone 3D lab harness with mode badges, Site Intel panel, dock collapse, and time controls. |
| `src/features/spatial/globe/__tests__/globeVisualHierarchyAndModes.test.ts` | Unit tests for visual hierarchy, marker scaling, layer toggles, and camera presets. |
| `scripts/verify-3d-lab.ts` | Automated browser verification testing the complete 11-step end-to-end scenario. |
