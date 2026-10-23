# LunaMission — Master 3D Experience Specification

**Version:** 1.0  
**Status:** Proposed engineering baseline; reconcile with the actual repository and validated science code before implementation.  
**Audience:** Product/UX, frontend, scientific computing, data, accessibility, and QA agents.  
**Primary mission question:** For a supported lunar south-pole location and canonical UTC epoch, help a user understand surface context, Sun/Earth geometry, illumination opportunities, terrain limits, and how the conditions compare across locations and time.

---

## 1. Product philosophy

### 1.1 Product promise

LunaMission should make scientifically meaningful lunar site/time comparison understandable through a linked 3D Moon, precision 2D polar map, local-sky view, Point Passport, and time explorer.

The product should feel immersive like a high-quality exploration simulator, but scientific semantics always outrank spectacle. Camera motion and rendering may feel tactile and responsive; scientific positions must come from the declared coordinate frames, data, methods, and epoch.

### 1.2 Non-goals

The initial product is not:

- Flight-certified or operational NASA mission-control software.
- A navigation solution or certified landing-site safety system.
- A full spacecraft trajectory optimizer, propellant estimator, or landing guidance system.
- An RF link-budget/DSN scheduling guarantee.
- A water-ice probability map or resource assessment unless separately supported by actual validated datasets and methods.
- A terrain-aware illumination engine outside verified terrain coverage.

Never present visual plausibility as scientific validation.

### 1.3 Design principles

1. **Data before decoration.** Every visible position, vector, marker, surface property, and metric must have a defined source or be visibly identified as illustrative.
2. **One scientific state.** The selected site, canonical UTC epoch, active data manifest, and geometry result must agree across 2D, 3D, local-sky, metrics, and timeline views.
3. **View state is not science state.** Orbit, zoom, pan, layer visibility, and fullscreen must not change geographic coordinates or computed measurements.
4. **Context first, precision on demand.** The global globe provides orientation; the south-pole view helps exploration; a local terrain view supports inspection; the 2D map remains the precise geographic reference.
5. **Honest scale.** If Sun/Earth symbols or distances are exaggerated to keep them visible, disclose that visual scale is not physical scale.
6. **Unknown is not zero.** Missing data, invalid calculations, and terrain gaps have explicit states.
7. **Progressive detail.** Use broad context at low zoom and reveal surface details as the camera approaches.
8. **Failure isolation.** A failed 3D renderer must not disable the 2D map, metrics, or time controls.

## 2. The current screenshot-level problems to solve

The screenshots show:

- A Moon that can be too dark, over-contrasted, or excessively bumpy at some camera distances.
- Site markers clumped together around the South Pole and labels overlapping.
- Sun/Earth rays stretching off-screen without enough context to explain their scale or frame.
- Earth sometimes shown as a floating tiny/wireframe globe rather than a coherent apparent-direction marker.
- Camera zoom levels that alternate between an over-cropped Moon and a tiny Moon surrounded by unused space.
- Nadir/oblique/site controls whose effect is not adequately defined.
- Some site selections changing the marker but not reliably updating all visual/analytical panels.
- A risk that Sun movement is implemented as arbitrary animation rather than an ephemeris-derived direction at a selected epoch.

The objective is to repair underlying data flow, transforms, scene composition, and control behavior—not to add bloom or more decorative lines.

## 3. Scene modes and camera behavior

### 3.1 Mode A — Global Context

**Purpose:** Explain where the south-polar study region is on the Moon.

Behavior:
- Show the Moon with a verified global color map and a globe-appropriate elevation/normal representation where available.
- Focus the initial camera on the Moon, with the south-pole region visible and an unobtrusive location cue.
- Display candidate-region/candidate-site markers only when their coordinates and catalog provenance are available.
- Earth and Sun are direction/sky indicators or a separate context visualization, not incorrectly placed physical-scale spheres close to the Moon.
- Do not try to fit the actual Sun, Earth, and Moon physical distances into a single viewport while preserving the globe's useful size.
- Offer a `Focus South Pole` action.

