# LunaMission — UI/UX Diagrams

These diagrams are written in Mermaid so they remain editable in Markdown-capable environments and can be supplied directly to coding/design agents. They are structural references, not a claim that the science pipeline is already implemented.

## 1. User journey

```mermaid
flowchart TD
    A[Open Explorer] --> B{Demo or live data?}
    B -->|Demo| C[Show persistent DEMO DATA label]
    B -->|Live| D[Show API/data status]
    C --> E[Choose supported site]
    D --> E
    E --> F[Choose date and time in UTC]
    F --> G[Request / load point conditions]
    G --> H{Result state}
    H -->|Available| I[Show metrics, units, method and quality]
    H -->|Partial| J[Show available metrics + missing reasons]
    H -->|Error| K[Show actionable error; preserve last valid selection]
    I --> L[Inspect local-sky diagram]
    J --> L
    L --> M[Open Method & Data]
    M --> N{Compare another site?}
    N -->|Yes| O[Add 2–4 sites at shared UTC epoch]
    N -->|No| P[Continue exploring]
    O --> Q[Review same metrics and differences in coverage]
```

## 2. Explorer screen regions

```mermaid
flowchart TB
    subgraph Shell[App shell]
      Nav[Brand + Explore / Compare / Method & Data + UTC control]
      subgraph Main[Main Explorer content]
        subgraph Left[Spatial workspace ~60% desktop]
          Switch[3D Moon / South-pole map switcher]
          Canvas[Globe or 2D map]
          MapControls[Reset • layers • legend • selected site]
          Alt[Candidate list / coordinate alternative]
        end
        subgraph Right[Point Passport ~40% desktop]
          Identity[Point ID • coordinates • coverage / quality]
          Sun[Sun geometry • units • method]
          Earth[Earth geometry • range / theoretical light-time]
          Sky[Local-sky explanatory diagram]
        end
      end
      Time[Time Explorer • UTC range • series / gaps • event definitions]
      Provenance[Method & Data summary]
    end
```

## 3. Component hierarchy

```mermaid
flowchart TD
  Root[Next.js App Router] --> Layout[Product Layout]
  Layout --> Shell[AppShell]
  Shell --> Header[PrimaryNavigation + UtcTimeControl]
  Shell --> Page[Route Page]
  Page --> Explore[ExplorePage]
  Page --> Compare[ComparePage]
  Page --> Method[MethodDataPage]
  Explore --> Workspace[SpatialWorkspace]
  Workspace --> Mode[ViewModeSwitcher]
  Workspace --> Map[SouthPoleMap]
  Workspace --> Globe[LunarGlobe - client-only]
  Workspace --> Site[SiteSelector / candidate list]
  Explore --> Passport[PointPassport]
  Passport --> Metrics[MetricBlock × N]
  Passport --> Sky[LocalSkyDiagram]
  Passport --> Quality[Quality / Coverage / Method labels]
  Explore --> Timeline[TimeExplorer - only when scientifically supported]
  Compare --> Matrix[ComparisonMatrix]
  Method --> Sources[Provenance and Method Details]
  Shell --> Feedback[Loading / Empty / Error / Unavailable]
```

## 4. Data flow and trust boundary

```mermaid
flowchart LR
  U[User: site + UTC epoch] --> S[Shared selection state / URL state]
  S --> V[UI view model request]
  V --> API[Typed API boundary]
  API --> SCI[Scientific service / validated computation]
  SCI --> R[Result + units + method + provenance + quality]
  R --> VM[View-model formatter]
  VM --> P[Point Passport]
  VM --> L[Local-sky diagram]
  VM --> T[Timeline, if supported]
  VM --> C[Comparison matrix]
  R --> D[Method & Data details]
  API -. request validation errors .-> E[Structured UI error]
  SCI -. missing coverage / failed validation .-> Q[Unavailable or qualified result]
```

**Boundary rule:** rendering may illustrate geometry, but must not become a competing source of truth for scientific values. Display components receive explicit values, units and quality state.

## 5. Responsive composition

```mermaid
flowchart TB
  subgraph Desktop[≥ 1024px: two-column workbench]
    direction LR
    D1[Spatial view ~60%] --- D2[Point Passport ~40%]
    D3[Time Explorer full width below]
  end
  subgraph Tablet[768–1023px: adaptive layout]
    T1[Spatial view]
    T2[Point Passport in next row or narrower rail only when readable]
    T3[Time Explorer]
    T1 --> T2 --> T3
  end
  subgraph Mobile[320–767px: single column]
    M1[Compact header / nav]
    M2[UTC control]
    M3[Site selection]
    M4[Map / 3D tabs + spatial view]
    M5[Point summary]
    M6[Sun / Local sky / Earth details]
    M7[Timeline if supported]
    M8[Method & Data]
    M1 --> M2 --> M3 --> M4 --> M5 --> M6 --> M7 --> M8
  end
```

## 6. Result-state behavior

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Loading: select site or change UTC
  Loading --> Success: complete result
  Loading --> Partial: some values unavailable
  Loading --> Error: request/calculation fails
  Success --> Loading: next selection
  Partial --> Loading: next selection
  Error --> Loading: retry / next selection
  Loading --> Stale: prior result kept while new request pending
  Stale --> Success: newest response arrives
  Stale --> Partial: newest partial response arrives
  Stale --> Error: newest request fails
```

## 7. Screen-by-screen prototype inventory

```mermaid
flowchart TD
  A[Explorer: required first] --> B[Compare: after site state works]
  A --> C[Method & Data: summary first, details as needed]
  A --> D[Loading / Empty / Error / Demo states]
  A --> E[Mobile layouts for all above]
  A -. only after valid time-series .-> F[Timeline / opportunity windows]
```

## Diagram conventions

- `Sun` is solar gold (`#F3CC70`); `Earth` is Earth blue (`#8CCBFF`); selected site is teal (`#70D6C5`).
- A dashed connector represents an optional/conditional capability or a boundary—not a completed scientific dependency.
- A `DEMO DATA` banner is a real UI state, not an annotation limited to a design preview.
