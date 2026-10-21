# Prompt to start with any UI generator

Attach or paste `DESIGN.md`, `UI_UX_MASTER_SPEC.md`, and `DIAGRAMS.md` alongside this prompt. For code generation, also include `AGENTS.md` and `NEXTJS_IMPLEMENTATION_GUIDE.md`.

```text
Create the LunaMission Explorer UI from the supplied design specification. The source of truth is the attached DESIGN.md, UI_UX_MASTER_SPEC.md and DIAGRAMS.md—not your default template.

Use the visual direction “scientific observatory”: cinematic lunar subject, restrained dark instrument surfaces, high legibility, evidence-first. The core layout is a hybrid 3D Moon + precise 2D south-pole map, with a Point Passport, Sun/Earth geometry, local-sky explanation, explicit UTC time, and a Method & Data entry point. On desktop the spatial view and details sit side-by-side with time analysis below; on mobile the workflow is deliberately single-column.

Use the exact design-token roles and avoid generic SaaS styling, excessive card grids, glassmorphism, neon effects, and decorative data. Implement a clear visual hierarchy, real labels, status/quality indicators and the specified responsive states.

The project’s scientific data has not necessarily been validated. Do not fabricate science or imply a computation is real. If you need placeholder metrics, show a persistent DEMO DATA / ILLUSTRATIVE label next to them and make the fixtures replaceable by typed data later. Unknown means unavailable/indeterminate, not zero.

If generating code, use a portable Next.js App Router + TypeScript structure, reusable feature components, CSS variables for tokens, semantic HTML and keyboard-accessible controls. Inspect existing files before changes, avoid needless dependencies, do not put everything in one component, and keep 3D rendering separate from scientific data. First build only the Explorer shell; do not implement unrelated pages or backend systems.

Deliver: (1) the initial Explorer screen at desktop and mobile sizes, (2) a component/file plan, (3) a list of assumptions, and (4) a checklist of where the output meets the spec. Do not claim tests or scientific validation unless actually completed.
```