Acceptance:
- The Moon occupies a deliberate portion of the viewport (target composition can be tuned in browser testing) and is not microscopic by default.
- No permanently large empty region is caused by incorrect framing or an off-screen target.
- A user can identify the study region and navigate to the south pole in one action.

### 3.2 Mode B — South Pole Focus

**Purpose:** Main 3D exploration mode for the challenge.

Behavior:
- Camera target is a defined point or region near the south pole, preferably selected-site focus when one exists.
- Show candidate markers and major crater context.
- Use geographically correct marker transforms and restrained annotation density.
- Use the highest verified terrain detail available for the current region; otherwise remain honest about the lower-resolution globe mesh.
- Prioritize terrain readability and site positions over stars, glows, rings, and decorative UI.
- Sun/Earth geometry follows the selected epoch using the configured scientific result.

Acceptance:
- The selected site is visible, markers match the 2D map's coordinates, and terrain relief is not exaggerated so strongly that the surface looks like foam or jagged plastic.

### 3.3 Mode C — Oblique Terrain

**Purpose:** Understand slopes, crater rims, shadow casting, and nearby terrain context.

Behavior:
- Camera can orbit toward an oblique angle with controlled pitch and smooth damping.
- Camera collision/limits prevent entering the terrain or becoming trapped below the surface.
- A `Return to South Pole` action restores a documented useful view.
- Show slope/elevation or terrain-provenance overlays only if the underlying DEM covers the displayed region.
- If local high-resolution terrain tiles are not available, do not create fake detail. Display a data-coverage cue.

Acceptance:
- Controls cannot rotate the camera into invalid/unusable states.
- The selected site and scale context remain visible or can be restored in one action.

### 3.4 Mode D — Selected Site Focus

**Purpose:** Inspect a specific candidate's local context.

Behavior:
- `Focus Selected Site` smoothly animates the camera target to the site's actual surface position.
- Use a local radius/view distance tied to the chosen site scale or a documented camera preset, not a hard-coded screen point.
- Selected site marker has a restrained ring/halo and a nearby decluttered label.
- Show site ID/name and coordinate metadata in a compact overlay or Point Passport.
- Nearby sites remain available but are de-emphasized when crowded.
- Add `Back to Region` or `South Pole Overview`.

Selection itself should not unexpectedly reset camera orientation. Camera focus is explicit, with an optional mild focus action only if that is a tested, documented UX decision.

### 3.5 Camera controls

Use the existing Three.js or React Three Fiber implementation if sound; do not migrate rendering libraries just for preference.

Desktop defaults:
- Primary drag: orbit.
- Wheel/trackpad: zoom.
- Secondary drag or configured modifier: pan.
- Click: select a candidate/object only when the pointer gesture is a click rather than a drag.
- Double-click or explicit button: focus target only if implemented accessibly and documented.

Touch defaults:
- One finger: orbit.
- Pinch: zoom.
- Two-finger drag: pan, if supported by the selected control library.
- Tap: select a candidate marker.

Keyboard:
- Visible buttons for zoom in/out, reset camera, focus selected, and return to region.
- Keyboard-operable candidate list as the reliable alternative to 3D picking.
- Escape exits fullscreen or dismisses the topmost transient surface according to a documented order.

Camera parameters:
- Set explicit min/max distance and polar-angle limits based on mode.
- Limit panning so the Moon cannot be lost indefinitely.
- Use damping with a correctly running update loop when the selected controls library requires it.
- Clamp camera motion to avoid going through the Moon or underground.
- Avoid continuous auto-rotation by default.
- An optional cinematic/orbit mode may exist, but it must be off by default, stoppable, reduced-motion-aware, and must not alter scientific state.
- User interaction interrupts scripted camera transitions.

Use `ResizeObserver` or equivalent container-resize handling so the renderer/camera resize when mode, sidebar, fullscreen, or viewport changes.

## 4. Surface realism and terrain-data strategy

### 4.1 Realism checklist

