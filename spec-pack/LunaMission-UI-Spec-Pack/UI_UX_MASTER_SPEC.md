# LunaMission — UI/UX Master Specification

**Status:** Proposed UI contract for visual design and frontend implementation.  
**Scope:** Responsive web UI for a scientifically honest lunar south-pole exploration workflow.  
**Primary user journey:** choose a supported lunar point → choose a UTC epoch → understand Sun/Earth geometry → inspect data quality/provenance → compare candidate points → explore a time interval if validated.

## 1. Product experience contract

### 1.1 What the product is

LunaMission is an interactive, time-aware scientific exploration interface. It helps users inspect and compare supported lunar locations using Sun geometry, qualified illumination information, Earth geometry/visibility, point-to-Earth range, theoretical light-time, and (when validated) time-window behavior.

The interface must make three questions easy to answer:

1. **Where am I looking?** Selected site, coordinates, coordinate convention, view orientation and supported coverage.
2. **At what time?** A canonical UTC epoch or UTC interval, synchronized across all panels.
3. **How should I interpret this result?** Value, unit, method, dataset/kernel version, quality/validation state, and caveats.

### 1.2 What the product is not

It is not an operational mission approval system, a landing guarantee, a complete RF link budget, a trajectory/fuel calculator, or a source of validated terrain insight simply because a 3D surface looks realistic. Unless separately designed and scientifically validated, do not display mission survival probabilities, unsupported power forecasts, vehicle arrival estimates, delta-v, propellant, radio-link guarantees or autonomous AI site recommendations.

### 1.3 Experience principles

1. **Evidence before spectacle.** The spatial view is important, but every important metric is labeled and explainable.
2. **Time is global state.** One UTC time is the default source of truth across the experience.
3. **Unknown is not zero.** Missing or unsupported outputs remain explicit.
4. **Progressive detail.** Most users see a readable result first; specialists can open method, coverage and source details.
5. **Spatial choice has a textual equivalent.** Every point-selection task is possible without WebGL, dragging or precise pointer work.
6. **Comparable means comparable.** Comparison exposes differences in epoch, methods, terrain support and coverage instead of silently masking them.
7. **Responsive by composition.** Mobile is a designed single-column workflow, not a desktop dashboard scaled down.
8. **A calm instrument.** The UI avoids decorative sci-fi effects and uses semantic color sparingly.

## 2. Information architecture

### Primary navigation

- **Explore** — main workbench; select one point, inspect its geometry and the selected epoch.
- **Compare** — compare 2–4 supported points under the same epoch and assumptions.
- **Method & Data** — explain definitions, source datasets, frames/time conventions, coverage and validation state.

`Time Explorer` appears inside Explore as a section or panel. It may become a separate route only when the validated workflow needs it. Do not create additional top-level destinations just to match a generic SaaS template.

### Global chrome

- Product wordmark: `LunaMission` with a restrained lunar/orbit glyph if desired.
- Main navigation.
- Current selected epoch displayed with a `UTC` label.
- Data/environment indicator when the interface is using illustrative/demo fixtures.
- A help/definitions entry point that does not obscure the work area.

The nav may become compact on narrow screens, but the user must never mistake local browser time for the selected UTC epoch.

## 3. Core Explorer screen

### 3.1 Desktop layout

Use a centered max-width shell, typically up to 1600px. Main content has a left spatial work area and a right information rail, with time analysis beneath. A 12-column grid is the layout model, not a hard requirement for CSS Grid syntax.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ LunaMission    Explore   Compare   Method & Data     2026-10-21 12:00 UTC│
├──────────────────────────────────────────────┬──────────────────────────┤
│ LOCATION WORKSPACE                           │ POINT PASSPORT           │
│ [3D Moon] [South-pole map] [layers] [reset]  │ Selected point / ID      │
│                                              │ Coordinates + coverage   │
│          spatial selection / orientation     │ Method / quality state   │
│                                              ├──────────────────────────┤
│  Candidate list / map legend / scale         │ SUN GEOMETRY             │
│                                              │ elevation / azimuth      │
│                                              ├──────────────────────────┤
│                                              │ EARTH GEOMETRY           │
│                                              │ elevation / visibility   │
│                                              │ range / theoretical time │
├──────────────────────────────────────────────┴──────────────────────────┤
│ TIME EXPLORER: UTC range, play/step controls, series, gaps, events      │
├─────────────────────────────────────────────────────────────────────────┤
│ METHOD & DATA SUMMARY / provenance entry point                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Proportions:** spatial area about 58–62% of the main split; detail rail 38–42%. Keep the spatial viewport large enough to orient and select, but do not let a huge globe push evidence below the fold on common laptop widths. The split may be adjustable later, but not required for the MVP.

