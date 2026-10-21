# Next.js Implementation Guide — Portable UI Architecture

This is a UI-focused implementation guide. It aligns with the proposed LunaMission stack but does not require a scientific service to exist before the interface shell can be built.

## 1. Default technology choices

- Next.js App Router + React + TypeScript.
- Tailwind CSS if the repository already uses it or the target generator scaffolds it; keep the actual visual values in CSS variables so styling is not tied to Tailwind class names.
- A small local component layer. Use the project's existing UI primitives first. If there is no component layer, shadcn/ui + Radix can be adopted selectively, not as a requirement for every UI element.
- Lucide React for icons if an icon package is needed; use one consistent icon set.
- Native SVG for the Local Sky diagram and lightweight map overlays when possible.
- Three.js / React Three Fiber only for the 3D globe phase. Load it client-side and lazily.
- A chart library only after timeline requirements and accessible alternatives are defined. Do not add charting in the visual-shell phase.
- Zod or the chosen shared runtime schema for validating API results at boundaries; keep the frontend types aligned with the API contract.

Avoid adding Redux, Zustand, TanStack Query, a 3D engine, multiple UI kits, animation libraries, or a large map package without a concrete need. React state and URL state are enough for the first prototype. A server-data library may be useful after real asynchronous endpoints are connected, but choose it intentionally.

## 2. Suggested portable repository layout

Adapt names to the existing repository; do not reshuffle a working codebase just to match this tree.

```text
src/
├── app/
│   ├── (product)/
│   │   ├── layout.tsx
│   │   ├── explore/page.tsx
│   │   ├── compare/page.tsx
│   │   └── method/page.tsx
│   ├── api/                         # Next route handlers / Hono mount, if present
│   ├── globals.css                  # CSS reset + token import only
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── primary-nav.tsx
│   │   └── page-header.tsx
│   ├── ui/                           # Button, Tabs, Badge, Input, Tooltip, Dialog
│   └── feedback/                    # Empty, Loading, Error, Unavailable
├── features/
│   ├── site-selection/
│   │   ├── site-selector.tsx
│   │   └── site-types.ts
│   ├── time-control/
│   │   ├── utc-time-control.tsx
│   │   ├── utc-format.ts
│   │   └── time-types.ts
│   ├── lunar-view/
│   │   ├── spatial-workspace.tsx
│   │   ├── view-mode-switcher.tsx
│   │   ├── south-pole-map.tsx
│   │   └── lunar-globe.tsx           # client-only / lazy loaded
│   ├── point-passport/
│   │   ├── point-passport.tsx
│   │   ├── metric-block.tsx
│   │   ├── local-sky-diagram.tsx
│   │   └── result-status.tsx
│   ├── comparison/
│   │   ├── comparison-matrix.tsx
│   │   └── comparison-types.ts
│   └── timeline/                    # Add only when supported by validated data
├── lib/
│   ├── formatters/
│   │   ├── angle.ts
│   │   ├── distance.ts
│   │   └── utc.ts
│   ├── api/                          # typed API client and runtime validation
│   └── utils/
├── contracts/                       # Shared UI-facing result schemas/types if useful
└── test/
```

**Architecture principle:** feature modules own UI behavior for one user capability; `components/ui` owns generic primitives; `lib` contains pure helpers and API adapters. Avoid circular dependencies between features. Keep server-specific imports away from client components.

## 3. Component boundaries

### App shell
Owns global navigation, page gutter, responsive frame, optional demo banner and global epoch display. It does not perform scientific calculations.

### UTC time control
Owns input parsing, field-level validation, display formatting and user interaction. It emits a valid normalized UTC value to shared state or the URL. It must not silently treat a string without a timezone as local time and then call it UTC. If the product supports date-only/time-only editing, combine fields under a documented rule.

### Site selection
Owns selecting/removing the current site and rendering the supported candidate list. It must expose the selected site identity as text. Avoid putting site selection only inside the WebGL canvas.

### Spatial workspace
Owns the visual frame, view toggle, legend, reset action and fallback. It should not own metric calculations. Keep the 2D map usable independently of the 3D renderer.

### Point Passport
Composes metric blocks and method status. It accepts a typed view model/result object. No astronomy formulas, frame conversions or horizon calculations belong here.

### Metric block
Displays label, value, unit, status, optional short definition and optional details action. It must handle unavailable/indeterminate values without displaying `0` by default.

### Local Sky diagram
Draws input values/orientation that are explicitly supplied by the scientific result or a fixture. It should be a deterministic visualization of data, not an independent geometry authority. Add `aria-label`/description and a visible textual value summary.

### Comparison matrix
Receives selected site results. It displays the same metric rows in the same order for all sites, flags missing data and notes method/coverage mismatches. Avoid doing hidden ranking.

## 4. State ownership

Use the simplest approach that satisfies synchronization. Do not create global state management until the current state graph requires it.

| State | Recommended owner | URL-shareable? |
|---|---|---|
| Selected route/view | Next.js route | Yes |
| Selected site IDs | URL query state plus a small shared controller where needed | Yes, when stable IDs exist |
| Selected UTC epoch | URL query state or a shared provider close to product layout | Yes |
| Local view mode (`3D` / `Map`) | local React state; query param only if shareable UX warrants it | Optional |
| Globe camera/orbit position | globe component-local state | Usually no |
| Open tooltip/dialog | component-local state | No |
| Fetched scientific result | API/data layer keyed by site + epoch + method/data versions | Cache policy required |
| Demo-mode flag | explicit configuration or route state | Must be visible when on |

