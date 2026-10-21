# AGENTS.md — LunaMission UI Build Rules

Read this file before editing UI code. Then read `DESIGN.md` and `docs/ui/UI_UX_MASTER_SPEC.md` (adjust the path to wherever the packet is stored).

## Mission

Build a clear, responsive scientific exploration interface for comparing lunar south-pole candidate locations and time-dependent Sun/Earth geometry. The product should feel like a premium scientific observatory: purposeful, quiet, high-contrast, evidence-led, never like a generic admin dashboard or a sci-fi game HUD.

## Non-negotiable rules

1. **Do not invent science.** No fabricated metrics, unsupported percentages, guessed event windows, fake terrain coverage, fake validation badges, “safe landing” scores or operational RF guarantees. Static fixtures must say `DEMO DATA` / `ILLUSTRATIVE` in the UI and source code.
2. **The server/domain layer is authoritative for scientific values.** UI components format and explain supplied results; they do not independently calculate mission science. UI-only geometry is allowed for illustrative diagrams and must be labeled accordingly.
3. **Keep the app portable.** Use ordinary Next.js App Router + TypeScript + React patterns. Avoid platform-specific dependencies, proprietary APIs, or a design tightly coupled to one generator. Do not assume deployment to one vendor.
4. **Prefer small feature modules.** Split code by product capability, not by every tiny JSX fragment. Extract a component when it has a clear contract, is reused, has non-trivial state, or is independently testable. Avoid a giant page component and avoid creating dozens of trivial wrapper components.
5. **Respect the design system.** Read `DESIGN.md`, use CSS variables/design tokens, and preserve the palette roles. Do not invent new colors, shadows, radii, fonts, or spacing values when a token fits.
6. **Responsive is a requirement, not a follow-up.** Verify at 320, 375, 768, 1024, 1280 and 1440 CSS pixels. No page-level horizontal overflow. Keep critical controls available on narrow screens.
7. **Accessible by default.** Semantic HTML, explicit labels, keyboard operation, visible focus, non-color-only states, reduced-motion support and usable chart data alternatives. Target WCAG 2.2 AA where applicable.
8. **Do not fake function.** Every visible button/control must work, be explicitly disabled with an explanation, or be identified as a future capability. No dead buttons that look production-ready.
9. **Preserve a single time basis.** UTC is canonical. Never silently reinterpret typed local time as UTC. Show `UTC` alongside the selected timestamp and synchronize all time-dependent panels to the same selected epoch unless the user explicitly chooses otherwise.
10. **Treat unknown as a valid state.** Missing data is not zero, false, no event, or clear visibility. Show `Unavailable`, `Not assessed`, or `Indeterminate` with the reason when known.
11. **Keep visual and scientific evidence separate.** A rendered Moon texture is for orientation, not elevation data. Geometric Earth visibility is not proof of RF link success. Theoretical light-time is not total operational latency. Geometry-only output is not terrain-aware.
12. **Keep code easy to move.** No hidden tool-generated runtime, undocumented global CSS dependencies, remote-only assets required for the initial screen, or hard-coded absolute deployment URLs. Use local assets or a documented fallback.
13. **Avoid overengineering.** No database, state-management framework, 3D engine, charting library, UI kit or animation library unless it solves a real current requirement. Reuse what's already in the repository. Add a dependency only with a brief reason.
14. **Do not overwrite unrelated user code.** Inspect the repo before editing. Preserve package manager, routing structure, aliases, linting and established component conventions where reasonable.

## Implementation expectations

- Use TypeScript for product code. Avoid `any`; define narrow data/view-model types and validate external data at runtime at the API boundary.
- Use Server Components by default. Add `"use client"` only to interactive leaf components or views that need browser APIs, local interaction state, canvas/WebGL or effects.
- 3D/WebGL must be client-only and dynamically imported with a useful fallback. The core interface must remain understandable if WebGL is unavailable.
- Keep scientific API clients, formatters and state logic out of presentational components.
- Use named functions/components with clear props. Avoid duplicated metric markup and duplicated state logic.
- Use stable keys, meaningful empty/loading/error states, request cancellation or stale-response protection, and no logging of sensitive data.
- Use `Intl.DateTimeFormat` only with an explicit UTC time-zone option for canonical values; never rely on the user's default zone for a displayed mission epoch.
- Never encode status only with color. Pair state colors with text, icon/shape or labels.
- Do not add a new font dependency solely for decorative effect. Use the specified font stacks and ensure sensible fallbacks.

## Required states for any data-backed panel

`idle/empty`, `loading`, `success`, `partial/unavailable`, `error`. Add `stale`/refreshing where relevant. Keep the last valid selection visible during a failed update, but do not misrepresent old data as belonging to the new selection.

## Workflow for each task

1. Inspect the repository and relevant code before changing anything.
2. Read the applicable spec section and identify the acceptance criteria.
3. State a compact implementation plan in the task output.
4. Implement the smallest coherent increment.
5. Run the available formatter, lint, typecheck, tests and production build. Do not claim a check passed if it was not run.
6. Inspect the result at desktop and mobile widths; fix overflow, clipping, inconsistent tokens and poor focus order.
7. Report changed files, behavior, commands actually run, failures, and unresolved assumptions.
8. Update the spec only when the product decision intentionally changes; explain why.

## Definition of done

A UI task is not done just because it compiles. It must meet relevant functional, responsive, accessibility, visual-consistency and scientific-honesty acceptance criteria from `UI_UX_MASTER_SPEC.md`.
