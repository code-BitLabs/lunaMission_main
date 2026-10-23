# LunaMission 3D Experience — Agent Workplan

**Version:** 1.0  
**Created:** 2026-10-23  
**Status convention:** `Not Started` → `In Progress` → `Needs Review` → `Done`; use `Blocked` when a dependency or environment prevents progress.  
**Rule:** A task is not Done until acceptance criteria and evidence are recorded. Do not allow multiple agents to edit the same production files concurrently without a shared integration plan.

## 0. Coordination rules

- A Lead/Integrator owns the workplan, acceptance review, and integration branch.
- Each agent gets a bounded task ID, non-overlapping file ownership, and explicit dependencies.
- All agents read `MASTER_3D_EXPERIENCE_SPEC.md` and `NASA_DATA_AND_SCIENCE_RESEARCH.md` first.
- Do not assume data files/assets are licensed, available, correctly projected, or validated until inspected.
- No agent changes the global app architecture, installs a new state manager, or migrates Three.js/React Three Fiber without a decision record approved by the Lead.
- An agent may work in a separate branch/worktree. If the tool only provides one shared workspace, agents work sequentially for overlapping areas and commit/record changes before another agent edits those files.
- Keep real science calculation modules separate from rendering. No fabricated values to fill UI.
- Every task handoff must include files changed, checks run, results, risks, and unresolved decisions.

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

## 2. Status summary

| Task | Title | Owner | Status | Depends on |
|---|---|---|---|---|
| 3D-001 | Repository and scene audit | Lead | Not Started | — |
| 3D-002 | Candidate catalog/version decision | Agent A + Lead | Not Started | 3D-001 |
| 3D-003 | Asset manifest and source coverage audit | Agent A | Not Started | 3D-001 |
| 3D-004 | Geometry/frame result contract | Agent B | Not Started | 3D-001 |
| 3D-005 | Renderer architecture and camera baseline | Agent C | Not Started | 3D-001 |
| 3D-006 | Shared selection/epoch integration | Agent D | Not Started | 3D-004, 3D-005 |
| 3D-007 | Accurate Moon assets and relief | Agent C + Agent A | Not Started | 3D-003, 3D-005 |
| 3D-008 | Sun lighting and direction display | Agent B + Agent C | Not Started | 3D-004, 3D-006 |
| 3D-009 | Earth direction/apparent-body display | Agent B + Agent C | Not Started | 3D-004, 3D-006 |
| 3D-010 | Candidate picking and surface inspection | Agent D + Agent C | Not Started | 3D-002, 3D-004, 3D-005 |
| 3D-011 | Camera presets, controls and focus transitions | Agent C + Agent E | Not Started | 3D-005, 3D-006 |
| 3D-012 | Layers, overlays, labels and decluttering | Agent E + Agent C | Not Started | 3D-003, 3D-005, 3D-006 |
| 3D-013 | Local terrain patch / LOD pilot | Agent A + Agent C | Not Started | 3D-003, 3D-004, 3D-007 |
| 3D-014 | Time playback and epoch-linked scene updates | Agent D + Agent B | Not Started | 3D-004, 3D-006, 3D-008, 3D-009 |
| 3D-015 | Error handling and lifecycle resilience | Agent C + Agent E | Not Started | 3D-005, 3D-007 |
| 3D-016 | Automated regression tests | Agent F | Not Started | 3D-004, 3D-006, 3D-008, 3D-009, 3D-010 |
| 3D-017 | Responsive, accessibility and performance review | Agent E + Agent F | Not Started | 3D-011, 3D-012, 3D-015 |
| 3D-018 | Integration and release evidence | Lead + Agent F | Not Started | 3D-002–3D-017 as applicable |

## 3. Detailed tasks

### 3D-001 — Repository and scene audit
- **Owner:** Lead / Integrator
- **Status:** Not Started
- **Dependencies:** None
- **Files/areas:** Existing renderer, package/config, current 3D feature, shared state, scientific API adapters, tests.
- **Actions:** Identify Three.js vs React Three Fiber or other renderer; map current scene graph and asset loading; find where camera and site markers are positioned; document state source for site/UTC; determine why Earth appears as a detached globe and why the Moon framing varies; inventory existing tests and commands.
- **Acceptance:** Concise audit with file paths, actual root causes, existing architecture, unresolved frame/asset questions, and recommended minimal changes.
- **Evidence:** Repo paths and line references; baseline screenshot/recording if available; test commands/status.

