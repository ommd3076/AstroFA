# PaceOS Hardware Telemetry: E2E Test Infrastructure & Test Plan (TEST_INFRA)

## 1. Test Philosophy

The testing framework for the PaceOS Tactile Hardware Telemetry UI Overhaul follows an **opaque-box, requirement-driven, 4-tier verification methodology**. 

AstroFA unifies formal Theory of Computation ($\varepsilon$-NFA $\to$ DFA $\to$ Minimized DFA) with observational celestial mechanics (Three.js 3D celestial sphere, Astronomy Engine). The presentation layer overhaul replaces consumer SaaS clichés with tactile, quantized hardware telemetry inspired by Braun and Teenage Engineering consoles (OP-1, Field, EP-133). 

Because astronomical calculations and automata state reductions are mathematically rigorous, our testing philosophy mandates:
1. **Opaque-Box Requirement Verification**: Tests evaluate system behavior from the public interface contracts without relying on transient implementation internals. Visual styling, CSS token contracts, DOM classes, state machine invariants, and mathematical projections are verified against the authoritative specifications in `ORIGINAL_REQUEST.md` and `PROJECT.md`.
2. **Defensive Mathematical Invariants**: Calculations must be invariant under translation, scaling, and 2D rotation. Coordinates must not produce `NaN` or `Infinity` at singularity points (e.g. celestial poles, zero distances, horizon transitions).
3. **Discrete Quantization Fidelity**: Zero continuous lines or proportional typography are permitted. Every readout, KPI, and label must adhere to the tri-tier monospace hierarchy and quantized telemetry tokens.
4. **Strict Logic Non-Regression**: Presentation changes must preserve 100% of underlying functional logic, state machines, event handlers, and calculations. All baseline unit tests (29/29) must pass continuously.

---

## 2. 4-Tier Testing Methodology

The test suite is structured into four distinct verification tiers:

### Tier 1: Visual System, Design Tokens & Micro-Architecture Invariants
- **Scope**: CSS custom properties, Google Fonts imports, typography hierarchy, layout geometry, HUD reticle ticks, and color architecture.
- **Verification Targets**:
  - CSS token matrix declared in `:root` and `@theme` (`--bg-shell`, `--bg-tray`, `--bg-card`, `--ink-primary`, `--signal-cobalt`, etc.).
  - Google Fonts links in `index.html` (Doto:wght@600;700;800 and IBM Plex Mono:wght@400;500;600).
  - Universal monospace typography enforcement and complete absence of proportional sans-serif fonts in base rules.
  - Recessed cavity bento grid classes (`.bento-shell`, `.bento-tray`, `.bento-card`) enforcing strict 6px gaps, 12px card radii, and zero drop shadows.
  - HUD reticle utilities (`.hud-reticle`, `.hud-reticle-4corner`) with 4px corner ticks (`--reticle-tick`) and cobalt active states.
  - Single-signal electric cobalt (`#1D55F5`) color architecture and calibrated cool grey scale.
  - Quantized display typography classes (`.font-dot`, `.telemetry-kpi`, `.telemetry-label`, `.micro-label`).

### Tier 2: Boundary Conditions, Edge Cases & Mathematical Robustness
- **Scope**: System boundaries, zero/empty states, extreme numerical ranges, and error handling.
- **Verification Targets**:
  - Empty trace state (0 points) and graceful handling of `clearTrace` and `undoLastTracePoint`.
  - Single-star trace (1 point) handling without division by zero or NaN propagation in tangent projection.
  - Minimal two-point trace (1 edge) and zero-turning-angle handling.
  - Consecutive duplicate star clicks prevention.
  - Large asterism traces (10+ stars) and arbitrary polygons.
  - Coordinate singularities: North and South Celestial Poles ($\text{Dec} = \pm 90^\circ$), RA boundary wrap-around ($0^\circ \equiv 360^\circ$).
  - Horizon boundary crossings: Topocentric altitude transitions ($h = 0^\circ$, `isAboveHorizon` boolean state).
  - Unrecognized trace rejection: Random non-asterism point sequences rejected by DFA.
  - Constellation catalog completeness (88 IAU constellations) and coordinate boundaries.
  - Gamification state clamping (Hunt mode hint levels 0 to 3).

