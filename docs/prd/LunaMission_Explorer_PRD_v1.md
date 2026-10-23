# LunaMission Explorer — Product Requirements & Delivery Plan

**Document type:** Product Requirements Document (PRD) + implementation blueprint  
**Version:** 1.0 — planning baseline, to be reviewed by the team  
**Prepared:** 19 October 2026  
**Target event:** NASA Space Apps Challenge 2026  
**Challenge:** CLPS Lunar Mission Browser  
**Working product name:** LunaMission Explorer  
**Status:** Proposed; science/data assumptions must be validated before claims are presented as results

> **Purpose of this document**  
> This is the team's source of truth for what we will build, why we will build it, what we will deliberately not build in the hackathon, how the science will be represented, how the system will be structured, how we will validate it, and how we will demonstrate its value.

---

## 0. Decisions at a glance

1. **Product, not game:** Build a mission-planning decision-support browser, not a lunar landing game and not a full spacecraft-flight simulator.
2. **Challenge first:** Prioritize lunar south-pole landing-site and date comparison, especially local Sun geometry, potential illumination/power opportunity, Earth visibility, and direct-to-Earth (DTE) communication windows.
3. **One compelling end-to-end workflow:** Select a supported site, choose a time/date range, inspect Sun/Earth relative to the local horizon, compare candidates, understand constraints, and export/share the evidence.
4. **3D is a navigation and explanation surface:** A 3D Moon can make site selection intuitive, but 3D polish must not displace correct calculations, useful comparisons, and transparent data quality.
5. **One source of scientific truth:** Scientific values are computed in a tested backend/domain module. Frontend animation and textures are not scientific data.
6. **Honest precision:** Every output is labelled as calculated, terrain-aware, geometry-only, estimated, unavailable, or not assessed. Missing information never becomes zero risk or “safe.”
7. **Modular monolith:** Start with one web app and one API/codebase boundary, with isolated domain modules. Do not create multiple deployed microservices for a hackathon.
8. **Trajectory, propellant, and mission cost are out of MVP:** A later extension may estimate transfer time, arrival conditions, Δv, and propellant for a defined vehicle/model. Landing-site visibility is not arrival trajectory planning; light-travel time is not spacecraft travel time.
9. **Win through proof, not feature count:** Demonstrate NASA data used meaningfully, at least one reproducible scientific case, a useful trade-off between sites or times, and a polished, understandable story.
10. **No guaranteed win:** The plan is designed to strengthen relevance, validity, creativity, usability, and presentation. Judging results cannot be guaranteed.

## 1. Challenge interpretation

### 1.1 Challenge statement

The challenge describes difficult lighting and communication conditions at the Moon's south pole. Existing tools can determine Sun and Earth positions at candidate landing sites, but complicated interfaces make the information slow to evaluate. The requested solution is an intuitive tool/application that lets mission planners, educators, and the public compare landing sites and dates by visualizing Sun and Earth positions relative to the horizon, so they can assess power-generation potential and direct-to-Earth communication windows.

### 1.2 The actual problem we solve

**Users need to answer, quickly and with evidence: “At this lunar location, during this time window, what are the Sun-lighting opportunities and the direct-to-Earth visibility opportunities—and how does that compare with another location or date?”**

The application turns scattered scientific information into a coherent and explainable decision workflow.

### 1.3 What “mission” means in this challenge

A lunar mission may carry a robotic lander, rover, payload, or other spacecraft system. The core challenge is not asking ordinary people to book a trip to the Moon. It is helping people understand the surface conditions and compare candidate places/times relevant to a planned mission.

The challenge does not require a full launch simulator, orbital trajectory optimizer, rocket design tool, fuel calculator, or trip-cost estimator. These are possible later extensions only if the core experience is already sound and a credible supported model can be implemented.

### 1.4 What the keywords mean

- **Landing site:** A candidate surface location or region where a lander might touch down. A single clicked point is not the same as a validated landing ellipse.
- **Local horizon:** The apparent skyline around a selected surface point. Nearby terrain can hide the Sun or Earth even when a simple geometric calculation says the body is above an ideal flat horizon.
- **Power-generation potential:** Evidence about illumination and sunlight availability that can help evaluate solar-power opportunity. It is not an energy guarantee unless panel, battery, orientation, efficiency, and load are modelled.
- **DTE (direct-to-Earth):** A possible direct line of sight between the lunar asset and Earth infrastructure. Earth visibility does not alone prove that a radio link will work.
- **Communication window:** A time interval during which a defined visibility condition is satisfied. It is not automatically a guaranteed operational communication link.
- **Educators:** Teachers, science communicators, and people helping learners explore how space/environmental conditions change with location and time.

### 1.5 Product vision

**Make lunar south-pole lighting and communication trade-offs understandable in minutes instead of forcing users to combine several specialist tools manually.**

### 1.6 Product positioning

LunaMission Explorer is an evidence-led browser for exploring, explaining, and comparing supported lunar landing-site candidates and time windows.

It is not positioned as:
- a game or entertainment-only 3D simulation;
- a substitute for a flight-qualified mission-design system;
- an official NASA recommendation or certification of a landing site;
- a fully validated survival-probability engine;
- a promise that a radio link or solar power system will operate successfully.

## 2. Product goals and non-goals

### 2.1 Goals

**G1 — Fast comprehension:** A new user can select a site and understand its Sun/Earth conditions without reading technical documentation first.

**G2 — Fair comparison:** A user can compare at least two and ideally up to four locations with the same UTC epoch, thresholds, and model settings.

**G3 — Time-aware results:** Changing the selected time updates all time-dependent results together and does not display stale metrics.

**G4 — Scientific traceability:** The user can see data source, coordinate convention, model type, terrain coverage/resolution, and known limitations.

**G5 — Useful decision support:** The app turns raw measurements into interpretable windows, durations, blackouts, and explicitly defined constraint outcomes.

**G6 — Accessible public experience:** The interface works for technical users, educators, and the general public, using progressive disclosure and plain-language explanations.

**G7 — Hackathon reliability:** The core demo works from a repeatable scenario even if live data downloads or external services are unavailable.

### 2.2 Non-goals for the hackathon MVP

- Full Earth-to-Moon transfer optimization.
- Accurate spacecraft fuel or dollar-cost estimation.
- Certifying the “best” landing site for NASA or any mission.
- Claiming full high-resolution terrain coverage across the whole Moon.
- General human habitability or guaranteed survival probability.
- Full RF link budget, antenna model, ground-station handover, or network operations model.
- Full thermal/radiation/meteoroid/dust hazard model without credible time/location data and validated calculations.
- Accounts, user profiles, social feeds, or a general-purpose mission management platform.
- A distributed microservice architecture.
- AI-generated scientific calculations.

### 2.3 Product principles

1. **A visible metric must have a defined meaning.**
2. **A missing value is not zero.**
3. **Compare like with like.** Same epoch and same assumptions by default.
4. **Prefer a smaller correct workflow to a larger fictional one.**
5. **Every recommendation explains its constraints.**
6. **Keep scientific logic out of view components.**
7. **Show confidence and coverage at the point where users need them.**

