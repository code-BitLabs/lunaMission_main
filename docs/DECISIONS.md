# LunaMission — Engineering Decisions

**Status:** Working decision register  
**Version:** 1.0  
**Last updated:** 2026-10-19  
**Owner:** LunaMission team  
**Purpose:** Record important engineering and product decisions so contributors do not make conflicting assumptions. A decision marked *Accepted* reflects the current project direction; it can still be revisited when new evidence meets the stated trigger.

---

## How to use this file

- **Accepted** — the team’s current direction; implement against it.
- **Proposed** — recommendation awaiting explicit team agreement.
- **Open** — unresolved; do not silently assume an answer.
- **Superseded** — replaced by a later decision; keep the record for traceability.

When changing a decision, update its status and record the date, reason, evidence, and consequences. Use small, focused records rather than burying decisions in chat messages.

## Current baseline

| Area | Current decision | Status |
|---|---|---|
| Project name | LunaMission | Accepted |
| Product goal | Compare supported lunar south-pole candidate locations and dates, emphasizing Sun geometry/illumination and Earth visibility/DTE opportunities | Accepted |
| JavaScript package manager | pnpm workspace | Accepted |
| Web application | Next.js + TypeScript | Accepted |
| Public application API | Hono integrated inside the Next.js application | Accepted |
| Scientific compute | A separate Python service when specialized scientific dependencies or workflows justify it | Accepted |
| Public API ownership | Browser calls the Hono API; Hono owns the public contract and coordinates Python calls when needed | Accepted |
| Shared contract approach | Canonical, versioned schemas; generate or validate TypeScript types from the canonical API definition rather than maintaining duplicate hand-written definitions | Proposed |
| Architecture style | Modular application, not microservices by default | Accepted |
| Science source of truth | Scientific domain code, not UI components or an LLM | Accepted |
| Scientific feasibility | Validate one reproducible location-and-UTC-time case before expanding the product | Accepted |
| Trajectory/fuel planning | Deferred from the initial MVP | Accepted |
| Operational RF link guarantees | Out of MVP; geometric visibility must not be represented as communications success | Accepted |
| Survival probability | Do not show an unvalidated survival probability or safety percentage | Accepted |
| Terrain-aware claims | Only claim terrain-aware accuracy for regions and products with verified DEM coverage and a tested pipeline | Accepted |
| Database / cache / orchestration tools | Add only when a demonstrated requirement justifies them | Accepted |

---

## DEC-001 — Product name

**Status:** Accepted  
**Decision:** Use **LunaMission** as the official project name in the repository, interface, documentation, and presentation.  
**Context:** Earlier team materials use the working name “MoonPoint Explorer.”  
**Consequences:** Treat that name as a legacy proposal title only. Rename current project references when practical; do not rename third-party identifiers that are not owned by this project.

## DEC-002 — Challenge-aligned MVP

**Status:** Accepted  
**Decision:** Prioritize site/date comparison and understandable visualization of the Sun and Earth relative to the local horizon, with illumination/power opportunity and direct-to-Earth visibility windows.  
**Context:** The application should make mission-planning conditions easier to compare, not become a broad lunar simulator.  
**Consequences:** Keep trajectories, propellant, advanced AI, full RF link budgeting, and unsupported environmental scoring out of the critical MVP path. A timeline is valuable, but should follow validation of point-in-time calculations.

## DEC-003 — pnpm workspace for TypeScript projects

**Status:** Accepted  
**Decision:** Use a pnpm workspace to manage the JavaScript/TypeScript application and shared packages.  
**Consequences:**
- Put the Next.js application and TypeScript shared packages under the workspace.
- Keep workspace package dependencies explicit and use package names for internal imports.
- Do not add Turborepo or another task orchestrator on day one; add one when the actual build/test graph benefits from it.
- Python dependencies are managed separately, for example with `pyproject.toml` and a Python-compatible environment/tooling.
- The repository may be a monorepo without forcing every language into pnpm.

## DEC-004 — Next.js is the web application