### 3D-002 — Candidate catalog/version decision
- **Owner:** Agent A + Lead
- **Status:** Not Started
- **Dependencies:** 3D-001
- **Files/areas:** Candidate data source, `candidate.schema`, catalog/service, current site selectors and labels.
- **Actions:** Trace exact current eight candidate records and metadata. Separate region polygons from candidate points/custom points. Add source/version metadata. Compare against NASA's October 2024 nine Artemis III regions and the May 2026 NASA Artemis III mission plan context. Do not replace the app data until identifying whether current IDs are legacy, internal points, or a custom shortlist.
- **Acceptance:** Documented decision and typed catalog contract. Labels are versioned, no stale mission label is asserted without evidence, and missing coordinates are not fabricated.
- **Evidence:** Source links and catalog comparison table.

### 3D-003 — Asset manifest and source coverage audit
- **Owner:** Agent A
- **Status:** Not Started
- **Dependencies:** 3D-001
- **Files/areas:** Asset URLs/files, manifest, data directory, asset loader config.
- **Actions:** Identify exact assets currently used (color map, height/displacement, DEM, local texture). Validate source URL, file size, map orientation/projection, coverage, resolution, units, NoData policy, license/attribution and whether each asset is visual or analytic. Find NASA CGI Moon Kit, LROC south-pole mosaic and LOLA site DEM product options without loading giant source files directly into the browser.
- **Acceptance:** Manifest with `verified/partial/unknown` coverage; explicit asset role; lightweight browser strategy and preprocessing recommendations.
- **Evidence:** Metadata inspected and checksums/size where downloadable.

### 3D-004 — Geometry/frame result contract
- **Owner:** Agent B
- **Status:** Not Started
- **Dependencies:** 3D-001
- **Files/areas:** Existing scientific response schema, geometry service/adapters, typed UI result contract, tests.
- **Actions:** Identify actual frame, observer/target, epoch conversion, azimuth convention, radius/shape model, light-time correction, and validation status. Propose result identity including site/custom coordinates, UTC epoch, source/kernel/algorithm version, and data coverage. Distinguish local topocentric angles from body-fixed vectors.
- **Acceptance:** Approved contract and transform table. No assumptions about `IAU_MOON`, `MOON_ME`, or kernel availability without verification.
- **Evidence:** Documentation references and coordinate/time unit tests or existing test findings.

### 3D-005 — Renderer architecture and camera baseline
- **Owner:** Agent C
- **Status:** Not Started
- **Dependencies:** 3D-001
- **Files/areas:** Main scene component, camera controls, resize observer, scene graph, renderer setup.
- **Actions:** Fix default framing, max/min orbit distance and polar angles, damping, pan bounds, camera target, resize/fullscreen, and target focus. Do not rewrite the rendering library. Identify a scene composition boundary with Moon, candidate layer, vector layer, sky indicators and overlays.
- **Acceptance:** Global view fills the canvas intentionally; South Pole and Site Focus presets work; zoom never loses the scene; orbit does not penetrate terrain; no duplicate renderer/RAF loops after remount.
- **Evidence:** Browser interaction test/recording and camera state tests where possible.

### 3D-006 — Shared selection/epoch integration
- **Owner:** Agent D
- **Status:** Not Started
- **Dependencies:** 3D-004, 3D-005
- **Files/areas:** Existing selected-site state, epoch state, selectors, scene adapter and Point Passport integration.
- **Actions:** Ensure one authoritative selected site and canonical UTC epoch; local camera/hover state stays view-specific. Ensure all results are identity-matched and stale responses ignored. Preserve camera on selection by default; make `Focus selected site` explicit.
- **Acceptance:** Changing site from list/2D/3D updates relevant panels; changing epoch updates geometry without changing site/camera; old response never overwrites current result.
- **Evidence:** Interaction tests and logged result identity in development.

### 3D-007 — Accurate Moon assets and relief
- **Owner:** Agent C + Agent A
- **Status:** Not Started
- **Dependencies:** 3D-003, 3D-005
- **Files/areas:** Texture loader, displacement/DEM handling, model/mesh materials, manifest.
- **Actions:** Integrate verified real color and elevation assets with correct coordinate orientation. Start with global context assets; load regional/local DEM mesh only in its coverage. Tune material/shadow contrast, physical scale, seams and levels of detail. Avoid fake craters, texture-as-elevation, excessive height exaggeration, and 3D terrain aliasing.
- **Acceptance:** Earth-like toy/jagged plastic look reduced; actual elevation changes mesh only where valid; source/coverage and relief scale visible in diagnostics; fallback to coarse globe works.
- **Evidence:** Screenshots at global/south-pole/site focus; asset provenance manifest; scene performance check.

### 3D-008 — Sun lighting and direction display
- **Owner:** Agent B + Agent C
- **Status:** Not Started
- **Dependencies:** 3D-004, 3D-006
- **Files/areas:** Geometry adapter, directional light setup, Sun marker/vector layer and tests.
- **Actions:** Make Sun directional lighting derive from the calculated Sun vector transformed into the scene's frame at canonical epoch. Separate physical scene illumination from display glyphs. Keep Sun glyph/vector toggle independent of lighting/data. Animate only through valid epoch changes, not an arbitrary circular orbit.
- **Acceptance:** Selected epoch/site results and light direction agree; local polar light can appear very low; toggling vector does not change lighting calculations; missing geometry shows unavailable rather than stale light direction.
- **Evidence:** Known reference/test epochs, vector transform tests, screenshot showing epoch update.

