---
version: alpha
name: LunaMission Scientific Observatory
description: A restrained, high-credibility interface for visual exploration of lunar south-pole locations and Sun/Earth geometry.
colors:
  canvas: "#070B12"
  surface: "#0C1320"
  surface-raised: "#111C2B"
  surface-strong: "#172438"
  border: "#26364A"
  border-subtle: "#1B293B"
  text-primary: "#F2F6FC"
  text-secondary: "#B5C2D3"
  text-muted: "#8191A7"
  text-disabled: "#58677B"
  sun: "#F3CC70"
  earth: "#8CCBFF"
  selected-site: "#70D6C5"
  focus: "#A6D9FF"
  success: "#83D6AA"
  warning: "#F2C66D"
  danger: "#FF928C"
  info: "#8CCBFF"
  data-demo: "#C3A6FF"
typography:
  display:
    fontFamily: "Inter, Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  heading-1:
    fontFamily: "Inter, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 620
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  heading-2:
    fontFamily: "Inter, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
  heading-3:
    fontFamily: "Inter, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  body-small:
    fontFamily: "Inter, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Inter, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.035em"
  numeric:
    fontFamily: "IBM Plex Mono, SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  none: "0px"
  xs: "4px"
  sm: "7px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  pill: "999px"
spacing:
  0: 0
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
components:
  panel:
    background: "{colors.surface}"
    border: "1px solid {colors.border-subtle}"
    radius: "{rounded.lg}"
  panel-raised:
    background: "{colors.surface-raised}"
    border: "1px solid {colors.border}"
    radius: "{rounded.lg}"
  primary-action:
    background: "{colors.text-primary}"
    foreground: "{colors.canvas}"
    radius: "{rounded.sm}"
  secondary-action:
    background: "{colors.surface-raised}"
    foreground: "{colors.text-primary}"
    border: "1px solid {colors.border}"
    radius: "{rounded.sm}"
  sun-marker:
    foreground: "{colors.sun}"
  earth-marker:
    foreground: "{colors.earth}"
  selected-site-marker:
    foreground: "{colors.selected-site}"
---

# Design System: LunaMission Scientific Observatory

## 1. Overview

LunaMission should feel like a scientific observatory at night: calm, precise, layered, and built for looking closely. The interface is cinematic because space and the Moon provide the subject, not because every card glows. It should inspire curiosity while preserving the discipline of an engineering tool.

The audience includes technical users, educators, students, and hackathon judges. Users should be able to understand what is being displayed, which epoch it represents, how a number was produced, and where data is incomplete. Use a strong visual hierarchy and compact technical metadata without turning the page into a dense telemetry wall.

The visual philosophy is **quiet interface, rich subject, explicit evidence**. A 3D Moon may be visually compelling; controls and evidence panels should stay restrained so the science remains legible. Large spatial views are surrounded by modestly sized panels. The interface is dark-first because the celestial subject and time-sensitive geometry are easier to read against a dark canvas, but do not treat dark UI as permission to use low-contrast grey text.

## 2. Colors

The palette uses deep ink surfaces, neutral high-legibility text, and a small set of semantic accents. Each chromatic accent has a stable meaning:

- **Solar gold** (`#F3CC70`): Sun direction, illumination cues, and Sun-related chart series only.
- **Earth blue** (`#8CCBFF`): Earth direction, Earth visibility and Earth-related series only.
- **Selected-site teal** (`#70D6C5`): selected candidate location, active site markers and selection outlines.
- **Demo purple** (`#C3A6FF`): illustrative or mocked data labels only. It must never imply a scientific status.
- **Success / warning / danger** represent application state only. They do not mean mission-safe / mission-unsafe.

Surfaces are separated mostly by value and a fine border, not by shadows. Use `canvas` for the page background, `surface` for panels, `surface-raised` for nested controls or emphasized areas, and `surface-strong` for selected/hover states where needed. Avoid using every surface token in every component; two to three surface levels per view are normally enough.

Never communicate a scientific state with color alone. Pair semantic color with a word label, shape, line style, symbol, or icon. Keep red for actual errors, not decoration.

## 3. Typography

Use a modern neutral sans-serif for interface copy and a monospace face for coordinates, timestamps, measurements, IDs and other precision-oriented values. System fallbacks are required, so the app remains portable when a preferred font is not installed or downloaded. Avoid decorative sci-fi fonts, all-caps body copy, exaggerated letter spacing, and tiny labels.

Headings are compact and confident, not enormous marketing-hero type. Numeric values should use tabular numerals where possible; use consistent decimal precision per metric. Units should be visually adjacent to values. Example: `12.4°` or `384,400 km`, never a number without its unit where the unit is meaningful.

