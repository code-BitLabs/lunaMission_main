# LunaMission — Design Specification

| Field | Value |
|---|---|
| Document status | Proposed; ready for implementation review |
| Project | LunaMission |
| Scope | MVP user experience and interaction behavior |
| Last updated | 2026-10-19 |
| Related documents | `PROJECT_BRIEF.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `SCIENCE_FEASIBILITY.md` |

## 1. Purpose

This document defines the user-facing behavior and information hierarchy for LunaMission. It is a product and interaction specification, not a final brand guide or a claim that the scientific pipeline has already been validated.

LunaMission helps users explore and compare lunar south-pole candidate locations at a selected UTC time or over a time interval. Its primary outputs concern Sun illumination geometry, Earth visibility geometry, and clearly qualified supporting measurements.

The experience must make it easy to answer:

1. Where is the candidate point?
2. At the selected time, where are the Sun and Earth relative to the point's defined local horizon?
3. How do those conditions change with time?
4. How do two or more candidate points compare under the same assumptions?
5. Which results are geometry-only, which are terrain-aware, and what evidence supports them?

## 2. Product principles

### 2.1 Show evidence and limitations beside the result

A scientific value must never appear without its unit, time basis, and necessary qualification. Users should be able to discover the source data, calculation method, coordinate frame, and coverage status without searching through unrelated documentation.

### 2.2 Keep geometry distinct from operational feasibility

The interface must distinguish:
- **Geometric visibility** from a verified radio-frequency (RF) communications link.
- **Geometric illumination** from actual power-system performance.
- **Geometry-only** results from results that account for verified terrain obstruction.
- **Theoretical light-time** from operational latency.
- Candidate comparison metrics from mission approval, survival probability, or fuel/trajectory claims.

Do not present a candidate as “safe,” “survivable,” “communication-ready,” or “optimal” merely because one geometric metric looks favorable.

### 2.3 Compare like with like

Comparison views should synchronize candidate points to the same canonical UTC timestamp or explicitly declare when data windows differ. If candidate points have different terrain-data coverage or different calculation methods, show that difference prominently.

### 2.4 Prefer legibility over dashboard density

The main task is point-and-time exploration. Advanced details belong in expandable panels, not in a wall of unexplained metrics.

### 2.5 No false precision

Display precision must reflect the scientific pipeline's validated accuracy and input resolution. Do not imply sub-degree, sub-second, or terrain-level accuracy unless the underlying method and data support it.

## 3. Primary users and tasks

The MVP should support:
- A challenge judge or reviewer checking the project’s scientific reasoning.
- A student or researcher exploring the consequences of changing site or time.
- A developer or domain expert inspecting calculation provenance and known limitations.

Primary tasks:
1. Choose a point on or near the lunar south-pole region.
2. Set a date and time in UTC.
3. Inspect Sun geometry and Earth visibility geometry for that point.
4. Explore a time series over a selected interval.
5. Add candidate points and compare them under the same time basis.
6. Inspect the method, inputs, source data, and validation status.

## 4. Main information architecture

The MVP contains these areas:

1. **Explorer** — lunar map/globe, candidate-point selection, UTC controls.
2. **Point details** — selected point summary and current-time measurements.
3. **Time explorer** — temporal changes and defined event windows.
4. **Comparison** — side-by-side metrics for two to four selected points.
5. **Method and provenance** — input data, coordinate/time conventions, source references, calculation method, coverage, validation status, and caveats.

These can be implemented as panels or tabs within one application route. Avoid creating a separate route for every panel unless implementation or accessibility testing shows it is necessary.

## 5. Main workflow

### Step 1 — Open the explorer

The user sees the lunar south-pole context, a concise explanation of what the current view means, and a clear way to select or enter a candidate point.

Initial state:
- No point is silently preselected as “best.”
- If a sample point is shown, it is labeled as an example.
- The UTC control has an explicit default value and explains that all results use UTC.
- The current dataset and calculation capability are visible (for example, geometry-only).

### Step 2 — Select a candidate point

The user can select a supported predefined candidate or a location from the map. Exact coordinate-entry behavior should only be enabled for coordinate systems the implementation can validate.

On selection, display:
- A stable point label or ID.
- Latitude/longitude or the documented lunar coordinate representation.
- Coordinate frame / body-fixed convention.
- Selection provenance: predefined source, user-entered, or derived.
- Data coverage indicators relevant to that point.

Do not label arbitrary selected points as mission-approved sites.

### Step 3 — Select a UTC time

Use a single canonical timestamp for the entire active exploration session. Show it in an unambiguous UTC representation such as `YYYY-MM-DD HH:mm:ss UTC`.

Provide:
- Direct date/time entry with validation.
- A time slider or step controls for nearby changes.
- A visible selected time range when exploring a window.
- A reset-to-current-view action only if the default reference is clearly defined.

The interface must reject or clearly report invalid times. Do not silently reinterpret local time as UTC.

### Step 4 — Inspect point details

The point-details panel presents the measurements defined in Section 7. Each value must include a unit, concise explanation or tooltip, and calculation/data status.

### Step 5 — Explore temporal behavior

The time explorer displays metrics across a user-selected interval. It must distinguish actual computed samples from interpolated or resampled display points. Detected event windows need an explicit event definition and boundary convention.

### Step 6 — Compare candidate points

The user can add two to four points to a comparison. The selected timestamp/range is synchronized unless the user explicitly chooses a different mode.

Show:
- The same core metric columns for each point.
- Units and shared time basis.
- Per-point data and calculation status.
- A visual indication when a metric is unavailable or not comparable.
- Clear method/coverage differences where they affect interpretation.

Never silently compare a terrain-aware result for one point to a geometry-only result for another as though they were equivalent.

### Step 7 — Inspect provenance

Every major result view provides a path to the details for:
- Calculation method and relevant assumptions.
- Source datasets and versions/identifiers.
- Coordinate frames and time conventions.
- Input coverage and missing-data behavior.
- Software or algorithm version where available.
- Validation status, reference result, and tolerance where such checks exist.

“Validated” must mean that a specific test or reference comparison passed. It must not mean merely that the code ran successfully.

## 6. Suggested screen layout

This is a functional layout, not a pixel-perfect mockup.

```text
┌─────────────────────────────────────────────────────────────────┐
│ LunaMission     Explorer   Compare   Method & Data    UTC time  │
├───────────────────────────────┬─────────────────────────────────┤
│                               │ Selected point                  │
│ Lunar south-pole map/globe    │ Point ID / coordinates          │
│                               │ Coverage + method status        │
│ Candidate points and filters  ├─────────────────────────────────┤
│                               │ Sun geometry                    │
│                               │ elevation / azimuth / status    │
│                               ├─────────────────────────────────┤
│                               │ Earth geometry                  │
│                               │ elevation / visibility / status │
├───────────────────────────────┴─────────────────────────────────┤
│ Time explorer: interval, time series, event windows             │
├─────────────────────────────────────────────────────────────────┤
│ Provenance / assumptions / limitations (expandable)             │
└─────────────────────────────────────────────────────────────────┘
```

Desktop: map and details can sit side by side, with the time explorer below. On narrow screens, stack these regions and preserve a visible UTC/time-basis label. Do not depend on hover as the only way to access a value definition.

## 7. Metric definitions and display requirements

Exact equations and reference frames must be settled and recorded by the science implementation; this section specifies UI labeling and interpretation.

| Metric | Required display | User-facing qualification |
|---|---|---|
| Sun elevation | Angle with unit, normally degrees | State the local horizon/reference definition. If terrain is not modeled, explicitly call it geometry-only or reference-horizon elevation. |
| Sun azimuth | Angle with unit and documented convention | Define the zero direction and direction of increase. Do not show an unlabeled azimuth. |
| Illumination state | A defined label and/or fraction, only if supported | Explain whether it is body-level, point-level, geometric, or terrain-aware. Avoid ambiguous “sunlit” if only a simplified geometry test was used. |
| Earth-center elevation | Angle with unit | Define local horizon and reference frame. Earth-center elevation alone does not prove an Earth communications link. |
| Geometric Earth visibility | Visible / not visible / indeterminate, if supported | State whether terrain obstruction is included and what “visible” geometrically means. |
| Range | Distance with unit, if computed | Name the target/reference point and method; do not imply RF link quality. |
| One-way light-time | Duration with unit, if computed | Label as theoretical propagation time for the stated range/model. |
| Round-trip light-time | Duration with unit, only when relevant and clearly defined | Do not label as operational latency; processing, routing, and protocol delays are excluded unless modeled. |
| Event/window duration | Duration with unit | State the event definition, interval boundaries, and sample/resolution constraints. |

For missing, unsupported, or uncertain values, show a textual state such as `Unavailable`, `Not computed`, `Outside supported data coverage`, or `Indeterminate`. Do not replace missing measurements with zero.

## 8. Visual encoding

The visual system must preserve scientific meaning rather than decorate the view.

- Use distinct labels and line styles for the Sun, Earth direction, local reference horizon, and any terrain profile.
- Include a legend whenever more than one directional object is displayed.
- Show angle arcs/labels only if the geometry behind them is defined and implemented.
- A “local horizon” diagram must not look like a terrain silhouette unless it uses a verified terrain profile.
- If terrain data is available, show the DEM source/resolution and whether the depicted profile was actually sampled for the selected location.
- Do not use color as the only distinction. Pair color with labels, markers, line styles, or icons that have accessible names.
- Avoid green/red “good/bad” rankings in the absence of validated mission requirements.

A local-horizon panel should answer: what reference horizon is being used, what direction is being measured, and whether terrain obstruction is included?

## 9. Time-series and event-window behavior

1. The selected UTC timestamp and displayed interval must be visible near the chart.
2. Axes include units; tooltips include exact sample time and whether the point is sampled, resampled, or interpolated.
3. Event windows must be defined by named rules, such as a documented visibility threshold crossing, not by an unexplained highlighted region.
4. Boundary rules must be consistent and testable (for example, whether threshold equality counts as visible).
5. If computation fails for part of an interval, mark the gap; do not connect lines across missing data as if values were known.
6. If event detection is based on discrete sampling, disclose the sampling/resolution limitation.
7. Rapid scrubbing or repeated input must not leave stale data presented as current. Mark pending work, cancel obsolete work where possible, and apply results only when they correspond to the current selection.

## 10. Comparison behavior

- Support two to four candidate points in the MVP.
- Keep a shared UTC timestamp/range by default.
- Preserve stable point identity and names while users change the timestamp.
- Provide a clear remove-point action.
- Handle mixed coverage explicitly.
- Do not calculate an aggregate “winner” score in the MVP unless the score has a documented formula, validated weights, user-visible assumptions, and approval criteria. The default is transparent metric-by-metric comparison.
- Do not imply that the point with the largest single metric is globally optimal.

## 11. Data quality and state model

Every result panel should distinguish the following states where applicable:

- **Ready** — result successfully computed using known inputs.
- **Computing** — result is pending for the current selection.
- **Unavailable** — required calculation or data is not provided.
- **Out of coverage** — the requested point/time is outside the supported domain.
- **Indeterminate** — inputs or precision do not support a reliable binary answer.
- **Geometry-only** — no verified terrain obstruction is included.
- **Terrain-aware** — terrain obstruction was computed using a named, versioned dataset and a declared method.
- **Validation pending** — result exists but relevant validation has not been completed.
- **Validation passed/failed** — tied to a named test/reference and recorded tolerance.
- **Error** — calculation failed; provide a safe, useful message and correlation/detail identifier where appropriate.

Do not conflate `Ready` with `Validated`, and do not treat missing terrain data as evidence of an unobstructed path.

## 12. Error and edge-case behavior

| Situation | Expected behavior |
|---|---|
| Invalid UTC entry | Explain the invalid field; retain the last valid selection. |
| Unsupported coordinate/frame | Prevent calculation or ask for a supported frame/conversion; never silently reinterpret. |
| Missing kernel/dataset | Show a data-availability error and the missing dependency in the diagnostics/provenance view. |
| Unsupported time range | Explain the supported time range or data coverage. |
| Partial time-series failure | Display gaps and report the affected interval; retain valid samples. |
| Rapid consecutive selections | Keep the UI responsive and ensure an old response cannot overwrite the latest selection. |
| Mixed terrain coverage in comparison | Mark each point's method/coverage and avoid a false like-for-like impression. |
| No candidate selected | Explain how to select a point; do not show stale point metrics as if current. |
| Empty event result | Say no event was detected under the current definition and sampling/coverage; do not claim the event can never occur. |
| Out-of-range numerical output | Report a computation/validation error rather than clamping silently, unless clamping is part of a declared numerical contract. |

## 13. Accessibility and responsive behavior

- All primary tasks are keyboard-accessible.
- Controls have visible labels and accessible names; do not rely on placeholder text alone.
- Charts expose the underlying values in an accessible table or equivalent summary.
- Every color-encoded state has a text or shape counterpart.
- Focus order follows the visual and task hierarchy.
- Dialogs and drawers manage focus and can be closed with the keyboard.
- Text and labels remain usable at browser zoom and narrow viewport widths.
- The map/globe must have an alternative point-selection route, such as a supported candidate list or coordinate form.
- Reduced-motion preferences should be respected for transitions and animated globe controls.

## 14. Performance and interaction expectations

The following are product targets to measure, not claims about current performance:

- Time and point controls give immediate feedback and do not freeze the page while calculations run.
- For local UI updates, preserve a responsive interaction frame rate on a representative development device.
- For server-backed calculations, show a pending state promptly and avoid duplicate requests for the same in-flight selection where feasible.
- Cache only with keys that include every input affecting scientific results, including data/kernel versions and the relevant calculation mode.
- Use cancellation or stale-result guards for rapidly changing inputs.
- Avoid shipping large scientific datasets in the browser bundle when they can be served or processed separately.
- Establish measurable latency budgets after the first representative end-to-end vertical slice; do not invent benchmark claims before measurement.

## 15. Out of scope for the MVP

Unless separately specified and scientifically validated, the UI must not provide:
- Trajectory optimization, fuel or delta-v estimates.
- RF link-budget or guaranteed communications availability.
- Surface power-system production forecasts.
- Survival probability or a categorical safety score.
- Terrain-aware claims without verified DEM provenance and validated terrain processing.
- Autonomous AI judgments that choose a site without transparent evidence.
- Mission approval or engineering certification.

## 16. Acceptance criteria

The MVP design is ready for implementation when:

- [ ] The primary point-and-time workflow is unambiguous.
- [ ] All time controls label UTC explicitly.
- [ ] The chosen coordinate frame/convention is visible wherever coordinates are shown.
- [ ] Sun and Earth metrics have units and concise definitions.
- [ ] Geometry-only and terrain-aware modes cannot be mistaken for one another.
- [ ] A user can compare two to four points at a shared UTC time.
- [ ] Missing/out-of-coverage/indeterminate values are not shown as zero.
- [ ] Time-series gaps and event definitions are visible.
- [ ] Each result has access to its calculation/data provenance.
- [ ] The interface does not claim operational RF success, survival probability, or site optimality without supporting validated models.
- [ ] Keyboard navigation and an accessible non-map selection path are available.
- [ ] Rapid changes cannot display stale results as current.

## 17. Open design decisions

Resolve these during the first vertical slice rather than through speculative mockups:

- Which initial candidate points and coordinate source will be supported?
- Which base lunar map/globe and projection are feasible for the implementation?
- Which exact metrics pass the scientific feasibility gate?
- How should terrain-data coverage be communicated before full terrain-aware calculations are available?
- Which time-series sampling and event-boundary rules can be defended scientifically?
- What representative device and latency budgets will be used for performance testing?

A decision should be recorded when it affects scientific meaning, data provenance, cross-view consistency, or user interpretation.