### 3D-009 — Earth direction/apparent-body display
- **Owner:** Agent B + Agent C
- **Status:** Not Started
- **Dependencies:** 3D-004, 3D-006
- **Files/areas:** Earth display marker or context mode, Earth geometry adapter, scale labels and tests.
- **Actions:** Replace arbitrary nearby globe with a correct site-to-Earth direction or a dedicated context view. Use realistic Earth texture/orientation only if it is valid and available; otherwise use a clean apparent-direction glyph. Clearly label visual magnification or not-to-scale context. Ensure Earth marker updates with epoch/site and is not rendered as a geographic ray without transform.
- **Acceptance:** Earth appears intentionally in scene, not floating arbitrarily near Moon; direction matches geometry result; scale caveat is visible when needed; Earth visibility is not equated to RF link success.
- **Evidence:** Scene screenshots at two sites/times; transform tests; label/scale review.

### 3D-010 — Candidate picking and surface inspection
- **Owner:** Agent D + Agent C
- **Status:** Not Started
- **Dependencies:** 3D-002, 3D-004, 3D-005
- **Files/areas:** Raycasting/picking, marker layers, inspect-point mode, candidate list.
- **Actions:** Use scene raycasting or existing framework equivalent for marker/terrain picking. Distinguish click from drag; hover previews don't commit. Custom-point inspection is explicit mode. Convert surface hit into declared coordinate frame; show coverage status and nearest-site distance only if valid.
- **Acceptance:** All supported candidates are selectable, marker position agrees with catalog, no silent selection from background click, custom point doesn't imply unsupported terrain data.
- **Evidence:** Automated/recorded interaction tests and coordinate round-trip checks.

### 3D-011 — Camera presets, controls and focus transitions
- **Owner:** Agent C + Agent E
- **Status:** Not Started
- **Dependencies:** 3D-005, 3D-006
- **Files/areas:** Preset buttons, camera controller, focus transitions, accessibility.
- **Actions:** Implement Global, South Pole, Oblique and Site Focus. Add focus, reset, zoom, pan, fullscreen and return-to-region behavior. User input interrupts scripted transitions; reduced motion is respected.
- **Acceptance:** Presets behave predictably, are keyboard accessible, preserve selected site/epoch, and have bounded safe camera values.
- **Evidence:** Preset test matrix across desktop/tablet/mobile and fullscreen.

### 3D-012 — Layers, overlays, labels and decluttering
- **Owner:** Agent E + Agent C
- **Status:** Not Started
- **Dependencies:** 3D-003, 3D-005, 3D-006
- **Files/areas:** Layer menu, overlay layers, labels, legend, marker styles.
- **Actions:** Group controls into Surface, Geographic overlays, Scientific overlays. Implement active/unavailable/error states. Prioritize selected > hovered > compared > nearby candidate > minor terrain labels. Use collision-aware labels and avoid huge overlapping HTML labels.
- **Acceptance:** No duplicate candidate markers or unbounded label pileups; toggles affect only their layer; legend is consistent across 2D/3D; labels readable at the target camera scales.
- **Evidence:** Crowded site screenshots, layer tests, accessibility check.

### 3D-013 — Local terrain patch / LOD pilot
- **Owner:** Agent A + Agent C
- **Status:** Not Started
- **Dependencies:** 3D-003, 3D-004, 3D-007
- **Files/areas:** Regional tile manifest/preprocessing, local mesh/tile loader, coverage UI.
- **Actions:** Choose one confirmed site DEM pilot; create/document any preprocessing pipeline; align local patch with global body-fixed coordinates and map orientation; add graceful coarse-mesh fallback. Don't attempt all sites at once.
- **Acceptance:** One verified region loads higher-detail terrain aligned with geographic markers; no seams severe enough to mislead; terrain coverage label is truthful; missing tiles fallback cleanly.
- **Evidence:** Test-site screenshot, projected-coordinate test and asset pipeline reproducibility notes.

### 3D-014 — Time playback and epoch-linked scene updates
- **Owner:** Agent D + Agent B
- **Status:** Not Started
- **Dependencies:** 3D-004, 3D-006, 3D-008, 3D-009
- **Files/areas:** Playback hook/controller and geometry refresh integration.
- **Actions:** Play/pause/step/scrub changes canonical epoch; set and display playback rate; use valid sampled/interpolated geometry only within declared rules; abort/ignore stale results; clean up scheduler when unmounted or tab hidden.
- **Acceptance:** Current display values and vectors share the current UTC epoch; pause stops; quick scrubbing doesn't flash old results; playback does not change selected site/camera; unavailable intervals are explicit.
- **Evidence:** Timing/state tests and time-lapse demonstration with real data or clearly labeled fixture.

