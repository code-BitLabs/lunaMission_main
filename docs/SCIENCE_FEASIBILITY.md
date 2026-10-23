# LunaMission — Scientific Feasibility Plan

**Status:** Investigation plan — experiments not yet run  
**Version:** 1.0  
**Last updated:** 2026-10-19  
**Owner:** LunaMission team  
**Purpose:** Prove that the first scientific outputs can be computed reproducibly, with suitable data and explicit limitations, before the team finalizes the API contract or invests heavily in the visual interface.

> **Important:** This document defines experiments and acceptance criteria. It does not claim that LunaMission's calculations have already passed validation. Replace each `Not run` status with evidence only after running the relevant experiment.

---

## 1. Executive summary

LunaMission's core scientific risk is not drawing the Moon; it is calculating and communicating Sun and Earth geometry at a lunar surface location and time without mixing coordinate frames, time representations, surface models, or levels of certainty.

The first feasibility milestone is deliberately narrow:

**Given one supported lunar surface location and one UTC timestamp, produce a reproducible result containing Sun direction/elevation, Earth direction and geometric visibility, point-to-Earth range, theoretical light-travel time, data/model provenance, and explicit quality limitations.**

The team should validate the point-in-time result first. Terrain-aware horizon analysis and time-window detection are follow-on experiments. They depend on choosing a supported terrain product, documenting its coordinate reference system and coverage, and testing the algorithm against a trusted reference.

### Current status

| Experiment | Status | Evidence required |
|---|---|---|
| Kernel availability and time coverage | Not run | Kernel manifest, coverage check, checksums, successful load log |
| UTC-to-SPICE time conversion | Not run | Round-trip test cases and supported range |
| One point: Sun/Earth geometry | Not run | Reproducible numeric result and documented frames |
| Earth range and theoretical light-time | Not run | Unit tests and independent arithmetic check |
| Geometry-only horizon classification | Not run | Above/below-horizon test cases |
| Terrain/DEM feasibility | Not run | Selected product, CRS/datum, resolution, coverage, sample extraction test |
| Reference illumination comparison | Not run | Reference scenario, aligned timestamps/resolution, difference report |
| Time-window detection | Not run | Sampling strategy and boundary/convergence tests |

No status should be changed to `Passed` merely because a calculation returns a number.

---

## 2. Questions this investigation must answer

1. Can the selected SPICE kernels represent the Moon, Earth, and Sun for the chosen UTC epochs?
2. Which exact lunar body-fixed frame and coordinate convention will be the source of truth?
3. Can a selected lunar latitude/longitude be converted into a surface position and a well-defined local vertical consistently?
4. Can the Sun's elevation and azimuth be calculated in that local frame at the selected epoch?
5. Can the direction to Earth's center, geometric horizon status, surface-point-to-Earth range, and theoretical light-time be calculated without mixing incompatible frames or correction conventions?
6. Which chosen candidate sites have a compatible lunar DEM, what area does it cover, and how is it georeferenced?
7. Can a small number of results be compared with trusted or independent reference cases?
8. What accuracy and limitations can LunaMission honestly expose in the first demo?
9. Can the result be reproduced from a versioned input scenario and pinned data/model versions?

If these cannot be answered, narrow the supported locations or output claims; do not conceal uncertainty with defaults.

---

## 3. Scientific output definitions

The API and UI should distinguish values that sound similar but mean different things.

### 3.1 Sun direction and elevation

For a selected surface point, calculate the vector from the surface point to the Sun at the documented epoch and express it in a consistent Moon-local frame.

- **Solar azimuth:** direction around the local horizon under a documented azimuth convention.
- **Solar elevation:** angle above the local tangent plane (positive above the local geometric horizon, negative below it).
- **Incidence angle:** angle between the chosen surface normal and the direction toward the Sun; for a smooth point and consistent geometry, elevation relative to that normal's tangent plane is related to incidence by `elevation = 90° − incidence`.
- **Geometric illumination:** whether the Sun's center is above the chosen ideal local horizon.
- **Terrain-aware sunlight:** whether the line of sight to the Sun is unobstructed by terrain under the selected DEM and horizon algorithm.