### Tier 3: Cross-Feature Interactions & Subsystem Integration
- **Scope**: Inter-module contracts, state synchronizations, and feature-to-feature pipelines.
- **Verification Targets**:
  - Trace Mode $\to$ Automata Lab handoff: Encoded symbol sequence generated from trace directly initializes the Automata Lab simulator tape.
  - Automata Lab Simulator execution: Stepping sequentially through symbols updates tape positions and reaches the designated accepting state.
  - Sky Tonight $\to$ SkyCanvas matrix synchronization: Time scrubber updates `observationDate`, synchronously re-evaluating topocentric coordinates and 3D transformation matrices.
  - Preset trace loading: `loadPresetTrace` populates star IDs, tangent points, triggers DFA recognition, focuses viewport coordinates, and routes to `'sky'`.
  - Hunt Mode workflow orchestration: `startNewHunt` selects target asterism, resets hint levels, hides constellation guides, and centers on target coordinates.
  - Star selection and inspector telemetry sync: `focusOnStar` updates store state and routes view.
  - Automata language equivalence: NFA $\to$ DFA $\to$ Minimized DFA pipeline language equivalence.

### Tier 4: Real-World Application Workflows & Forensic Verification
- **Scope**: End-to-end user workflows, scientific recognition, and academic examination demonstrations.
- **Verification Targets**:
  - Full Orion asterism trace and recognition: 8-star sequence through tangent plane projection, normalization, quantization, DFA evaluation to accept state, and Procrustes fit (< 0.05 residual).
  - Full Cassiopeia asterism trace and recognition: 5-star "W" shape traversal matching `Cas_fwd`.
  - Hopcroft DFA minimization mathematical proof: Validates state count reduction, total transition matrix completeness, absence of unreachable states, and multi-label acceptance preservation.
  - Formal Theory of Computation 11-step viva academic curriculum walkthrough: Validates all 11 stages from raw catalog selection through $\varepsilon$-NFA, subset construction, minimization, simulation, to Procrustes residual verification.
  - Open-science data provenance citations: Verifies data integrity across HYG 3.8 catalog, Marc van der Sluys constellation vectors, and Don Cross Astronomy Engine ephemerides.

---

## 3. Feature Inventory Mapping (F1 through F14)

