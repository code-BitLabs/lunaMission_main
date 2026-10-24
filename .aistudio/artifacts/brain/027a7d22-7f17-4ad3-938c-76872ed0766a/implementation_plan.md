# LunaMission: Scientifically Grounded 3D Lunar Site Inspection & Local Orbit Engine

A rigorous, phased engineering overhaul of the LunaMission 3D inspection mode, delivering mathematically stable local orbit controls at polar latitudes, authentic physical lighting and shadows, verified LOLA DEM terrain provenance, clear scientific uncertainty labeling, and an ergonomic scientific HUD.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following revisions have been integrated directly into the engineering plan:
> - **Scientific Authenticity Over Assumption**: The unverified 1,000 m Artemis landing ellipse, arbitrary slope hazard rings, and synthetic zero-albedo PSR plates are removed. All terrain data, illumination, and visibility calculations are derived from verified LOLA/Kaguya datasets or physically consistent Three.js shadow maps, with explicit provenance badges (source, resolution, coordinate frame, coverage, and limitations).
> - **Singularity-Free Local Orbit Frame**: Rather than relying merely on `camera.up` manipulation (which fails near the poles), local inspection uses an explicit topocentric East-North-Up (ENU) tangent basis centered on the candidate's exact selenographic Cartesian coordinate, preventing gimbal lock, inverted pitch, and near-clipping artifacts down to deep inspection altitudes.
> - **Preserved Workflows**: The four camera modes (Regional Overview, 45° Oblique Inspection, Overhead Nadir, Ground-Level Horizon), interruptible easing transitions, synchronized UTC diurnal scrubber, optional cinematic flyover, and optional 2D/3D split view are preserved and stabilized.
> - **Evidence-Backed 7-Phase Execution**: Implementation follows a strict phased pipeline (Baseline & Reproduction → Standalone Lab → Camera Reliability → Visual Cleanup → Verified Terrain/Science → Performance Profiling → Browser & Edge-Case Verification).

---

### 1. Overview & Core Concept

- **What It Does**: Provides a scientifically validated, dual-scale lunar exploration interface. Users can inspect candidate landing sites across the lunar South Pole (e.g., Shackleton Connecting Ridge, Malapert Massif, Connecting Ridge Extension) from regional orbital context down to local surface relief without experiencing camera flips, jitter, near-plane clipping, or unverified claims.
- **Scientific Foundation**: Strictly respects the IAU/IAG Moon 2000 / Mean Earth/Polar Axis (ME) body-fixed coordinate frame, NASA LOLA (128 ppd, ~237 m/px horizontal resolution), and verified sub-solar ephemeris geometry.
- **Key Value**: Delivers an authentic mission-planning tool with zero hallucinated landing safety zones, explicit provenance, and robust interactive performance.

---

### 2. User Experience & Visual Design

#### Four Calibrated Camera Perspectives
1. **Regional South Pole Overview (`nadir`)**: Nadir perspective framing 83°S to 90°S, with +Z (prime meridian / Earth-facing) pointing up, matching the 2D polar stereographic map.
2. **45° Oblique Site Inspection (`oblique`)**: Grazing view tilted 45° to the local surface normal, highlighting topographic relief and solar shadows along crater rims.
3. **High-Angle Overhead (`overhead`)**: Top-down view centered on the candidate site coordinates, ideal for morphological inspection of crater rims and plateaus.
4. **Ground-Level Horizon Perspective (`horizon`)**: Low-altitude perspective (~150 m equivalent scale) looking outward toward the local horizon, useful for evaluating Earth direct-to-Earth communication sightlines and low-angle sun angles.