- Use genuine LRO/LROC-derived surface color where appropriate.
- Use compatible LOLA/elevation-derived displacement or a real regional DEM to provide actual shape detail.
- Use scientifically grounded lighting, surface roughness, and restrained contrast.
- Avoid invented crater decals, repeated procedural pits, excessively harsh contrast, crushed blacks, glowing crater edges, thick wireframes, and nonphysical height exaggeration.
- Avoid treating a texture as a height map unless the data format and metadata explicitly define that use.
- The Moon should not look like a monochrome jagged sculpture. Check global, south-pole, and site-focus views separately.

### 4.2 Multiresolution approach

Use progressive detail rather than loading the largest global data asset immediately:

1. Small, fast-loading global color texture and coarse globe geometry for first render.
2. Appropriate global elevation/displacement dataset where its coverage and projection are understood.
3. South-pole regional texture/DEM tiles when the camera enters the region and the asset covers that area.
4. Optional local site mesh/terrain layer for verified high-resolution DEM locations.
5. Fall back to the coarser layer when a tile is missing or loading fails, and show the active resolution/coverage honestly.

Local DEM overlays must align with the global body-fixed coordinate frame. Do not paste a polar-projected tile onto an equirectangular sphere without a valid reproject/mesh mapping.

### 4.3 Height exaggeration

- Default exaggeration should be 1x physical vertical scale if the source supports correct scale and the target renderer can show it.
- If a user-adjustable exaggeration is provided for pedagogy, label it clearly (e.g. `Vertical exaggeration 2×`) and do not use it for quantitative slope/visibility claims.
- Never silently apply different exaggeration by zoom level if that could mislead comparison.
- Lighting realism and material shading should improve the perception of relief before exaggerating height.

### 4.4 Shadows and illumination layers

Separate three concepts:

1. **Visual shading:** renderer lighting creates an appearance and is not itself a scientific result.
2. **Geometric illumination:** based on Sun direction and declared surface/reference model.
3. **Terrain-aware shadow/illumination:** requires a suitable DEM/mesh, valid Sun vector, declared sampling/resolution, and a validated algorithm.

Show distinct statuses and provenance. Terrain shadows in a high-resolution site mesh should be computed only where the terrain dataset is valid. Do not infer a permanently shadowed region from a dark textured pixel.

## 5. Sun representation and behavior

### 5.1 Role

The Sun has two separate functions in the scene:
- Illumination source that determines directional lighting.
- Optional visible direction indicator/disc and vector for user orientation.

These are related but not interchangeable. The lighting direction must agree with the calculated Sun direction in the lunar scene frame at the selected epoch.

### 5.2 Rendering rules

- Use a directional light or suitable physically meaningful light approximation for distant solar illumination.
- Do not render the Sun at literal astronomical distance in the main scene.
- Represent the Sun visually as a small directional icon/disc, a ray/arrow, or an anchored direction glyph. If its on-screen size/position is altered for legibility, label the visualization as not to scale where ambiguity exists.
- Avoid exaggerated bloom that washes out terrain detail.
- Surface shadows should respond to Sun direction when the relevant mesh and renderer support it.
- Distinguish renderer-created shadows from validated illumination analysis.
- Include a `Sun vector` toggle whose state affects only its visual layer, not the lighting calculation or data result.

### 5.3 Epoch changes and animation

- The canonical epoch is UTC in the UI. The scientific service converts to the time representation required by the chosen ephemeris/kernel workflow.
- Update the Sun direction through the valid ephemeris and lunar body-frame transformation for the new epoch.
- Do not rotate the Sun around the Moon on an arbitrary circular path.
- Time-lapse/playback samples valid epochs; it may accelerate the display but must show playback rate and current UTC.
- If scientific samples are coarse or unavailable, the UI must not pretend an interpolated shadow is fully validated.
- During playback, update at a bounded rate appropriate to the service and renderer. The displayed epoch and returned result epoch must agree.
- Stop/pause cancels pending playback scheduling and retains the current epoch.

## 6. Earth representation and behavior

### 6.1 Important scale issue

A physical-scale scene combining the Moon, Earth, and Sun is incompatible with a terrain-centric viewport: Earth is hundreds of lunar radii away and the Sun vastly farther. Putting a full-size Earth model just above the Moon without explanation is visually appealing but scientifically misleading.

