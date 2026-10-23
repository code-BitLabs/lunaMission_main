# LunaMission — Project Brief

**Status:** Working project brief  
**Version:** 1.0  
**Last updated:** 19 October 2026  
**Project category:** NASA Space Apps Challenge 2026  
**Related documents:** `PRD.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `SCIENCE_FEASIBILITY.md`, `API_CONTRACTS.md`

---

## 1. Project at a glance

**LunaMission** is a web application that helps users explore and compare candidate lunar landing locations and dates by making Sun geometry, illumination opportunity, Earth visibility, and direct-to-Earth (DTE) communication windows easier to understand.

The application is intended to turn mission-planning questions that normally require specialized tools and fragmented data into a clearer, visual, time-aware workflow.

**Core interaction:** select a lunar location, choose a UTC time or interval, inspect Sun and Earth geometry relative to the local horizon, and compare the result with other candidate locations.

## 2. The problem

Lunar south-pole mission planning is affected by difficult lighting conditions and communication geometry. At a candidate site, the Sun may sit close to the local horizon or be obstructed by terrain. Earth may be geometrically visible at some times and hidden at others. Evaluating these conditions across several locations and dates requires users to coordinate scientific data, time settings, and visualization tools.

The challenge is not simply to render a 3D Moon. It is to help users answer practical comparison questions clearly, consistently, and with visible evidence about how each result was obtained.

## 3. The proposed solution

LunaMission will provide an interactive lunar exploration and comparison experience.

Users will be able to:

1. Select a supported lunar location, with the initial focus on candidate sites near the lunar south pole.
2. Choose a date and time using a canonical UTC timestamp.
3. Inspect the Sun's direction and elevation relative to the local horizon, alongside a clearly qualified illumination result.
4. Inspect Earth's direction and geometric visibility and view the point-to-Earth range and theoretical light-travel time.
5. Compare multiple locations under the same timestamp and assumptions.
6. Explore illumination and Earth-visibility opportunities over a time interval when timeline calculations are validated.
7. See units, data coverage, calculation method, source/model versions, and quality flags, including when a result is unavailable or only geometry-based.

The interface may use a 3D Moon for selecting and understanding locations, supported by focused horizon views, metrics, comparison panels, and timelines. Scientific correctness and an understandable comparison workflow take priority over visual complexity.

## 4. Intended users

- **Mission planners and technical users** who need to compare site/time conditions and inspect assumptions.
- **Educators and students** who want to understand lunar illumination and Earth visibility through an intuitive interface.
- **The public and hackathon judges** who need to explore the problem without first mastering specialized scientific tools.

The application is an exploratory planning aid. It is not, by itself, an operational mission-certification system.

## 5. MVP scope

### In scope

- Interactive selection of supported lunar sites.
- UTC-based time selection and consistent updates across all time-dependent panels.
- Sun and Earth geometry for supported locations and times.
- Illumination and direct-to-Earth visibility results with explicit method/quality labels.
- Earth range and theoretical one-way light-time, with the reference point and calculation assumptions documented.
- Comparison of at least two candidate sites at the same epoch.
- Clear data-coverage, missing-data, and model-limitation indicators.
- A timeline or opportunity-window view if point-in-time calculations are proven early enough.
- A reproducible demo scenario and documented validation evidence.

### Not in the initial MVP

- Spacecraft trajectory optimization, arrival dates, delta-v, or propellant estimates.
- A full radio-frequency link budget or a guarantee that a communications link will work.
- A survival probability or safety percentage without a validated probabilistic model.
- Terrain-aware accuracy for locations that lack verified elevation data and a tested terrain pipeline.
- AI-generated scientific calculations.
- User accounts, a database, distributed jobs, or microservices without a demonstrated product need.

These boundaries protect the core challenge workflow from being diluted by ambitious but unvalidated features.

## 6. Key principles

### Scientific outputs must be explainable

Every result should identify its timestamp, units, calculation method, relevant frame/target assumptions, and source/model version. Where important information is missing, the application must say so rather than quietly substituting a default.

### Geometry is not terrain-aware visibility

A body appearing above an ideal geometric horizon does not prove that nearby terrain leaves it unobstructed. Terrain-aware claims may only be made where a suitable digital elevation model (DEM) is available and its pipeline has been validated.

### Visibility is not communication success

Geometric Earth visibility is not equivalent to a successful operational radio link. LunaMission will clearly separate geometric visibility from an RF link budget, which is outside the initial MVP.

### Light-travel time is not network latency

Theoretical signal light-time is derived from a documented distance and the speed of light. It must not be presented as end-to-end operational communications latency.

### Compare like with like

Site comparisons must use the same UTC epoch and compatible calculation settings. Missing metrics must remain visibly missing rather than being treated as zero or as a favorable outcome.

## 7. Proposed technical direction

The team's current proposed stack is:

- **Workspace:** pnpm workspace for JavaScript/TypeScript applications and packages.
- **Web application:** Next.js with TypeScript.
- **Application API:** Hono integrated within the Next.js application, providing the main public API boundary.
- **Scientific service:** a separate Python service where its scientific ecosystem is beneficial, especially for SPICE-based ephemeris/geometry calculations and validated terrain processing.
- **Scientific tooling:** SPICE/SPICEyPy and numerical libraries such as NumPy, pending feasibility testing with the required kernels, frames, time coverage, and datasets.
- **Shared contracts:** explicit API schemas; TypeScript types should be generated from or checked against a canonical schema rather than maintained independently by hand.
- **Testing:** Python unit/integration tests, TypeScript tests, and end-to-end tests for the main user journey.
- **Repository model:** one repository containing the web application, scientific service, documentation, test fixtures, and data acquisition manifests.

This stack is a proposed project direction, not a claim that all scientific dependencies or data products have already been verified. Hono is the primary public API surface; the browser should not bypass it to call the Python service directly. Whether the Python service is needed for each computation should be decided by capability and measurement, not by default.

## 8. First scientific milestone

Before building the full interface, the team should prove one reproducible end-to-end scientific case:

1. Select one reference lunar location and UTC timestamp.
2. Load and identify the required ephemeris kernels.
3. Compute Sun and Earth geometry using documented coordinate frames and targets.
4. Compute point-to-Earth range and theoretical light-travel time under a stated range definition.
5. Compare the results with a trusted reference product or an independently validated sanity case.
6. Record expected tolerance, data/kernel versions, assumptions, limitations, and test results in `SCIENCE_FEASIBILITY.md`.

The first vertical slice then connects the supported input to the scientific computation, returns a typed result with provenance and quality flags, and displays that result in the web application.

## 9. What success looks like

The MVP is successful when a user can select two supported lunar south-pole candidate sites, evaluate them at the same UTC epoch, understand the Sun/Earth conditions and meaningful trade-offs, and distinguish reference data, computed geometry, terrain-aware outputs, estimates, and unavailable information.

The project should demonstrate:

- A working site-and-time workflow.
- At least one documented scientific reference/validation case.
- Consistent time handling across comparison views.
- Honest data-coverage and model-limitation messaging.
- A reproducible scenario for the final presentation.
- A clean setup and run guide.
- Clear attribution for external datasets and software.

A convincing demonstration should show how site choice and time can change the lighting and Earth-visibility picture—not just show an attractive Moon.

## 10. Immediate project milestones

1. **Review the PRD:** confirm the MVP, acceptance criteria, and non-goals; ensure all product naming uses LunaMission.
2. **Record decisions:** add `DECISIONS.md` with the agreed stack, repository conventions, scientific boundaries, open questions, and decision owners.
3. **Create the workspace skeleton:** set up the Next.js/Hono application, Python service structure, pnpm workspace, basic CI, and developer commands.
4. **Run the feasibility experiment:** validate one scientific location/time case before expanding the interface.
5. **Define API contracts:** finalize request/response schemas from the supported calculation workflow.
6. **Build the vertical slice:** connect one UI selection to one verified result.
7. **Expand carefully:** add multi-site comparison, timelines, terrain-aware results where proven, and presentation polish.

## 11. Main risks

| Risk | Response |
|---|---|
| Incorrect frames, kernels, or UTC handling | Validate a small reference case and document frames, time coverage, and kernel versions. |
| Insufficient or uneven DEM coverage | Track coverage explicitly and distinguish geometry-only from terrain-aware output. |
| Too much effort spent on 3D rendering | Prove the scientific vertical slice first; treat visualization as a presentation layer. |
| Unsupported confidence in results | Show provenance and quality flags; make insufficient data a first-class state. |
| Scope creep into trajectories, AI, or survival scores | Defer these until the core site/date comparison is complete and validated. |
| Demo requires large live downloads | Prepare required data ahead of time and document a reproducible local/demo setup. |

## 12. Project documents

| Document | Purpose |
|---|---|
| `PROJECT_BRIEF.md` | Short shared explanation of what LunaMission is and what success means. |
| `PRD.md` | Product requirements, user workflows, MVP, non-goals, and acceptance criteria. |
| `ARCHITECTURE.md` | System boundaries, stack proposal, repository structure, and major technical decisions. |
| `DECISIONS.md` | Decisions, rationale, owners, consequences, and unresolved questions. |
| `SCIENCE_FEASIBILITY.md` | Scientific dependencies, reference cases, assumptions, data coverage, and validation results. |
| `API_CONTRACTS.md` | Request/response schemas, units, timestamps, errors, and provenance. |
| `DESIGN_SPEC.md` | Interface layout, interactions, and visualization states. |
| `VALIDATION_PLAN.md` | Test strategy, reference checks, tolerances, and release acceptance. |
| `README.md` | Project setup, development commands, data setup, tests, and demo instructions. |

## 13. Assumptions and open questions

The following remain open until the team validates them:

- Which exact candidate locations will be supported in the first demo?
- Which SPICE kernels, coordinate frames, and supported time range will be used?
- Which reference case will be used for independent validation?
- What DEM product covers the selected sites, at what resolution, and under what usage terms?
- Can the first release support terrain-aware illumination and Earth line-of-sight, or must some outputs be labeled geometry-only?
- Is the opportunity timeline part of the MVP after point-in-time results are validated?
- What pre-event work, external data use, and submission requirements apply under the current event rules?

These questions should be resolved through documented decisions and experiments rather than assumptions.

---

**One-line pitch:** LunaMission makes lunar south-pole site-and-time trade-offs easier to explore by bringing Sun geometry, illumination opportunity, Earth visibility, and transparent scientific evidence into one interactive comparison workflow.