#### Inspection HUD & Interaction Directives
- **Zero Viewport Occlusion**: All interactive controls are consolidated in a collapsible, glassmorphic bottom dock (`bottom: 16px; max-width: min(1040px, 94vw)`), keeping the central 3D scene 100% unobstructed.
- **Zen View (Collapse / Expand)**: Single-click toggle hides all floating HUD chrome for fullscreen scientific presentation or screenshot capture.
- **Time Stepper**: Step controls (±1h, ±6h, play/pause diurnal loop) that dynamically re-aim the directional solar key light and update the topocentric sun elevation readout.
- **Guided Flyover**: Smooth 360° circular reconnaissance trajectory orbiting the crater rim that immediately yields control to user mouse/touch input upon interaction.
- **Optional 2D/3D Split View**: Synchronized dual-pane layout rendering the 3D WebGL scene alongside the 2D LOLA slope and radar passport for the selected candidate.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Topocentric Tangent Basis for Local Orbit
- **Chosen Approach**: When entering inspection mode, the camera's reference frame is mathematically decoupled from the global selenographic Cartesian axes. A local topocentric orthonormal basis is constructed:
  $$\mathbf{U} = \hat{\mathbf{n}} \quad (\text{Local Up / Surface Normal})$$
  $$\mathbf{E} = \frac{\hat{\mathbf{Y}}_{\text{pole}} \times \mathbf{U}}{\|\hat{\mathbf{Y}}_{\text{pole}} \times \mathbf{U}\|} \quad (\text{Local East})$$
  $$\mathbf{N} = \mathbf{U} \times \mathbf{E} \quad (\text{Local North})$$
  OrbitControls is re-anchored to the site position with control angles evaluated in this local tangent space.
- **Why**: Eliminates the mathematical gimbal singularities that occur when orbiting coordinates near the lunar poles (-89° to -85° latitude) in global space.
- **Alternative Considered**: Continuous Euler angle clamping. Rejected because Euler clamping produces unpredictable steering reversals at high latitudes.

#### Decision 2: Elimination of Arbitrary Landing Ellipses & Synthetic PSR Baseplates
- **Chosen Approach**: Remove the hardcoded 1,000 m Artemis landing ellipse and synthetic pitch-black floor baseplates. Permanently shadowed regions and illumination are visualized purely via physical Three.js shadow maps cast by actual surface relief and low-angle directional sunlight. Where scientific coverage boundaries exist (e.g. 83°S LOLA limit), they are explicitly labeled with source and uncertainty.
- **Why**: Prevents conveying unsupported landing safety or fabricated crater depth to mission planners.

#### Decision 3: Profile-First Performance Architecture
- **Chosen Approach**: Profile fullscreen WebGL performance using the built-in telemetry HUD and browser performance tools before optimizing. Identify whether bottlenecks stem from shader fill-rate on retina displays, polygon count, or shadow map updates. Cap device pixel ratio dynamically (`renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))`) and use adaptive shadow map resolution.
- **Why**: Avoids degrading visual fidelity prematurely while guaranteeing smooth 60 FPS in fullscreen mode.

---

### 4. Technical Architecture & Phased Implementation Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             LunaMission 3D Lab                              │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Top Bar: Return to Observatory | Candidate Selector | Telemetry HUD │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌───────────────────────────────┬─────────────────────────────────────┐   │
│   │                               │ (Optional Synchronized Split-View)  │   │
│   │      3D Lunar Scene Stage     │ 2D LOLA Slope & Radar Passport      │   │
│   │                               │                                     │   │
│   │  - PBR Lunar Surface          │ - Synchronized Candidate Site       │   │
│   │  - Physical Directional Sun   │ - Verified Elevation Profile (LOLA) │   │
│   │  - Shadow-Casting Relief      │ - Topocentric Sun/Earth Readouts    │   │
│   │  - Localized Orbit Controller │ - Coordinate Frame: IAU ME 2000     │   │
│   │  - Scale-Adaptive Markers     │ - Provenance & Limitations Ledger   │   │
│   │                               │                                     │   │
│   └───────────────────────────────┴─────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Collapsible Scientific HUD (Bottom Center, Zero Center Occlusion)   │   │
│   │                                                                     │   │
│   │ [Presets: South Pole | 45° Oblique | Overhead | Horizon | Flyover] │   │
│   │ [Time: -6h | -1h | Play/Pause | +1h | +6h | Sun Elevation Readout]  │   │
│   │ [Layers: Relief | Sites | Earth Sightline | Graticule Grid]        │   │
│   │ [Deep Zoom Stepper] | [Split 2D/3D Mode] | [Zen Mode Toggle]        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Phased Rollout Plan

- [x] **Phase 1: Baseline Profiling & Issue Reproduction**
  - Profiled scene: confirmed OrbitControls gimbal flip at polar latitudes ($\phi \to -\pi/2$) when using global Cartesian axes.
  - Confirmed near-clipping at $0.05\text{ u}$ was causing planar polygon slicing during close inspection; camera collision guard pushed radially outward from $(0,0,0)$ rather than relative to the orbit target.
  - Baseline metrics captured: 60 FPS, 199 unit tests passing across 33 test files.