## 3. Target users and user needs

| User | Main question | Product response |
|---|---|---|
| Mission planner / engineer | Which candidate site/time satisfies my lighting and DTE constraints? | Compare table, timelines, thresholds, limiting-factor explanation, exportable evidence. |
| Science / engineering educator | How do location and time alter lunar lighting and Earth visibility? | Visual horizon view, time slider, plain-language definitions, shareable scenarios. |
| Interested public user | What would conditions be like at this place on the Moon? | Simple Point Passport with explainers and clear uncertainty labels. |
| Hackathon judge / evaluator | Does this genuinely solve the challenge and use data credibly? | One clear demo workflow, citations, reproducible case, tests, visible limits. |

### 3.1 Primary persona: Mission analyst

- Has several candidate south-pole sites.
- Needs to evaluate illumination and Earth visibility over a specified date range.
- Wants to compare sites without manually switching between separate tools.
- Needs units, provenance, assumptions, and exportable evidence.

### 3.2 Secondary persona: Educator

- Wants to demonstrate why the same place changes over time and why terrain matters.
- Needs plain-language definitions, a visual horizon, and a repeatable view that can be shared with learners.

### 3.3 Secondary persona: Public explorer

- Wants to click a location, choose a date, and see an understandable summary.
- Should not need to know SPICE, DEM, ephemeris, coordinate frames, or link budgets to get started.

## 4. Key user journeys

### Journey A — Inspect a candidate site

1. Open the application and see a lunar globe/map centred on the south-pole region.
2. Select a supported site marker or click a covered point.
3. See the point's coordinates and data-coverage state.
4. Choose a UTC time.
5. Inspect the local-horizon diagram and Sun/Earth metrics.
6. Read concise explanations of what is calculated and what is not assessed.

**Success:** The user can state whether the Sun is geometrically above the horizon, whether terrain occlusion was evaluated, and whether Earth is geometrically/terrain-clear visible under the selected model.

### Journey B — Compare sites and dates

1. Add Site A and Site B to a comparison tray.
2. Select a common UTC epoch or a date range.
3. Review side-by-side Sun elevation/illumination, DTE visibility, longest dark interval, longest DTE blackout, and data quality.
4. Switch to a timeline to inspect windows and gaps.
5. See metric deltas and constraint failures with explanations.
6. Export a report or copy a shareable scenario link.

**Success:** The user understands the trade-offs and can reproduce the comparison.

### Journey C — Evaluate a mission profile (stretch)

1. Choose a simple profile such as “solar-powered lander” or “communications-sensitive payload.”
2. Review the explicit thresholds required by that profile.
3. Evaluate a selected site over a defined interval.
4. Receive “Favorable under selected constraints,” “Conditional,” “Constraint failure,” or “Insufficient data,” plus per-factor reasoning.

**Success:** The status is traceable to actual inputs and does not masquerade as a survival probability.

### Journey D — Arrival planning (out of MVP)

A later release can accept a departure window, target, spacecraft state, mission architecture, propulsion data, and solver configuration. It can then return an arrival estimate and recompute local conditions at the estimated arrival epoch. This is not part of the hackathon commitment.

## 5. Product experience and UX specification

### 5.1 Design direction

Use a calm, mission-control / scientific visualization aesthetic rather than a game HUD. The interface should feel precise, credible, and easy to navigate.

- Deep neutral background for the space scene.
- High-contrast text and simple card hierarchy.
- A restrained colour language: sunlight/illumination, Earth/DTE, selected site, warning/unknown.
- Never rely on colour alone; add labels, icons, patterns, and text.
- Keep the Moon visualization visually impressive but secondary to the scientific answer.
- Use responsive layouts; the primary demo target is desktop, but core information must remain usable on smaller screens.

### 5.2 Information architecture

**Primary navigation:** Explore · Compare · Learn / Evidence

**Explore view:**
- Main lunar globe/map with south-pole focus and candidate markers.
- Selected-site header and coordinate display.
- UTC time/date control.
- Compact Sun/Earth status cards.
- “Inspect local horizon” action.
- Coverage and provenance badge.

**Point Passport drawer/panel:**
- Location: label, latitude/longitude, coordinate convention, terrain coverage.
- Time: selected UTC epoch.
- Sun: azimuth/elevation, geometric state, terrain-aware state where available, next illumination transitions when supported.
- Earth/DTE: Earth elevation, visibility state, source/target definition, theoretical point-to-Earth light time as secondary context.
- Evidence: data products, model version, assumptions, limitations.

**Local Horizon view:**
- 2D horizon/azimuth-elevation plot or clear cross-section.
- Sun direction indicator.
- Earth direction/disk indicator when supported.
- Terrain skyline where DEM coverage exists.
- Explicitly state when the horizon is geometry-only rather than terrain-derived.

**Compare view:**
- A table or aligned cards for 2–4 sites.
- A shared timestamp and shared assumptions.
- Consistent units and metric definitions.
- Highlight differences, not just absolute values.
- Missing/unknown data visible as a state, not hidden.

**Timeline view:**
- Chosen interval with sunlit/dark, Sun elevation, and DTE visibility lanes.
- Window start/end and duration.
- Longest continuous dark interval and longest DTE blackout.
- Sampling step and any threshold shown.

**Learn / Evidence view:**
- Short definitions and “why this matters” explanations.
- Source links and model details.
- An “assumptions and limits” section.
- Export/share controls.

### 5.3 Visual content requirements

- A 3D globe is recommended for intuitive discovery but is not itself the product's scientific value.
- Show a clearly marked selected location and stable coordinates.
- Where possible, show Sun/Earth directions relative to a *local* horizon, not only a global orbit graphic.
- Do not infer elevation from a visual texture.
- Do not use fake live-looking values. Sample data must be labelled “illustrative,” and the demo should prefer the real validated scenario.
- Every chart should identify units, time zone, selected epoch/range, and data/model mode.

### 5.4 Interaction rules

- UTC is the canonical calculation time. Local time can be displayed additionally but must not replace UTC in the science contract.
- All time-dependent panels update from the same request/response version.
- If a new time is selected while a request is pending, cancel or supersede the previous request; never allow an old response to overwrite the new state.
- Keep selected sites in the comparison tray when the camera rotates or the view changes.
- Show loading, error, unsupported-time, and insufficient-data states explicitly.
- Candidate site selection and time selection should be keyboard accessible where feasible.

## 6. Functional requirements

Priorities: **MUST** = required for a credible challenge-aligned MVP; **SHOULD** = valuable if time/data support it; **COULD** = stretch; **WON'T** = explicitly out of scope for this event.

### FR-01 — Lunar overview (MUST)
The application renders an interactive lunar overview that users can rotate/zoom or navigate and that prioritizes the south-pole candidate region.

