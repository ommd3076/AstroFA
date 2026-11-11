# Project: PaceOS Hardware Telemetry UI Overhaul for AstroFA

## Architecture
AstroFA combines formal Theory of Computation (automata theory, $\varepsilon$-NFA $\to$ DFA $\to$ Minimized DFA) with observational celestial mechanics (Three.js 3D celestial sphere, Astronomy Engine). The presentation layer is overhauled into a tactile hardware telemetry instrument panel inspired by Braun and Teenage Engineering consoles (OP-1, Field, EP-133), replacing SaaS clichés with discrete, quantized telemetry while preserving 100% of functional logic, calculations, event handlers, and state management.

### Global Visual & Token Architecture
- **Chassis Shell**: `--bg-shell: #ECEEF2` (molded polymer cool off-white chassis)
- **Recessed Bento Tray**: `--bg-tray: #E2E5EC` (milled hardware channel cavity with strict 6px gaps)
- **Module Cards**: `--bg-card: #F5F6F8` (elevated instrument cards, 12px radius, 1px subtle border, zero drop shadows)
- **Single-Signal Electric Cobalt**: `--signal-cobalt: #1D55F5` (active dots, accept states, primary CTAs), `--signal-mid: #6892F6`, `--signal-surface: #C7D5EC`
- **Achromatic Ink**: `--ink-primary: #181A20`, `--ink-secondary: #525866`, `--ink-muted: #8C93A0`
- **Tri-Tier Monospace Typography**:
  * Tier 1 — Dot-Matrix LED Readouts (`Doto:wght@600;700;800`): secondary time windows, fixed session blocks, pixelated directional arrows, star IDs, state badges.
  * Tier 2 — High-Scale Technical Monospace (`IBM Plex Mono:wght@400`): primary KPIs (32px-40px Regular), countdowns, with units in 10px uppercase superscript aligned to cap-height.
  * Tier 3 — All-Caps Tracked Micro-Labels (`IBM Plex Mono:wght@500;600`): strictly UPPERCASE (10px-13px) with tracking 0.06em to 0.10em across all section titles, navigation links, axis markers, and tags.
- **HUD Reticles**: Precision corner-bracket reticles (`[ ]`) with 4px x 4px corner ticks wrapping inputs, filters, search omnibar, and status badges.
- **Quantized Visualizations**: Zero continuous spline lines. 3x10 vertical dot-matrix columns, multi-band horizontal dot arrays (4 dots/hr), segmented pill barcodes (4-5 segments), and 5-dot LED arrays.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Token Matrix & Font Imports | Inject Google Fonts (Doto & IBM Plex Mono) into index.html; define CSS token matrix in index.css | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Universal Shell & Bento Layout | Overhaul App.tsx, index.css, and App.css to implement #ECEEF2 shell, recessed bento tray, and 6px gap grid | M1 | ORIGINAL_REQUEST §R1 |
| F3 | Machined Navigation & Controls | Replace HeaderNav and TimelineBar with tactile hardware rocker pills, HUD reticle search, and discrete buttons | M1 | ORIGINAL_REQUEST §R1, R2 |
| F4 | 3D Sky Canvas Telemetry & HUD | Restyle SkyCanvas 3D overlays, cardinal compass ruler, star inspection reticles, and StarInspector drawer | M2 | ORIGINAL_REQUEST §R1, R2 |
| F5 | Trace Mode & Recognition HUD | Overhaul TraceHud, PatternAnalysisModal, and RecognitionResultsModal with quantized barcodes and Doto readouts | M2 | ORIGINAL_REQUEST §R1, R2 |
| F6 | Automata Lab Bento Console | Restyle AutomataLab container, tab switchers, and ExportModal into recessed bento hardware modules | M3 | ORIGINAL_REQUEST §R1, R2 |
| F7 | Automata State Graphs & Math | Overhaul NfaView, DfaView, MinimizedDfaView, FormalDefinitionView, and TransitionTableView with tactile presentation | M3 | ORIGINAL_REQUEST §R1, R2 |
| F8 | Discrete Simulator Tape & Stepper | Replace range sliders in SubsetConstructionView and SimulatorView with quantized LED step arrays and tape cells | M3 | ORIGINAL_REQUEST §R1, R2 |
| F9 | Constellation Catalog Bento Grid | Restyle ConstellationExplorer 88-constellation card grid into 4-column recessed bento cards with dot grids | M4 | ORIGINAL_REQUEST §R1, R2 |
| F10 | Sky Tonight & Time Telemetry | Convert SkyTonight 24-hr slider into multi-band horizontal dot matrix timeline (18:00–04:00, 4 dots/hr) | M4 | ORIGINAL_REQUEST §R1, R2 |
| F11 | Hunt Mode & Image Lab Sliders | Convert HuntMode HUD and ImageLab preprocessing controls (Denoise, Contrast, Sharpen) into tactile hardware sliders | M4 | ORIGINAL_REQUEST §R1, R2 |
| F12 | Academic Viva Walkthrough & Credits | Restyle AcademicWalkthrough and CreditsModal into strict monospace technical documentation cards | M4 | ORIGINAL_REQUEST §R1, R2 |
| F13 | Strict Non-Regression Verification | Verify 100% preservation of Three.js canvas, automata algorithms, geometry projection, and state hooks | M_FINAL | ORIGINAL_REQUEST §R2 |
| F14 | Comprehensive E2E Testing Suite | Author and execute 4-tier E2E tests validating visual tokens, typography, and functional invariants | M_TEST | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M_TEST | E2E Testing Suite | Create E2E test infra and test cases (Tiers 1-4) across visual tokens and functionality | none | DONE |
| M1 | Core Tokens & Universal Shell | index.html, src/index.css, src/App.css, src/App.tsx, HeaderNav.tsx, TimelineBar.tsx | none | DONE |
| M2 | Sky Viewport & Trace Telemetry | SkyCanvas.tsx, StarInspector.tsx, TraceHud.tsx, PatternAnalysisModal.tsx, RecognitionResultsModal.tsx | M1 contract | DONE |
| M3 | Automata Lab Hardware Console | AutomataLab.tsx, NfaView.tsx, EpsilonClosureView.tsx, SubsetConstructionView.tsx, DfaView.tsx, MinimizedDfaView.tsx, SimulatorView.tsx, FormalDefinitionView.tsx, TransitionTableView.tsx, ExportModal.tsx | M1 contract | DONE |
| M4 | Observational Tools & Image Lab | ConstellationExplorer.tsx, SkyTonight.tsx, HuntMode.tsx, ImageLab.tsx, AcademicWalkthrough.tsx, CreditsModal.tsx | M1 contract | DONE |
| M_FINAL | E2E Verification & Adversarial Hardening | Pass 100% E2E test suite, adversarial coverage audit, forensic integrity review | M1, M2, M3, M4, M_TEST | IN_PROGRESS |

