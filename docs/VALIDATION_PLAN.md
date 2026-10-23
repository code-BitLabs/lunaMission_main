# LunaMission — Validation Plan

| Field | Value |
|---|---|
| Document status | Proposed test plan; execution results not yet asserted |
| Project | LunaMission |
| Scope | Scientific correctness, numerical behavior, API/data integrity, and user-facing claims |
| Last updated | 2026-10-19 |
| Related documents | `PROJECT_BRIEF.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `SCIENCE_FEASIBILITY.md`, `DESIGN_SPEC.md` |

## 1. Purpose

This plan defines how LunaMission results will be tested before they are presented as scientifically meaningful. The project combines time handling, coordinate transformations, Sun/Earth geometry, potential terrain obstruction, event-window detection, and a comparative UI. A green test suite alone does not establish scientific validity; results must also be checked against authoritative references, analytically expected cases, or independently computed results with documented tolerances.

**Current execution status:** This file is a plan. Unless a row is updated with evidence, its status is `Not run`. Do not describe planned tests as passed.

## 2. Validation objectives

1. Verify time conversion, coordinate frames, units, and sign conventions.
2. Verify geometric calculations against known identities and independent references.
3. Detect numerical edge cases and incorrect boundary behavior.
4. Verify terrain-aware behavior only when a specific, licensed/usable DEM and method are available.
5. Ensure API and UI state correspond to the exact current inputs and calculation/data versions.
6. Make missing data and unsupported claims visible.
7. Preserve evidence so reviewers can reproduce key results.

## 3. Validation layers

### Layer A — Unit tests

Fast tests for deterministic functions: time parsing, unit conversion, vector normalization, angle wrapping, coordinate transforms, event-boundary logic, result validation, and response-schema validation.

### Layer B — Property and invariant tests

Test relationships that must hold across many inputs, such as vector norms, range non-negativity, angle bounds, chronological ordering, and consistency between a returned timestamp and the request.

### Layer C — Reference tests

Compare selected calculations to authoritative toolkit outputs, documented examples, trusted ephemeris/geometry products, or an independently implemented method. Record the reference source, version, input set, expected result, observed result, tolerance, and rationale.

### Layer D — Integration tests

Exercise the full path from a user selection to calculation request, scientific result, server response, and rendered view. Verify error paths and stale-response protection.

### Layer E — Product and scientific review

Check that units, frame conventions, coverage warnings, method labels, data provenance, and limitations are understandable and do not overstate what the calculation proves.

## 4. Scientific configuration that must be recorded

For each reproducible test or reference result, save a test manifest containing, where applicable:

- Test ID and purpose.
- Input point and the exact coordinate representation.
- Coordinate frame and axis/longitude conventions.
- Body-fixed frame realization and reference epoch, where relevant.
- UTC input string and the parsed/normalized time.
- Time conversion method and leap-second data version if relevant.
- SPICE toolkit and wrapper version.
- Kernel names, versions, checksums, and relevant coverage intervals.
- Target, observer, aberration correction, and geometry definitions.
- Whether the local horizon is a reference plane, ellipsoid-based convention, or terrain profile.
- DEM source, version, resolution, vertical reference, and no-data handling for terrain-aware cases.
- Calculation version/commit.
- Expected result, actual result, units, comparison metric, and tolerance.
- Result: `Not run`, `Pass`, `Fail`, `Blocked`, or `Needs review`.
- Evidence location and reviewer/date.

Do not publish a result as reproducible if the input data or kernel provenance cannot be reconstructed.

## 5. Test catalog

### 5.1 Time and UTC

| ID | Scenario | Expected behavior | Status |
|---|---|---|---|
| TIME-001 | Parse a valid explicit UTC timestamp | Same physical epoch is used by the calculation layer; normalized output is unambiguous | Not run |
| TIME-002 | Reject malformed date/time | Clear validation error; no silent fallback to current time | Not run |
| TIME-003 | Input contains an explicit offset | Convert correctly to canonical UTC if offset input is supported; otherwise reject with documented guidance | Not run |
| TIME-004 | UTC timestamp at supported-range boundary | Accept/reject according to recorded coverage; no off-by-one ambiguity | Not run |
| TIME-005 | Leap-second-sensitive conversion, if within supported dates | Use an authoritative conversion path and documented leap-second data; avoid naïve fixed-offset arithmetic | Not run |
| TIME-006 | Scrubbing emits requests out of order | Only the response corresponding to current inputs may update visible results | Not run |

### 5.2 Coordinate frames and conventions

| ID | Scenario | Expected behavior | Status |
|---|---|---|---|
| FRAME-001 | Transform a documented test vector between supported frames | Matches reference within declared tolerance | Not run |
| FRAME-002 | Point near a pole | Longitude/azimuth conventions are stable and documented; singular or poorly conditioned cases are handled explicitly | Not run |
| FRAME-003 | Longitude wrapping at convention boundary | Equivalent locations normalize consistently without a discontinuous physical result | Not run |
| FRAME-004 | Invalid latitude or malformed coordinates | Rejected before scientific calculation | Not run |
| FRAME-005 | Missing/incompatible frame definition or kernel | Explicit dependency error; never silently substitutes another frame | Not run |
| FRAME-006 | Coordinate label in UI | Shown coordinates and the selected frame/axis convention agree | Not run |

### 5.3 Sun geometry

| ID | Scenario | Expected behavior | Status |
|---|---|---|---|
| SUN-001 | Compare Sun state/vector to a trusted SPICE/reference case | Difference is within a tolerance justified by the data and method | Not run |
| SUN-002 | Construct a synthetic geometry with source direction along local up | Elevation follows the documented convention (for a standard local horizon, +90 degrees) | Not run |
| SUN-003 | Construct a synthetic geometry along local horizon | Elevation follows the documented convention (0 degrees) | Not run |
| SUN-004 | Construct a synthetic geometry below local horizon | Elevation is negative under the documented convention | Not run |
| SUN-005 | Azimuth test vectors along each defined cardinal direction | Results follow the documented zero direction and rotation direction | Not run |
| SUN-006 | Near-threshold sunrise/sunset crossing | Boundary, interpolation, and sampling rules are consistent and disclosed | Not run |
| SUN-007 | Zero or near-zero vector / invalid numerical input | No NaN/Infinity leak into user-facing results; report invalid/indeterminate state | Not run |

Synthetic geometry tests validate formulas and conventions; they do not by themselves validate ephemeris accuracy.

### 5.4 Earth visibility and light-time

| ID | Scenario | Expected behavior | Status |
|---|---|---|---|
| EARTH-001 | Compare Earth state/range to an authoritative reference case | Matches declared target, observer, frame, and correction setup within tolerance | Not run |
| EARTH-002 | Geometric Earth-center elevation test vectors | Correct sign and angle convention | Not run |
| EARTH-003 | Earth-center visibility versus extended Earth disk | UI and API make clear which is calculated; a center test is not mislabeled as full-disk visibility | Not run |
| EARTH-004 | Geometric visibility without terrain | Clearly marked as geometry-only; no implication of an unobstructed RF path | Not run |
| EARTH-005 | One-way light-time | Computation matches the declared distance/model and is labeled theoretical propagation time | Not run |
| EARTH-006 | Round-trip light-time | Only produced with an explicit definition; not labeled operational latency | Not run |
| EARTH-007 | Missing Earth ephemeris coverage | Result is unavailable with reason, rather than inferred from prior samples | Not run |

### 5.5 Terrain-aware calculation (conditional)

These tests are **blocked until** a supported DEM, correct registration, documented interpolation, and a terrain obstruction method have been selected and checked.

| ID | Scenario | Expected behavior | Status |
|---|---|---|---|
| TERRAIN-001 | Verify DEM identity, coverage, resolution, and vertical reference | Metadata is recorded; unsupported coverage is rejected or flagged | Blocked |
| TERRAIN-002 | Sample a known profile from the chosen DEM | Values agree with source/reference sampling within a documented tolerance | Blocked |
| TERRAIN-003 | Missing/no-data cells | Missing terrain is not interpreted as clear terrain | Blocked |
| TERRAIN-004 | Synthetic flat terrain | Terrain-aware result agrees with expected geometry-only behavior under the same declared assumptions | Blocked |
| TERRAIN-005 | Synthetic ridge that blocks a ray | Obstruction is detected according to the stated ray/profile algorithm | Blocked |
| TERRAIN-006 | DEM coverage ends along a test ray | Result is blocked/indeterminate or otherwise explicitly qualified; no extrapolated-clear claim | Blocked |
| TERRAIN-007 | Compare terrain-aware and geometry-only results | Method label and visual result make the distinction obvious | Blocked |

Do not advertise terrain-aware functionality until the blocked tests have evidence and review.

### 5.6 Time-window and event detection

| ID | Scenario | Expected behavior | Status |
|---|---|---|---|
| EVENT-001 | Monotonic synthetic metric crosses a threshold once | Correct event start/end according to explicit boundary rules | Not run |
| EVENT-002 | Metric touches but does not cross the threshold | Behavior follows declared equality/touch rule | Not run |
| EVENT-003 | Multiple disjoint windows | All valid windows are returned in chronological order | Not run |
| EVENT-004 | Window touches requested interval boundary | Clipping/inclusion semantics are deterministic and documented | Not run |
| EVENT-005 | Missing samples inside a window | Do not imply a continuous known window across missing data | Not run |
| EVENT-006 | Coarse sampling near a short event | Resolution limitation is exposed; do not claim exact boundary time without adequate method | Not run |
| EVENT-007 | Start time after end time or invalid interval | Reject before calculation | Not run |

### 5.7 API, schema, and UI integrity

| ID | Scenario | Expected behavior | Status |
|---|---|---|---|
| API-001 | Valid request | Response validates against the implementation's declared schema | Not run |
| API-002 | Missing required input | Consistent client-visible error; no scientifically meaningful-looking default result | Not run |
| API-003 | Unsupported time/coordinate/data coverage | Typed or otherwise stable error state with a useful reason | Not run |
| API-004 | Response includes units, frame, timestamp, and mode | Metadata agrees with the calculation performed | Not run |
| API-005 | Result is `null`/unavailable | UI shows an explicit unavailable state, not zero | Not run |
| UI-001 | Change selected point/time repeatedly | Visible values always correspond to current selection | Not run |
| UI-002 | Two to four points with shared timestamp | Comparison applies the same time basis and exposes method/coverage differences | Not run |
| UI-003 | One point has terrain data and another does not | Comparison avoids false equivalence | Not run |
| UI-004 | Open provenance details | Data versions, method, conventions, and validation status are available where known | Not run |
| UI-005 | Keyboard-only navigation | Primary selection, time, comparison, and provenance tasks remain usable | Not run |
| UI-006 | Chart contains gaps | Gaps are visible and not bridged as known values | Not run |

### 5.8 Safety of scientific claims

| ID | Scenario | Expected behavior | Status |
|---|---|---|---|
| CLAIM-001 | Earth geometrically visible | No statement that a radio link is guaranteed | Not run |
| CLAIM-002 | Sun elevation is positive | No unqualified claim of power-system adequacy or surface safety | Not run |
| CLAIM-003 | Multiple candidate metrics shown | No unsupported “best site” ranking or survival probability | Not run |
| CLAIM-004 | Light-time shown | Labeled theoretical propagation time, not operational latency | Not run |
| CLAIM-005 | Terrain coverage absent | Geometry-only limitation is visible where it matters | Not run |
| CLAIM-006 | Results are calculated but reference tests not run | UI/documentation says validation is pending rather than implying scientific validation | Not run |

## 6. Reference strategy

Prefer sources in this order, depending on the calculation:
1. Official documentation and data from NAIF/JPL or the authoritative mission archive.
2. Published reference examples with fully specified inputs.
3. Independent implementation using a clearly different path.
4. Analytically constructed synthetic cases for signs, axes, invariants, and boundaries.

A reference comparison must document the exact setup. Two outputs from the same implementation path do not constitute independent validation.

Potential technical references to investigate and pin by version during execution:
- NAIF SPICE tutorials: https://naif.jpl.nasa.gov/naif/tutorials.html
- SPICE kernel required reading: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/kernel.html
- SPICE frames required reading: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/frames.html
- SPICE time required reading: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/time.html
- SPICE illumination geometry API documentation: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/illumf_c.html
- SPICE Geometry Finder required reading: https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/gf.html
- SPICEyPy documentation: https://spiceypy.readthedocs.io/en/latest/documentation.html
- NASA/GSFC South Pole LOLA DEM information: https://core2.gsfc.nasa.gov/PGDA/LOLA_5mpp/
- PDS Geosciences Node LOLA: https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- NASA Scientific Visualization Studio south-pole illumination visualization (qualitative context only unless its exact inputs are reproducible): https://svs.gsfc.nasa.gov/5027

A source being listed here is not proof that a specific dataset has been downloaded, that its license/format is suitable, or that any comparison has passed.

## 7. Tolerances

Do not choose tolerances merely to make a test pass. Derive them from:
- Source data precision and coverage.
- Kernel and ephemeris characteristics.
- Coordinate and time conversion methods.
- Algorithmic and floating-point error.
- Sampling/interpolation resolution.
- Independent reference uncertainty.

For each reference test, record both an absolute and/or relative error rule where appropriate, the physical unit, and why that tolerance is acceptable. Use angle-wrap-aware comparison for periodic quantities such as azimuth. Test near discontinuities separately; a single global tolerance can conceal boundary errors.

Until a tolerance is justified and recorded, classify the test as `Needs review` or `Blocked`, not `Pass`.

## 8. Test data and reproducibility

Keep small, legally distributable test fixtures separate from large scientific datasets. Each fixture should have:
- Stable name and test ID.
- Source and version.
- License/redistribution note when relevant.
- Checksum when practical.
- Expected-output provenance.
- A concise README or manifest.

Do not commit large kernels or DEMs to the repository by default. Document an explicit acquisition/cache strategy and avoid silently pulling mutable “latest” data during a test. Automated tests should use pinned, deterministic fixtures; scheduled checks can separately evaluate new source versions.

## 9. Execution workflow

1. **Inventory the science path.** List supported point representation, time conversion, coordinate frames, kernels, target/observer definitions, and metrics.
2. **Establish one reference case.** Choose a simple, reproducible geometry case with documented inputs and a trusted output.
3. **Add analytic synthetic tests.** Confirm axes, angle signs, units, normalization, and boundary behavior before broad integration.
4. **Record fixture provenance.** Pin versions/checksums and declare coverage.
5. **Run unit and invariant tests.** Fix deterministic convention errors first.
6. **Run reference tests.** Record error values and justify tolerances.
7. **Test service integration.** Validate request/response metadata and error cases.
8. **Test UI state integrity.** Verify selected inputs and displayed result cannot drift apart.
9. **Conduct scientific-claim review.** Review labels, limitations, and provenance.
10. **Publish evidence.** Update status tables and link logs/fixtures or test reports.

Suggested implementation cadence: begin with time/frame and a single Sun/Earth geometric vertical slice. Terrain-aware checks remain blocked until the data feasibility gate is passed.

## 10. Minimum release gate

A demo or release should not claim validated scientific comparison until all of the following are true:

- [ ] At least one end-to-end input case is reproducible from a pinned test manifest.
- [ ] Time parsing and canonical UTC handling tests pass.
- [ ] All supported coordinate transforms have reference or invariant evidence.
- [ ] Every displayed metric has a documented definition, unit, coordinate frame, and target/observer setup where relevant.
- [ ] Core calculations pass analytical and reference tests with justified tolerances.
- [ ] Missing data, unsupported coverage, and numerical failures do not produce plausible but false values.
- [ ] UI results are tied to the current point/time and expose data/calculation mode.
- [ ] Geometry-only and terrain-aware behavior are clearly differentiated.
- [ ] Earth visibility is not presented as guaranteed communications.
- [ ] Theoretical light-time is not presented as end-to-end latency.
- [ ] Candidate rankings and survival probabilities are not presented unless separately justified by validated models.
- [ ] Known limitations and unrun tests are visible in project documentation.

If terrain-aware capability is a key advertised feature, the conditional terrain tests must also pass before that claim is made. Otherwise the MVP must explicitly remain geometry-only.

## 11. Test execution record template

Copy this block for each reference or integration run and store it in the repository or CI artifacts.

```text
Test ID:
Date / reviewer:
Code commit:
Environment:
Input point:
Coordinate frame and conventions:
UTC input / normalized epoch:
Kernel/data versions and checksums:
Calculation mode:
Expected output and source:
Observed output:
Error / tolerance / rationale:
Status: Not run | Pass | Fail | Blocked | Needs review
Evidence location:
Notes / follow-up:
```

## 12. Ongoing validation and change control

Re-run relevant tests when changing:
- Kernels, ephemeris source, frame definitions, time conversion, or leap-second data.
- Coordinate transforms, angle conventions, or unit conversions.
- Sun/Earth geometry formulas or aberration settings.
- DEM source, resolution, registration, interpolation, or obstruction logic.
- Event definitions, sampling intervals, root-finding, or boundary conventions.
- Result schemas that affect timestamps, methods, units, or provenance.
- UI logic that maps scientific states to human-readable claims.

Use OpenSpec or the project’s chosen change workflow to record implementation changes and their acceptance criteria. Scientific reference fixtures and validation evidence should remain explicit artifacts; the spec workflow does not replace scientific testing.

## 13. Exit criteria for the first scientific milestone

The first milestone is complete when:
- One documented point/time case runs end to end.
- Required ephemeris/kernel/data inputs are identified and reproducible.
- The meaning of every initial metric is documented.
- At least one independent reference comparison and a set of synthetic/invariant tests have been executed.
- Tolerances have recorded rationale.
- Result provenance and error states are carried through the API to the UI.
- The scope is explicitly marked geometry-only or terrain-aware based on verified implementation.
- All tests have accurate statuses; no `Not run` item is represented as passing evidence.

This milestone establishes a trustworthy narrow slice, not full mission-site qualification.