**Acceptance:**
- User can orient the view and reset it.
- Candidate sites are visually identifiable and selectable.
- The current selected site remains selected when the camera changes.
- If a 3D engine proves too time-consuming, a high-quality 2D map/local-horizon experience is acceptable so long as the challenge's scientific comparison is stronger than the globe itself.

### FR-02 — Site selection and coordinates (MUST)
The user can choose a supported site and view its coordinates and coordinate convention.

**Acceptance:**
- Selection is stable and repeatable.
- Selected coordinates are displayed with units/sign convention.
- Unsupported or out-of-coverage points are not silently analysed as terrain-aware.
- Clicking a generic globe point can be supported, but initial terrain-aware analysis must be limited to verified coverage.

### FR-03 — Time control (MUST)
The user can set a UTC instant for point inspection and a UTC interval for timeline comparison when the timeline feature is enabled.

**Acceptance:**
- Selected UTC time is always visible.
- All time-dependent metrics correspond to that epoch/interval.
- Invalid or unsupported time ranges return a clear error.
- Request ordering/cancellation prevents stale results.

### FR-04 — Sun geometry and illumination (MUST)
The application reports Sun direction/elevation and distinguishes geometric illumination from terrain-obstructed illumination where terrain data support it.

**Acceptance:**
- Units are degrees.
- Geometric “Sun above ideal horizon” and terrain-aware “surface receives direct sunlight” are distinguishable.
- A missing terrain layer produces “terrain assessment unavailable” or geometry-only labelling, not an assumed clear sky.

### FR-05 — Earth direction and DTE visibility (MUST)
The application reports Earth direction/elevation and a clearly defined direct visibility state. Terrain-aware DTE obstruction is included where supported.

**Acceptance:**
- Output labels whether it is Earth-centre geometry, Earth-disc geometry, or terrain-aware line of sight.
- Threshold and horizon model are visible.
- “Earth visible” is not labelled as “radio link guaranteed.”

### FR-06 — Point Passport (MUST)
All selected-point metrics are presented in a consistent profile.

**Acceptance:**
- Every metric includes units, selected epoch, model/data mode, and relevant quality status.
- A single Point Passport never mixes different site IDs or epochs.
- “Not available” and “not assessed” are different states.

### FR-07 — Multi-site comparison (MUST)
Users can compare at least two, ideally 2–4, sites with shared assumptions.

**Acceptance:**
- Comparison uses the same UTC epoch and shared thresholds by default.
- Metrics have consistent definitions and units.
- Differences/deltas are highlighted.
- Coverage and model differences are made visible.
- If a metric is missing for one site, the comparison says why rather than dropping the metric silently.

### FR-08 — Date-range windows (SHOULD; high-value differentiator)
The application plots sunlight and DTE visibility windows over a selected interval.

**Acceptance:**
- Window start/end and duration can be inspected.
- Longest continuous darkness and longest DTE blackout are reported when the sampling/model supports them.
- Sampling step and visibility threshold are shown.
- Window boundaries are refined or clearly bounded by the sampling interval.

### FR-09 — Data coverage and provenance (MUST)
The application discloses which source products and models support a result.

**Acceptance:**
- Site/metric response includes data coverage and source references.
- Terrain resolution/product ID is shown when terrain data are used.
- SPICE kernel/model version and applicable time range are recorded for scientific results.
- Unsupported regions and time gaps are explicit.

### FR-10 — Scenario export and share (SHOULD)
Users can export a comparison (CSV/JSON) and reopen a scenario via URL/file.

**Acceptance:**
- Export includes coordinates, epoch/interval, metrics, units, thresholds, data/model identifiers, and caveats.
- Share URL contains only the necessary scenario parameters or a stable scenario ID.
- A reviewer can reproduce the shown scenario from the README or supplied file.

### FR-11 — Mission-profile suitability (COULD / post-core)
Evaluate explicit, user-visible constraints for a named example profile.

**Acceptance:**
- Every status can be traced to constraints and input values.
- Missing critical inputs return “Insufficient data.”
- No unsupported percentage chance of survival is shown.
- Profile name and assumptions are visible.

### FR-12 — Metric explanation / learning aid (SHOULD)
A “Why does this matter?” affordance explains key concepts in plain language.

**Acceptance:**
- Explanations are connected to actual metric outputs.
- Text distinguishes illumination, electrical power, DTE visibility, and operational radio-link feasibility.
- Explanations do not invent values not returned by the calculation engine.

### FR-13 — Arrival trajectory and propellant (WON'T for MVP; future COULD)
Only implement if the core challenge experience is complete and a supported solver/vehicle model is available.

**Acceptance for any future implementation:**
- The user supplies or selects a documented spacecraft configuration and mission architecture.
- The system does not estimate fuel from Earth–Moon distance alone.
- Outputs include model, limitations, convergence status, and assumptions.

### FR-14 — AI copilot (COULD, only after core works)
An optional assistant may translate natural-language requests into a typed scenario and explain existing computed results.

**Guardrails:**
- LLM does not calculate ephemerides, visibility, power, or trajectory values on its own.
- All numerical outputs come from deterministic tools/APIs.
- The assistant cannot claim a site is safe or viable without supported model output.
- Every explanation links back to values, constraints, and data provenance.

## 7. Distinctive feature strategy

A credible hackathon differentiator should be useful, testable, and tightly aligned to the challenge. The recommended differentiator is:

### “Opportunity Timeline + Trade-off Comparison”

Instead of stopping at a beautiful globe and a point-in-time display, let users compare **how long** each selected site remains sunlit or in DTE visibility over a chosen interval.

For each site, show:
- Sunlit and dark periods under the selected illumination model.
- DTE visible and blocked periods under the selected horizon model.
- Longest continuous dark interval.
- Longest continuous DTE blackout.
- Combined-window intersections as a descriptive aid, only when the team explicitly defines what “combined opportunity” means.
- Data coverage and confidence/method flags beside each result.

This supports an actual decision: a site may have good illumination but poor DTE windows; another may trade off one against the other. The product explains the trade-off instead of claiming a universal winner.

**Important:** Do not invent a single weighted “best site” score in the MVP. If ranking is added later, let users see the constraints and weights and label any unvalidated aggregate as a heuristic index.

## 8. Scientific model and calculation policy

This section sets the minimum scientific contract. It does not assert that every mode below will be implemented during the hackathon.

### 8.1 Coordinate conventions

- Declare the lunar coordinate reference, body-fixed frame, shape model, latitude convention (planetocentric or planetographic), and longitude direction (east-positive or west-positive).
- Convert surface picks to the chosen reference shape consistently.
- For terrain-based calculations, resolve the point against the chosen DEM/shape model where supported.
- Never mix a rendered globe coordinate with a DEM coordinate without an explicit transform.

### 8.2 Time conventions

- Use a canonical UTC timestamp in the API and science domain.
- Convert UTC to the ephemeris time scale internally using the selected SPICE kernels/time rules.
- Record valid kernel coverage; reject or mark unsupported times instead of extrapolating invisibly.
- Use a single epoch for Sun/Earth position metrics in one Point Passport.