## Interface Contracts

### CSS Token Matrix Contract (M1 $\to$ All Milestones)
Every downstream view and component consumes these exact CSS variables defined in `src/index.css`:
- `--bg-shell`: `#ECEEF2`
- `--bg-tray`: `#E2E5EC`
- `--bg-card`: `#F5F6F8`
- `--bg-card-subtle`: `#EDF0F5`
- `--bg-pill-neutral`: `#E6E9EF`
- `--bg-pill-active`: `#E0E8F9`
- `--bg-viewport`: `#060A14`
- `--ink-primary`: `#181A20`
- `--ink-secondary`: `#525866`
- `--ink-muted`: `#8C93A0`
- `--signal-cobalt`: `#1D55F5`
- `--signal-mid`: `#6892F6`
- `--signal-surface`: `#C7D5EC`
- `--dot-inactive`: `#C8CCD4`
- `--dot-active`: `#1D55F5`
- `--reticle-tick`: `#8FA4C4`
- `--font-mono`: `'IBM Plex Mono', 'JetBrains Mono', monospace`
- `--font-dot`: `'Doto', monospace`

### Utility Classes Contract (M1 $\to$ All Milestones)
- `.hud-reticle`: wraps inputs, filter pills, and status badges with 4px x 4px corner ticks (`--reticle-tick`).
- `.bento-shell`: outer viewport shell (`bg-[var(--bg-shell)]`).
- `.bento-tray`: recessed grid tray (`bg-[var(--bg-tray)] gap-[6px] p-[6px]`).
- `.bento-card`: module card (`bg-[var(--bg-card)] rounded-[12px] border border-white/70`).
- `.font-dot`: dot-matrix LED font for Tier 1 readouts.
- `.telemetry-kpi`: Tier 2 32-40px Regular 400 monospace with 10px superscript units.
- `.telemetry-label`: Tier 3 UPPERCASE micro-labels with letter-spacing `0.08em`.

### Logic Preservation Contract (All Milestones)
- **ZERO modifications** to:
  * `src/automata/*` (NFA, epsilonClosure, determinize, completeDfa, minimize, simulate, prefixMatcher)
  * `src/geometry/*` (projection, normalize, quantize, similarity)
  * `src/recognition/*` (matcher)
  * `src/astronomy/*` (coordinates)
  * `src/stores/useAstroStore.ts` (state definitions, getters, setters, action dispatchers)
- **Strict Verification**: Every worker must run and pass `npm test` (all 29 unit tests pass) and `npm run build` (`tsc -b && vite build` succeeds with 0 errors).

## Code Layout
- `index.html`: Google Fonts `<link>` tags, page title, viewport.
- `src/index.css`: Tailwind v4 theme bridge, `:root` CSS token matrix, global body styles.
- `src/App.css`: Hardware telemetry utility classes (.hud-reticle, .bento-*, .telemetry-*).
- `src/App.tsx`: Root shell container, view switching router.
- `src/components/`: Universal chrome components (`HeaderNav.tsx`, `TimelineBar.tsx`, `StarInspector.tsx`, `CreditsModal.tsx`).
- `src/sky/`: 3D canvas viewport (`SkyCanvas.tsx`).
- `src/features/traceMode/`: Trace HUD and analysis modals (`TraceHud.tsx`, `PatternAnalysisModal.tsx`, `RecognitionResultsModal.tsx`).
- `src/features/automataLab/`: Automata lab sub-views (`AutomataLab.tsx`, `NfaView.tsx`, `DfaView.tsx`, etc.).
- `src/features/constellationExplorer/`: Constellation card grid (`ConstellationExplorer.tsx`).
- `src/features/skyTonight/`: Topocentric tonight view (`SkyTonight.tsx`).
- `src/features/huntMode/`: Challenge game mode (`HuntMode.tsx`).
- `src/features/imageLab/`: Astrophotography star detection lab (`ImageLab.tsx`).
- `src/features/academic/`: College viva academic demonstration (`AcademicWalkthrough.tsx`).
- `tests/`: Automated test suites (`geometry.test.ts`, `automata.test.ts`, `astronomy.test.ts`, `recognition.test.ts`, plus E2E tests).
