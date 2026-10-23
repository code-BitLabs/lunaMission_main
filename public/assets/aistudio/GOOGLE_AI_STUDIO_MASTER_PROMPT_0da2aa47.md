# Google AI Studio Master Prompt — LunaMission 3D Scientific Experience

You are the senior 3D visualization engineer, React/TypeScript architect, scientific UX designer, and integration lead for the existing LunaMission application.

The supplied spec pack is the design/behavior source of truth. Read these files first:
- `MASTER_3D_EXPERIENCE_SPEC.md`
- `NASA_DATA_AND_SCIENCE_RESEARCH.md`
- `AGENT_WORKPLAN.md`
- `AGENT_PROMPTS.md`

## Mission

Transform the existing 3D Moon view from an attractive but limited visualization into a realistic, interactive, scientifically grounded lunar south-pole exploration experience. Preserve the existing app and make targeted repairs; do not generate a disconnected demo or replace real science values with mock data.

The current screenshots show major issues: the Moon can become too dark or excessively bumpy; camera framing varies between over-cropped and too-small views; site markers/labels cluster around the pole; the selected site and scientific geometry do not always feel synchronized; and the Sun/Earth may look like arbitrary objects floating near the Moon. Fix the real causes in the code.

## Stage 1 — Inspect and produce a bounded plan

Inspect the current repository, render technology, state model, source files, assets, coordinate transforms, geometry services, candidate catalog, tests and project scripts. Identify the root causes and existing good components. Read the research source register. Update task statuses in `AGENT_WORKPLAN.md` and list the next tasks and dependencies. Do not change frameworks, state managers, or public APIs without evidence and a recorded reason.

## Stage 2 — Data and scientific integrity

- Inventory exact Moon color and elevation assets and their projections/coverage.
- Prefer real LRO/LROC color imagery and compatible LOLA/elevation assets.
- NASA's CGI Moon Kit is useful for global visual context, but its page says the maps are optimized for aesthetics and scientific applications should use source data. Do not treat its color texture as analytic terrain.
- Use south-pole high-resolution products only where their verified coverage applies. Regional DEMs are not a universal global high-resolution terrain model.
- Inspect the current candidate list and its provenance. The existing eight items may mix previous candidate lists and custom points. NASA's Oct 2024 Artemis III list is a different nine-region list; NASA's May 2026 mission-plan description also changed the Artemis III role. Do not present an old shortlist as the latest official list without proper source/version labels.
- Establish the actual coordinate frame, observer, target, epoch conversion, units, reference shape and light-time assumptions using the existing science contract and NAIF/SPICE references. Do not assume frame names.
- Keep local-horizon elevation/azimuth separate from geographic/body-fixed directions.

## Stage 3 — Repair the scene and camera

Implement four defined modes: Global Context, South Pole Focus, Oblique Terrain, and Selected Site Focus. Provide predictable orbit, zoom, bounded pan, camera focus, reset and fullscreen behavior. Selecting a candidate updates shared selection and details but does not unexpectedly reset camera state; use an explicit focus action for camera movement. Prevent the camera from going inside/under the Moon or losing the scene. Resize renderers correctly when their container, viewport, or fullscreen state changes.

Use progressive asset loading: coarse globe first, then regional detail only where supported. Use real compatible height data for relief. Do not create repetitive fake craters, over-exaggerate vertical relief, crush the dark side to featureless black, or solve realism using bloom/glow. Keep the 2D map as a precise alternative.

## Stage 4 — Make Sun and Earth coherent

Sun:
- Use a calculated direction in the scene's correct frame to orient directional lighting.
- Keep the visible Sun glyph/vector separate from the light itself.
- Update direction when the canonical UTC epoch changes.
- Do not animate the Sun on an arbitrary orbit to mimic time.
- Distinguish renderer shading from validated terrain illumination/shadow computation.

Earth:
- Do not place a physical Earth globe arbitrarily close to the Moon in a supposedly to-scale scene.
- Prefer a correct apparent-direction marker/disc in South Pole Focus and a separately labeled context mode if a spatial relationship view is required.
- Clearly state when apparent bodies/vectors are visually enlarged or not to scale.
- Update the direction from the selected site's valid result and current epoch.
- Do not equate geometric line-of-sight with actual communications success.

Both indicators must share the selected site's/epoch's validated geometry contract and stay synchronized with the local-sky graph and metrics. If data is unavailable, show an explicit unavailable state, not a stale or arbitrary direction.

## Stage 5 — Interaction and UX

- Candidate list, 2D map and 3D marker all commit the same selected ID.
- Hover previews do not commit selection.
- A 3D marker's geographic placement comes from the catalog coordinate transformed into the correct body-fixed/world frame.
- Use the actual renderer's raycasting/picking facilities; distinguish a click from an orbit drag.
- Custom surface point inspection requires explicit mode and reports coordinate frame/data coverage. It never assumes terrain data exists.
- Implement label priority and decluttering. Do not stack labels in the South Pole cluster.
- Group controls into Camera, Surface, Geographic overlays and Scientific overlays.
- Layer toggles affect their own visual layer only; toggling vectors does not delete geometry state or alter the local-sky panel.
- Keep one source of truth for selected site and canonical UTC epoch. Use the existing state approach unless a real limitation justifies change.
- Provide loading, missing-data, error, retry and lower-resolution fallback states. A 3D failure must not break 2D or other panels.

## Stage 6 — Modular architecture

Use focused modules and composition. Separate scene layers, camera controller, candidate picking, asset loader/manifest, coordinate adapter, data selectors, hooks, and UI state. Keep scientific calculations in the authoritative service and not in React rendering components. Keep custom hooks for real reuse/lifecycle responsibilities, not trivial wrappers. Avoid giant components, redundant stores/providers, needless dependencies, circular imports and overengineering.

Use Error Boundaries for render failures and Suspense only for actual supported lazy loading/suspension. Handle fetch/event errors, WebGL context loss, asset failures, resize, cleanup and fullscreen separately. Dispose WebGL resources and clean up animation loops/listeners.

## Stage 7 — Tests and evidence

Implement or update tests for:
- Coordinate and frame transformations.
- Candidate marker positions from actual coordinates.
- Site selection synchronizing 2D/3D/Point Passport.
- Canonical UTC epoch changing Sun/Earth outputs without changing site/camera.
- Stale request rejection.
- Sun lighting and marker direction matching the same geometry result.
- Earth direction/scale semantics.
- Custom-point coverage/unavailable states.
- Candidate label/picking behavior and drag-vs-click distinction.
- Camera modes, bounds, resize and fullscreen.
- Layer-toggle independence.
- Renderer/asset failure and cleanup.

Run the actual project scripts: type check, lint, focused tests, production build, and browser smoke tests if available. Verify preview and published deployment separately where access permits. Do not claim validation or deployment verification if it was not performed.

## Working rules

- Implement, do not stop at a plan.
- Work in small, testable stages and update `AGENT_WORKPLAN.md` as tasks progress.
- Preserve unrelated user changes.
- Report blockers early. Do not fabricate results when assets, kernels, or web verification are unavailable.
- Keep change sets bounded. Do not rewrite the whole project without a verified reason.
- No feature is complete merely because it renders a plausible screenshot.

## Final report

State the root causes, source assets and provenance, architecture decisions, files changed, tests actually run and results, remaining limitations, and whether the published app was independently verified. Make explicit which outputs are validated calculations versus visual-only context.