### 3.2 Explorer header

Show the view title and a concise subtitle, such as “Explore location conditions at a selected lunar epoch.” Use plain language. The global UTC control should have:
- an explicitly labeled date field,
- an explicitly labeled time field,
- a visible `UTC` designation,
- previous/next step controls when time stepping exists,
- a concise indication if the selected epoch is outside supported data coverage,
- validation that does not silently coerce invalid dates/times.

Never make a placeholder the only field label. If using a date picker and time input, their combined value is one global epoch.

### 3.3 Spatial workspace: 3D globe and 2D map

Offer two clearly named modes:
- **3D Moon** — global orientation and point discovery.
- **South-pole map** — precise regional selection and dense point comparison.

The 2D map is not a lower-quality fallback; it is a first-class scientific work mode. Its projection, coordinate grid, north/latitude orientation and scale must be labeled according to the actual map implementation. Never imply a map projection is geographically exact without documenting it.

Required controls:
- View mode selector.
- View reset/recenter.
- Layer selector showing only layers actually available.
- Selected-site marker plus textual selected-site label.
- Candidate list or coordinate-entry alternative.
- Legend for all visual encodings.
- Loading/unsupported-data/WebGL-unavailable fallback.

Optional until evidence exists: terrain shading, illumination overlay, local horizon overlay, DEM-derived contours. Unavailable layers must be disabled or marked unavailable; never substitute a decorative texture silently.

Do not require exact pixel clicks. Map selection should support keyboard-accessible candidate-site list and, where coordinate entry is supported by the science contract, explicit coordinate fields. A selected point has a distinct marker and a text label.

### 3.4 Point Passport / detail rail

This is the primary result summary, not a generic collection of cards.

**Header block**
- Candidate/site name and stable point ID (or user-selected coordinate name).
- Latitude/longitude or relevant selenographic coordinates with units and convention.
- Selected epoch (`UTC`).
- Calculation/method state, coverage state and validation state.
- Short summary only when supplied by a deterministic, explainable model; otherwise omit.

**Sun geometry block**
- Sun elevation with degrees and a defined local-horizon/reference convention.
- Sun azimuth with degrees and a documented zero/direction convention.
- Illumination label only if its meaning and calculation mode are supported.
- Method qualifier: `Geometry-only`, `Terrain-aware`, `Unavailable`, etc.
- Short “What this means” explanation linked to the precise definition.

**Earth geometry block**
- Earth-center elevation with degrees and defined reference/horizon.
- Geometric visibility state: visible / not visible / indeterminate only when supported.
- Range with the target/reference point definition and unit.
- Theoretical one-way light-time only when a range result and declared light-time convention are available.
- Explicit disclaimer that geometric visibility does not prove radio link success.

**Data/method block**
- Coverage and method labels.
- A link to source/model/kernel versions, reference frames, time system, algorithm version and validation evidence.
- Missing-data reasons when known.

Values use stable labels, units and a consistent precision scheme. Do not show extra decimal places that imply unsupported accuracy. A definition may be placed in a tooltip or expandable row, but the value and essential qualifier must remain visible without hover.

### 3.5 Local-sky diagram

Provide a compact cross-sectional diagram showing the local horizon and the relative direction/elevation of the Sun and Earth. It makes angular metrics understandable and visually connects the numbers to the physical situation.

Requirements:
- Label `Sun` and `Earth` directly or include a persistent legend.
- Draw the local horizon explicitly and identify whether it is a reference horizon or terrain-derived horizon.
- Use solar gold for Sun and Earth blue for Earth.
- Keep line/arrow meanings consistent between screen, legend and documentation.
- Show numeric elevations where available; mark unsupported or illustrative geometry explicitly.
- Do not draw a terrain silhouette unless backed by actual terrain data for that site.
- Do not visually show the Earth as “connected” to the site merely because it is above a simplified horizon.
- Provide a text equivalent below/alongside the diagram for screen readers and small screens.