Do not use incidence angle, local-tangent elevation, and terrain-clear visibility as interchangeable labels. State which one is displayed.

A point can be geometrically sunlit under a simple shape model but shadowed by nearby terrain. Near the lunar poles, that distinction can be mission-significant.

### 3.2 Earth direction and visibility

Calculate the direction from the surface point toward the documented Earth target/reference point and express it in the same local frame used for the Sun.

- **Earth-center elevation:** angle of the direction to Earth's center above/below the local geometric horizon.
- **Geometric Earth-center visibility:** whether the Earth-center direction clears the ideal horizon under the selected shape model.
- **Terrain-aware Earth line of sight:** whether a ray toward the relevant Earth direction clears terrain, for locations with verified topographic support.
- **Earth-disk visibility:** a more refined model can consider Earth's apparent angular radius and partial disk obstruction. This is not equivalent to Earth-center visibility.
- **DTE window:** an interval satisfying the exact stated geometric/terrain condition. It is not proof that a radio link can operate.

**Not modeled in this initial feasibility milestone:** antenna pointing limits, transmitter/receiver characteristics, RF frequency, transmit power, gain, polarization, atmospheric/ionospheric effects, operational constraints, and a full link budget.

### 3.3 Range and theoretical light-travel time

Define the target clearly. The initial simple result may be the instantaneous geometric distance from the lunar surface point to Earth's center at the selected epoch:

`range_km = norm(earth_center_position_km − lunar_surface_point_position_km)`

For that declared range:

`t_one_way_seconds = range_km × 1000 / c_m_per_s`

`t_round_trip_seconds ≈ 2 × t_one_way_seconds`

Use an exact, documented value of the speed of light and consistent units in implementation. The round-trip formula is a simple approximation for a path to and back over comparable distances, not an operational latency prediction.

These are **theoretical vacuum light-travel times derived from the declared geometric distance**, not web/network latency, not the total delay of a mission communication system, and not proof of link availability.

Do not silently mix an instantaneous geometric range with an apparent/light-time-corrected position. If an apparent geometry model is ever used, document its aberration corrections and define how the displayed range and time are computed.

### 3.4 Mission suitability

Suitability is not a core science output until a mission profile and explicit constraints have been defined. If implemented later, use explanatory statuses such as `favorable_under_constraints`, `conditional`, `constraint_failed`, and `insufficient_data`. Do not publish a survival probability or safety percentage without a validated probabilistic model and supporting evidence.

---

## 4. Proposed scientific computation approach

This is the candidate approach to test, not a final implementation specification.

1. **Normalize and validate input.** Accept a canonical UTC timestamp, latitude, and longitude. Validate ranges and require the latitude/longitude convention and coordinate frame to be explicit.
2. **Convert time for SPICE.** Load the required leapseconds kernel (LSK) and convert the UTC representation to the ephemeris time representation expected by the selected SPICE routines. Record kernel identifiers and the resulting time convention.
3. **Resolve the surface point.** Convert the input coordinates to a body-fixed lunar position using the chosen reference shape or an explicitly selected terrain surface. Never assume one coordinate convention without declaring it.
4. **Compute Sun and Earth vectors.** Get the relevant target states at the requested epoch; transform position vectors into a common, documented Moon-fixed frame before subtracting the lunar surface position.
5. **Compute local angles.** Derive local vertical, east/north or equivalent tangent directions, and use one documented azimuth convention. Check signs and quadrants with synthetic cases.
6. **Compute range/light-time.** Calculate the declared point-to-Earth-target distance and derive theoretical light-time from that distance and the speed of light.
7. **Classify visibility.** Initially compute geometry-only horizon status. Treat terrain obstruction as unavailable until the DEM and terrain algorithm pass their own tests.
8. **Return a typed result.** Include inputs, units, frames, target definitions, correction assumptions, data/model identifiers, quality flags, and explicit unavailable states.
9. **Validate independently.** Compare against trusted reference data or an independent calculation, record discrepancies and tolerances, and only then expose the output as validated.