## 4. Layout and spacing

Use a disciplined spacing scale based on 4px increments. Main content should use a centered fluid container with a practical maximum width around 1600px and responsive page gutters: about 24px on large desktop, 20px on tablet, and 16px on mobile; reduce only when the viewport requires it. Preserve space around the spatial view so the map/globe reads as the primary instrument.

On desktop, the Explorer uses a 12-column composition: approximately 7 columns for the map/globe and 5 for the point detail rail. The time explorer spans the content width below. On mobile, switch to a single-column sequence. Do not squeeze the desktop split layout into a narrow phone; reorder and simplify it.

Controls should be quiet and compact, with touch-friendly hit targets. Primary actions should be visually obvious but rare. The product is an instrument panel, not a page full of equally prominent cards.

## 5. Elevation and depth

Use flat surfaces, thin borders and subtle surface-value changes. Shadows may be used sparingly for popovers, menus and modal separation, but should remain low contrast. Do not use frosted glass, blurred glass panes, thick neon outlines, heavy glow or excessive parallax. A restrained atmospheric falloff inside the globe visualization is acceptable if it does not sit behind text or reduce contrast.

## 6. Shapes

Prefer modest corner radii: about 7px for controls, 10–14px for panels, and pill shapes only for compact state chips or segmented control tracks. Avoid making every object fully rounded. Data tables and visualization frames should feel precise, with clear alignment and predictable edges.

## 7. Components

- **Navigation:** simple top bar with product identity, primary destinations (`Explore`, `Compare`, `Method & Data`) and a persistent, legible UTC time control on desktop.
- **Panel:** solid surface, hairline border, consistent interior padding, clear heading and optional secondary action.
- **Metric block:** short label, large value, unit, a compact definition/help affordance, and calculation/coverage status when relevant.
- **Status label:** text plus optional icon/shape. Distinguish `Validated`, `Validation pending`, `Geometry-only`, `Terrain-aware`, `Unavailable`, `Demo data` and `Error`; only use `Validated` when a named reference/test passed.
- **Spatial view:** includes visible orientation/selection state, a way to reset the view, layer controls with explicit labels, and a non-3D point-selection alternative.
- **Local sky:** an explanatory diagram of Sun/Earth direction relative to a declared local-horizon convention; it must identify whether the geometry is illustrative or computed.
- **Timeline:** continuous x-axis with explicit UTC start/end, visible data gaps, selected epoch and event-window definitions. Do not turn unknown samples into a continuous filled area.
- **Comparison:** same epoch and shared settings by default, same metric order, units visible, per-site method/coverage labels and visibly unavailable cells.
- **Provenance:** expandable panel or dedicated route that shows method, source/version, time/frame conventions, coverage, quality, validation and limitations.
- **Feedback states:** loading, empty, partial, error and no-WebGL alternatives are designed states, not improvised text.

## 8. Do's and don'ts

### Do
- Let the Moon/map occupy meaningful space; keep information panels easy to scan.
- Make time and selected site visible, because they change the interpretation of every metric.
- Use the same color semantics everywhere.
- Label demo data visibly and persistently.
- Prefer restrained outlines and clear alignment over decorative cards.
- Make dense detail progressively disclosable without hiding important caveats.
- Keep keyboard focus visible and touch targets comfortable.
- Show unavailable/indeterminate states honestly.

### Don't
- Do not use neon cyberpunk, purple-blue gradient fog, fake radar sweeps, HUD reticles everywhere or decorative telemetry that looks scientific but communicates nothing.
- Do not display fabricated “survival %”, “landing safety” scores, made-up DTE windows or “RF quality” values.
- Do not show a global texture as if it were elevation/terrain analysis.
- Do not imply that Earth is radio-reachable simply because its geometric center appears above a simplified horizon.
- Do not present theoretical light-time as end-to-end operational latency.
- Do not shrink labels into unreadable metadata or use muted text for critical limitations.
- Do not use color alone for success, warning, missing data or selection.
- Do not add glassmorphism, gratuitous gradient borders, excessive rounded cards or animation because a generator defaults to them.

## 9. Motion

Motion is functional and short. Prefer 120–220ms for hover/focus/selection feedback and 180–300ms for panel transitions. Never animate metrics as if they are changing live unless the data is actually updating. Avoid constant orbiting/rotating of the Moon by default; movement should stop or reduce when requested and must respect `prefers-reduced-motion`. The selected point and timestamp should not jump unpredictably when data finishes loading.
