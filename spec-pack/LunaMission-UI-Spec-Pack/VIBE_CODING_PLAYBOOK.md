# Vibe-Coding Playbook — LunaMission

This playbook lets multiple AI tools help without each inventing a different product. Keep the design system and master spec attached to the same repo/project. Generate in small reviewable slices; never treat a single prompt as a replacement for validation.

## 1. Suggested context packet

For the first generation, provide:

1. `DESIGN.md`
2. `UI_UX_MASTER_SPEC.md`
3. `DIAGRAMS.md`
4. `AGENTS.md` (for code-generating agents)
5. `NEXTJS_IMPLEMENTATION_GUIDE.md` once asking for real Next.js files

For a tool with limited context/upload support, paste the **Master Prompt** below and the relevant sections from `DESIGN.md` / screen spec. Do not paste every unrelated project document each time; include scientific constraints whenever requesting metric content or real data integration.

## 2. Master prompt — design or implement the Explorer

Copy this prompt into a visual generator or coding agent and attach the spec files:

```text
You are the product designer and senior frontend engineer for LunaMission, a scientifically honest lunar south-pole exploration interface.

SOURCE OF TRUTH
Read DESIGN.md, UI_UX_MASTER_SPEC.md, DIAGRAMS.md and (for code) AGENTS.md. Follow them as a coherent design contract. Do not invent a competing visual identity. Where tool defaults conflict with the spec, follow the spec.

PRODUCT
The user selects a supported lunar location and a canonical UTC epoch, then inspects qualified Sun/Earth geometry, data coverage, method/quality and provenance. The UI direction is a premium scientific observatory: cinematic spatial subject, restrained controls, clear evidence. Use a hybrid 3D Moon and precise 2D south-pole map; the 2D map and candidate list are first-class, and the core workflow must remain possible without WebGL.

VISUAL RULES
Use the palette, typography, spacing and component semantics in DESIGN.md. Deep ink surfaces, fine borders, legible text, restrained solar gold / Earth blue / selected-site teal. Avoid generic SaaS dashboard styling, neon sci-fi HUDs, glassmorphism, unnecessary gradients/glows, excess rounded cards, giant empty hero art and decorative telemetry. Sun gold means Sun; Earth blue means Earth; teal means selected site; demo purple means illustrative content only.

SCIENTIFIC HONESTY
Never fabricate science, site names that appear official, metric values, terrain coverage, validation badges, event windows, survival percentages, RF success or trajectory/fuel outputs. If using fixtures, label the interface DEMO DATA and keep the label near the relevant numbers. Represent unavailable and indeterminate values explicitly. Every scientific value needs a unit, stated method/status and a path to provenance. UTC must be explicit. A render texture is not a DEM. Geometric Earth visibility is not an operational communications guarantee. Theoretical light-time is not complete operational latency.

TASK BOUNDARY
Work on [INSERT ONE SLICE: e.g. static Explorer shell / responsive Point Passport / UTC control]. Do not build unrelated pages or add backend/science features unless specifically asked. Inspect the existing project before changing it. Preserve its package manager, dependencies, routes and conventions unless there is a clear reason to change them.

IMPLEMENTATION
Use Next.js App Router + TypeScript + React patterns that remain easy to move to a normal Next.js repository. Keep Server Components by default and place client state/canvas in the smallest reasonable client boundary. Use CSS variables from the design tokens. Prefer semantic HTML and a small reusable component set. Keep components organized by feature. Do not add dependencies without a short justification. Every visible control must work, be disabled with a reason, or be identified as a preview.

RESPONSIVE AND ACCESSIBLE
Design for 320, 375, 768, 1024, 1280 and 1440px widths. Desktop uses a spatial workspace and detail rail with timeline below; mobile becomes a deliberate single-column workflow. No page overflow. Keyboard alternatives exist for the globe/map. Show focus, support reduced motion, avoid color-only semantics, label every form control, and provide text equivalents for diagrams/charts.

DELIVERABLE
First state a brief plan. Then produce the requested slice with real file organization rather than one giant component. After implementation, run the checks available in the repo and report which commands actually ran, what passed/failed, changed files, visual states tested and remaining limitations. Do not claim validation or test success without evidence.
```

## 3. Prompt sequence for a reliable result

### Prompt A — Design exploration only

```text
Study DESIGN.md, UI_UX_MASTER_SPEC.md and DIAGRAMS.md. Do not write application code yet. Create one high-fidelity Explorer screen proposal with desktop (1440px) and mobile (390px) compositions. Use labelled illustrative fixture values only, with a visible DEMO DATA indicator. Preserve the hybrid 3D Moon / precise 2D south-pole map concept. Include the UTC control, selected site, Point Passport, Sun/Earth geometry, local-sky diagram, and an entry point to Method & Data. Return a component inventory and identify where the design follows the spec. Do not invent other metrics or screens.
```

### Prompt B — Critique the visual result

```text
Audit the current design against DESIGN.md and the UI_UX_MASTER_SPEC.md acceptance checklist. Be specific. Identify: token violations, unreadable typography, weak hierarchy, excessive card treatment, viewport overflow, unclear UTC state, missing data/quality labels, misleading scientific implication, keyboard/accessibility gaps, fake controls and non-responsive desktop-to-mobile transformations. Fix the highest-impact issues without changing the product scope or inventing new science.
```

### Prompt C — Build the static shell in Next.js

