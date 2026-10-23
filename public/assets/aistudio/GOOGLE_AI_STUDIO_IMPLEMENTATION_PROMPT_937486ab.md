# Google AI Studio Prompt — Upgrade LunaMission's 3D Moon Experience

You are the senior React/TypeScript, Three.js, scientific visualization, and UX engineer continuing the existing LunaMission application. The full `LunaMission_3D_EXPERIENCE_SPEC.md` is the source of truth for the 3D user experience, scientific correctness, component architecture, edge cases, and acceptance criteria. Read it completely before editing code.

## Objective

Fix the current 3D Moon mode. The screenshots show that the Moon is either heavily cropped with harsh, spiky-looking relief or too small within a mostly empty canvas. The Earth appears as a floating blue wireframe/debug sphere; the Sun is mainly an arrow rather than an understandable light source; candidate markers and labels overlap; camera behavior and selected-site focus feel inconsistent.

Build a premium, explorable scientific observatory that feels responsive and tactile while remaining scientifically honest. This is not permission to create fake orbital movement or invented geometry.

## Work autonomously in this sequence

### 1. Inspect and diagnose
- Inspect the current repository, renderer, asset manifests, state flow, camera controls, and tests.
- Identify the precise causes of bad framing, exaggerated terrain, Earth appearance/placement, Sun-light/vector mismatch, marker collisions, and selection/camera issues.
- Preserve existing user changes and working 2D behavior.
- Do not rewrite unrelated features.

### 2. Fix composition and camera presets
Implement deliberate, tested presets:
- **Global Context:** complete Moon with margins; no accidental cropping or tiny object.
- **South Pole Focus:** default scientific workflow view, centered on the candidate region.
- **Oblique Terrain:** useful local relief/context, bounded camera angle/zoom.
- **Selected Site Focus:** move the camera toward the selected site with an interruptible transition and a clear return-to-region action.

Set sensible camera limits, smooth damping, reset behavior, and container-aware resize. Do not auto-rotate by default. Camera motion must never change site coordinates or UTC time.

### 3. Fix the Moon asset and material
- Inspect the actual lunar asset: establish whether it is color-only, color plus height, or a topographic mesh.
- If helpful, use a suitable verified NASA LRO-based Moon asset from https://svs.gsfc.nasa.gov/14959/ or compatible data from https://svs.gsfc.nasa.gov/4720/, after checking actual format, size, coordinate orientation, coverage, and attribution.
- Prefer an appropriate small/medium asset for initial loading; do not automatically load a 100–300 MB model.
- Correct height/displacement intensity and material settings; don't invent relief or use extreme bump intensity.
- Keep the terminator clear without making the dark side invisible.
- Do not claim DEM-derived accuracy if the model is only a visual texture.

### 4. Make Sun and Earth proper, time-driven scene elements
- Sun uses a gold directional indicator/light derived from the same validated geometry result as the metrics. Its visible direction and lighting must agree.
- Earth should look like a recognizable planet or an intentional directional marker, not a wireframe debug globe floating near the Moon.
- Because literal system-scale distances make the Moon too small for this view, use direction cues or a clearly disclosed visual scale treatment rather than fake physical proximity.
- Show clear direction labels and a compact legend. Keep Sun and Earth visually distinct.
- Convert validated ephemeris/observer vectors through documented coordinate frames before updating scene objects.
- Never use local azimuth directly as a 3D world vector without the correct local-to-world transform.
- When data are missing or outside coverage, show unavailable state; do not fabricate object motion.

### 5. Implement purposeful interactions
- Rotate/orbit, zoom, pan where appropriate, reset, Global Context, South Pole Focus, Oblique, Focus Selected Site.
- Select candidate markers with raycasting or the existing correct picking mechanism.
- Keep marker positions tied to the canonical candidate coordinates and supported model frame.
- Keep selected-site state and UTC epoch shared with the 2D map, Point Passport, Local-Sky Geometry, and Time Explorer.
- Hover previews without changing committed selection.
- Selection transition is restrained and interruptible. Do not stack big labels over candidate clusters.
- Declutter labels in screen space without moving geographic markers.

### 6. Time playback
- Provide Play/Pause, a visible rate, step controls, and UTC scrubber integration.
- Advance the canonical epoch, then update Sun direction, Earth direction, lighting, metrics, and timeline from valid calculation results.
- Do not issue a scientific API request every animation frame. Use the actual service contract and valid sampling/interpolation rules.
- Cancel or ignore stale requests. Stop cleanly at unsupported time bounds or calculation errors.
- Camera rotation is independent of time progression.

### 7. Architecture and React lifecycle
- Follow existing repository conventions and the spec's modular responsibility map.
- Separate UI/composition, scene construction, camera controls, picking, resource loading, display-frame transforms, shared site/time state, and scientific data access.
- Keep scientific calculations in the authoritative service; frontend code renders the validated output.
- Reuse existing state management unless it demonstrably cannot support the interaction. Do not add Zustand/provider layers automatically.
- Lazy-load browser-only rendering as appropriate, use localized Error Boundaries, and use Suspense only for supported loading paths.
- Clean up controls, observers, event listeners, render loops, textures, geometries, and materials. Handle WebGL failure/context loss where feasible.
- Preserve 2D map functionality if 3D fails.

### 8. Verify rather than guess
Add/update tests for:
- Candidate world positions and selection synchronization.
- Sun/Earth frame transforms and epoch updates.
- Camera state independent of scientific state.
- Asset loading/fallback.
- Marker/label collision behavior.
- Resize/fullscreen transitions.
- Play/Pause and stale-result protection.
- Missing data and unsupported coverage.

Run the actual type-check, lint, tests, and production build available in the repository. Inspect the running result at desktop and mobile sizes. Do not claim tests or live deployment checks passed unless actually executed.

## Final acceptance
- Moon has a good, predictable frame in every camera preset.
- Surface relief looks plausible rather than spiky/noisy.
- Earth reads as a planet or directional sky target, not a debug sphere.
- Sun direction, label, and lighting agree.
- Candidate markers sit at true positions and labels do not stack indiscriminately.
- Site selection and epoch synchronize across every view and panel.
- Playback is visibly controllable, bounded, and based on valid scientific data.
- Missing data and renderer failures recover gracefully.
- Architecture remains understandable in an ordinary Next.js/React project.

Implement the smallest maintainable sequence that reaches these outcomes. Report root causes, files changed, checks executed, and remaining limitations. Do not stop after generating a plan or static mockup.