**Status:** Accepted  
**Decision:** Use Next.js with TypeScript for the web application and its application shell.  
**Consequences:** The web app owns routes, rendering, user interaction, loading/error states, and visualization. UI components must not become an independent implementation of scientific calculations. Choose additional rendering libraries based on a small prototype and team familiarity rather than adding every possible library immediately.

## DEC-005 — Hono is the primary public API

**Status:** Accepted  
**Decision:** Integrate Hono into the Next.js application and use it as the primary public application API.  
**Consequences:**
- The browser calls Hono endpoints for application data.
- Hono validates/normalizes requests, applies appropriate middleware, coordinates domain operations, and returns the public API response.
- Avoid duplicate endpoints in Next.js route handlers and Hono that implement the same operation. Use one clear owner per route.
- The precise file layout and adapter setup must follow the chosen Next.js runtime/deployment target and the supported Hono integration approach.

## DEC-006 — Python is a specialized scientific service, not a second public API

**Status:** Accepted  
**Decision:** Use a separate Python service only for scientific calculations or data workflows where Python’s ecosystem provides a concrete benefit, such as SPICE-based geometry or validated terrain processing.  
**Consequences:**
- The Python service is an internal computation boundary; the browser does not call it directly.
- Hono remains the public API and translates between public contracts and internal service contracts.
- Keep the Python service small, with typed request/response models and explicit errors.
- Do not make Python a required hop for work that can be handled correctly and simply in TypeScript.
- Prove the needed kernels, frames, coverage, numerical behavior, and runtime assumptions before treating any scientific operation as production-ready.
- If the first feasibility experiment shows that a standalone Python service is unnecessary for a specific operation, do not force that operation into Python merely for architectural consistency.

## DEC-007 — Modular architecture before distributed architecture

**Status:** Accepted  
**Decision:** Start with a modular Next.js/Hono application and, if required, one separate Python scientific process/service. Do not split the system into multiple network services without a reason.  
**Rationale:** A small team needs fast integration, straightforward local development, and testable boundaries.  
**Consequences:** Keep calculation modules independent from HTTP handlers. Revisit service separation only when deployment, scaling, isolation, or dependency requirements justify the extra operational complexity.

## DEC-008 — Canonical API contracts

**Status:** Proposed  
**Decision:** Keep a single canonical definition for public API requests and responses. Prefer OpenAPI generated from the Hono-side contract approach or a schema-first TypeScript package, then generate/validate clients and Python-side models where practical.  
**Context:** TypeScript and Python can easily drift if each side duplicates schemas manually.  
**Consequences:** `API_CONTRACTS.md` must name the canonical source and generation/validation method before both implementations grow. Every contract must specify units, UTC semantics, coordinate conventions, error cases, and data-quality/provenance fields.  
**Decision trigger:** Confirm the exact tool after a small proof that can represent the required TypeScript and Python types without excessive duplication.

## DEC-009 — Scientific code is authoritative

**Status:** Accepted  
**Decision:** Scientific computations are implemented in testable domain modules, not in React components, chart code, or LLM prompts.  
**Consequences:** UI components render returned values and source/quality metadata. Deterministic calculations have unit tests and documented assumptions. When an explanatory AI feature is added later, it may explain structured results but must not invent or independently replace calculated values.

## DEC-010 — UTC is the canonical timestamp

**Status:** Accepted  
**Decision:** All scientific requests and comparisons use a canonical UTC timestamp.  
**Consequences:** Local time is a display/input concern at the interface boundary. All panels in one scenario and all sites in one comparison use the same epoch. The scientific implementation must still document the time scale and conversion required by the selected ephemeris system; “UTC” alone does not remove the need to handle SPICE time conversions correctly.

## DEC-011 — Coordinate frames and conventions must be explicit

**Status:** Accepted  
**Decision:** No scientific API may accept or return lunar coordinates without documenting the latitude convention, longitude convention, reference frame, epoch, and relevant target/observer definitions.  
**Consequences:** Do not silently mix planetocentric and planetographic coordinates, east-positive and west-positive longitudes, or body-fixed and inertial frames. Exact conventions and supported frames remain open until the science feasibility spike is completed.

## DEC-012 — Distinguish geometry-only from terrain-aware results