Use one of the following explicit modes:

**Direction mode (recommended for South Pole Focus):** display Earth as an apparent-direction marker or a compact textured disc in a local-sky/overlay region. Its direction comes from the site-to-Earth geometric calculation. The on-screen symbol may be enlarged for readability but must be labeled `symbol enlarged / not to scale` where applicable.

**Context mode (optional):** display Moon and Earth in a dedicated relationship view with a documented scale treatment. If distances are compressed, show a clear scale note and provide the numeric range separately. Do not present a compressed scene as a to-scale orbital diagram.

Do not place an Earth globe at an arbitrary fixed position above the pole. Do not animate Earth as if it orbits around the Moon in a circular path. The visual direction should follow the selected epoch and the lunar/site frame according to the valid geometry result.

### 6.2 Earth marker appearance

- Use a real Earth texture/orientation only if the assets and intended phase/orientation are supported; otherwise use a clean blue apparent-direction marker.
- Display Earth elevation, azimuth, range, and theoretical vacuum light-time from the same result, with definitions and source context.
- Keep the visible marker anchored to the right direction in local sky/body-fixed coordinates, not to a stale screen coordinate.
- When below the declared local horizon, show `Below reference horizon` or `Terrain-occluded` only when the relevant method supports it; a geometric below-horizon result is not the same as verified terrain blockage.
- Geometric Earth visibility is not proof of RF link success. A real link requires antenna geometry, RF link budget, spacecraft/ground network state, and mission schedule assumptions.

## 7. Candidate site and arbitrary-point interactions

### 7.1 Site model

Store site/region metadata in a versioned catalog, not scattered arrays in rendering components. Distinguish:
- Landing region polygon/outline (if available).
- Named candidate site/point (coordinate and provenance).
- User-inspected arbitrary coordinate.
- Hovered site.
- Selected site.
- Comparison sites.

Don't use `SITE-001` as a scientific fact unless IDs map to a sourced catalog. Give stable internal IDs and preserve source IDs/official names separately.

### 7.2 Candidate marker behavior

- A candidate marker is transformed from its declared geographic coordinate into the correct lunar body-fixed/world frame.
- Click/tap selects that marker; hover previews but does not commit selection.
- Use raycasting or the project's equivalent hit test, not DOM labels as a substitute for geographic picking.
- Markers must remain attached to the correct surface point when the Moon rotates in the camera.
- Use a selected marker ring/halo and a non-overlapping label; do not move the actual marker to avoid label collisions.
- Label priority: selected > hovered > compare-selected > nearby candidates > secondary crater labels.
- When many labels overlap, hide/abbreviate low-priority labels and provide a side list or hover/focus details.
- Marker scale may be screen-space constant for usability; if so, separate marker display size from physical coordinate geometry.

### 7.3 Clicking the surface

Custom-point selection is a distinct mode, not a hidden side effect of every empty-space click.

- A `Inspect surface point` action enables click-to-query mode.
- Raycast the scene surface and convert the hit to a coordinate in the documented lunar frame.
- Report coordinate reference/frame, latitude/longitude convention, and point status.
- If the point is outside supported terrain or geometry coverage, show an explicit limitation.
- Offer `Select nearest candidate` with a computed surface/geodesic distance only if coordinate semantics support it.
- Clicking blank space in normal exploration should not silently change site selection.
- Escape or Cancel exits point-inspection mode.

## 8. Scientific frame contract

Before representing any computed geometry, document:
- Body-fixed frame used for lunar terrain and sites (e.g. a specific Moon body-fixed frame supported by the loaded kernel/PCK set).
- Inertial/reference frame used for ephemeris states.
- Observer and target definitions.
- Epoch/time conversion method.
- Longitude direction, latitude type (planetocentric vs planetographic), units, and reference radius/shape model.
- Any light-time correction applied.
- Transformation from inertial/body-fixed state to the local topocentric/horizon frame.
- Whether vectors represent position, direction, surface-normal relation, or a display-only extrapolation.