| Feature ID | Feature Name | Description | Verification Tier | Test Suite Mapping |
|---|---|---|---|---|
| **F1** | Token Matrix & Font Imports | Google Fonts (`Doto`, `IBM Plex Mono`), CSS `:root` & `@theme` variable matrix | Tier 1 | `tests/e2e-telemetry.test.ts` (Group 1.1) |
| **F2** | Universal Shell & Bento Layout | `#ECEEF2` chassis, recessed bento tray with 6px gaps, `#F5F6F8` cards with 12px radii | Tier 1 | `tests/e2e-telemetry.test.ts` (Group 1.2) |
| **F3** | Machined Navigation & Controls | Rocker pills, HUD reticle search, tactile buttons, active states | Tier 1, Tier 3 | `tests/e2e-telemetry.test.ts` (Group 1.3, 3.4) |
| **F4** | 3D Sky Canvas Telemetry & HUD | J2000 to Horizontal matrix, star inspection, Alt/Az calculations, coordinate limits | Tier 2, Tier 3 | `tests/e2e-telemetry.test.ts` (Group 2.3, 3.2) |
| **F5** | Trace Mode & Recognition HUD | Tangent plane projection, turning angle quantization, DFA recognition report | Tier 2, Tier 3, Tier 4 | `tests/e2e-telemetry.test.ts` (Group 2.1, 3.1, 4.1, 4.2) |
| **F6** | Automata Lab Bento Console | Tab router, bento layout, console state integration | Tier 1, Tier 3 | `tests/e2e-telemetry.test.ts` (Group 1.4, 3.1) |
| **F7** | Automata State Graphs & Math | $\varepsilon$-NFA assembly, subset determinization, Hopcroft minimization proof | Tier 3, Tier 4 | `tests/e2e-telemetry.test.ts` (Group 3.5, 4.3) |
| **F8** | Discrete Simulator Tape & Stepper | Stepping through tape cells, quantized LED states, string acceptance | Tier 1, Tier 3 | `tests/e2e-telemetry.test.ts` (Group 1.4, 3.1) |
| **F9** | Constellation Catalog Bento Grid | 88 IAU constellations database, family and seasonal filters, coordinate bounds | Tier 2 | `tests/e2e-telemetry.test.ts` (Group 2.4) |
| **F10** | Sky Tonight & Time Telemetry | Topocentric tonight view, 24-hr time scrubber, horizon boundary transitions | Tier 2, Tier 3 | `tests/e2e-telemetry.test.ts` (Group 2.3, 3.2) |
| **F11** | Hunt Mode & Image Lab Sliders | Gamified recognition challenge, progressive hint levels (0-3), coordinate focusing | Tier 2, Tier 3 | `tests/e2e-telemetry.test.ts` (Group 2.5, 3.3) |
| **F12** | Academic Viva Walkthrough | 11-step formal Theory of Computation examination pipeline, open-science citations | Tier 4 | `tests/e2e-telemetry.test.ts` (Group 4.4, 4.5) |
| **F13** | Strict Non-Regression Verification | Continuous passing of all 29 original unit tests across geometry, automata, astronomy | All Tiers | `tests/*.test.ts` |
| **F14** | Comprehensive E2E Testing Suite | Authoring and execution of the unified 4-tier E2E telemetry test suite | All Tiers | `tests/e2e-telemetry.test.ts` |

---

## 4. Test Architecture & Runner Command

### Execution Architecture
- **Framework**: Vitest v5.1.0 (`vitest run`)
- **Runtime**: Node.js / Vite ESM environment
- **Static Artifact Inspection**: Synchronous file system inspection (`node:fs`, `node:path`) for CSS stylesheets, HTML headers, and configuration files.
- **State Store Ingestion**: Direct Zustand store instantiation (`useAstroStore`) executing action dispatchers, state updates, and subscribers.
- **Mathematical Invariant Provers**: Astronomical transformation routines, Procrustes alignment engines, and automata minimizers.

### Test Runner Commands
```bash
# Execute entire test suite (baseline unit tests + E2E telemetry suite)
npm test

# Execute E2E telemetry suite specifically
npx vitest run tests/e2e-telemetry.test.ts

# Execute with coverage report
npx vitest run --coverage
```

---

## 5. Coverage Thresholds

| Verification Tier | Threshold Requirement | Metric Target |
|---|---|---|
| **Tier 1: Visual Tokens & Layout** | $\ge 5$ test assertions per visual feature (tokens, fonts, monospace, HUD reticles, bento grid) | $\ge 15$ test cases |
| **Tier 2: Boundary & Robustness** | $\ge 5$ test assertions per boundary domain (empty trace, single point, duplicate, extremes, horizon) | $\ge 10$ test cases |
| **Tier 3: Cross-Feature Interactions** | All primary subsystem handoffs (Trace $\to$ Lab, Time $\to$ Canvas, Preset $\to$ Viewport, Hunt $\to$ Trace) | $\ge 6$ test cases |
| **Tier 4: End-to-End Scenarios** | Real-world constellation recognitions (Orion, Cassiopeia), Hopcroft minimization, 11-step Viva | $\ge 5$ test cases |
| **Strict Non-Regression** | 100% of existing unit tests must continue passing | 29 / 29 passed |
| **Total Test Suite Target** | $\ge 70$ total passing tests across 5 test suites | $\ge 70$ passed |