Potential SPICE routines and documents include time conversion (`str2et`/`utc2et` family), vector and frame transformation routines, and illumination geometry routines. Select the exact functions after the experiment's geometry definitions are settled. The NAIF `illumf` documentation describes illumination angles and visibility/illumination flags using either a reference ellipsoid or DSK topography; its model assumptions and restrictions must be checked before treating it as a terrain solution. [NAIF `illumf_c`](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/illumf_c.html)

---

## 5. Kernel and ephemeris investigation

### 5.1 SPICE kernel roles to investigate

The exact set depends on the chosen ephemeris coverage and frame/model requirements. Do not download an arbitrary collection of kernels and assume it is sufficient.

| Kernel type | Why it may be needed | Investigation task |
|---|---|---|
| LSK — leapseconds | Converts UTC representations to SPICE ephemeris time | Confirm current chosen LSK loads and test conversion |
| SPK — ephemeris | Positions of Earth, Moon, and Sun over a time interval | Verify each required target and requested epoch are covered |
| PCK — planetary constants/orientation/shape | Body orientation and reference shape; may be text or binary | Confirm the selected Moon frame and radii/shape assumptions |
| FK — frame definitions | Defines frames not otherwise built in | Load if required by the selected data products or custom frames |
| DSK — digital shape/topography | Detailed shape models for SPICE routines that use DSK data | Optional; do not assume a raster DEM is automatically a DSK |
| Meta-kernel | Reproducible list of kernels loaded together | Create a versioned manifest/meta-kernel for the chosen data set |

### 5.2 Required checks

- [ ] Record each kernel's source, filename, version/date, coverage, checksum, and purpose.
- [ ] Confirm the files load in one documented process and are compatible.
- [ ] Confirm Earth, Moon, and Sun IDs/target names resolve as expected with the loaded data.
- [ ] Verify the chosen frame exists and transformations are available over the time range.
- [ ] Verify ephemeris coverage at the test epochs and at both ends of the proposed supported interval.
- [ ] Record the selected SPICE Toolkit and SPICEyPy versions.
- [ ] Capture missing-kernel, unavailable-frame, and out-of-coverage behavior as explicit errors.
- [ ] Do not load or replace kernel sets invisibly at runtime. Record precedence and competing data choices when applicable.

NAIF recommends understanding kernel types, kernel management, frames, and time conversion before building scientific geometry on top of SPICE. A meta-kernel is a useful way to make the loaded kernel set reproducible.