Do not assume `IAU_MOON`, `MOON_ME`, or any specific frame is available or compatible without inspecting the actual kernels and contract. Derive and validate the transform from the actual scientific workflow.

Every result used in the 3D view should be traceable to a result key such as `{siteId or coordinate, utcEpoch, frame, dataManifestVersion, algorithmVersion}` or an equivalent typed response.

If a result is missing or does not match current site/epoch, hide stale geometry or mark it stale with a visible update status. Never display old output as current.

## 9. Application state contract

Keep shared state minimal and authoritative:

- `selectedSiteId` or `selectedPoint`.
- `canonicalUtcEpoch`.
- `activeSpatialMode`.
- `activeCameraPreset`.
- `visibleLayers`.
- `comparisonSiteIds`.
- `currentGeometryResult` with matching input identity/provenance/status.

Camera position, orbit target, map zoom, hovered object, open popover, and transient point-picking mode can remain local to the view/feature when appropriate.

Do not store duplicate derived Sun/Earth vectors in several components. Compute/derive once from the valid result, or select one canonical result object. All view components should consume the same value/identity.

### Site selection transition

1. Commit the selected site ID.
2. Mark the previous geometry result as no longer current for that ID, or visibly stale during a deliberate stale-while-revalidate state.
3. Ask the geometry service for the selected site at the current UTC epoch.
4. Reject/ignore any result whose request identity does not match the current site and epoch.
5. Update Point Passport, local sky, 2D/3D markers, and Time Explorer selection when the result arrives.
6. Preserve camera state unless the user requested focus.

### UTC transition

1. Parse and validate explicit UTC input.
2. Update canonical epoch.
3. Request geometry/time samples for the selected site(s).
4. Keep camera and site unchanged.
5. Ignore stale responses; expose pending/partial/error states.

## 10. Map, terrain, and overlay layers

Provide a layer menu grouped by purpose rather than one row of ambiguous buttons.

### Surface
- Color/albedo texture.
- Elevation/shaded relief.
- Optional local DEM patch with resolution/coverage label.

### Geographic overlays
- Latitude/longitude graticule (or documented polar grid).
- Candidate regions and points.
- Crater/feature names.
- Scale and orientation reference.

### Scientific overlays
- Sun direction.
- Earth direction/line-of-sight indicator.
- PSR/permanent-shadow dataset (where a declared product exists).
- Calculated illumination/shadow result (only where method/coverage supports it).
- Terrain slope or elevation contours (only with compatible real data).

Every toggle must affect only the intended presentation layer. Hiding vectors must not delete geometry data or stop the local-sky panel from displaying the result.

A layer should expose `enabled`, `loading`, `unavailable`, and `error` states. Unsupported layers should be disabled or visibly marked unavailable, not shown as empty as if data were zero.

## 11. Local-sky inspector

The 3D workspace should be linked to a dedicated local-sky panel or expandable inspector.

Display:
- Horizon reference line at 0 degrees.
- Sun apparent elevation/azimuth.
- Earth apparent elevation/azimuth.
- Mean spherical horizon and terrain horizon as distinct visual concepts.
- Local terrain obstruction/clearance only for a verified DEM and validated method.
- Canonical UTC epoch.
- Data coverage, method, reference frame, and quality/validation flags.

Interactions:
- Hover/focus Sun or Earth to show a value tooltip.
- Click to open details without changing selected site or epoch.
- Expand to a larger inspection view with zoom/reset if useful.
- Keep chart values synchronized with the metric cards and the same result ID.

Do not label an Earth below the mean spherical horizon as `Terrain-occluded` unless terrain analysis supports that statement. Do not infer terrain visibility from the global color map.

## 12. Time-lapse and animation UX

### Playback modes
- `Scrub`: user drags/selects time points.
- `Play`: advances the canonical epoch using configured step/rate and supported samples.
- `Pause`: stops at the current epoch.
- `Step back/forward`: changes by explicit increment.
- `Reset to selected epoch`: returns to the global selection time.