```text
Inspect the current repository, then implement only Phase 0 (static visual shell) from NEXTJS_IMPLEMENTATION_GUIDE.md. Use the existing package manager and stack. Create reusable AppShell, navigation, UTC-control visual shell, SpatialWorkspace, PointPassport, MetricBlock, local-sky diagram and Method/Data summary as reasonable features/components. Use design tokens and responsive CSS. Any values are illustrative and must be labelled DEMO DATA. No real scientific calculation, API, database, login, trajectory, terrain claims, timeline results or unsupported packages. Ensure every visible control is either functional as a prototype interaction or explicitly disabled with an explanation. Run available lint/typecheck/build checks and report actual results.
```

### Prompt D — Add interaction and state

```text
Implement Phase 1 only. Add candidate-site selection, UTC input validation, shared selected site/time state and synchronized panel context. Keep the exact same timestamp across the details and local-sky diagram. Invalid input must preserve the last valid epoch and show a useful message. Protect against stale async responses if requests exist. Do not connect fake science. Preserve layout/tokens/accessibility and include unit tests for UTC parsing and selection-state behavior.
```

### Prompt E — Add the 2D spatial experience

```text
Implement Phase 2: add the south-pole map as a first-class view, with explicit projection/orientation/legend conventions, selected-site marker and keyboard-accessible candidate list. Any invented basemap or coordinates must be labeled illustrative. Do not claim terrain accuracy from a visual texture. Keep the app usable when WebGL is disabled. Verify responsive behavior and map interaction via tests or a documented manual checklist.
```

### Prompt F — Add 3D only after the 2D workflow works

```text
Implement the 3D lunar globe as progressive enhancement. Inspect the existing stack before selecting/installing Three.js or React Three Fiber. Load the renderer client-side only; include loading, failure and unsupported-WebGL fallbacks; provide reset/recenter; do not autoplay rotation; provide accessible candidate list selection. The surface texture is for visual orientation only, never scientific terrain input. Keep scene code separate from metric computation. Report bundle/dependency trade-offs.
```

### Prompt G — Connect a real result

```text
Before changing code, read API_CONTRACTS.md, SCIENCE_FEASIBILITY.md, VALIDATION_PLAN.md and the implemented API types. Connect only one supported point + UTC epoch to the real response. Display all units, method, quality, source/data provenance and validation status. Handle loading, partial results, missing coverage, invalid input and errors. Do not rename or reinterpret fields without an explicit contract change. Add a test proving an old request cannot overwrite the latest selection. If the science contract or evidence is incomplete, stop at the boundary and list what must be resolved; do not fill the gap with plausible numbers.
```

### Prompt H — Compare screen

```text
Implement Compare using the existing shared UTC state and typed result contract. Limit to 2–4 sites. Use a legible responsive comparison matrix with shared metric order, units, per-site coverage/method labels, missing values and mismatch warnings. Do not calculate a hidden overall winner. Add a test for same-epoch comparison and mixed geometry-only/terrain-aware warnings.
```

### Prompt I — QA and polish

```text
Perform a quality pass against the complete UI spec without adding features. Test 320, 375, 768, 1024, 1280 and 1440px. Verify no page horizontal overflow, readable labels, visible UTC, clear DEMO DATA, loading/empty/partial/error states, keyboard path, focus states, dialog focus, reduced motion, non-color-only states, WebGL fallback and accessible diagram/chart alternatives. Run lint/typecheck/tests/build and report only checks actually run. Fix issues rather than merely listing them when safe to do so.
```

## 4. Tool-specific use (keep the source of truth the same)

- **v0:** give `DESIGN.md` plus the current screen section of `UI_UX_MASTER_SPEC.md`; ask for one screen or component at a time. When exporting/connecting to a project, keep tokens and source specs in the repo so later iterations cannot drift.
- **Lovable:** use the master prompt and screenshots/spec sections as the product contract. Once the layout is acceptable, sync/export the code and continue in the actual repository. Audit dependencies, routes and data assumptions instead of accepting them blindly.
- **Bolt:** request the exact framework (Next.js App Router + TypeScript) at the start and confirm the exported project uses that stack before investing in polish. If a generator selects a different framework, stop and decide whether portability or the current prototype is the priority before continuing.
- **Google AI Studio:** use Build mode for rapid iteration if appropriate; keep code in a GitHub repository or export a ZIP regularly. Treat the design docs as files/source context, not just a one-time prompt.
- **Google Stitch:** use `DESIGN.md` as the portable design-system guide, and generate a single screen first. Keep an exported visual as reference, then implement/verify real behaviors in the Next.js repository.
- **Claude Code / Codex / OpenCode / other repository agents:** make `AGENTS.md` and `DESIGN.md` easy to discover at repository root. Ask for one bounded slice, request tests and screenshots/manual viewport checks, and require a changed-file/check report.

Tool capabilities and menus change. If a particular tool cannot preserve files, export cleanly or produce Next.js, use it for visual exploration only and move the approved design into the canonical repository.

## 5. How to prevent design drift across agents

- Keep one canonical `DESIGN.md` and one master UI spec in source control.
- Use a short task prompt pointing to those files rather than rewriting the entire spec in each message.
- Have the agent name the spec sections it is implementing.
- Review screenshots at fixed viewport widths against the acceptance list.
- Require design-token reuse; disallow one-off random hex values.
- Have a second agent audit, not re-generate everything from scratch.
- Keep science/API contracts separate from visual creativity.
- Update docs when an intentional product decision changes, not each time an agent has a new stylistic idea.