### 8.3 Sun geometry

For a selected point and epoch, calculate Sun direction relative to the local frame and report at least solar elevation; azimuth is recommended.

Distinguish:
1. **Geometric Sun-above-horizon:** Sun is above an idealized local horizontal plane.
2. **Terrain-aware direct illumination:** Sun ray is not blocked by the modeled local terrain skyline/DEM.
3. **Power estimate:** Not implied by either of the first two. A power estimate requires panel geometry/orientation, efficiency, degradation, battery, load, and other assumptions.

### 8.4 Earth geometry and visibility

Distinguish:
1. **Geometric Earth direction/elevation:** Earth direction compared with an idealized local horizon.
2. **Earth-disc visibility:** Whether a defined part of Earth's apparent disk is above the horizon, if supported.
3. **Terrain-clear line of sight:** Whether local terrain blocks the line of sight, if supported by the DEM/horizon model.
4. **Operational RF link feasibility:** Requires transmitter/receiver/antenna/frequency/power/link-budget/ground infrastructure data. Out of the core MVP.

The UI must not collapse these into one unjustified “communications works” flag.

### 8.5 Range and light time

For context, the MVP may calculate the range from the selected lunar surface point to Earth centre at the selected epoch, then derive theoretical one-way light time as `t = d / c` and approximate round-trip light time as `2d / c`.

These are **signal light-time estimates**, not spacecraft travel time, network latency, or proof of a functioning radio link. Label the reference target and approximation method.

### 8.6 Time windows

- Window computation should report the sampling step and threshold.
- Short windows can be missed by coarse sampling; state this limitation and refine transition times where feasible.
- A reported boundary is accurate only to the declared model and sampling/refinement method.
- Timeline results must be deterministic for the same site, time interval, model, data products, and settings.

### 8.7 Suitability status (optional extension)
Use explainable categories rather than a fake precision score:
- **Favorable under selected constraints** — all modelled constraints pass and critical inputs are present.
- **Conditional / limited margin** — no hard requirement fails, but margins are narrow or sensitive.
- **Constraint failure** — at least one explicit threshold fails.
- **Insufficient data** — a critical input or data product is missing.

This is not a probability of survival. Thermal, radiation, dust, landing hazards, life support, and hardware reliability must be “not assessed” unless properly sourced and modelled.

## 9. Data strategy

### 9.1 Data types needed

| Data type | Use | MVP strategy |
|---|---|---|
| SPICE kernels / ephemerides / frames | Sun, Earth, Moon geometry and time/frame transformations | Pin a known-compatible kernel set, record coverage and versions, build a repeatable test fixture. |
| Lunar elevation / DEM (LOLA and related products) | Local skyline, terrain obstruction, local surface geometry | Start with limited verified south-pole coverage and selected benchmark sites; do not promise global high-resolution coverage. |
| Candidate sites / ROIs | Site discovery and side-by-side compare | Use an explicit, cited list; keep site IDs and coordinate conventions stable. |
| NASA illumination reference products | Independent comparison of expected lighting patterns where epochs/resolution align | Use as a benchmark/reference, not as an arbitrary-time live calculation API. |
| Derived windows | Timeline and blackout summaries | Compute from declared algorithms/sampling; cache by site/interval/model/data version. |
| Source/coverage metadata | Data trust and reproducibility | Store product ID, source, version, resolution, coordinate frame, checksum/retrieval date when available. |
| Vehicle/profile parameters (future) | Suitability or trajectory features | Explicit documented presets or user inputs only; no hidden defaults that affect major conclusions. |

### 9.2 Recommended starting points

- **NASA/JPL NAIF SPICE:** https://naif.jpl.nasa.gov/  
  SPICE supports space geometry and event analysis used in mission/science planning. Review the official tutorials, frame/time conventions, kernel comments, validity ranges, and licensing/rules before use: https://naif.jpl.nasa.gov/naif/tutorials.html and https://naif.jpl.nasa.gov/naif/rules.html
- **NASA Planetary Geodesy Data Archive (PGDA):** https://pgda.gsfc.nasa.gov/  
  Candidate source for lunar geodesy/elevation products; verify each product’s actual coverage, CRS, pixel spacing, interpolation, and terms before committing to it.
- **NASA Scientific Visualization Studio (SVS):** https://svs.gsfc.nasa.gov/  
  Search for lunar south-pole illumination products and use suitable outputs as independent visual/validation references where the timestamp and resolution match.
- **NASA/JPL Solar System Treks / Moon Trek:** https://trek.nasa.gov/  
  Use to understand existing capabilities and avoid presenting already-common globe controls as the innovation. Verify terms/attribution before reusing any assets.
- **Official NASA Space Apps Challenge 2026:** https://www.spaceappschallenge.org/2026/  
  Recheck the active challenge wording, submission fields, event instructions, and rules before the event.

### 9.3 Data-selection gates (must finish before claiming accuracy)

For every proposed dataset, answer:
1. What exact product/version is used?
2. What area does it cover?
3. What time interval or reference frame applies?
4. What coordinate system and height datum/reference surface are used?
5. What is the nominal resolution, and does it represent measurement resolution or interpolation spacing?
6. Can our runtime load/process it within the hackathon constraints?
7. What is the license/attribution requirement?
8. What is our independent check that the result is plausible?

### 9.4 Large-data strategy

- Do not ship a multi-gigabyte DEM to the browser.
- Preprocess or crop the required local terrain around a small number of supported candidate sites.
- Precompute/cache local horizon profiles if live terrain ray tracing is too expensive.
- Keep source data and derived products separate.
- A global textured globe can be used for navigation, but scientific terrain coverage must be separately displayed.
- Ensure the main demo works from a known local/cached data package if internet access or an external source is unavailable.

## 10. Recommended architecture

### 10.1 Architecture decision

Use a **modular monolith** with a clear frontend/backend separation:

- **Frontend:** React + TypeScript + Three.js (or React Three Fiber if the team already knows it).
- **API/backend:** Python + FastAPI.
- **Scientific geometry:** SPICE through a supported Python interface such as SpiceyPy, after verifying the chosen kernels and runtime.
- **Terrain processing:** Python geospatial/scientific tools selected only after a small data spike proves the target DEM can be read and queried correctly.
- **Contracts:** Versioned JSON request/response schemas shared with frontend types, with OpenAPI generated from the API.
- **Persistence:** Start with static curated site metadata plus small local files/SQLite only if required. Use a cache for derived calculations; avoid introducing a database without a real need.
- **Deployment:** One deployable web app and one API process or same-origin deployment if operationally simpler. Keep data artifacts versioned separately.

This is a recommendation based on the team's proposal, not a claim that these are the only valid technologies. If the team has a strong existing stack, keep the domain boundaries and data contracts while changing implementation tools.

### 10.2 Logical modules (not separate microservices)