The diagram is a teaching aid, not a separate scientific engine. The displayed vectors and values must come from the same result/fixture and epoch.

### 3.6 Time Explorer

Timeline behavior is conditional on validated time-series support. Until then, render the section as an explicitly labelled preview or do not render it; do not draw plausible fake event windows as if real.

When implemented, provide:
- UTC start/end controls and selected timestamp.
- Zoom/step/play controls only if they have well-defined behavior.
- Shared-time cursor synchronized with the rest of the UI.
- Separate line series for Sun and Earth metrics, each with units and an accessible value summary.
- Visible gaps wherever calculations/data are missing; do not interpolate silently.
- Event windows with a written definition and boundary convention.
- A distinction between actual computed samples and interpolated/resampled display points.
- A summary of sampling interval and coverage when that affects interpretation.

Motion playback should not auto-start. Respect reduced-motion preference and make pause/stop obvious.

### 3.7 Method & Data panel

Use an expandable side panel, dialog or dedicated route based on the size of content. This view is a core trust feature, not legal-footer content.

Show, where available:
- calculation/method name and version;
- dataset/kernel names, identifiers/versions, coverage and retrieval/version information;
- coordinate frame and reference body/target definitions;
- time scale/convention and exact UTC epoch;
- terrain mode and dataset resolution if terrain is used;
- input coverage and missing-data treatment;
- validation status linked to a named test/reference and tolerance;
- known limitations and unsupported interpretations.

If a value has not been validated, label `Validation pending`; do not label the whole app “validated” merely because it builds or returns a value.

## 4. Compare screen

### Purpose

Let users compare 2–4 supported sites with one shared epoch and comparable assumptions. It should make trade-offs easy to see without converting the data into an unjustified overall ranking.

### Layout

- Header with `Compare sites` and a persistent shared UTC epoch.
- Site selector with selected site chips/list and a visible cap of four sites.
- Optional shared settings row (method/mode) only for real settings exposed by the implementation.
- On desktop, a comparison matrix/table with one row per metric and one column per site, or one compact card per site where that provides better clarity. Prefer a table for precise same-metric comparisons.
- A small coordinated view/map can identify the sites spatially, but avoid making the same map consume more space than the comparison itself.
- A clear action to return to Explore with a selected site.

### Comparison rules

- All sites use the same UTC epoch by default.
- Keep metric order and units consistent across columns.
- Show unavailable cells as `—` only when accompanied by a clear reason/tooltip or status; do not replace missing with zero.
- Show method/coverage differences per site, especially when one is geometry-only and another terrain-aware.
- Make selection state explicit.
- Do not invent a “best site” ranking unless a transparent user-configurable scoring model exists and its assumptions are visible. A sort by a single defined metric is allowed with clear direction and units.
- If epochs/settings diverge, show a warning and offer a deliberate synchronize action.

## 5. Responsive behavior

Use content-driven breakpoints, nominally:
- **Small mobile:** 320–479px
- **Large mobile:** 480–767px
- **Tablet:** 768–1023px
- **Small desktop:** 1024–1279px
- **Wide desktop:** 1280px and above

These are design test bands, not hard dependencies on a framework's defaults.

### Mobile order

1. Compact top bar and primary navigation/menu.
2. Page title + short description.
3. UTC epoch control, with `UTC` visible.
4. Site picker / selection status.
5. View toggle and spatial view with controls reachable without covering important geometry.
6. Point Passport summary.
7. Sun block and local-sky diagram.
8. Earth block.
9. Time Explorer, if supported.
10. Method & Data summary.

Use a single column. Prefer `Map` and `3D` as tabs/segmented controls; avoid side-by-side canvases on phones. Candidate lists may become a sheet/drawer only if it is keyboard-accessible, dismissible, scrollable and does not trap the user unexpectedly. Sticky actions may be used sparingly, but should not hide content or overlap browser safe areas.

### Responsive acceptance

- No horizontal page overflow at 320px.
- Long site names, coordinates, timestamps and IDs wrap or scroll only inside their own intended region.
- Data tables become horizontally scrollable within a labeled container or transform to row cards; never force the whole page wider.
- Buttons remain reachable and have approximately 44×44px touch targets where practical.
- Use responsive chart labels; never solve fit issues by shrinking to unreadable text.
- 3D view height adapts to the viewport and is not a huge empty region.
- Navigation and time editing remain possible at phone widths.