Useful documentation:
- [NAIF SPICE tutorials](https://naif.jpl.nasa.gov/naif/tutorials.html)
- [NAIF kernel required reading](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/kernel.html)
- [NAIF frames required reading](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/frames.html)
- [NAIF time required reading](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/time.html)
- [SPICEyPy documentation](https://spiceypy.readthedocs.io/en/latest/documentation.html)

---

## 6. Time and coordinate conventions

These choices must be written down in the experiment report before results are accepted.

### 6.1 Time

- Public/API scenario input: ISO-8601 UTC timestamp, including `Z` or an explicit UTC offset that is normalized to UTC.
- Internal scientific epoch: the representation required by the selected SPICE routine, with UTC-to-ephemeris conversion performed using loaded and recorded time data.
- All compared locations in one comparison must use the same epoch and compatible calculation settings.
- Record the accepted time range; reject dates outside kernel/data coverage.
- Test timestamps around day/month/year boundaries, fractional seconds if supported, malformed values, explicit offsets, and leap-second-related conversion behavior.
- The UI may display local time for convenience, but stored scenario timestamps and API contracts remain canonical UTC.

Important terminology: SPICE documentation distinguishes a UTC time representation from dynamical time systems such as TDB/ET. Do not treat the string format by itself as the complete time model.

### 6.2 Lunar coordinates and frames

The team must explicitly choose and test:

- Latitude type: planetocentric or planetographic.
- Longitude convention: east-positive or west-positive, with allowed range.
- Body-fixed reference frame used for the lunar surface point.
- Shape model/reference ellipsoid used to map latitude/longitude to 3D.
- Inertial frame and aberration/correction settings used when obtaining ephemeris vectors.
- Local tangent basis and azimuth convention.
- For terrain products: projected CRS, map units, lunar reference radius/datum, axis directions, pixel registration, and nodata representation.

Do not guess these values from a visualization texture. They must come from the source product metadata and the selected SPICE setup.

### 6.3 Frame validation

Use a small explicit test matrix:

- [ ] Equator and prime-meridian point.
- [ ] Longitude wrap values (for example, equivalent values at the wrap boundary).
- [ ] Near north and south poles.
- [ ] Known landmark/site coordinates from a documented source.
- [ ] Same instant transformed through each chosen frame path.
- [ ] Check that every vector subtraction uses the same frame and compatible origin/epoch.
- [ ] Verify a surface point has the expected magnitude/radius under the selected shape model.
- [ ] Verify the local normal and azimuth axes are consistent at the poles and across longitude wrap.

A test that merely shows the clicked marker visually “looks close” is not sufficient.

---

## 7. Terrain and illumination data feasibility

### 7.1 A DEM is not just a texture

Terrain-aware illumination and horizon obstruction require elevation/topographic data and a validated calculation pipeline. A rendered global albedo/imagery texture is not a DEM.

For each candidate DEM product, record:

- Product identifier, source, version, citation, and usage terms.
- Spatial coverage and actual coverage of each proposed test site.
- Projection/CRS, coordinate frame/datum, axes, units, pixel registration, and nodata encoding.
- Pixel size/nominal resolution and any resampling or interpolation.
- Vertical accuracy/uncertainty information where available.
- Data preprocessing and checksum.
- Known holes, edges, seams, artifacts, and limitations.

High nominal resolution does not guarantee that the product covers the entire candidate site or has the needed accuracy for a near-horizon classification.

### 7.2 Candidate source products

These are candidates to inspect, not yet selected dependencies:

1. **NASA/GSFC South Pole LOLA DEM resources.** The PGDA/LOLA site lists site-specific south-pole topographic products and a broader south-pole mosaic. Its site-specific high-resolution collection describes selected sites and reports 5 m/pixel GeoTIFF products with south polar stereographic X/Y coordinates in meters and a `MOON_ME` reference frame tied to DE421. That metadata applies to those products; do not generalize it to every LOLA file. Inspect the exact selected product's README and metadata before use.  
   - [South Pole Landing Site LOLA DEMs](https://core2.gsfc.nasa.gov/PGDA/LOLA_5mpp/)
   - [NASA PDS Geosciences Node — LRO LOLA](https://pds-geosciences.wustl.edu/missions/lro/lola.htm)
   - [PDS LOLA GDR dataset profile](https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-LOLA-4-GDR-V1.0)

2. **NASA Scientific Visualization Studio south-pole illumination product.** NASA SVS publishes a south-pole sunlight/shadow product covering the region south of 80°S; the page describes a 2026 sequence at two-hour intervals over a year. This can be useful for qualitative checks and choosing test intervals. It is not automatically an exact numeric ground-truth source for arbitrary coordinates or times: confirm the product's metadata, terrain, projection, time sampling, and rendering assumptions before comparison.  
   - [NASA SVS — Illumination at the Moon's South Pole to 80°S, 2025 to 2028](https://svs.gsfc.nasa.gov/5027)

3. **NASA Planetary Data System.** Use the PDS product documentation/Software Interface Specification to understand product fields and coverage. Do not rely only on an overview page.  
   - [NASA PDS](https://pds.nasa.gov/)
   - [PDS Geosciences Node — LOLA data and product documentation](https://pds-geosciences.wustl.edu/missions/lro/lola.htm)

### 7.3 Terrain algorithm to prove

Start with a *single point and a narrow local DEM window*.

- [ ] Load the selected DEM and verify metadata/CRS.
- [ ] Transform the test site's coordinates into DEM map coordinates using a documented transformation.
- [ ] Extract elevation values around the point and check nodata/edge behavior.
- [ ] Convert terrain samples to a local coordinate system that respects the Moon's curvature over the window.
- [ ] Build an azimuth-dependent terrain horizon profile or use an independently justified ray/horizon method.
- [ ] Test Sun-ray obstruction for a set of known azimuth/elevation pairs.
- [ ] Test Earth direction visibility using a clearly defined target model; do not treat a single direction as full-disk visibility.
- [ ] Compare at least one terrain-aware case with a trusted reference or an independent implementation.
- [ ] Quantify the effect of DEM resolution, sampling interval, interpolation, and near-horizon tolerance.

**If the team cannot validate this path in time, ship the geometry-only output with a clear label.** Do not imply that terrain obstruction has been evaluated.

---

## 8. Minimal experiment plan

### Experiment A — Kernel/time readiness

**Input:** one candidate UTC timestamp and a documented kernel manifest.  
**Procedure:** load the manifest, confirm required bodies/frames resolve, convert UTC to the internal epoch, and check coverage.  
**Output:** kernel manifest, load result, time conversion result, supported interval, and failure modes.  
**Pass criteria:** deterministic load and conversion; explicit errors for missing kernels and unsupported coverage.

### Experiment B — Point geometry

**Input:** one documented lunar location and one UTC timestamp, fixed coordinate/frame conventions.  
**Procedure:** map the location to a surface point; calculate Sun and Earth direction vectors; transform them into one Moon-local frame; calculate local directions/elevations and point-to-Earth-center range.  
**Output:** a JSON fixture with input, timestamp, frames, target/reference-point definitions, vectors/angles, range, method, and provenance.  
**Pass criteria:** repeatable results; frame/units tests pass; the independent reference or sanity case is documented. Do not accept a number without the reference comparison.

### Experiment C — Light-travel time

**Input:** range value with explicit units/reference definition.  
**Procedure:** derive one-way and approximate round-trip vacuum light-time.  
**Output:** seconds and conversion-test evidence.  
**Pass criteria:** unit tests catch kilometer/meter mistakes; one-way result equals documented range divided by `c`; round-trip result equals twice that approximation.

### Experiment D — Geometry-only horizon visibility

**Input:** point plus Sun/Earth direction and selected reference-shape normal.  
**Procedure:** compute the direction elevation relative to the local tangent horizon; classify above/below horizon using a documented tolerance.  
**Output:** signed elevation, threshold, and classification.  
**Pass criteria:** constructed above/below/at-threshold cases work; azimuth/quadrant and polar edge cases are covered. Label this `geometry_only`.

### Experiment E — Terrain feasibility

**Input:** one point covered by a selected DEM plus local direction(s).  
**Procedure:** verify the data, compute the local terrain horizon/obstruction, and compare to geometry-only status.  
**Output:** DEM manifest entry, coverage evidence, algorithm version, comparison case, and uncertainty/limitations.  
**Pass criteria:** data mapping and nodata tests pass; at least one independently checked case; discrepancies are recorded. If this fails, terrain-aware capability remains unsupported.

### Experiment F — Timeline/window feasibility

**Input:** a supported point, interval, and sampling settings.  
**Procedure:** sample Sun/Earth conditions, detect candidate crossings, and refine around transitions where feasible.  
**Output:** intervals, sample step, boundary-refinement method, and confidence/limitations.  
**Pass criteria:** boundary tests pass and changing sample step is shown not to materially miss or shift target windows beyond a documented tolerance. If short windows cannot be resolved, show the sampling limitation rather than claiming exact windows.

---

## 9. Validation matrix

| ID | Test | Expected behavior | Status |
|---|---|---|---|
| V-001 | Valid UTC timestamp within supported coverage | Converts using the selected LSK and supported SPICE time conversion | Not run |
| V-002 | Timestamp outside kernel coverage | Explicit unsupported/out-of-coverage error | Not run |
| V-003 | Missing or invalid kernel | Clear startup/computation error; no stale or fabricated result | Not run |
| V-004 | Wrong/unavailable frame | Fail explicitly; never silently substitute a different frame | Not run |
| V-005 | Latitude/longitude bounds and wrap | Accepted/rejected according to documented coordinate convention | Not run |
| V-006 | Frame consistency | Vectors combined only after transformation to compatible frame/origin/epoch | Not run |
| V-007 | Sun above/below local tangent horizon | Signed elevation and classification match synthetic test geometry | Not run |
| V-008 | Terrain blocks a geometrically visible Sun | Geometry-only and terrain-aware results differ where the validated DEM supports the case | Not run |
| V-009 | Earth-center horizon boundary | Visibility classification follows documented sign/tolerance convention | Not run |
| V-010 | Earth range/light-time units | Range and times consistent with the formula and explicit target definition | Not run |
| V-011 | Missing DEM or uncovered location | Terrain-aware metric reports unsupported/insufficient data | Not run |
| V-012 | DEM edge/nodata pixel | Clear quality state or error; never silently treat missing elevation as zero | Not run |
| V-013 | Different timeline sampling steps | Differences measured and recorded; transitions refined or limitations stated | Not run |
| V-014 | Same scenario re-run with same versions | Results reproduce within documented numeric tolerance | Not run |
| V-015 | Comparison across locations | Same UTC epoch/settings; each value has its own provenance and quality state | Not run |

---

## 10. Result and provenance contract

The first scientific result should be serializable and reproducible. Exact API field names belong in `API_CONTRACTS.md`, but the result should contain these concepts:

```json
{
  "scenario": {
    "latitude_deg": null,
    "longitude_deg": null,
    "latitude_convention": "UNSET",
    "longitude_convention": "UNSET",
    "utc": "UNSET",
    "surface_model": "UNSET",
    "frame": "UNSET"
  },
  "methods": {
    "geometry": "UNSET",
    "visibility": "geometry_only",
    "aberration_correction": "UNSET"
  },
  "metrics": {
    "sun_elevation_deg": null,
    "sun_azimuth_deg": null,
    "earth_center_elevation_deg": null,
    "earth_range_km": null,
    "one_way_light_time_s": null,
    "round_trip_light_time_s_approx": null
  },
  "quality": {
    "status": "not_evaluated",
    "flags": [],
    "limitations": []
  },
  "provenance": {
    "spice_toolkit_version": null,
    "spiceypy_version": null,
    "kernel_manifest_id": null,
    "kernel_checksums": {},
    "dem_product_id": null,
    "algorithm_version": null
  }
}
```

The `null` and `UNSET` values above are placeholders for a schema example, **not computed results**. Final types should use enums/unions or structured missing-data reasons rather than overloading strings once API contracts are written.

Minimum quality states to consider: `validated`, `computed_unvalidated`, `geometry_only`, `estimated`, `insufficient_data`, `unsupported`, and `error`. Do not use `validated` until a declared validation method and tolerance have passed.

---

## 11. Definition of done for the first science milestone

The milestone is complete only when all required evidence below is checked off.

- [ ] A specific site and UTC test epoch are selected and cited.
- [ ] Coordinate convention, frame, surface model, and target/reference point are documented.
- [ ] Required SPICE kernel manifest is versioned and checksummed.
- [ ] Kernel loading, frame availability, time conversion, and coverage checks pass.
- [ ] Sun/Earth vectors and local angles have unit tests.
- [ ] Earth range and theoretical light-time units have tests.
- [ ] A trusted reference or independent sanity case is compared and discrepancies explained.
- [ ] Numeric tolerance is defined and justified instead of chosen after seeing results.
- [ ] Missing data and out-of-coverage cases fail explicitly.
- [ ] All data/model versions and assumptions needed to reproduce the result are recorded.
- [ ] The `SCIENCE_FEASIBILITY.md` status table is updated with evidence links and real outcomes.

A passing test suite is necessary, but tests based on the implementation's own output alone do not establish scientific correctness. At least one independent reference or independently derived case is required.

---

## 12. Python service implications

The team's intended architecture is Next.js + Hono as the main application and public API, with Python for specialized scientific work where needed.

For this spike:

- Keep scientific calculations in a small Python module first; do not require a deployed service just to prove local mathematics.
- Once the input/output contract is clear, expose the computation behind a small Python API only if isolation, dependencies, runtime, or deployment needs justify it.
- Hono remains the public API boundary. The browser should not call the Python service directly.
- Return structured errors for missing kernels, unknown frames, invalid time, and unsupported site/terrain coverage.
- If the result is passed between TypeScript and Python, pin a canonical schema and test both implementations against the same fixture.

This keeps the science experiment independent from Next.js integration and avoids making an unproven network boundary part of the first scientific test.

---

## 13. External references

Use the source documentation and exact product metadata; an overview page does not replace the selected data product's specification.

1. **NAIF SPICE Tutorials** — concepts, kernels, time, frames, SPK/PCK and observation geometry:  
   https://naif.jpl.nasa.gov/naif/tutorials.html
2. **NAIF Kernel Required Reading** — kernel types, loading, kernel management and meta-kernels:  
   https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/kernel.html
3. **NAIF Frames Required Reading** — frame relationships and transformations:  
   https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/frames.html
4. **NAIF Time Required Reading** — UTC representation and conversion to SPICE time:  
   https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/time.html
5. **NAIF `illumf_c`** — illumination angles and visibility/illumination flags with ellipsoid or DSK shape model:  
   https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/illumf_c.html
6. **NAIF Geometry Finder Required Reading** — finding intervals where geometric conditions hold; relevant if the team later uses SPICE window searches:  
   https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/gf.html
7. **SPICEyPy documentation** — Python wrapper and kernel management:  
   https://spiceypy.readthedocs.io/en/latest/documentation.html
8. **NASA/GSFC South Pole Landing Site LOLA DEMs** — candidate high-resolution terrain products at selected south-pole sites:  
   https://core2.gsfc.nasa.gov/PGDA/LOLA_5mpp/
9. **NASA PDS Geosciences Node — LRO LOLA** — LOLA products and supporting documentation:  
   https://pds-geosciences.wustl.edu/missions/lro/lola.htm
10. **NASA PDS LOLA GDR dataset profile** — raster DEM products and metadata description:  
    https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-LOLA-4-GDR-V1.0
11. **NASA SVS — Illumination at the Moon's South Pole to 80°S, 2025–2028** — candidate qualitative reference for south-pole lighting; verify time sampling and product assumptions before quantitative comparison:  
    https://svs.gsfc.nasa.gov/5027

---

## 14. Immediate owner checklist

Before starting the first experiment, assign owners for these items:

- [ ] **Science owner:** choose the first reference site/time and document the physical quantities to compute.
- [ ] **Data owner:** find and record kernel products, source links, versions, checksums, and coverage.
- [ ] **Validation reviewer:** select a reference/sanity case independent of the implementation and propose tolerances.
- [ ] **Integration owner:** keep the result fixture compatible with the future TypeScript/Python API contract.
- [ ] **Demo owner:** ensure the selected reference site is usable in the intended visual experience.

The first deliverable is not a broad science engine. It is a small, reproducible, independently checked result with explicit assumptions.

**Next document after the experiment begins:** `API_CONTRACTS.md`, based on the proven inputs, outputs, and failure states.