1. **API / request validation:** validate coordinates, epochs, model settings, supported coverage, and response contracts.
2. **Site catalogue:** stable IDs, labels, coordinates, coverage status, reference links.
3. **Time and frame adapter:** UTC validation/conversion, selected kernel set, coordinate transforms.
4. **Sun geometry:** Sun direction and geometric elevation/azimuth.
5. **Earth geometry / DTE:** Earth direction/elevation and geometric visibility.
6. **Terrain horizon:** query DEM, build or load local horizon, evaluate occlusion, return coverage/quality state.
7. **Window engine:** sample time intervals, find illumination/DTE windows and gaps.
8. **Comparison engine:** evaluate each site under shared settings, calculate deltas, flag non-comparable coverage.
9. **Explanation / evidence:** return definitions, assumptions, source provenance and reasons for statuses.
10. **Cache / scenario export:** cache deterministic results and serialize reproducible scenario inputs/outputs.
11. **Validation fixtures:** golden cases, known geometry checks and regression tests.
12. **Optional suitability module:** explicit constraints, no unsupported probabilistic claims.

### 10.3 System flow

```text
User selects site(s) + UTC epoch / interval + model settings
                         |
                         v
                  React/TypeScript UI
                         |
                         v
             FastAPI request validation
                         |
          +--------------+----------------+
          |              |                |
          v              v                v
      Site catalogue  SPICE/time       DEM coverage /
                      frame adapter    local horizon
          |              |                |
          +--------------+----------------+
                         |
                         v
          Sun + Earth + terrain computations
                         |
                         v
           Windows / comparison / constraints
                         |
                         v
      Typed result + provenance + quality flags
                         |
                         v
    Point Passport, horizon view, timeline, compare
```

### 10.4 Data-flow rule

The UI sends the selected site coordinates/ID, UTC epoch or interval, metric requests, and model settings. The backend validates the input, performs geometry and terrain calculations if supported, computes derived windows, and returns a single coherent result carrying the epoch and model/data provenance. The UI renders that result; it does not independently recompute scientific values.

### 10.5 Reliability and caching

- Cache key includes site/point ID, UTC epoch or interval, kernel-set ID, terrain product/model ID, algorithm version, sampling step, threshold, and other calculation-affecting settings.
- Cache must not return results under a different model/data version without labelling them.
- Include request IDs or client cancellation to guard against out-of-order time-slider responses.
- If a calculation fails, return a typed error and preserve the last valid data only if the UI clearly labels them as stale/not current; preferably clear time-dependent metrics while showing loading/error state.

## 11. Proposed API contracts

Endpoint names are a starting design; freeze them after one vertical slice. Version the API.

| Endpoint | Purpose | Priority |
|---|---|---|
| `GET /api/v1/health` | API, kernel/data package, and model readiness | MUST |
| `GET /api/v1/sites` | List supported candidate sites and coverage badges | MUST |
| `GET /api/v1/coverage?lat=...&lon=...` | Report products/coverage and quality mode for a point | MUST |
| `POST /api/v1/point/conditions` | Point Passport for one point/epoch | MUST |
| `POST /api/v1/compare` | Compare 2–4 points under one shared epoch/settings | MUST |
| `POST /api/v1/point/timeline` | Illumination/DTE windows over a UTC range | SHOULD; high-value differentiator |
| `POST /api/v1/suitability/evaluate` | Explicit profile constraints and limiting factors | COULD |
| `POST /api/v1/scenarios` | Save/export a reproducible scenario, if server-side persistence is needed | SHOULD |
| `GET /api/v1/scenarios/{id}` | Reopen a saved scenario | SHOULD |

### 11.1 Example conditions request

```json
{
  "schema_version": "1.0",
  "site_id": "south-pole-site-a",
  "point": {
    "latitude_deg": -89.0,
    "longitude_deg": 120.0,
    "latitude_convention": "planetocentric",
    "longitude_convention": "east_positive"
  },
  "epoch_utc": "2030-01-01T00:00:00Z",
  "metrics": ["sun_geometry", "earth_visibility", "earth_range_light_time"],
  "model": {
    "terrain_mode": "terrain_aware_if_available",
    "minimum_earth_elevation_deg": 0.0
  }
}
```

**Note:** Example coordinates are illustrative schema values, not a recommended or scientifically validated candidate site. The implementation should prefer site IDs from the verified catalogue and return the analysis point actually used.

### 11.2 Example response shape

```json
{
  "schema_version": "1.0",
  "scenario_id": "demo-scenario-001",
  "site": {
    "site_id": "south-pole-site-a",
    "latitude_deg": -89.0,
    "longitude_deg": 120.0,
    "coordinate_reference": "declared-lunar-reference",
    "analysis_point_source": "declared-shape-model-or-dem"
  },
  "epoch_utc": "2030-01-01T00:00:00Z",
  "metrics": {
    "sun": {
      "azimuth_deg": null,
      "elevation_deg": null,
      "geometric_state": "unknown",
      "terrain_illumination_state": "not_assessed"
    },
    "earth": {
      "reference_target": "earth_center",
      "range_km": null,
      "one_way_light_time_s": null,
      "round_trip_light_time_s_approx": null,
      "elevation_deg": null,
      "geometric_visibility": "unknown",
      "terrain_clear_visibility": "not_assessed"
    }
  },
  "quality": {
    "mode": "geometry_only",
    "terrain_coverage": "not_available",
    "quality_flags": ["example_shape_only_not_computed"]
  },
  "provenance": {
    "algorithm_version": "0.1.0",
    "kernel_set_id": "recorded-kernel-set-id",
    "terrain_product_id": null,
    "source_refs": []
  },
  "limitations": ["illustrative schema only; not a computed scientific result"]
}
```

Use nullable typed fields in the implementation. Do not copy this example's `null` values as defaults for a real scenario. Define enums for statuses such as `visible`, `blocked`, `unknown`, `not_assessed`, `not_available`, and for quality mode such as `terrain_aware`, `geometry_only`, and `insufficient_data`.

### 11.3 Data contracts / domain objects

- **Site:** stable ID, display name, coordinates, coordinate convention, coverage reference, citation.
- **Scenario:** selected site(s), UTC epoch or interval, model options, thresholds, data version, algorithm version.
- **MetricResult:** value, unit, status, calculation method, epoch, quality flags.
- **TimeWindow:** UTC start/end, duration, condition definition, sampling/refinement method.
- **ComparisonResult:** per-site results, same/different assumptions warnings, deltas.
- **EvidenceRecord:** source product, version, URL, coordinate/frame context, resolution/coverage, method version, retrieval/checksum metadata where available.
- **ConstraintEvaluation:** named requirement, threshold, measured value, margin, pass/fail/unknown, explanation.

## 12. Repository and code organization

Suggested monorepo (adapt to team conventions):