Changing the site or UTC epoch triggers the same canonical selection used by all time-dependent panels. Do not make every panel maintain its own independent timestamp.

### Stale responses

For async calls, identify the request by the complete input identity. Cancel in-flight requests when possible or ignore late responses by request ID/abort signal. A late response for a previous site/epoch must never overwrite the current panel. If displaying an old result while reloading, label it as stale and preserve its epoch.

## 5. Result types and display state

Keep a UI-facing contract narrow, typed and explicit. For example (illustrative type shape only; sync with `API_CONTRACTS.md` before real integration):

```ts
type ResultAvailability =
  | { kind: "available"; value: number; unit: string }
  | { kind: "unavailable"; reason?: string }
  | { kind: "indeterminate"; reason?: string };

type MethodQuality = {
  mode: "geometry-only" | "terrain-aware" | "not-assessed";
  validation: "pending" | "passed" | "failed" | "not-applicable";
  sourceLabels: string[];
};

type PointConditionsViewModel = {
  siteId: string;
  siteLabel: string;
  epochUtc: string;
  coordinates: {
    latitudeDeg: number;
    longitudeDeg: number;
    convention: string;
  };
  sunElevation: ResultAvailability;
  sunAzimuth: ResultAvailability;
  earthElevation: ResultAvailability;
  earthVisibility: "visible" | "not-visible" | "indeterminate" | "unavailable";
  rangeKm: ResultAvailability;
  oneWayLightTimeSeconds: ResultAvailability;
  quality: MethodQuality;
  provenanceUrl?: string;
  dataMode: "live" | "demo";
};
```

This is not an API decision and should not be blindly copied over an already agreed `API_CONTRACTS.md`. It illustrates the core UI type-safety rule: missing/indeterminate values must be representable, and provenance/quality are part of the result model rather than an optional decorative afterthought.

## 6. CSS and token strategy

- Import `tokens/design-tokens.css` in the global stylesheet.
- Use CSS variables for colors, spacing, radii, typography, focus and semantic status.
- If Tailwind is used, map Tailwind theme values to these variables rather than duplicating hex values throughout classes/configs.
- Component styles should not create private values for shared tokens.
- Keep the design tokens framework-neutral so a generated UI can be moved to a plain Next.js app or another React build environment.

## 7. 3D view strategy

3D is a progressive enhancement, not a gate to the product.

- Import the 3D view dynamically with server-side rendering disabled when required by the renderer.
- Define a fixed, responsive container and avoid uncontrolled full-screen canvas expansion.
- Always provide loading and unsupported-WebGL states.
- Surface click selection must communicate the selected point in DOM content as well as canvas visuals.
- Add reset/recenter and safe camera controls; no auto-rotation as the default.
- Use the visual texture only for orientation. Never infer DEM elevation from it.
- Keep 3D rendering separate from science computations; feed it an explicit scene view model.
- Avoid loading high-resolution assets until required and measure bundle impact.

Example boundary (adapt to the repository's exact Next.js version):

```tsx
import dynamic from "next/dynamic";

const LunarGlobe = dynamic(
  () => import("./lunar-globe").then((module) => module.LunarGlobe),
  {
    ssr: false,
    loading: () => <div className="spatial-loading" aria-live="polite">Loading 3D view…</div>,
  },
);
```

Only use this pattern if the selected 3D package actually requires browser-only APIs. Do not add the dependency just to match the example.

## 8. Testing strategy

### Unit tests
- UTC parsing/normalization and invalid input behavior.
- Metric formatting, units and unavailable states.
- Status-label semantics.
- Local-sky visualization mapping and text equivalent.
- Comparison formatting and mismatch warnings.

### Component/integration tests
- Changing the selected site updates identity and requests/fixtures correctly.
- Changing UTC updates all time-dependent panels.
- Stale async response cannot overwrite a newer selection.
- Loading/error/unavailable/demo states are all rendered correctly.
- Keyboard operation for selectors, tabs and dialogs.

### End-to-end smoke tests
- Explore → select site → set UTC → inspect method info.
- Add 2 sites to Compare → confirm same epoch and visible missing/method differences.
- Narrow viewport can complete the core workflow.
- WebGL disabled/unavailable still leaves site selection possible.

Scientific calculation tests and reference validation belong in the science/API workstream; frontend tests must not pretend to validate equations.

## 9. Recommended delivery sequence

### Slice A — static shell
Implement app shell, routes, tokens, Explorer composition, navigation and responsive layout using conspicuously labelled fixture content. Get typography, panel density and site/time hierarchy right before 3D.

### Slice B — stateful prototype
Add site selection, UTC input validation, shared selected epoch, tabs and functional controls. Preserve state in the URL only when stable IDs and URL behavior are specified.

### Slice C — 2D spatial view
Add the south-pole map before investing heavily in 3D. Include a clear data/projection legend and non-map candidate list.

### Slice D — 3D progressive enhancement
Integrate global Moon view, test dynamic loading, keyboard alternative, camera reset, and fallback.

### Slice E — single real result
Connect one validated API result; show loading, error, quality, method and provenance correctly.

### Slice F — compare and timeline
Add comparison after the result contract is stable. Add timeline only when calculation/window behavior is validated.

### Slice G — quality gate
Run test/build checks, inspect 6 viewport widths, keyboard through the core path, test reduced motion and missing-data states, and report unresolved assumptions.
