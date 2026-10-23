# LunaMission — 3D Scientific UX & Implementation Roadmap

**Package version:** 1.0  
**Prepared:** 2026-10-23  
**Purpose:** Define a realistic, interactive, data-grounded 3D lunar south-pole experience and coordinate parallel implementation work without letting agents produce conflicting or untestable changes.

## Start here

1. Read `MASTER_3D_EXPERIENCE_SPEC.md` as the product and interaction source of truth.
2. Read `NASA_DATA_AND_SCIENCE_RESEARCH.md` before selecting assets or representing candidate regions.
3. Use `AGENT_WORKPLAN.md` as the task board. Update each task status, evidence, tests, and blockers as work proceeds.
4. Give `GOOGLE_AI_STUDIO_MASTER_PROMPT.md` to the main agent in the existing Google AI Studio project.
5. For parallel work, use `AGENT_PROMPTS.md`, assign non-overlapping file ownership, and integrate through the task dependencies.

## Project boundary

LunaMission is an **exploration and comparison decision-support prototype**. It is not flight-certified mission operations software, and the UI must not imply operational readiness. It can expose validated measurements and well-qualified exploratory analysis; it must not invent safety scores, terrain coverage, trajectory/fuel results, radio-link success, or survival probabilities.

## Source-of-truth precedence

1. Existing validated scientific implementation and schemas.
2. Accepted project decisions, API contracts, and current data manifest.
3. `MASTER_3D_EXPERIENCE_SPEC.md` for product behavior.
4. This research package for external references and proposed work.
5. Screenshots are visual references only; they do not validate numerical data or coordinate transformations.

## Package contents

- `MASTER_3D_EXPERIENCE_SPEC.md` — complete scene, camera, interaction, scientific, edge-case, UX, architecture, and acceptance specification.
- `NASA_DATA_AND_SCIENCE_RESEARCH.md` — researched official data sources, their intended uses and limitations, candidate-region versioning notes, and visual/scientific design implications.
- `AGENT_WORKPLAN.md` — dependency-aware, status-trackable task list for parallel agents.
- `AGENT_PROMPTS.md` — focused instructions for research, rendering, geometry, UX/state, and QA agents.
- `GOOGLE_AI_STUDIO_MASTER_PROMPT.md` — a single implementation prompt for the existing project.

## How agents should track progress

Use the checkbox and status field in `AGENT_WORKPLAN.md`. Every task should record: `Owner`, `Status`, `Files/areas owned`, `Dependencies`, `Evidence`, `Tests run`, and `Blockers`. Only mark a task Done when its acceptance criteria are met and evidence is recorded. If the agent cannot verify a result, mark it Blocked or Needs Review—never silently mark it complete.