```text
LunaMission-explorer/
  apps/
    web/                    # React + TypeScript UI
    api/                    # FastAPI application
  packages/
    contracts/              # OpenAPI-generated or shared contract types
  science/
    time_frames/             # UTC/SPICE/frame conventions and helpers
    geometry/                # Sun/Earth geometry functions
    terrain/                 # DEM coverage, horizon profile, occlusion
    windows/                 # interval sampling and window extraction
    comparison/              # shared-setting comparisons and deltas
    suitability/             # optional explicit rule engine
  data/
    manifest/               # source/product metadata
    catalog/                # curated candidate sites
    fixtures/               # small test inputs and expected outputs
    processed/               # small derived assets only; do not commit huge raw DEMs
  tests/
    unit/
    integration/
    science-reference/
    e2e/
  docs/
    PRD.md                  # this document copied/renamed here if desired
    SCIENCE_NOTES.md
    DATA_SOURCES.md
    DEMO_SCRIPT.md
  README.md
  .github/workflows/ci.yml
```

If the team uses one framework/repository layout already, do not waste hackathon time rearranging it. Preserve the boundaries, tests, provenance, and reproducible demo instead.

## 13. Scientific validation and test plan

A result that looks plausible is not automatically correct. The validation suite is a product feature because trust is part of the solution.

### 13.1 Unit tests

- Coordinate conversions: sign, longitude wrap, pole cases, selected-point mapping.
- UTC parsing/validation and ephemeris time conversion for supported epochs.
- Sun azimuth/elevation formula with simple known geometric cases.
- Range is positive and the light-time formula has consistent units.
- One-way light time equals `range / c`; approximate RTT equals `2 * range / c` under the stated assumption.
- Earth visibility classification at threshold boundaries.
- Interval/window merging, gap durations, and boundary conditions.
- Suitability rules, including explicit “insufficient data” paths.

### 13.2 Integration / data tests

- Selected kernels load successfully and cover the intended dates.
- Kernel IDs and frame assumptions appear in result provenance.
- Selected DEM tile corresponds to the stated region and frame.
- Terrain queries correctly report out-of-coverage states.
- A change to epoch changes time-dependent geometry when expected.
- Same request/data/version returns a deterministic result within defined numeric tolerances.

### 13.3 Independent science checks

Before demo freeze, choose at least one reference scenario whose date, coordinate, frame, and assumptions are documented. Compare our output with a trusted NASA illumination product or an independent trusted calculation when time/resolution align. Do not compare mismatched epochs or treat a coarse/pre-rendered reference as exact truth for an arbitrary time.

### 13.4 UI end-to-end tests

- Select site → Point Passport appears.
- Change time → all time-dependent panels show the new epoch.
- Rapidly scrub time → older response cannot overwrite newer selected time.
- Compare two sites → same timestamp/settings visible.
- Out-of-coverage point → clear fallback label.
- API error or missing data → no fabricated zero or stale-looking value.
- Export/share → reopenable scenario contains the same settings and provenance.

### 13.5 Demo evidence required

- One saved/reproducible scenario.
- One reference check or validation note.
- A source/coverage display showing data products, model, and limitations.
- One example where local terrain changes or could change the geometric visibility interpretation, if terrain-aware analysis is implemented.
- A written list of features not modelled: operational RF link quality, full survival probability, high-fidelity arbitrary trajectory, and cost.

## 14. Non-functional requirements

| ID | Requirement | Target / acceptance |
|---|---|---|
| NFR-01 | Understandability | First-time user can inspect a preselected site and explain at least the Sun and DTE states without reading documentation. Validate informally with 2–3 people if possible. |
| NFR-02 | Responsiveness | Globe interaction remains smooth on the team’s target laptop; expensive calculations do not block rendering. Exact FPS target is a goal, not a claim until measured. |
| NFR-03 | Analysis latency | Cached point inspection should feel immediate; measure realistic cold/warm request times and show loading state rather than promise an unmeasured SLA. |
| NFR-04 | Determinism | Same input, model version, and dataset version reproduce the same outputs within explicit tolerance. |
| NFR-05 | Accessibility | Text contrast, keyboard-operable primary actions, semantic labels, and non-colour status cues. |
| NFR-06 | Robustness | Missing data, unsupported timestamps, download failure, or computation errors produce clear states. |
| NFR-07 | Maintainability | UI does not perform authoritative science calculations; domain modules and contracts are testable. |
| NFR-08 | Reproducibility | README setup and demo scenario can be followed by a reviewer on a clean environment. |
| NFR-09 | Provenance | Every scientifically meaningful response includes a reference to the method and data/model version used. |
| NFR-10 | Deployment | Deployed app has a stable public URL if the team has reliable hosting; provide a local run fallback. |

## 15. Acceptance gates

### Gate A — Challenge fit
- [ ] The app visibly compares lunar landing sites and dates.
- [ ] Sun and Earth are shown relative to the selected point/local horizon, not only as decorative globe icons.
- [ ] Lighting/power opportunity and DTE windows are central to the experience.

### Gate B — Scientific integrity
- [ ] Selected coordinate reference and time convention are documented.
- [ ] Outputs have units, selected UTC epoch, method, source/model and quality status.
- [ ] Geometry-only and terrain-aware calculations are distinguished.
- [ ] Light time is not described as spacecraft travel time or operational network latency.
- [ ] No unsupported survival probabilities, RF guarantees, fuel values, or temperature predictions are shown.

### Gate C — Product usability
- [ ] A first-time user can complete the primary journey without team intervention.
- [ ] Point Passport, comparison, and timeline have clear loading/error/unknown states.
- [ ] At least two sites can be compared under shared settings.
- [ ] A useful scenario can be shared or exported.

### Gate D — Technical evidence
- [ ] Tests run from a documented command.
- [ ] At least one science sanity/reference case is recorded.
- [ ] Candidate data coverage and source attribution are visible.
- [ ] No essential runtime step requires downloading huge data during the demo.

### Gate E — Submission readiness
- [ ] Public repo and README are understandable.
- [ ] Deployment and fallback demo are available.
- [ ] Demo script is rehearsed and stays within the current local-event instructions.
- [ ] Team checks official 2026 submission fields, media requirements, and applicable rules with the event organizers.

## 16. Delivery plan

### 16.1 Before the 48-hour hackathon

Treat this as preparation subject to the current official rules and local organizer guidance. Confirm what pre-event planning, data exploration, prototyping, and coding are permitted before relying on any prebuilt implementation.

Preparation deliverables:
- Freeze the problem statement, scope, architecture choices, and definitions.
- Identify candidate sites and verify available data coverage.
- Test installation and compatibility of the selected SPICE/kernel/data path with one minimal geometry calculation.
- Create a small golden fixture and define expected units/frame/time semantics.
- Prepare wireframes, repository structure, CI skeleton, and role assignments where permitted.
- Decide on one end-to-end demo scenario and one optional differentiator.
- Confirm official 2026 submission/pitch instructions and local-event judging guidance.

### 16.2 Hackathon 48-hour build plan

The exact time slices can shift, but the exit gates should not.