### 3D-015 — Error handling and lifecycle resilience
- **Owner:** Agent C + Agent E
- **Status:** Not Started
- **Dependencies:** 3D-005, 3D-007
- **Files/areas:** Error Boundary, Suspense boundaries, renderer lifecycle, asset fallback.
- **Actions:** Add focused Error Boundary and Suspense only where relevant. Handle fetch errors, WebGL failure/context loss, asset load failure, resize, resource disposal, fullscreen exit and retry. A broken 3D view must not crash 2D or time/metrics panels.
- **Acceptance:** Failures produce local recovery UI; no unhandled promise errors; no duplicate render loops/GPU leaks after remount; fallback is useful.
- **Evidence:** Forced-failure tests, console/network capture, renderer cleanup validation.

### 3D-016 — Automated regression tests
- **Owner:** Agent F
- **Status:** Not Started
- **Dependencies:** 3D-004, 3D-006, 3D-008, 3D-009, 3D-010
- **Files/areas:** Test suites and fixtures, no production feature rewrite.
- **Actions:** Cover frame/coordinate transform contracts, site+epoch identity, candidate selection, stale response rejection, Sun/Earth indicators, layer toggle independence, picking and custom-point status.
- **Acceptance:** Tests fail against known regressions and pass after implementation; fixtures are labelled test data; no test calls mock output validated science.
- **Evidence:** Actual test command/result and new test list.

### 3D-017 — Responsive, accessibility and performance review
- **Owner:** Agent E + Agent F
- **Status:** Not Started
- **Dependencies:** 3D-011, 3D-012, 3D-015
- **Files/areas:** Responsive styling, keyboard interaction, performance instrumentation and final UX fixes.
- **Actions:** Test wide desktop, laptop, tablet, and mobile; keyboard/touch; reduced motion; webgl failure; asset wait; fullscreen state; rendering performance at representative scene/quality settings. Use measured data, not performance claims.
- **Acceptance:** No clipping/overlap or trapped controls; 2D fallback works; scene has no obvious frame loop/resource leak; target devices have documented performance observations.
- **Evidence:** Browser test matrix and recorded measurements.

### 3D-018 — Integration and release evidence
- **Owner:** Lead + Agent F
- **Status:** Not Started
- **Dependencies:** All relevant tasks
- **Files/areas:** Integration branch, test/build reports, final docs.
- **Actions:** Integrate only reviewed changes, resolve conflicts, run full project checks, verify preview and published deployment separately if accessible, update task statuses and known limitations.
- **Acceptance:** No unresolved blocker hidden; tests/build results recorded; data provenance and catalog labels aligned; launch checklist complete.
- **Evidence:** CI/build logs, screenshot set, known limitations and final workplan statuses.

## 4. Parallelization graph

```text
3D-001 Audit
  ├── 3D-002 Candidate/catalog version ───────────┐
  ├── 3D-003 Asset/coverage audit ──────────────┐ │
  ├── 3D-004 Geometry/frame contract ────────┐  │ │
  └── 3D-005 Renderer/camera baseline ───────┼──┼─┤
                                             │  │ │
                  3D-006 Shared selection/epoch ◄──┘ │
                     ├── 3D-008 Sun lighting ◄───────┤
                     ├── 3D-009 Earth display ◄──────┤
                     └── 3D-010 Picking ◄────────────┤
  3D-003 + 3D-005 -> 3D-007 Real global assets       │
  3D-003 + 3D-007 -> 3D-013 Local DEM/LOD            │
  3D-005 + 3D-006 -> 3D-011 Camera presets           │
  3D-003 + 3D-006 -> 3D-012 Layers/labels            │
  3D-008 + 3D-009 + 3D-006 -> 3D-014 Playback        │
  3D-005 + 3D-007 -> 3D-015 Error/lifecycle          │
  3D-004 + 3D-006 + 3D-008/009/010 -> 3D-016 Tests    │
  3D-011/012/015 -> 3D-017 UX/performance            │
  all reviewed work -> 3D-018 Integration ◄──────────┘
```

## 5. Definition of Done

A task is `Done` only if:
- implementation or research output exists in the project;
- acceptance criteria are met;
- relevant tests/checks actually ran and output is recorded;
- documentation and source/provenance fields are updated;
- no unreviewed assumptions or unresolved failures are hidden;
- the task is reviewed by the Lead or designated integrator.

When work is blocked by data access, API access, missing official products, unavailable browser automation, or environment restrictions, record that blocker and the fallback. Do not fill the gap with fabricated science.
