# LunaMission — Portable UI/UX Specification Pack

**Purpose:** A tool-neutral, implementation-ready source of truth for designing and building LunaMission's responsive Next.js interface with v0, Lovable, Bolt, Google AI Studio / Stitch, Claude Code, Codex, OpenCode, or another capable UI/coding agent.

**Product direction:** Scientific observatory. Cinematic space visuals, precise controls, restrained surfaces, legible evidence. Hybrid 3D lunar globe + precise 2D south-pole map. Scientific credibility comes before visual spectacle.

## Start here

1. Read `AGENTS.md` — the rules every coding agent must follow.
2. Read `DESIGN.md` — the portable visual language and design tokens.
3. Read `UI_UX_MASTER_SPEC.md` — screens, behaviors, states, responsive rules and acceptance criteria.
4. Use `DIAGRAMS.md` to understand structure and interactions.
5. Use `NEXTJS_IMPLEMENTATION_GUIDE.md` when implementing in a repository.
6. Use `VIBE_CODING_PLAYBOOK.md` to prompt a visual generator or a coding agent without losing consistency.
7. Copy `tokens/design-tokens.css` and `tokens/design-tokens.json` into the app if useful. Treat `DESIGN.md` as the normative visual intent and CSS/JSON as implementation-friendly mirrors. If they disagree, fix the files rather than silently guessing.

## Recommended workflow

**Design first → build one screen → inspect responsive states → add meaningful interactions → connect real data → validate.** Do not ask a single prompt to generate the whole finished scientific platform in one pass. First generate the explorer shell, then refine it against this packet, then add the map/globe and individual scientific panels.

### For visual-first platforms

Start by giving the platform `DESIGN.md`, `UI_UX_MASTER_SPEC.md`, and the relevant diagrams. Ask it to generate a single high-fidelity **Explorer** screen that follows the spec, with clearly labelled illustrative data. Compare the result against the acceptance checklist before generating more screens. Export/sync the project, then keep the same files in the repository as living context.

### For a fresh Next.js repository or code agent

Copy this folder to `docs/ui/` (or keep `DESIGN.md` and `AGENTS.md` at the repository root and place the remaining specs under `docs/ui/`). Tell the agent to read `AGENTS.md` first. Start with Phase 1 in `NEXTJS_IMPLEMENTATION_GUIDE.md` and ask for one coherent, runnable vertical slice at a time.

## Source-of-truth hierarchy

1. Product/scientific constraints in the current project docs and `UI_UX_MASTER_SPEC.md`.
2. Visual identity and tokens in `DESIGN.md`.
3. Implementation conventions in `AGENTS.md` and `NEXTJS_IMPLEMENTATION_GUIDE.md`.
4. Current code and test behavior.
5. A tool's defaults or generated design choices.

If a generated design conflicts with science constraints, accessibility, or explicit UI rules, the generated design loses. If the code and the spec disagree, flag the difference and update the spec intentionally.

## What this packet does not claim

This is a UI/UX and frontend implementation contract, not evidence that the scientific computation, terrain data, SPICE kernels, map coverage, or API are already validated. The UI must visibly distinguish real validated results, geometry-only results, unavailable results, and illustrative demo content.

## Tool portability notes

- `DESIGN.md` uses the open, plain-text format described by Google Labs' `design.md` project; the format is currently described as alpha and may evolve: https://github.com/google-labs-code/design.md
- v0 is a natural-language UI/app generation workflow: https://v0.app/docs/quickstart
- Google AI Studio Build mode documents code editing, ZIP download and GitHub sync: https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- Google Stitch supports design-system guidance and design-to-code workflows: https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/

These are workflow references, not guarantees that every platform accepts every file format. When a tool cannot ingest Markdown or a folder, paste the relevant section/prompt and attach only the supporting files it accepts.