### Visual behavior
- Terrain shading and Sun direction must agree at the displayed epoch to the extent supported by the lighting implementation.
- The selected site's geometry labels update with the same epoch.
- Rendered timeline samples and current marker must identify their own timestamps.
- If interpolated/approximate positions are used for smooth camera/scene animation between validated samples, mark the display appropriately and do not treat that as a validated scientific output.
- Animation should not run at full CPU/GPU speed unnecessarily; pause render loops where practical when scene is static.
- Respect reduced motion and stop on tab visibility loss if that improves stability/performance.

## 13. Responsive, accessibility, and usability

- Fullscreen scene must preserve site, epoch, layer state, and camera state; Escape exits reliably.
- Fullscreen status must follow the browser's actual Fullscreen API state, not a local boolean alone.
- Resize the renderer/camera when the containing panel changes, not only on window resize.
- Desktop: toolbar at the top of the viewport, scene fills the available region, compact selected-site info and layer control.
- Tablet: toolbar groups can wrap/overflow gracefully and scene stays large enough to inspect.
- Mobile: use touch-aware controls, large hit targets, a collapsible details drawer, candidate list, and a fallback if WebGL is unavailable.
- Avoid tooltips as the sole route to essential data.
- Keyboard-accessible alternative to 3D selection must exist.
- Respect `prefers-reduced-motion`; no forced continuous rotation.
- Use visible focus, accessible labels, contrast, and shape/text distinctions in addition to color.

## 14. Errors and edge cases

The 3D feature must explicitly handle:
- WebGL unavailable or initialization failure.
- WebGL context lost and restored (where practical).
- Asset/model/texture/DEM load failure.
- Asset coverage does not include the selected site.
- Height map and color map projection/orientation mismatch.
- A marker coordinate outside the rendered geographic coverage.
- Invalid/missing latitude/longitude.
- Candidate IDs missing from catalog.
- Custom click on the far side/back-facing Moon surface.
- Marker overlap or selection ambiguity.
- Clicking a marker while rotating or dragging.
- Rapid switching between candidates or epochs.
- Old network responses arriving after a newer request.
- Invalid/non-finite geometry values.
- No terrain horizon profile available.
- Fullscreen request denied or external fullscreen exit.
- Renderer resize while a sidebar or details drawer opens.
- Low GPU memory/performance, device pixel ratio spikes, reduced-motion mode.
- Canvas blank/transparent behind a stale HTML overlay.
- User exits 3D mode while asset loading is incomplete.
- User switches between 2D, 3D, and Dual View.

Error Boundaries catch React render/lifecycle errors in their boundary; they do not replace explicit handling of fetch rejections, event-handler errors, WebGL loss, or other asynchronous failures. Use Suspense for actual supported lazy-loading/suspending boundaries, not as a generic network-error handler.

Fallback behavior:
- 3D failure should leave 2D, UTC, metrics, and candidate list usable.
- Asset failure should show a retry plus a documented lower-resolution fallback when available.
- Missing DEM should disable terrain-aware claims and expose geometry-only coverage clearly.
- Invalid geometry should hide stale vectors or label their stale status rather than drawing arbitrary defaults.

## 15. Maintainable code architecture

Inspect the current stack and preserve useful patterns. Do not migrate renderer/state packages without a concrete technical reason.

Suggested feature layout:

```text
features/lunar-scene/
  ui/
    LunarScene.tsx
    SceneToolbar.tsx
    SceneCanvasBoundary.tsx
    SceneFallback.tsx
    CameraModeControl.tsx
    LayerMenu.tsx
    SelectedSiteOverlay.tsx
    EarthDirectionMarker.tsx
    SunDirectionMarker.tsx
    SceneLegend.tsx
  hooks/
    useLunarScene.ts
    useCameraController.ts
    useSitePicking.ts
    useSceneResize.ts
    useCelestialDisplay.ts
  services/
    sceneAssetService.ts
    sceneCoordinateService.ts
    sceneGeometryAdapter.ts
    siteCatalogService.ts
  state/
    sceneSelectors.ts
    sceneUiState.ts
  schemas/
    sceneAssetManifest.schema.ts
    candidateSite.schema.ts
  types.ts
  constants.ts
  tests/
    coordinate-transform.test.ts
    site-picking.test.ts
    selection-sync.test.ts
    celestial-result-identity.test.ts
    layer-toggle.test.ts
    camera-presets.test.ts
```