| Time block | Priority | Deliverable | Exit gate |
|---|---|---|---|
| Hours 0–2 | Scope + contracts | Freeze MUST list, repository, issue board, API/domain contracts, responsibilities | Everyone agrees what will not be built. |
| Hours 2–6 | Vertical slice | Interactive site selection, UTC input, Point Passport shell, API health | Click/select works end-to-end with stable site ID/coordinates. |
| Hours 6–12 | Science baseline | One supported geometry path for Sun/Earth, range/light time only if tested | Real typed outputs with units, timestamps, tests, provenance. |
| Hours 12–18 | Core visibility | DTE geometric visibility and local horizon/terrain path where data supports it | At least one verifiable site/time scenario works. |
| Hours 18–25 | Compare + time | 2-site comparison, timeline/windows if core is stable | A real trade-off is visible across sites or times. |
| Hours 25–30 | Differentiator | Longest-darkness / DTE-blackout trade-off and explanation, or terrain-aware horizon proof | Clear value beyond a static visualization. |
| Hours 30–34 | Evidence + usability | Export/share, source attribution, missing-data labels, basic responsive UI | User can explain and reproduce the displayed result. |
| Hours 34–39 | Validation + repair | Unit/integration/e2e tests, golden case comparison, edge cases | No obvious stale data or unsupported scientific claims. |
| Hours 39–43 | Demo storytelling | README, screenshots, short demo recording if required, rehearsed pitch | Demo has a beginning, decision, evidence, result. |
| Hours 43–46 | Freeze | Bug fixes only, deployment, fallback fixture/data | Known path works from a clean browser. |
| Hours 46–48 | Submission buffer | Verify submission form, links, credits, project description | Submit early enough to avoid last-minute failure. |

**Scope rule:** If the science calculation or comparison is not working by the midpoint, cut trajectory, AI, elaborate animations, account systems, and other stretch work. Never cut scientific honesty or the challenge's core workflow to save a flashy feature.

### 16.3 Team workstreams

For a team of 4–6, assign one person per workstream. In a smaller team, combine adjacent roles but appoint one integration owner.

| Workstream | Ownership | Deliverables |
|---|---|---|
| Product / UX / narrative | Challenge fit, workflow, labels, visual hierarchy, demo script | Wireframes, user path, wording, pitch/story. |
| Frontend / visualization | Globe/map, point picker, panels, compare, timeline | Working interface, accessible controls, state synchronization. |
| Science / SPICE / time | Kernels, frame/time convention, Sun/Earth geometry, test cases | Calculation module and reference fixtures. |
| Terrain / data | DEM selection, coverage, horizon and obstruction if feasible | Source manifest, preprocessed data, coverage states. |
| API / integration / DevOps | Contracts, request validation, cache, deployment, CI | Stable endpoints, logs/errors, deployment and repo hygiene. |
| QA / mission logic / presenter | Acceptance tests, constraints, demo rehearsal, README | Verification matrix, repeatable scenario, answer bank for judges. |

**Integration owner rule:** One named person owns the end-to-end working path and can decide to cut any feature that threatens it.

## 17. Winning strategy: turn judging dimensions into evidence

The official 2026 site confirms the 2026 event dates, but a complete 2026 judging rubric should be checked as soon as it is available. The following strategy uses judging dimensions commonly shown in Space Apps materials as a planning lens, not a guarantee that every current event will use identical weights or wording.

### 17.1 Relevance

**Evidence:** The first screen and demo immediately show lunar site/date comparison, Sun relative to local horizon, and DTE communication windows. Explain that the tool reduces the friction of evaluating information currently spread across specialist tools.

Avoid: spending half the demo on the 3D globe or building features not called for by the prompt.

### 17.2 Scientific validity / feasibility

**Evidence:** Real NASA data are integral to the calculation; the time, coordinate frame, model version, coverage and limitations are visible. Show a reference comparison or a test. Use exact terms: geometric visibility, terrain-clear visibility, operational link feasibility.

Avoid: invented temperatures, false 99% survival claims, fixed average distance presented as time-dependent, or arbitrary fuel outputs.

### 17.3 Creativity / innovation

**Evidence:** The opportunity timeline and side-by-side trade-off explanation help the user answer a mission question quickly. A local-horizon diagram plus time-window comparison is more aligned than simply copying a generic 3D globe.

Avoid: calling a feature “AI-powered” or “unique” without showing what it does and why it is useful. Existing tools such as Moon Trek should be reviewed so we can articulate what usability gap our workflow improves.

### 17.4 Impact

**Evidence:** Show how a mission planner, educator, and public user can each use the same evidence at the appropriate level of detail. Explain why reliable sunlight and communication visibility matter to lunar surface operations.

Avoid: claiming it will pick the actual NASA landing site or guarantee mission success.

### 17.5 Presentation

**Evidence:** One story, one scenario, one trade-off, one validated result, one limitation explained honestly, and one crisp conclusion. Keep the live click path short and have screenshots/video or cached scenario as a fallback.

Avoid: narrating every framework and endpoint, leaving code errors visible, or using a time-consuming untested external data download live.

### 17.6 Three-minute demo template (adapt to official event rules)

- **0:00–0:20 — Problem:** “At the lunar south pole, a candidate site must be evaluated not just by its coordinates, but by when it receives sunlight and when Earth is visible.”
- **0:20–0:45 — Product:** Open LunaMission Explorer and select a supported site. Point out the selected point and UTC epoch.
- **0:45–1:25 — Scientific view:** Show Sun elevation/illumination and local horizon; switch to Earth/DTE visibility. State which outputs are geometry-only and which are terrain-aware.
- **1:25–2:05 — Decision value:** Compare Site A and Site B across the same interval. Point to the difference in window duration or blackout length. Do not invent an example result; use the actual validated fixture.
- **2:05–2:35 — Trust:** Show source/provenance, coverage badge, or validation note. State one limitation honestly.
- **2:35–3:00 — Impact:** “We turn scattered lunar geometry into a clear comparison workflow for mission teams, educators, and the public.”

If the local event allows a different presentation duration, retime this structure to fit the actual rules.

## 18. Risk register

| Risk | Severity | Early signal | Mitigation / fallback |
|---|---|---|---|
| Scope creep into a complete mission simulator | Critical | More time spent on rocket/fuel screens than site/time comparison | Enforce MUST list; keep trajectory as post-MVP. |
| SPICE or kernel setup takes too long | High | No reproducible geometry result after the initial spike | Reduce to one known-compatible kernel set and one validated supported time range; preserve an explicit fallback only if scientifically defensible. |
| DEM is too large or unavailable | High | Download/processing dominates the schedule | Crop/preprocess a small local region, use selected supported sites, or label geometry-only. Do not claim terrain-aware coverage. |
| Frame or coordinate mismatch | Critical | Plausible but inconsistent Sun/Earth/terrain outputs | Freeze convention early; unit tests and known fixtures; record reference frame and shape model. |
| Static illumination reference mistaken for arbitrary-time calculation | High | App returns precise-looking values beyond product coverage | Use reference products as validation/visual baseline only; label their temporal resolution. |
| Visibility presented as guaranteed communications | High | Single Boolean called “signal works” | Separate geometry visibility, terrain line of sight, and RF link feasibility. |
| Dark windows missed by sampling | Medium-high | Window boundaries change drastically with sample step | Report step, refine transitions where possible, test short windows. |
| Stale UI data after time scrubbing | High | Selected date differs from metrics shown | Cancel/supersede requests; bind all panels to response epoch. |
| Weak product differentiation | High | Demo is mostly globe rendering and basic cards | Deliver opportunity timeline + trade-off comparison and explain its decision value. |
| Too much visual polish, weak validation | High | Animation works but science cases are untested | Scientific acceptance gates before final styling. |
| Browser or network failure during demo | High | Data loads only from live services | Cached/fixture scenario, preloaded demo data and a short recorded fallback. |
| Official rules / submission details change | High | Team relies on older or local-only instructions | Check official 2026 site and ask local organizer; keep final submission checklist separate from this PRD. |