**Status:** Accepted  
**Decision:** A result based on ideal geometric horizon assumptions must be labeled as such. Terrain-aware illumination or Earth line-of-sight is available only where an appropriate DEM and validated pipeline exist.  
**Consequences:** Data coverage and method are visible to users. A missing DEM must produce an explicit unsupported/insufficient-data state, never an invisible fallback that implies terrain was checked.

## DEC-013 — Light-time and visibility are not link guarantees

**Status:** Accepted  
**Decision:** Display theoretical light-travel time and geometric Earth visibility as separate scientific metrics.  
**Consequences:** Point-to-Earth range must have a documented target/reference point; theoretical one-way vacuum light-time is derived from the declared distance and the speed of light. Do not label either metric as actual network latency or guaranteed radio contact. Full RF link budgeting is deferred.

## DEC-014 — No unsupported survival/safety probability

**Status:** Accepted  
**Decision:** Do not represent a heuristic suitability score as a probability of survival or safety.  
**Consequences:** If suitability is added, use explicit mission constraints and explain pass/fail/unknown states. Unknown or unavailable data must remain visible and must not default to a favorable outcome.

## DEC-015 — Do not commit to terrain or ephemeris products before a feasibility test

**Status:** Accepted  
**Decision:** Select kernels, reference products, and DEM data based on the specific target sites and validated coverage required for the demonstration.  
**Consequences:** Record provider, product/version, retrieval instructions, licensing/usage terms, coverage, resolution, checksum, and known limitations. Keep large binary data out of Git by default; version manifests and test fixtures instead. The specific reference location, epoch, products, and tolerance remain open.

## DEC-016 — Validate one scientific vertical slice before broad UI development

**Status:** Accepted  
**Decision:** First implement a reproducible path from one supported lunar location and UTC epoch to a scientific result with units, provenance, quality flags, and a validation check.  
**Done when:**
- Required kernels/data load reproducibly.
- Reference frames and target/observer definitions are documented.
- Sun/Earth geometry and range/light-time calculations produce unit-bearing results.
- At least one trusted or independent reference/sanity case is compared.
- Known limitations and a tolerance are documented.
- The result is accessible through a typed internal/public contract.

**Consequences:** The complete 3D experience and timeline do not block the first scientific proof.

## DEC-017 — Defer persistence and extra infrastructure until needed

**Status:** Accepted  
**Decision:** Do not add a database, message queue, distributed cache, user accounts, background job system, or orchestration framework until an MVP requirement or measurement justifies it.  
**Consequences:** Prefer static manifests, local/configured scientific data, simple in-process caching, and reproducible scenario files for the first release. Revisit only when there is a concrete need such as shared saved scenarios, long-running jobs, or measured performance limits.

## DEC-018 — Testing is part of science delivery

**Status:** Accepted  
**Decision:** Include automated scientific, API, frontend, and end-to-end checks from the start.  
**Consequences:** At minimum test coordinate/time handling, unit conversions, known geometry cases, range/light-time, missing data, API validation, comparison epoch consistency, and stale UI responses. A passing build is not evidence that the science is correct; reference validation is required separately.

---

## Open decisions — do not silently guess

| ID | Question | Needed before |
|---|---|---|
| OPEN-001 | What exact candidate sites and demo timestamps will be supported? | Feasibility spike |
| OPEN-002 | Which SPICE kernels, frames, time conversions, and coverage are required? | Scientific implementation |
| OPEN-003 | Which independent reference case and numeric tolerance will validate the calculations? | Science milestone acceptance |
| OPEN-004 | Which DEM product covers chosen sites, at what resolution, and under what terms? | Terrain-aware implementation |
| OPEN-005 | Which schema/tooling will be canonical across TypeScript and Python? | Finalizing API contracts |
| OPEN-006 | Which runtime and deployment target will host Next.js/Hono and Python? | Deployment/adapter setup |
| OPEN-007 | Is the time-window timeline in the must-have MVP or the first stretch feature? | Scope freeze |
| OPEN-008 | Which checks and work are permitted under current event rules before the event? | Hackathon work planning |

## Change log

| Date | Change |
|---|---|
| 2026-10-19 | Initial register based on the current LunaMission project direction and proposed architecture. |
