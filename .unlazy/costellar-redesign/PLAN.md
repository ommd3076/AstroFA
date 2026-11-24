# Plan: Costellar UI and UX redesign
Scope: costellar-redesign
Mode: orchestrated
Depth: tree 2

## Contract
Use native GPT-6 Luna workers only for app implementation, with disjoint file ownership in the dirty checkout. Preserve existing user work and algorithms. The newly attached PaceOS screen controls interior visual direction. Earlier Costellar audit supplies route-specific behavior and risks. Leave the existing blue surround treatment alone. Reuse current token names and route contracts. Shared design is frozen in the briefs so independent routes can build in one wave. Weekly account allowance floor is 40% remaining. Send updates at 35-minute intervals during sustained work.

Compact left rail and pale warm-neutral panels with 8–12px gutters. Main metadata in readable IBM Plex Mono, large regular numeric metrics, Doto only for isolated digital values, real dot grids. Approximate palette: #eeeeed chassis, #f6f6f5 panels, #dedfdf dividers, #18191b ink, #565b64 secondary, #064bdc accent. Single active cobalt. Existing blue exterior stays. Reference overview is four metrics, then two equally weighted panels, then three utility modules. Quiet surfaces and meaningful controls.

## Tree
- 1 Costellar redesign ........ GATES.md
  - 1.1 Shell and navigation ........ gates/leaf-1.1.md
  - 1.2 Overview ........ gates/leaf-1.2.md
  - 1.3 Sky Explorer and trace controls ........ gates/leaf-1.3.md
  - 1.4 Sky rendering ........ gates/leaf-1.4.md
  - 1.5 Sky Tonight ........ gates/leaf-1.5.md
  - 1.6 Library and constellation details ........ gates/leaf-1.6.md
  - 1.7 Recognition results and pattern analysis ........ gates/leaf-1.7.md
  - 1.8 Automata Lab ........ gates/leaf-1.8.md
  - 1.9 Image Lab ........ gates/leaf-1.9.md
  - 1.10 Hunt, Viva and Credits ........ gates/leaf-1.10.md
  - 1.11 Browser and integration evidence ........ gates/leaf-1.11.md

## Leaf dispatch table
| Leaf | Owns | Needs | Tier | Planned wave | State |
|---|---|---|---|---|---|
| 1.1 | src/App.tsx, src/App.css, src/index.css, src/components/HeaderNav.tsx, src/components/ui/**, components.json, package.json, package-lock.json, tests/e2e-telemetry.test.ts, src/stores/useAstroStore.ts | - | judgment | 1 | VERIFIED |
| 1.2 | src/features/overview/** | - | judgment | 1 | VERIFIED |
| 1.3 | src/features/skyExplorer/**, src/features/traceMode/TraceHud.tsx, src/components/TimelineBar.tsx, src/components/StarInspector.tsx | - | judgment | 1 | VERIFIED |
| 1.4 | src/sky/** | - | judgment | 1 | VERIFIED |
| 1.5 | src/features/skyTonight/** | - | judgment | 1 | VERIFIED |
| 1.6 | src/features/constellationExplorer/** | - | judgment | 1 | VERIFIED |
| 1.7 | src/features/traceMode/RecognitionResultsModal.tsx, src/features/traceMode/PatternAnalysisModal.tsx | - | judgment | 1 | VERIFIED |
| 1.8 | src/features/automataLab/** | - | judgment | 1 | VERIFIED |
| 1.9 | src/features/imageLab/** | - | judgment | 1 | VERIFIED |
| 1.10 | src/features/huntMode/**, src/features/academic/**, src/components/CreditsModal.tsx | - | judgment | 1 | VERIFIED |
| 1.11 | scripts/verify-screens.cjs, scripts/capture_screens.ps1 | - | judgment | 1 | VERIFIED |