## 6. UI states and content rules

Every data-backed panel must define the following states:

| State | UI behavior |
|---|---|
| Idle / no selection | Explain how to select a candidate or enter a supported location. Do not show stale values as current. |
| Loading | Preserve the selected point/time context; show a clear pending state or skeleton that matches layout. Do not block unrelated controls unnecessarily. |
| Success | Show value, unit, method/quality labels and accessible definition. |
| Partial / unavailable | Keep available values, show missing values explicitly and explain coverage/method limitations. |
| Error | Human-readable message and safe retry action where appropriate; avoid dumping stack traces. |
| Stale / updating | If an older result remains visible temporarily, label it as previous/stale and keep the requested new epoch visible. |
| Demo / illustrative | Persistent `DEMO DATA` or `ILLUSTRATIVE` label near the content and documented fixture source. |
| Unsupported capability | Explain the boundary and do not render a fake control as functional. |
| WebGL unavailable | Offer the 2D map, candidate list or coordinate selection if available. |

### Error semantics

- Invalid UTC input: explain the invalid field and retain the last valid epoch.
- Unsupported location/frame: identify what is unsupported, do not silently reinterpret coordinates.
- Missing source/kernel/DEM: show data-availability status; missing terrain is not “clear line of sight”.
- A partial timeline failure: show the affected interval as a gap and retain valid samples.
- Rapid selection changes: ensure an old request cannot overwrite the result for the newest point/time.
- Empty event result: say no event was found under the current sampling/definition/coverage; do not claim the event can never occur.

## 7. Scientific presentation standards

### Vocabulary is precise

- **Geometry-only:** terrain obstruction is not included in the relevant calculation.
- **Terrain-aware:** terrain obstruction is included using a named/versioned dataset and documented method.
- **Geometric Earth visibility:** geometric criterion only; not an RF success guarantee.
- **Theoretical one-way light-time:** derived from a declared range and speed-of-light convention; not full operational latency.
- **Validation pending / passed / failed:** tied to named validation evidence and tolerance where applicable.
- **Unavailable / indeterminate / not assessed:** distinct from false or zero.

### No false precision

- Use per-metric decimal precision defined by the science/data contract.
- Always show units where applicable.
- Keep source/method qualification attached to a result.
- Do not rank, score or color sites using hidden assumptions.
- If comparing mixed-quality results, expose the difference before inviting interpretation.

### Demo fixtures

If a prototype needs fixed sample data, use visibly fictional/site-labelled placeholders or clearly identified sample fixtures. Do not fabricate realistic-looking scientific output that could be mistaken for actual calculations. A demo banner is required at page level and preferably near the metrics. Fixture code comments must describe the data as illustrative and identify the future contract the mock is intended to mimic.

## 8. Accessibility requirements

Target WCAG 2.2 AA in design and implementation.

- Use landmark elements (`header`, `nav`, `main`, named `section`, footer when needed) and logical headings.
- Every form control has a visible label or an accessible name plus visible label text where practical. Placeholder text does not count as the only label.
- Keyboard users can operate navigation, site selection, tabs/segmented controls, UTC inputs, timeline controls, dialogs and menus.
- Provide a visible focus ring using the focus token; never remove outlines without a replacement.
- Include a keyboard and screen-reader alternative to the 3D globe and pointer-based map interactions.
- Charts and diagrams have text descriptions and a data table or equivalent summary where values matter.
- Every semantic color is paired with text, shape, line style or icon.
- Check contrast for muted text, borders that communicate state, charts and focus outlines; don't use the color tokens blindly if a specific pair fails.
- Support zoom/reflow and 320px viewport without loss of core tasks.
- Respect `prefers-reduced-motion`; all functionality remains available with motion reduced.
- Dialogs/sheets preserve and restore focus, have a name, and close by keyboard.
- Dynamic calculation status updates should be announced sensibly without repeatedly reading the entire page.

## 9. Interaction and microcopy

Use short and literal labels. Prefer `Select site`, `Selected epoch`, `UTC`, `Geometry-only`, `Terrain-aware`, `Method & data`, `Unavailable`, `Validation pending`, and `Compare sites`. Avoid unexplained abbreviations in the most prominent layer; explain DTE the first time it appears, such as `Direct-to-Earth (DTE)`.