This is an example, not a mandate to create empty files. Use single responsibility and composition:
- Scene container composes camera, globe mesh, terrain tiles, marker layers, and vector/label overlays.
- Rendering components display state; they do not calculate ephemerides or silently derive mission science.
- Services own asset manifests, data access, schema validation, and coordinate-adapter operations.
- Hooks own React interaction lifecycle and subscriptions.
- Scientific geometry service is authoritative for Sun/Earth positions, local angles, range, and light-time.
- UI state owns camera/hover/popover/layer visibility, separate from scientific state.
- Candidate catalog is versioned and separate from rendering code.

Use the repository's existing shared-state pattern for selected site and canonical epoch. Introduce Zustand only if existing context/local state demonstrably cannot manage the shared state cleanly. Avoid duplicating the same state in providers, stores, and component state.

## 16. Data contracts and provenance

Every visual asset should have a manifest entry where applicable:

- Asset ID and display name.
- Source organization and URL.
- License/usage and attribution requirement.
- Data product/version/date.
- Spatial coverage and coordinate reference.
- Projection and orientation.
- Pixel/mesh resolution and units.
- NoData/missing coverage semantics.
- Checksum and size for managed assets.
- Whether it is for visual context or scientific measurement.

Every scientific geometry result should expose identity/provenance such as:
- site ID or custom point coordinates.
- canonical UTC epoch and time conversion path.
- observer/target/frame metadata.
- kernel/dataset manifest version.
- algorithm/method version.
- coverage status.
- validation status and reference/test when applicable.
- quality limitations and warnings.

`Ready` does not mean `validated`. `Geometry-only` does not mean terrain is unobstructed. A rendered shadow is not itself proof of a validated PSR classification.

## 17. Feature roadmap and priority

### P0 — correctness and core feel
- Verify real Moon assets, texture/height map compatibility, source and coverage.
- Fix camera defaults/limits, resize, pan/zoom and reset.
- Correct geographic site markers and selection/picking.
- Link selection and UTC state to Point Passport and geometry results.
- Fix Sun lighting/vector direction using the valid frame transform.
- Replace arbitrary Earth placement with explicit direction/context display.
- Add label decluttering and layer control correctness.
- Add Error Boundary, loading/error fallback and GPU cleanup.
- Regression tests for transforms, selection, epoch, and lifecycle.

### P1 — useful scientific 3D
- High-resolution south-pole DEM tile or local mesh for verified coverage.
- Camera presets: Global, South Pole, Oblique, Site Focus.
- Local-sky horizon inspector linked to selected point.
- Validated surface illumination/shadow layer for covered regions.
- Data coverage overlay and source/projection metadata.
- Terrain layer toggles and accessible candidate list.

### P2 — analysis tools
- Elevation/slope profile along a user-defined line for supported DEMs.
- Measure surface/geodesic distance with explicit method and frame.
- Compare site-to-site camera or synchronized viewpoint mode.
- PSR overlays from a named source product.
- Timeline playback with frame/epoch matching and provenance.
- Scenario permalink/export with site, epoch, layer settings, and data manifest IDs.

### P3 — advanced, only when backed by data
- Boulder/hazard map layers and roughness when source coverage supports it.
- Thermal context from appropriate temperature datasets and method; never infer from color/shadow alone.
- Volatile-resource context from relevant mission datasets with proper spatial resolution and uncertainty.
- Mission-specific suitability analyses only with named criteria, weights, sources, and validation.

## 18. Acceptance criteria

A 3D release candidate is acceptable only when:

1. Real lunar imagery is used and provenance is recorded.
2. Elevation detail is driven by an actual compatible height/DEM asset, or the view is explicitly texture-only/coarse.
3. The selected marker is positioned from real coordinates in a verified coordinate frame.
4. Candidate selection works by marker and list and stays synchronized across views.
5. Camera navigation is predictable, bounded, responsive, and recoverable.
6. Sun lighting/indicator uses the current valid geometry result; no arbitrary orbital animation is presented as science.
7. Earth is shown as a direction/apparent-body/context representation with an explicit scale rule.
8. The local-horizon panel shows correct frame/epoch metadata and does not imply RF success.
9. Terrain-aware outputs are limited to verified coverage.
10. Time changes update valid geometry without corrupting camera/selection state.
11. Error, loading, and unavailable states work; 2D remains usable when 3D fails.
12. No markers or vectors are hard-coded to a screen coordinate or stale result.
13. 3D context and site views do not have giant accidental blank space or over-cropped framing.
14. The UI works at desktop, tablet, and mobile breakpoints and responds to fullscreen resize.
15. Tests cover transforms, selection, epoch/result identity, picking, layers, asset/renderer failures, and camera modes.
16. The team documents what is still illustrative and what is scientifically validated.

---

## 19. References

The references below were checked while drafting this specification on 2026-10-23. Their existence does not mean every dataset has already been downloaded, licensed, transformed, integrated, or validated in LunaMission.

1. NASA SVS, **CGI Moon Kit** (includes global color and displacement/elevation assets from LRO/LROC/LOLA; NASA explicitly notes the color maps are optimized for aesthetics rather than scientific analysis): https://svs.gsfc.nasa.gov/4720/
2. NASA Planetary Geology, Geophysics and Geochemistry Laboratory, **High-Resolution LOLA Topography for Lunar South Pole Sites** (5 m/pixel site DEMs; lists products including elevation, point clouds, count maps, slope and uncertainty): https://pgda.gsfc.nasa.gov/products/78
3. NASA PDS Geosciences Node, **LRO LOLA archive**: https://pds-geosciences.wustl.edu/missions/lro/lola.htm
4. LROC / USGS-managed LROC Data Node, **Controlled 1 m/pixel South Pole Average Mosaic**: https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_POLE_SOUTH_CM_AVG
5. NASA/JPL, **Moon Trek** (data layering, feature search, source metadata, distance, elevation-plot, lighting and slope-analysis tools): https://trek.nasa.gov/moon/
6. NASA Science, **Shadows near the Moon’s South Pole** (low solar elevation and long terrain-cast shadows): https://science.nasa.gov/resource/shadows-near-the-moons-south-pole/
7. NASA, **Artemis III candidate landing regions update, October 28, 2024**: https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/
8. NASA, **Preliminary Artemis III mission plans, May 13, 2026** (mission-plan context changed; Artemis III described as an Earth-orbit test ahead of Artemis IV crewed lunar landing): https://www.nasa.gov/missions/artemis/artemis-3/nasa-outlines-preliminary-artemis-iii-mission-plans/
9. Lunar and Planetary Institute, **Lunar South Pole Atlas** (map combines 2022 and 2024 landing-region selections, LOLA DEM and hillshade, contours, and PSR overlay): https://www.lpi.usra.edu/lunar/lunar-south-pole-atlas/
10. NAIF/SPICE, **Time subsystem** (UTC representation and conversion to ephemeris time require correct kernel/time handling): https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/time.html
11. NAIF/SPICE, **SPK required reading** (target/observer state vectors and optional light-time correction): https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/spk.html
12. NAIF/SPICE, **Reference frames required reading**: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/FORTRAN/req/frames.html
13. Three.js, **OrbitControls** (orbit/dolly/pan behavior, damping, distance and polar-angle limits): https://threejs.org/docs/pages/OrbitControls.html
14. Three.js, **Raycaster** (ray-based picking of scene objects): https://threejs.org/docs/pages/Raycaster.html
15. Three.js, **Picking manual**: https://threejs.org/manual/pages/picking.html
16. Three.js, **Resource cleanup** (dispose geometries, materials and textures): https://threejs.org/manual/pages/cleanup.html
17. Three.js, **WebGLRenderer**: https://threejs.org/docs/pages/WebGLRenderer.html

Always check the latest upstream documentation and dataset metadata at implementation time.