- [x] **Phase 2: Standalone Lab Architecture & Routing**
  - Confirmed `/scenario/3d-lab` route integrity in both production SPA routing and client header navigation.
  - Synchronized candidate selection (`CANDIDATE_SITES`) and UTC epoch flow seamlessly with `WorkspaceProvider` without state resets.

- [x] **Phase 3: Camera Reliability & Topocentric Orbit Frame**
  - Implemented orthonormal topocentric East-North-Up (ENU) tangent basis in `globeCameraPresets.ts`:
    $$\hat{\mathbf{U}} = \hat{\mathbf{n}}, \quad \hat{\mathbf{E}} = \frac{\hat{\mathbf{Y}} \times \hat{\mathbf{U}}}{\|\hat{\mathbf{Y}} \times \hat{\mathbf{U}}\|}, \quad \hat{\mathbf{N}} = \hat{\mathbf{U}} \times \hat{\mathbf{E}}$$
    With singularity resolution at $\phi = -90^\circ$ referencing prime meridian (+Z).
  - Implemented dynamic near-plane scaling down to $0.002\text{ u}$ during deep inspection.
  - Implemented interruptible exponential damping across presets (`nadir`, `oblique`, `overhead`, `horizon`, `site`, `global`).
  - Unit tests in `globeCameraPresets.test.ts` and `globeCameraOrbitStability.test.ts` pass with 100% success.

- [x] **Phase 4: Visual Cleanup & De-cluttering**
  - Removed unverified 1,000 m Artemis landing ellipse and generic slope hazard rings from `globePolarTerrain.ts`.
  - Removed synthetic zero-albedo flat floor baseplates; physical Three.js directional key lighting and terrain-cast shadow maps govern surface illumination.
  - Scale-adaptive candidate markers smoothly fade at close zoom, revealing unoccluded topography with a subtle IAU datum crosshair.
  - Non-occluding, glassmorphic bottom dock (`GlobeInspectionDock.tsx`) with Zen mode toggle and zero center-screen occlusion.

- [x] **Phase 5: Verified Terrain & Scientific Provenance**
  - Dataset provenance documented: NASA LOLA DEM (128 ppd, ~237 m/px horizontal resolution, 83°S–90°S coverage), IAU 2000 Moon Mean Earth/Polar Axis frame, and sub-solar ephemeris.
  - Explicit uncertainty indicators and provenance tags displayed in Site Intel panel.
  - Synchronized 2D/3D split-view mode linking the 3D terrain canvas with the 2D slope and radar passport (`PointPassport`).

- [x] **Phase 6: Performance Profiling & Optimization**
  - Dynamic renderer pixel ratio capped at `Math.min(window.devicePixelRatio, 1.75)` to prevent 4K/retina fillrate degradation.
  - Optimized polar directional light shadow map frustum ($0.75 \times 0.75\text{ u}$, $2048 \times 2048$ shadow map) for crisp rim shadows without frame drops.
  - Smooth 60 FPS verified across repeated deep zoom and orbit cycles.

- [x] **Phase 7: Comprehensive Browser & Edge-Case Verification**
  - Playwright browser script (`scripts/verify-3d-lab.ts`) executed 12 end-to-end verification steps capturing high-resolution validation screenshots in `/.playwright-cli/`:
    - `lab-3d-4-oblique-45.png` (45° oblique view)
    - `lab-3d-5-overhead.png` (Tactical overhead nadir)
    - `lab-3d-6-horizon.png` (Ground-level horizon)
    - `lab-3d-7-orbit-drag.png` (Manual orbit drag)
    - `lab-3d-8-flyover-active.png` (Flyover tour active)
    - `lab-3d-9-split-view.png` (Synchronized 2D/3D split view)
    - `lab-3d-10-malapert-split.png` (Malapert Massif +5.1 km in split view)
  - Full test suite execution: `bun test` passed all 199 tests across 33 test files in 239ms.
  - Typecheck: `bun run lint` (`tsc --noEmit`) passed with 0 errors.
  - Build compilation: `compile_applet` (`vite build`) compiled cleanly with 0 errors.