## 19. Post-hackathon roadmap (not commitments for event submission)

### Phase 2 — Better decision support
- Expand validated candidate-site coverage.
- Improve terrain horizon and Earth-disk visibility.
- Add user-defined mission constraints and explainable suitability.
- Improve scenario exports and reproducibility.
- Add educational walkthroughs and comparison presets.

### Phase 3 — Mission arrival extension
Only after a trajectory solver and spacecraft/mission input model are identified:
- Departure window and initial state.
- Target and desired arrival conditions.
- Transfer family and numerical solver status.
- Arrival epoch/velocity and maneuver-level Δv where available.
- Propellant estimate grounded in Δv and vehicle propulsion/mass assumptions.
- Arrival-time Point Passport.

### Research / advanced extensions
- RF link budget with actual transmitter/receiver/antenna/ground station assumptions.
- More detailed power system model (solar panel, battery, load, efficiency, degradation, operating limits).
- Thermal/radiation/dust data only with meaningful coverage and documented models.
- Robustness analysis under alternative DEMs, thresholds, or model uncertainties.
- AI copilot for turning natural-language needs into typed constraint sets and explaining deterministic results.

## 20. Open decisions before implementation

Do not silently decide these during implementation. Record the team's answer in an ADR or issue:

1. Which exact candidate sites/regions will the MVP support?
2. Which SPICE kernel set, coordinate frame, lunar shape model, and epoch range are validated?
3. Which DEM product covers each supported site, and is terrain-aware analysis feasible within the deadline?
4. What is the smallest independent reference case we can reproduce?
5. Do we build interactive 3D first, or a 2D/local-horizon view first if 3D effort threatens the analysis workflow?
6. Is the timeline required for MVP or stretch? Recommendation: prioritize it if point-in-time science works because it creates real comparison value.
7. Do we need server-side saved scenarios, or are a share URL and JSON export enough?
8. Who is the integration owner and who independently reviews scientific outputs?
9. What pre-event work is permitted under the current official event rules and local organizer instructions?
10. What are the final submission language, media, pitch, and repository requirements for our local event?

## 21. Definition of Done for MVP

The MVP is done when all the following are true:

- A user can select at least two supported lunar south-pole sites and a shared UTC epoch/interval.
- The app displays Sun geometry and an honest illumination state.
- The app displays Earth direction/visibility and distinguishes geometry-only from terrain-aware output.
- At least two sites can be compared with shared assumptions and useful deltas.
- The opportunity timeline or its fallback summary reveals a real time-window trade-off.
- Every result has units, epoch, method, data/model provenance, and quality flags.
- Missing data are explicit; no unsupported survival probability, RF link guarantee, spacecraft arrival time, fuel, or cost is shown.
- A science sanity/reference case, automated tests, and a reproducible demo scenario are documented.
- The deployed or local demo works without requiring a large live data download.
- README, source attribution, model limitations, and submission materials are complete.

## 22. Sources and references

### Challenge and event
- NASA Space Apps Challenge 2026 event website: https://www.spaceappschallenge.org/2026/ (event dates and current official event information; check again before submission).
- Challenge text used in this PRD: the challenge description supplied by the team in the project conversation. Reconfirm against the current official challenge page before final submission.
- NASA Space Apps 2026 Participant Terms and Conditions: https://www.spaceappschallenge.org/legal/ (read current version; this PRD does not substitute for event rules).

### Scientific and data sources
- NASA/JPL NAIF SPICE: https://naif.jpl.nasa.gov/
- NAIF SPICE tutorials: https://naif.jpl.nasa.gov/naif/tutorials.html
- NAIF SPICE rules / acknowledgement and usage guidance: https://naif.jpl.nasa.gov/naif/rules.html
- NASA Planetary Geodesy Data Archive: https://pgda.gsfc.nasa.gov/
- NASA Scientific Visualization Studio: https://svs.gsfc.nasa.gov/
- NASA/JPL Solar System Treks / Moon Trek: https://trek.nasa.gov/

### Existing team design reference
- *LunaMission Explorer — System Requirements Specification & Solution Architecture Design*, team proposal dated 14 October 2026. This PRD retains its strongest guidance on synchronized UTC, source/model provenance, geometric versus terrain-aware visibility, honest missing-data handling, and keeping trajectory/fuel calculations separate from the MVP.

---

## Appendix A — Decision records (initial)

### ADR-001: Challenge-aligned MVP
**Decision:** Focus on site/date comparison, illumination, local-horizon Sun/Earth visibility, and opportunity windows.  
**Reason:** Directly addresses the challenge; avoids spending the event on an unrelated mission simulator.  
**Consequence:** Arrival/fuel and operational RF link budget are postponed.

### ADR-002: Modular monolith
**Decision:** One API application with testable domain modules; one frontend.  
**Reason:** Faster integration, fewer deployment failure modes, and a cleaner scientific boundary than distributed microservices for a short hackathon.  
**Consequence:** Modules can be separated later if runtime measurements justify it.

### ADR-003: Scientific backend is authoritative
**Decision:** The frontend displays returned scientific metrics; backend/domain code calculates them.  
**Reason:** Prevents visual code from becoming a second, untested source of truth.  
**Consequence:** Shared schema/version and tests are required.

### ADR-004: No false precision
**Decision:** Unknown/not assessed are first-class states. Avoid unsupported survival probabilities, operational comm guarantees, arrival/fuel numbers, and temperature claims.  
**Reason:** Scientific validity is more valuable than impressive but ungrounded outputs.  
**Consequence:** Coverage and caveat UI are core product features.

### ADR-005: Narrow verified terrain support
**Decision:** Support terrain-aware outputs only where the chosen DEM and pipeline are verified.  
**Reason:** A global texture is not elevation data, and high-resolution products may have limited coverage or interpolation.  
**Consequence:** The UI must show coverage mode and a geometry-only fallback.

## Appendix B — One-sentence pitch

**LunaMission Explorer turns complex lunar south-pole lighting and Earth-visibility data into an intuitive, reproducible comparison of candidate landing sites and time windows—helping people see the trade-offs before choosing where and when a mission should operate.**