Buttons use verbs: `Add site`, `Remove`, `Reset view`, `Synchronize time`, `Retry`, `Open method details`. A button must indicate the action it performs. Do not use `OK` where a meaningful action label fits.

Tooltips help define a term, but information essential to interpretation must also be visible in the panel or method view. Tooltips must be available on focus as well as hover.

## 10. Performance and resilience

- Load the 3D scene only on the client; use a dynamic import and a clear loading/unsupported fallback.
- The page remains navigable and explanatory while the scene or a scientific result is pending.
- Use responsive sizing and avoid giant textures or data blobs in the initial JS bundle.
- Debounce high-frequency time changes only when needed; keep the user's selected value visually immediate.
- Cancel or ignore outdated requests. Use cache keys that include all scientific inputs that affect the result.
- Use skeletons only when they preserve the shape and hierarchy; avoid page-wide flashing/reflow.
- Do not auto-play the Moon rotation or timeline by default.
- Keep the public UI usable without WebGL, external-font success or non-essential remote imagery.

Performance goals should be measured on a representative device after the first complete vertical slice. Do not invent latency or frame-rate claims in the interface.

## 11. Component and code quality contract

The UI should be assembled from a small, consistent design system plus product features. Keep common primitives generic enough to reuse without turning the project into an internal component framework.

Required reusable concepts:
- App shell and navigation
- UTC time control
- Site selector / selected-site summary
- Spatial view container and view-mode switcher
- Metric block
- Method/quality/coverage badge
- Local-sky diagram
- Time-series/timeline panel (only when supported)
- Comparison matrix
- Provenance/method panel
- Empty/loading/error/unsupported-state components

Detailed implementation conventions are in `NEXTJS_IMPLEMENTATION_GUIDE.md`.

## 12. Release phases

### Phase 0 — visual shell
Navigation, color/type/spacing tokens, core desktop layout, mobile single-column layout, all data visibly illustrative. No pretend science.

### Phase 1 — honest interactive prototype
Site list/selection, UTC editing and validation, view toggle scaffolding, selected site/time state, working responsive interactions. A 2D map may use simplified non-scientific fixtures if clearly labeled.

### Phase 2 — spatial vertical slice
Add precise 2D south-pole map and/or 3D Moon. 3D is a progressive enhancement; point selection always has a non-3D alternative.

### Phase 3 — first validated scientific result
Connect one real point/time response with method/quality/provenance. A single validated path beats many fake metrics.

### Phase 4 — comparison
Compare 2–4 points at the same UTC epoch, including missing data and coverage differences.

### Phase 5 — timeline
Build only when point-in-time calculations, sample strategy and event definitions are validated.

### Phase 6 — polish
Responsive QA, keyboard/a11y pass, visual cleanup, performance profiling, demo flow and final acceptance.

## 13. Acceptance checklist

### Visual system
- [ ] Colors, typography, radii, spacing and focus states use `DESIGN.md` tokens.
- [ ] The screen feels like a scientific observatory, not a generic dashboard or game HUD.
- [ ] No decorative gradients/glows distract from the map/globe or evidence.
- [ ] Sun/Earth/site colors keep consistent meanings.

### Functional integrity
- [ ] Site selection updates the visible selected-site identity.
- [ ] UTC value is visible, explicit and valid; all time-dependent panels use the same epoch.
- [ ] A change in point/time cannot display a stale response as current.
- [ ] Every control works, is disabled with an explanation, or is labeled future/preview.
- [ ] Missing and unsupported results are not converted to zero/false.
- [ ] Demo content is unmistakably labeled.

### Layout
- [ ] No horizontal page overflow at 320px.
- [ ] Responsive checks at 320, 375, 768, 1024, 1280 and 1440px.
- [ ] Spatial view remains useful on phones and supports a list/form alternative.
- [ ] Comparison data remains readable without widening the entire page.

### Accessibility
- [ ] Keyboard-only core flow works.
- [ ] Focus is visible, order is logical and menus/dialogs manage focus.
- [ ] Colors are supplemented by labels or shapes.
- [ ] Charts/diagrams have text alternatives.
- [ ] Reduced motion is respected.

### Engineering
- [ ] Typecheck, lint, tests and build are run where configured; results reported honestly.
- [ ] No scientific equations hidden inside presentation components.
- [ ] WebGL failure does not destroy the core site/time workflow.
- [ ] No unexplained tool-specific lock-in is introduced.
