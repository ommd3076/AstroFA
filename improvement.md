# Costellar UI: strict audit and implementation handoff

**Audience:** Antigravity implementation agent  
**Status:** Evidence-backed implementation specification; application code was not changed. Runtime verification is limited to the checks documented in the runtime chapter.  
**Repository:** `C:\ommd3076\Proejcts\automata-theory`  
**References:** `UI-REFENECE/`  
**Verification date:** 2026-11-11 (Asia/Calcutta). Runtime entry state is recorded with its exact UTC timestamp in the runtime chapter.  
**Implementation scope:** presentation, route composition, and motion behavior, preserving current scientific and application logic.

This is a local reviewable handoff file. No Antigravity integration was available to send it directly. Open this file in Antigravity for execution. The implementation agent should proceed through the source baseline, shared shell, screen owners, and final evidence gates in the listed order.

## Contents

- [Executive brief and implementation contract](#executive-brief-and-implementation-contract)
- [Reference index](#reference-index)
- [Consolidated root causes](#consolidated-root-causes-evidence-led)
- [Provenance and repository evidence](#provenance)
- [Motion and jitter audit](#motion)
- [Reference measurement: images 1–4](#reference-1-4)
- [Implementation mapping: images 1–4](#implementation-1-4)
- [Implementation audit: images 5–8](#implementation-5-8)
- [Implementation audit: images 9–12](#implementation-9-12)
- [Sequenced implementation order](#costellar-implementation-order)
- [Runtime validation](#runtime-evidence)
- [Final completion gate](#final-completion)

## Executive brief and implementation contract

The task is to bring Costellar's application presentation into line with the supplied visual references, address source-identified jitter risks, and preserve real application behavior. Treat the 1586 × 992 references as the target images for this work. Preserve their observed frame-specific differences at matching dimensions. Use a common shell only where the evidence supports it.

This package is a specification and reviewable task queue. It does not contain an application patch. Antigravity is expected to execute the implementation work in the named source files, then produce the evidence required by the completion gate. Proceed through the work in dependency order: establish the source baseline, implement the shared frame, implement route-specific layouts, address motion behavior, and run visual and functional evidence gates. Do not treat prior approvals as proof of fidelity; earlier review history explicitly lacks a pixel-level comparison.

### Evidence language

Use these labels for claims and outcomes:

- **Observed:** directly visible in a supplied image, current source, or named runtime observation.
- **Inferred:** a reasoned interpretation, not directly demonstrated.
- **Proposed:** an implementation task or choice.
- **Verified:** a named repeatable check was run and its evidence recorded.
- **Unverified:** the available evidence does not establish the claim.

A “pass” requires the relevant gate to be run. Route presence in source does not prove that the route renders correctly. A screenshot does not prove that a control works. A mockup value does not prove scientific correctness.

### Frame variation and fixtures

Preserve observed reference differences at matching dimensions. Record each frame's own coordinates and dimensions. Do not average conflicting measurements into an invented universal value. The image 9–12 left-rail measurements are seam coordinates from the PNG's left edge, not rail widths. Their derived widths account for the approximately 34 px app-frame inset. References 1–8 also require per-image measurement before asserting a shared width.

Use deterministic local fixture data to exercise layouts and reproduce states. Label fixtures as fixtures in code and verification records. Where reference values have no legitimate backing source, the implementation work must add the real source/model needed to support them, or use an honest unavailable/empty state where the metric definition is unresolved. If factual values prevent a numerical pixel match, mark that visual subcriterion **PARTIAL** and explain why. Never present unsupported screenshot data as live output.

### Product decisions and content semantics

Preserve the existing initial route because the references do not establish launch behavior. Overview can be added as a route independently. Changing the default landing route is an optional product decision and is separate from reference fidelity.

Resolve the Overview cards as real features, not decorative placeholders. Historical traces and recent recognitions require an event source. Accuracy requires a defined evaluation set, numerator, denominator, and method. Session duration requires an explicit session lifecycle and monotonic timer. Sky Activity requires actual activity history. If these definitions are not decided, make that missing decision explicit and show an honest unavailable state; do not invent counts, history, percentages, or elapsed times.

Orion's hourly and monthly visibility must be calculated from a documented observer, date, time-zone, horizon, and duration rule. The Image Lab reference depicts FITS input and a 0.64 value, while the inspected app accepts PNG/JPEG and uses an 8-bit luminance threshold initialized to 180. Implement verified semantics the product actually supports, or document the specific reference subcriterion as blocked by the missing capability. Do not imitate unsupported formats or values with decorative controls.

### Scope and ownership

The target repository is `C:\ommd3076\Proejcts\automata-theory`. The repository was read-only during this audit. This handoff may identify existing code anchors and proposed owner files, but it contains no application patch. The implementation agent owns app changes.

Keep presentation changes in the smallest source set that owns them. The global frame belongs in `src/App.tsx`, `src/App.css`, and `src/components/HeaderNav.tsx`. Route composition belongs in each feature owner named in the route chapters. Keep automata, geometry, recognition, astronomy, state calculations, datasets, and export logic intact unless a separate product requirement authorizes a real feature change.

### Completion standard

Complete the work only when the implementation agent has reported every required gate with its evidence. The package includes the twelve-file reference inventory, ten unique frames, provenance, root-cause findings, owner anchors, route-specific tasks, removal scope, runtime observations, and sequenced verification criteria. The current audit's build and route sweep do not establish strict visual fidelity. A visual pass requires captures at the exact target dimensions and explicit comparison against the correct source frame.

## Reference index

All twelve supplied reference files are retained. The first four contain two unique frames because each pair is byte-identical. The remaining eight files each represent another unique frame, for ten unique frames total. All source PNGs are 1586 × 992.

| Ordinal | Source file | Screen identity | Duplicate relationship | Native dimensions |
|---:|---|---|---|---|
| 1 | `ChatGPT Image Nov 11, 2026, 07_57_18 PM-1.png` | Overview dashboard | Byte-identical to 3 | 1586 × 992 |
| 2 | `ChatGPT Image Nov 11, 2026, 07_57_37 PM-2.png` | Sky Explorer | Byte-identical to 4 | 1586 × 992 |
| 3 | `ChatGPT Image Nov 11, 2026, 07_57_58 PM-1.png` | Overview dashboard | Byte-identical to 1 | 1586 × 992 |
| 4 | `ChatGPT Image Nov 11, 2026, 07_58_13 PM-2.png` | Sky Explorer | Byte-identical to 2 | 1586 × 992 |
| 5 | `ChatGPT Image Nov 11, 2026, 07_58_21 PM-3.png` | Sky Tonight | Distinct frame | 1586 × 992 |
| 6 | `ChatGPT Image Nov 11, 2026, 07_58_28 PM-4.png` | Constellation Library | Distinct frame | 1586 × 992 |
| 7 | `ChatGPT Image Nov 11, 2026, 07_58_40 PM-5.png` | Trace workspace | Distinct frame | 1586 × 992 |
| 8 | `ChatGPT Image Nov 11, 2026, 07_58_46 PM-6.png` | Recognition Result | Distinct frame | 1586 × 992 |
| 9 | `ChatGPT Image Nov 11, 2026, 07_58_54 PM-7.png` | Pattern analysis | Distinct frame | 1586 × 992 |
| 10 | `ChatGPT Image Nov 11, 2026, 07_59_01 PM-8.png` | Automata Lab | Distinct frame | 1586 × 992 |
| 11 | `ChatGPT Image Nov 11, 2026, 07_59_08 PM-9.png` | Image Lab | Distinct frame | 1586 × 992 |
| 12 | `ChatGPT Image Nov 11, 2026, 07_59_17 PM-10.png` | Orion detail | Distinct frame | 1586 × 992 |

The supplied screenshots are visual targets, not production assets. The blue outer surround is not established as application UI. Do not copy the images into app assets or treat their sample values as verified live data.

## Consolidated root causes (evidence-led)

1. **The shared composition differs from the target.** The running application uses a horizontal header with eight view buttons and a dark sky-focused composition. The references use a persistent left rail, a pale application plate, and route-specific card layouts. This is a direct visual mismatch. The exact pixel-level severity was not measured because no target-size runtime capture or pixel diff was available.
2. **Reference routes and current route owners do not map one-to-one.** The current app has eight `activeView` branches. Overview is not one of them. Trace and recognition results are currently overlays/modal states, while references show independent page compositions. Some reference labels such as Patterns, Results, and Settings do not map directly to current route values. Preserve all current features while designing a reachable, coherent mapping.
3. **Several reference metrics lack product data contracts.** Current source does not establish session history, activity history, completed-event counts, empirical recognition accuracy, a verified 312-pattern count, or the shown monthly/hourly visibility semantics. Styling alone cannot produce a truthful match. Add the necessary data/calculation contract or document an unresolved semantic gate and show honest states.
4. **Per-frame rail geometry varies.** Images 9–12 show seam x-coordinates of about 257, 278, 262, and 267 px. With an app-frame inset near 34 px, derived rail widths are about 223, 244, 228, and 233 px. Images 1–8 have separate measurements and must not be silently normalized to the later set. These are static image measurements, not recovered CSS tokens.
5. **Jitter risk is source-identified, not yet seen in a recording.** The sky render loop schedules frames continuously, focus interpolation uses a per-frame fraction, the SVG overlay is rebuilt with `innerHTML`, and some UI has broad transitions or pulse effects. These source patterns warrant the proposed stable-frame gates. No runtime frame recording or jitter measurement was collected in the motion sub-audit.
6. **Earlier acceptance evidence is incomplete and conflicting.** Repository handoffs report 73/74 tests and 44/45 E2E counts. Previous reviewers later approved the work, but a challenger explicitly noted no pixel comparison. Git status was not accessible, and the live page has no source/build identity. Treat those handoffs as claims, not current independent proof.
7. **Runtime comparison used different dimensions.** The supplied references are 1586 × 992. The already-open browser viewport observed by the runtime audit was 1536 × 640. The route sweep verifies presence and usable controls in that observed state; it does not establish the target-size layout or strict match.


## Stable implementation task register

Use these stable IDs in change notes, commits, and verification results. The detailed file-specific steps and acceptance conditions remain in the referenced screen chapters. Keep the implementation order from the sequenced plan; do not start dependent work before the shared owner is settled.

| Task ID | Owner files | Depends on | Deliverable and acceptance |
|---|---|---|---|
| BASE-01 | Repository baseline and all listed owners | — | Record branch, source state, applicable instructions, and baseline; preserve existing changes and make no cleanliness claim if status cannot be read. |
| SHELL-01 | `src/App.tsx`, `src/App.css`, `src/index.css` | BASE-01 | Implement shared reference-aligned plate, cards, typography, spacing, and per-frame comparison without breaking measurable canvas sizing. |
| NAV-01 | `src/components/HeaderNav.tsx`, `src/App.tsx` | SHELL-01 | Replace the top-strip composition with one persistent accessible rail; retain all eight current view routes and all current utilities. |
| OVERVIEW-01 | `[PROPOSED / NEW] src/features/overview/Overview.tsx`, `src/App.tsx`, `src/stores/useAstroStore.ts` | SHELL-01, NAV-01 | Add the Overview route and screenshot structure. Keep existing default route unless separately selected as a product decision. |
| OVERVIEW-02 | Overview selectors, astronomy source modules, event/session model owners | OVERVIEW-01 | Back every retained summary value with a documented calculation or event source. Do not hard-code reference telemetry. |
| SKY-01 | `src/sky/SkyCanvas.tsx`, `src/components/StarInspector.tsx`, `src/components/TimelineBar.tsx`, `src/App.tsx` | SHELL-01, NAV-01 | Map Sky Explorer to the live sky behavior, fit inspector and controls to its frame, and preserve focus/time/observer handlers. |
| TONIGHT-01 | `src/features/skyTonight/SkyTonight.tsx` | SHELL-01, NAV-01 | Match Sky Tonight density and controls while distinguishing hourly observations from quarter-hour steps and using real observer/date data. |
| LIBRARY-01 | `src/features/constellationExplorer/ConstellationExplorer.tsx` | SHELL-01, NAV-01 | Match catalog and detail states using catalog entities; retain filter, selection, focus, trace, and automata handoffs. |
| TRACE-01 | `src/features/traceMode/TraceHud.tsx`, `src/sky/SkyCanvas.tsx` | SHELL-01, NAV-01 | Recompose trace workspace while retaining current trace state, canvas input, undo, clear, completion, and geometry behavior. |
| RESULTS-01 | `src/features/traceMode/RecognitionResultsModal.tsx` and result presentation owner | TRACE-01 | Present the actual recognition report as the Results screen; preserve report export, empty state, and simulator handoff. |
| PATTERNS-01 | Pattern analysis and relevant catalog/recognition presentation owners | SHELL-01, NAV-01 | Match Pattern Analysis using real trace geometry and report output. Do not turn sample metrics into evaluation claims. |
| AUTOMATA-01 | `src/features/automataLab/AutomataLab.tsx` and its view children | SHELL-01, NAV-01 | Add the reference dashboard composition while retaining all eight teaching tabs, machine state, simulator, and export. |
| IMAGE-01 | `src/features/imageLab/ImageLab.tsx` | SHELL-01, NAV-01 | Match the Image Lab workspace using supported formats, real detector state, correct threshold semantics, and aligned source coordinates. |
| DETAIL-01 | `src/features/constellationExplorer/ConstellationExplorer.tsx`, astronomy selectors | LIBRARY-01 | Recompose selected constellation details using catalog values and reproducible astronomy calculations. |
| HUNT-01 | `src/features/huntMode/HuntMode.tsx`, route composition | SHELL-01, NAV-01 | Preserve target, hint, score, and route lifecycle; resolve observed lingering target overlay behavior through an explicit ownership rule. |
| VIVA-01 | `src/features/academic/AcademicWalkthrough.tsx` | SHELL-01, NAV-01 | Match the reference shell while preserving all eleven steps, source text, citations, and navigation bounds. |
| CREDITS-01 | `src/components/CreditsModal.tsx` | SHELL-01, NAV-01 | Integrate Credits in the shared presentation while preserving attribution, license, and close behavior. |
| MOTION-01 | `src/sky/SkyCanvas.tsx` | SKY-01 | Remove idle continuous work and overlay churn or establish a dirty-render path; require stable idle capture and fresh updates after each input. |
| MOTION-02 | `src/components/HeaderNav.tsx`, `src/App.css`, trace result components | SHELL-01 | Remove or narrow movement-producing transitions and pulse effects; preserve immediate, visible focus and active feedback. |
| VERIFY-01 | All changed owners, evidence folders | All implementation tasks | Run route, function, responsive, target-size visual, data-truth, and jitter gates. Record exact outcomes and evidence for C01–C12 and R/G matrices. |

### Removal and relocation scope

| Existing element | Required action | Preserve |
|---|---|---|
| Horizontal eight-button header layout | Replace its presentation with the reference rail and deliberate utility placement. | Every route ID, brand-to-sky action, search/filter behavior, observer access, trace action, keyboard access. |
| Per-route copy of global navigation | Remove duplicate shell/navigation implementations if introduced during redesign. | One shared nav owner in `HeaderNav.tsx` and `App.tsx`. |
| Screenshot-only live counts, date/location defaults, rankings, match percentages, session duration | Remove as hard-coded product output; replace with real source-backed values or explicit unresolved/empty states. | Deterministic fixture values in test/evidence contexts, isolated from live state. |
| FITS acceptance label without decoder; decorative 0.64 threshold with raw 180 detector | Remove/rename unsupported representation until decoder and scale mapping exist. | Existing PNG/JPEG processing and 50–240 luminance threshold contract unless a separate feature is authorized. |
| CSS/JS motion causing idle movement or jitter risk | Remove ambient pulse/focus easing and repeated no-change overlay replacement as defined by the motion gates. | Direct drag, zoom, explicit time playback/step, user-triggered selection, and accessible state feedback. |
| Existing feature logic replaced for visual convenience | No algorithm, dataset, store contract, automata transitions, or export payload removal is permitted in this visual scope. | Current calculations, state, and callbacks. |
<a id="provenance"></a>
# Provenance and Audit Handoff Notes

## Purpose and boundaries

This is the provenance section for the independent strict audit of Costellar.
The target repository is `C:\ommd3076\Proejcts\automata-theory`.
The audit request and acceptance contract are in the repo's `ORIGINAL_REQUEST.md`.
The supplied visual references are in `UI-REFENECE/` (spelling as stored).
This note records evidence available to the inventory agent, not a final visual verdict.
Repository source was read only; no source file was edited.
Only this report was written, under the current projectless `work/` directory.
No tests, build, dev server, deployment, or external application action was run.

## Confidence labels used here

**Directly verified** means the named file/path/metadata was read in this session.
**Document claim** means a repo handoff says it happened; no transcript was independently recovered.
**Inferred** means the conclusion follows from visible structure or metadata, not runtime behavior.
**Unknown** means access/evidence limits prevent a reliable conclusion.
A claim in a handoff remains a claim until its underlying artifact or behavior is checked.
Handoff-document presence is not itself proof that the described review occurred.
A checked-out source file is not necessarily the version at the reported branch ref.
A production bundle's presence does not prove that it built from current source.

## Repository identity and current-state limitation

The intended repository path exists and contains a React/Vite project.
The repository root contains `src/`, `tests/`, `docs/`, `scripts/`, `public/`, and `dist/`.
It also contains `.agents/`, `.git/`, `node_modules/`, and `UI-REFENECE/`.
`package.json` names the application `costellar`, version `0.0.0`, private ESM package.
Scripts include `dev: vite`, `build: tsc -b && vite build`, `lint: oxlint`, and `test: vitest run`.
The project name in the original initial request is Costellar; some agent notes say PaceOS.
PaceOS appears to be the design-system name, while Costellar is the product brand.
That naming inconsistency is not alone evidence of a functional defect.
`.git/refs/heads/main` directly contains `50fc866bae318900833df2cab34d3f454d521605`.
This proves the on-disk branch ref value only; it does not prove HEAD/worktree cleanliness.
`.git/HEAD` says `ref: refs/heads/main`.
`.git/logs/HEAD` is readable and provides a reflog chronology (see below).
Git CLI `status`, `log`, and `diff` fail with `Permission denied` at this repository.
The exact index/worktree status is consequently unknown to this audit agent.
Do not describe the worktree as clean or as exactly matching the ref.
Do not attribute source modifications to the shown commits without a diff.
Current files could be dirty, staged, or different from the ref; that remains unresolved.

## Reflog evidence and claim chronology

Directly read source: `.git/logs/HEAD` and `.git/refs/heads/main`.
The reflog records the initial project commit `48c2400525436eb6c6ea7589dbae93dd23ea6944`.
Next recorded commit `bc91ffd889b622c1a63e11c280b93ba61c6457c2` adds astronomy datasets.
Next `d9815a0d6ee3df80f80bb0b757ab16c1e689a35a` adds automata algorithms.
Next `962f5bbb428c2a7b2bbee074b2b8f8ce187d61f7` adds geometry and tests.
Next `87d8c6799c9ccf80fb2db11413662ca0b668682e` adds the Three.js sky.
Next `2f0e3a7640ebdff492a7deaa63a5fe05a9e08e13` adds recognition modes.
Next `1042552f396da968562e21213521b483183fcf91` adds the automata lab.
The UI milestone commit is `1f6f212ad1d5a45c9a892e0ba41a055e46fb6bef`.
Its reflog subject claims M1–M4 complete, zero lint warnings, and 74/74 tests.
The final branch ref points to `50fc866bae318900833df2cab34d3f454d521605`.
That commit's reflog subject is `chore(branding): rename application everywhere to Costellar...`.
The chronology is verified from `.git/logs/HEAD`; commit contents are not.
The repo includes `dist/`, but build timestamps alone cannot establish source provenance.
No Git object diff was available to independently confirm the rename's touched files.
The UI milestone's self-reported test/build result is corroborated by later handoff claims only.
Current tests were not run in this read-only inventory task.

## Applicable instructions and scope constraints

A recursive search found zero `AGENTS.md` files within the repository.
No repo-scoped `AGENTS.md` instruction file was found to govern this audit.
`ORIGINAL_REQUEST.md` is the user-task specification, not an agent instruction file.
`PROJECT.md` is a project plan/specification with milestones and interface contracts.
`.agents/teamwork/` contains dispatches, briefings, progress notes, and handoffs.
Those artifacts can preserve task-specific constraints but are historical claims, not system policy.
`ORIGINAL_REQUEST.md` requires presentation replacement while preserving app logic.
It explicitly prohibits alterations to automata, geometry, recognition, astronomy, and store logic.
It asks for production UI coverage across all views, not just a home-screen mockup.
The request lists acceptance requirements and does not itself waive visual runtime evidence.
The task scope here is an independent audit, not additional implementation.
No source changes or tests were authorized by this inventory subtask.

## Reference inventory and provenance

`UI-REFENECE/` contains exactly twelve PNG files, checked directly.
All twelve names carry a November 11, 2026 ChatGPT Image timestamp.
A byte-level SHA-256 check yields ten unique files.
Files `07_57_18 PM-1.png` and `07_57_58 PM-1.png` are identical bytes.
Files `07_57_37 PM-2.png` and `07_58_13 PM-2.png` are identical bytes.
The other eight image files have distinct hashes from each other and these pairs.
A read-only contact sheet was created at `work/refs-contact.png` for analysis.
The contact sheet is a derivative convenience image, not a new source reference.
No references were sent to an external application.
The screenshots depict a consistent light shell, sidebar, compact technical labels, and cobalt signals.
They include dashboard, sky, tonight, constellation catalog/detail, trace, results, automata, and image-lab screens.
The two duplicate pairs add no distinct visual evidence.
The source originals and their timestamps should remain the citation targets for visual audit.
The reference folder spelling `UI-REFENECE` is preserved in all path references.
Do not silently rename or deduplicate repo files during this audit.
Reference images are inspiration and task acceptance context, not runtime screenshots.

## Application route inventory

`src/App.tsx` directly imports and switches on Zustand `activeView`.
`sky` renders `SkyCanvas`, `TraceHud`, `StarInspector`, and `TimelineBar` together.
`tonight` renders `src/features/skyTonight/SkyTonight.tsx`.
`constellations` renders `src/features/constellationExplorer/ConstellationExplorer.tsx`.
`automataLab` renders `src/features/automataLab/AutomataLab.tsx`.
`hunt` renders `src/features/huntMode/HuntMode.tsx`.
`imageLab` renders `src/features/imageLab/ImageLab.tsx`.
`academic` renders `src/features/academic/AcademicWalkthrough.tsx`.
`credits` renders `src/components/CreditsModal.tsx`.
Global navigation is in `src/components/HeaderNav.tsx`.
The global frame is `.bento-shell` and `.bento-tray` in `src/App.css`.
These eight `activeView` branches are the direct route coverage surface in the root app.
Modals and overlays also appear within these views and should be audited as part of their owning route.
A route inventory is not evidence that each route was opened or visually checked.

## Design-system contract in project artifacts

`ORIGINAL_REQUEST.md` defines shell/tray/card colors and cobalt/periwinkle signals.
It asks for Doto and IBM Plex Mono fonts, all text monospaced, labels uppercase and tracked.
It asks for quantized dot/segment visualizations and HUD corner brackets.
It specifies 6px tray gaps, 12px cards, and no drop shadows or gradient meshes.
`PROJECT.md` expands these into tokens, utilities, route inventory, and milestones.
`PROJECT.md` lists M_TEST, M1, M2, M3, M4, and M_FINAL as DONE.
That DONE table is project-plan status, not independent completion evidence.
`src/index.css` currently declares the color/font/tracking tokens by direct inspection.
Its current source includes `--tracking-wide: 0.06em`, `--tracking-wider: 0.08em`, and `--tracking-widest: 0.10em`.
The same source file includes those tracking values in both `@theme` and `:root`.
`src/App.css` currently defines `.hud-reticle`, `.bento-*`, typography utilities, and cards.
It presently includes `box-shadow: none !important` for `.bento-card`.
These are spot-verified snippets, not exhaustive style-compliance proof.
A CSS declaration does not prove a font downloaded or every text node uses it at runtime.
A utility's existence does not prove every relevant control uses it correctly.

## Historical reviewer and worker artifacts

`.agents/teamwork/orchestrator_1/handoff.md` says COMPLETE (PASS).
This is the orchestrator's completion report, not neutral evidence.
`.agents/teamwork/reviewer_gate_1/handoff.md` has verdict REQUEST_CHANGES.
Its major finding is tracking-token resolution under Tailwind v4 defaults.
It also lists a minor finding on Hunt target description body-copy letter spacing.
The gate document claims tests/build passed despite requesting a fix.
`.agents/teamwork/worker_remediation_1/handoff.md` claims tracking tokens were added.
It claims compiled CSS uses 0.06em, 0.08em, and 0.10em values.
It claims 74 tests and a build passed; those executions were not replayed here.
`.agents/teamwork/reviewer_gate_1_recheck/handoff.md` says APPROVE after remediation.
It claims the previous finding was resolved and compiled CSS was checked.
`.agents/teamwork/reviewer_gate_2/handoff.md` says APPROVE.
It claims 74 tests, runtime logic robustness, and final review coverage.
`.agents/teamwork/auditor_gate_1/handoff.md` labels the integrity review CLEAN.
It claims source scans, tests, build, lint, and application integrity checks were performed.
`.agents/teamwork/challenger_gate_1/handoff.md` says APPROVE.
It explicitly caveats that pixel-level screenshot diffing was not performed.
`.agents/teamwork/challenger_gate_2/handoff.md` says APPROVE and claims logic test coverage.
These documents are firsthand artifacts of their authors only if provenance can be authenticated.
Their claims should be reported as claims unless independently reproduced.
The independent audit should retain the Gate 1 finding/remediation history, not flatten it into “always passed.”
The reviewer recheck is evidence of a changed verdict, but not a substitute for current runtime inspection.

## Conflicts and discrepancies to reconcile

`TEST_READY.md` says 73/73 tests passed and calls the new suite 44 tests.
The same artifact maps base geometry coverage to seven tests.
`TEST_INFRA.md` contains a 4-tier test plan and various coverage claims.
Several later handoffs say 74/74, with geometry listed as eight tests.
`reviewer_gate_1_recheck/handoff.md` also says 74/74.
`reviewer_gate_2/handoff.md` claims 74/74 and elsewhere describes 45 E2E tests.
Thus the docs conflict over 73 vs 74 total and 44 vs 45 E2E tests.
The current `package.json` confirms Vitest is configured as the test script.
It does not confirm the actual current test count or pass status.
No test output transcript was independently rerun in this task.
The latest current test inventory needs to be established from test files and a permitted execution.
A previous report's total should not be promoted to fact without a fresh run.

## Runtime and handoff capability inventory

No Node, Vite, or Antigravity process was observed at the inventory checkpoint.
No listener was observed on common development ports 5173, 4173, 3000, or 8080.
This is a point-in-time observation, not a global guarantee no application is open.
`dist/index.html` and built assets exist, but a running preview was not found.
`package.json` advertises `npm run dev`; starting it was outside this read-only assignment.
The available tool registry had no Antigravity-specific application or handoff tool.
A Codex `handoff_thread` tool exists, but its declared purpose is moving another Codex thread between checkouts/hosts.
That tool is not an Antigravity design import/export mechanism.
No Antigravity interaction or send was performed.
A human can manually open the project in Antigravity if that is their preferred review surface.
A “ready-to-give” artifact must still be concrete, inspectable, and accurately named.
For the current task, the local reference contact sheet is only an analysis aid, not a handoff package.
A stronger evidence route is an actual browser run with route screenshots and comparison to the supplied PNGs.

## Provenance conclusions at this checkpoint

The design reference set and source route structure are directly inventoried.
The gate history is traceable in repo-local handoff documents.
A real blocking issue was identified by Gate 1 and later reported remediated.
Current source contains those tracking variables, consistent with the described remediation.
The prior pass verdicts should not be interpreted as an independent visual acceptance.
At least one challenger explicitly says no pixel-level screenshot diff was done.
No current application screenshot, route-by-route interaction trace, or browser console log exists in this audit evidence.
Git status and tracked diff remain unavailable because Git cannot read the repo metadata.
The checked-in branch-ref value is known, while worktree/ref correspondence remains unknown.
No evidence here justifies a deployment-ready claim.
The appropriate status is “substantial implementation claimed; strict independent runtime/visual confirmation pending.”

## Proposed strict-audit priority order

**P0 — Establish source/ref relation:** obtain authorized Git status/diff or equivalent provenance evidence.
Acceptance: document the status of HEAD, index, and worktree; identify every uncommitted change.
Acceptance: tie the audited UI files and `dist/` bundle to one explicit source revision.
Acceptance: do not characterize the repository as clean unless status proves it.

**P0 — Obtain genuine runtime evidence:** start the supported local app only in an authorized test context.
Acceptance: record the exact command, host/port, browser, viewport, and app build/source identity.
Acceptance: capture each route named in `src/App.tsx` at a reproducible viewport.
Acceptance: confirm routes are actually reachable and no runtime exception blocks initial render.
Acceptance: preserve console errors/warnings and network font/image loading outcomes.

**P0 — Compare screenshots to references:** map each reference to the corresponding route/state.
Acceptance: compare layout, hierarchy, spacing, typography, palette, and active-state treatments.
Acceptance: call out where a reference is only a related inspiration rather than a one-to-one screen.
Acceptance: disclose any route that cannot be reproduced due to missing state/data.
Acceptance: distinguish real screenshot observations from static source inspection.

**P1 — Verify the high-level shell:** inspect HeaderNav and all route framing.
Acceptance: shell, side rail, top controls, and content area resemble the reference composition.
Acceptance: verify no clipped nav labels or inaccessible content at desktop and narrower widths.
Acceptance: confirm actual font fallback behavior if Google Fonts are unavailable.
Acceptance: assess whether all visible labels meet the uppercase/tracking contract.

**P1 — Audit the live sky route:** inspect Three.js canvas, controls, inspector, and timeline.
Acceptance: canvas initializes and animates without obscuring the data or controls.
Acceptance: inspector, trace actions, time controls, and responsive overlays remain usable.
Acceptance: verify the screen resembles the sky reference, including dark viewport and light instrument chrome.
Acceptance: check graphical legibility and dot/tick visibility against actual rendering.

**P1 — Audit observational and catalog routes:** inspect Tonight and Constellation Explorer/detail.
Acceptance: timelines, list/detail hierarchy, filters, and dense cards remain readable.
Acceptance: discrete time steps operate correctly if implemented as steppers/dots.
Acceptance: 88-item catalog remains navigable and search/filter state stays visible.
Acceptance: detail content has a coherent return path and no overflow at realistic viewport sizes.

**P1 — Audit trace and recognition:** inspect TraceHud and result/analysis modals.
Acceptance: capture empty, in-progress, matched, and rejected states as available.
Acceptance: active star/path contrast is distinct without breaking the cobalt single-signal system.
Acceptance: numeric confidence/residual values remain readable and labels are consistently styled.
Acceptance: verify modal layering, close behavior, and route return behavior.

**P1 — Audit automata lab:** inspect all tab branches and diagrams/tables.
Acceptance: NFA, epsilon closure, subset construction, DFA, minimized DFA, simulator, formal definition, and transition table are reachable.
Acceptance: graph labels and transitions remain legible at the rendered size.
Acceptance: table/search/input controls are operable and not horizontally clipped.
Acceptance: discrete slider replacement preserves keyboard and pointer accessibility.

**P1 — Audit Image Lab and Hunt:** inspect controls and interactive outcomes.
Acceptance: image upload/canvas flow displays actual loaded media and detection overlays.
Acceptance: discrete controls visibly map to values and are keyboard accessible.
Acceptance: Hunt progression, feedback, and modal states remain understandable.
Acceptance: do not call these controls preserved solely because their React component still exists.

**P2 — Reconcile test/build records:** independently run the declared scripts if authorized.
Acceptance: report exact test files and test count from fresh output.
Acceptance: explain 73/74, 44/45 E2E discrepancies using current source/runtime evidence.
Acceptance: report build output hash/time and source commit or explicitly state it is unbound.
Acceptance: static E2E tests are not described as full browser end-to-end unless browser interaction occurs.

**P2 — Audit requirement-to-evidence traceability:** map every acceptance bullet to observed evidence.
Acceptance: each item is PASS, PARTIAL, FAIL, or NOT VERIFIED with a concise reason.
Acceptance: high-impact claims about logic preservation cite before/after diffs or focused behavioral checks.
Acceptance: visual claims cite exact route screenshots and corresponding reference filenames.
Acceptance: disclose scope gaps and contradictions instead of using “no caveats.”

## Recommended route assignment map for the parent audit

Route A: Shell, navigation, global tokens, font loading, and responsive framing.
Evidence targets: `src/App.tsx`, `src/App.css`, `src/index.css`, `index.html`, `HeaderNav.tsx`.
Reference focus: dashboard references 01/03 plus chrome repeated in every other reference.

Route B: Live sky, trace initiation, star inspection, and timeline.
Evidence targets: `SkyCanvas.tsx`, `TraceHud.tsx`, `StarInspector.tsx`, `TimelineBar.tsx`.
Reference focus: sky references 02/04 and trace reference 07.

Route C: Observational views and constellation catalog/detail.
Evidence targets: `SkyTonight.tsx`, `ConstellationExplorer.tsx` and their data dependencies.
Reference focus: reference 05, catalog 06, and detail 12.

Route D: Recognition result and geometric-analysis dialogs.
Evidence targets: `RecognitionResultsModal.tsx`, `PatternAnalysisModal.tsx`, recognition store flow.
Reference focus: result reference 08 and trace reference 07.

Route E: Automata theory lab and simulator.
Evidence targets: `AutomataLab.tsx`, all lab subviews, `ExportModal.tsx`.
Reference focus: references 09 and 10.

Route F: Hunt, Image Lab, academic flow, and credits.
Evidence targets: `HuntMode.tsx`, `ImageLab.tsx`, `AcademicWalkthrough.tsx`, `CreditsModal.tsx`.
Reference focus: image lab 11 and relevant repeated chrome.

Cross-cutting logic reviewer: compare source changes to `src/automata/`, `src/geometry/`, `src/recognition/`, `src/astronomy/`, and `src/stores/useAstroStore.ts`.
Acceptance: verify untouched logic through a usable diff, or explain why the no-modification claim remains unverified.
Cross-cutting quality reviewer: verify labels, contrast, overflow, interaction, accessibility, and reduced-motion behavior.
Acceptance: each finding includes severity, route, direct evidence, and a concrete correction.

## Handoff-ready inventory summary

Repository path is confirmed: `C:\ommd3076\Proejcts\automata-theory`.
Branch ref value is confirmed: `main` points to `50fc866bae318900833df2cab34d3f454d521605`.
Git worktree/index status is not confirmed because Git metadata access is denied.
No repository `AGENTS.md` was found.
Twelve reference PNGs represent ten unique byte-identical screens.
Eight root `activeView` routes are present in `src/App.tsx`.
Past handoff records culminate in APPROVE/CLEAN after Gate 1 remediation.
Past documentation also conflicts on exact test totals and one review discloses no screenshot diff.
No Antigravity integration is available to this agent; no external handoff was sent.
No current running local server was found at the checkpoint.
The audit should proceed with route screenshots, current Git state, and criterion-level evidence.
A transient `safe.directory` Git override was also attempted, with optional locks disabled.
That retry still failed with `Permission denied` before status/diff could be read.
This is consistent with an OS-level path/metadata access restriction, not merely Git dubious ownership.
No persistent Git configuration was changed by the retry.



<a id="motion"></a>
# Motion and jitter audit: Automata Theory / Costellar

## Scope and confidence

- Target: `C:\ommd3076\Proejcts\automata-theory`.
- Requested deliverable: an independent, strict audit of jitter and motion that can be removed or reduced.
- This report is advice for `Antigravity improvement.md`; it does not change the application.
- Repository files were read only.
- This audit covers navigation, live sky, trace, time playback, star/constellation inspection, explorer, automata lab, hunt, image lab, academic walkthrough, and credits.
- Confidence labels distinguish directly observed implementation from behavior that needs a browser.
- Source fact means the cited file contains the described implementation.
- Hypothesis means the source pattern may cause visible instability, but visual runtime confirmation was unavailable.
- Recommendation means a specific change for the implementer, with a pass/fail acceptance criterion.
- No screenshots, frame recordings, or interactive observations are represented as collected evidence.
- No browser automation module was resolvable from the project dependencies during this pass.
- Runtime reproduction was therefore unavailable without adding tooling or starting a server.
- No server was started and no shared browser or user profile was used.
- Headless browser evidence remains a follow-up item for the implementation agent.
- Primary motion owner: `src/sky/SkyCanvas.tsx`.
- Global CSS owner: `src/App.css`.
- View routing owner: `src/App.tsx`.
- Shared state owner: `src/stores/useAstroStore.ts`.
- Live sky has continuous rendering, even while the camera is idle.
- Most other views have no explicit perpetual animation in the searched source.
- CSS entrance effects are short but introduce movement on view/modal appearance.
- Hover and selected-state transitions are not automatically defects.
- Time playback deliberately changes observation time and should remain an explicit user-controlled behavior.
- The motion-removal goal is a stable, settled presentation with no ornamental motion. Preserve only necessary data-driven trace and simulation state updates, with no decorative interpolation.
- Preserve click, keyboard, pointer, and semantic state changes.
- Do not add hidden movement as feedback for ordinary status changes.
- Do not animate scientific geometry when static state communicates the same information.
- Respect `prefers-reduced-motion` for any residual optional transition.
- Prefer immediate final state over an animated final state for the target look.
- If a movement has instructional value, make it explicit and user-triggered.
- Do not silently alter simulation step size while addressing visual motion.
- The audit does not assess general color, typography, responsive layout, or correctness of astronomy math.
- It does assess coordinate stability where it directly affects perceived motion.

## Evidence index and source findings

### Sky camera target interpolation

- Evidence: `src/sky/SkyCanvas.tsx:83` stores current look angles and nullable target angles in refs.
- Evidence: `src/sky/SkyCanvas.tsx:285` schedules the next animation frame unconditionally.
- Evidence: `src/sky/SkyCanvas.tsx:288-301` interpolates the camera toward a target while the render loop runs.
- Evidence: `src/sky/SkyCanvas.tsx:296-297` advances each angle by 8% of remaining difference per frame.
- Evidence: `src/sky/SkyCanvas.tsx:296-301` uses a fixed frame fraction, rather than elapsed time.
- Evidence: `src/sky/SkyCanvas.tsx:299-301` snaps to the target when both remaining differences are at most 0.002 radians.
- Evidence: `src/sky/SkyCanvas.tsx:597` assigns target angles after a focus request.
- Evidence: `src/sky/SkyCanvas.tsx:607` clears an in-flight target when the pointer is pressed.
- Finding: focus movement speed depends on display refresh rate and frame scheduling.
- Finding: at 60 Hz the nominal exponential time constant differs from 120 Hz.
- Finding: a dropped frame changes perceived duration because interpolation is not elapsed-time based.
- Finding: the final snap is a discontinuity whenever the residual is still visible at the threshold.
- Finding: the threshold is approximately 0.115 degrees per angle.
- Risk: the 8% factor is an obvious source-based hypothesis for uneven focus motion across devices.
- Risk: source alone does not prove that users perceive a visible jump at the snap boundary.
- Reproduction: open Live Sky, select a distant constellation in search, and record the viewport.
- Reproduction: repeat at two refresh rates, keeping window size and selected target constant.
- Reproduction: compare target-to-settled duration and pixel displacement near the final frames.
- Reproduction: pause and step observation time after focus settles to distinguish focus easing from sky rotation.
- Recommended change: replace the per-frame fraction with elapsed-time animation only if preserving a transition is desired.
- Recommended change: for strict motion removal, assign the calculated focus azimuth and elevation immediately.
- Recommended change: remove target refs and interpolation branches if direct positioning is selected.
- Acceptance: focus request reaches the target in one visual update, with no easing or final snap.
- Acceptance: manual drag still cancels a pending focus request and moves the camera with the pointer.
- Acceptance: azimuth wrap-around still selects the shortest mathematically valid direction if animation remains.
- Acceptance: camera target stays fixed after focus, regardless of 60 Hz versus 120 Hz rendering.
- Acceptance: repeated selection of the current target causes no visible movement.
- Acceptance: focus action never changes simulation date or selected star state unintentionally.
- Acceptance: rotation remains clamped to the current elevation range after direct manipulation.
- Validation: inspect computed azimuth/elevation at focus request and after the next rendered frame.
- Validation: record a fixed viewport and compare consecutive frames around focus completion.
- Validation: run the same focus interaction with reduced motion enabled.
- Validation: verify pointer-down during focus leaves the camera at the exact pointer-down orientation.
- Priority: P1, because focus motion is user-visible in the primary sky view and refresh-rate sensitive.

### Continuous frame loop and overlay rebuild

- Evidence: `src/sky/SkyCanvas.tsx:285-285` runs `requestAnimationFrame(animate)` at the start of every frame.
- Evidence: `src/sky/SkyCanvas.tsx:316-317` renders the Three.js scene every frame when references exist.
- Evidence: `src/sky/SkyCanvas.tsx:320-321` synchronizes the SVG overlay each frame.
- Evidence: `src/sky/SkyCanvas.tsx:451` replaces the entire overlay using `innerHTML`.
- Evidence: `src/sky/SkyCanvas.tsx:323-324` invokes that RAF loop during idle periods as well.
- Source fact: there is no dirty-state or settled-frame gate in the loop.
- Source fact: SVG contents are serialized and replaced even when all view inputs are unchanged.
- Hypothesis: recurring SVG node destruction/recreation may produce text rasterization shimmer on some browsers.
- Hypothesis: continuous rendering consumes GPU and CPU while the static starfield is idle.
- Hypothesis: overlay rebuild cost can amplify frame-time variance when many labels are enabled.
- Hypothesis: the recurring cost can make focus movement feel less stable under device load.
- No measured frame-time or repaint evidence was collected in this audit.
- Reproduction: hold the Live Sky view idle with labels and constellation lines enabled.
- Reproduction: capture a 10-second recording at fixed viewport size.
- Reproduction: compare overlay text edges and marker positions frame by frame.
- Reproduction: repeat with labels off, labels on, and trace markers present.
- Reproduction: observe whether movement persists after any camera or time input stops.
- Recommended change: mark the scene dirty on pointer, resize, camera, time, observer, and overlay-state changes.
- Recommended change: render once after a state change and sleep the loop until a new dirty signal arrives.
- Recommended change: preserve the existing render-on-demand behavior for static views.
- Recommended change: update existing SVG nodes or rebuild only when their semantic inputs change.
- Recommended change: avoid reconstructing identical SVG markup each animation frame.
- Acceptance: idle live sky schedules no continuous RAF work once a frame is rendered.
- Acceptance: pointer move, pointer drag, wheel zoom, resize, date change, and observer change each schedule a fresh frame.
- Acceptance: the view remains visually correct after returning from a hidden browser tab.
- Acceptance: labels and trace markers update immediately after their source state changes.
- Acceptance: overlay coordinates match the rendered camera after a drag and after a focus request.
- Acceptance: hidden labels are not recreated when the label toggle is off.
- Acceptance: repeated identical inputs do not replace overlay DOM nodes.
- Acceptance: no flicker appears in a 10-second idle capture with labels enabled.
- Acceptance: CPU/GPU activity falls to idle after the view settles, measured with browser performance tooling.
- Validation: instrument frame callbacks and count callbacks over a 5-second idle interval.
- Validation: count SVG child mutations during the same interval.
- Validation: repeat after enabling trace hints and after selecting a star.
- Validation: compare 60 Hz and 120 Hz behavior on the same browser build when available.
- Risk: event-driven rendering changes must not leave stale geometry after store updates.
- Risk: Three.js controls are custom, so the dirty-state invalidation path needs an explicit owner.
- Priority: P1 for unnecessary work and possible overlay flicker; visual flicker remains a hypothesis until measured.

### Time playback as apparent sky jitter

- Evidence: `src/sky/SkyCanvas.tsx:474-481` starts a timer only while time playback is on.
- Evidence: `src/sky/SkyCanvas.tsx:477-479` advances date once per 100 ms timer tick.
- Evidence: `src/sky/SkyCanvas.tsx:478` scales each step by the selected speed multiplier.
- Evidence: `src/stores/useAstroStore.ts:118-123` derives the next date by adding requested hours.
- Evidence: `src/components/TimelineBar.tsx:58-69` exposes play/pause and displays its state.
- Evidence: `src/components/TimelineBar.tsx:94-107` exposes speed values from 1x through 86400x.
- Source fact: playback is explicit and recurring while enabled.
- Source fact: its timer is wall-clock based rather than synchronized to animation timestamps.
- Source fact: date changes re-run the celestial rotation effect at `SkyCanvas.tsx:455-473`.
- Hypothesis: high speed values visibly step the sky in discrete 100 ms jumps.
- Hypothesis: timer scheduling jitter makes apparent motion irregular on loaded machines.
- This may be intended simulation behavior; treat as a product decision, not an automatic defect.
- Reproduction: enter Live Sky, note the selected speed, and start playback.
- Reproduction: observe fixed cardinal references and constellation lines at 1x.
- Reproduction: repeat at 3600x and 86400x while recording the viewport.
- Reproduction: compare the displayed UTC time change with visible sky-angle changes.
- Reproduction: stop playback and confirm the scene settles without residual movement.
- Recommended change: keep playback opt-in and keep the pause state visually explicit.
- Recommended change: if smooth simulated movement is desired, derive date from elapsed time rather than timer count.
- Recommended change: if motion removal is the goal, make playback updates discrete and user-stepped.
- Recommended change: avoid running a timer while the user has paused playback.
- Acceptance: paused playback changes neither date nor scene orientation during a 10-second idle capture.
- Acceptance: play begins only after an explicit click or keyboard activation.
- Acceptance: pause stops the next scheduled update and leaves the displayed date stable.
- Acceptance: speed changes do not produce a one-off date jump.
- Acceptance: manual previous/next buttons remain discrete actions without animated spatial interpolation.
- Acceptance: reset-to-now stops playback and lands at the current date.
- Acceptance: no background playback runs after switching views unless that is an explicit product requirement.
- Validation: test each exposed speed and record timestamp deltas for 10 seconds.
- Validation: verify that timer cleanup occurs on pause and component unmount.
- Validation: repeat with the browser tab backgrounded and foregrounded.
- Validation: document whether large speed steps are desired simulation semantics or unwanted motion.
- Priority: P2; playback is explicit, though the high-speed stepping should be clearly understood.

### Persistent trace hint pulse

- Evidence: `src/sky/SkyCanvas.tsx:733-739` displays the trace instruction inside a conditional block.
- Evidence: `src/sky/SkyCanvas.tsx:737` assigns Tailwind's `animate-pulse` class to a small status dot.
- Evidence: the pulse appears only while a star is hovered and trace mode is active.
- Source fact: the CSS animation repeats while this conditional tooltip remains mounted.
- Finding: this is perpetual blinking in an otherwise still data-entry task.
- Risk: blinking draws attention away from the hovered star and trace geometry.
- Risk: repeated luminance change can be uncomfortable for motion-sensitive users.
- Reproduction: enable trace mode, hover a star, and keep the pointer still.
- Reproduction: compare the dot with a stationary visual reference for at least five seconds.
- Reproduction: move the pointer away and confirm the tooltip and pulse disappear.
- Recommended change: remove `animate-pulse` from the dot.
- Recommended change: keep the dot as a static color indicator for the trace instruction.
- Recommended change: use a semantic label or icon to communicate the instruction state.
- Recommended change: do not replace pulse with a different recurring blink or glow.
- Acceptance: the dot remains visually unchanged for a 10-second stationary hover.
- Acceptance: entering trace mode does not start a repeated visual cycle.
- Acceptance: tooltip content remains readable while hovering a star.
- Acceptance: trace instruction still appears only in trace mode.
- Acceptance: tooltip still disappears when the hover target is cleared.
- Acceptance: reduced-motion settings do not change functional tooltip behavior.
- Validation: record a still hover for 10 seconds and inspect the dot's color and opacity.
- Validation: check that there is no inherited animation utility on the tooltip or ancestors.
- Priority: P1 for a simple, high-confidence motion removal.
- Classification: confirmed repeating animation from source; runtime visual severity not measured.

### Entrances, drawers, and result dialogs

- Evidence: `src/components/StarInspector.tsx:30` applies fade and right-slide entrance classes.
- Evidence: `src/features/traceMode/TraceHud.tsx:106` applies fade and left-slide entrance classes.
- Evidence: `src/features/traceMode/PatternAnalysisModal.tsx:47` applies fade and 95%-scale entrance classes.
- Evidence: `src/features/traceMode/RecognitionResultsModal.tsx:64` applies fade and 95%-scale entrance classes.
- Evidence: `src/features/constellationExplorer/ConstellationExplorer.tsx:422` applies fade and 95%-scale entrance classes.
- Evidence: `src/features/huntMode/HuntMode.tsx:79` applies a 95%-scale entrance to its success dialog.
- Source fact: entrance classes are conditional on components being mounted by view state.
- Finding: the effect repeats on each mount, including repeated opening and closing.
- Finding: panels move several Tailwind spacing units from their resting position.
- Finding: modal scale movement affects a large visual region despite short duration.
- Hypothesis: repeated entries feel jumpy when users rapidly select stars or open result panels.
- Hypothesis: a 150 ms zoom remains noticeable because the card edge changes size and location.
- Reproduction: in Live Sky, focus/select stars in quick succession to repeatedly mount the inspector.
- Reproduction: enter trace mode and exit/re-enter to observe the HUD's leftward slide.
- Reproduction: open/close pattern analysis and recognition results in sequence.
- Reproduction: open constellation details, dismiss, and reopen the same item.
- Reproduction: complete a hunt target and inspect the success dialog's scale motion.
- Recommended change: remove `animate-in`, `slide-in-from-*`, `zoom-in-95`, and associated duration classes.
- Recommended change: render each panel directly at its final position and final opacity.
- Recommended change: preserve the same mount/unmount state logic and focus management.
- Recommended change: do not replace movement with an opacity fade if the requested goal is no entrance motion.
- Acceptance: first mount paints the panel at its final coordinates and size.
- Acceptance: closing a panel removes it without an animated travel or scaling phase.
- Acceptance: repeated open/close cycles show identical stable geometry.
- Acceptance: selecting a new star does not move the inspector panel.
- Acceptance: opening a modal does not shift adjacent layout or resize the dialog.
- Acceptance: success state is communicated by static content, border, and text.
- Acceptance: Escape, close button, backdrop, and existing actions continue to function.
- Validation: measure panel bounding box on first rendered frame and after 250 ms.
- Validation: confirm bounding box is constant after mount.
- Validation: inspect all six cited components after removing classes.
- Priority: P1 if user explicitly requests no motion; otherwise P2 due brief one-shot movement.

### Broad CSS transitions

- Evidence: `src/App.css:171-175` defines `.tactile-button` with `transition: all 0.1s ease-in-out`.
- Evidence: `src/App.css:180-190` defines `.tactile-pill` with `transition: all 0.1s ease-in-out`.
- Evidence: `src/App.css:192-202` changes pill text and border on hover.
- Evidence: `src/App.css:21-24` transitions reticle border color only.
- Source fact: `transition: all` can interpolate any changed animatable property on those controls.
- Source fact: actual motion depends on which CSS properties change in each control.
- Risk: broad transitions may animate dimensions or transforms after later styles are added.
- Risk: different hovered/active controls can appear to move if a utility class changes layout properties.
- Current searched usages do not establish a specific layout shift from `.tactile-button`.
- Current `.tactile-pill` implementation changes color and border, which is not geometric movement.
- Color fades are ornamental transitions under this strict target; remove them or make the state change immediate.
- Recommended change: remove the broad `all` transition and make state changes immediate.
- Recommended change: keep hover feedback instantaneous with no color interpolation.
- Recommended change: audit computed styles for transforms, dimensions, padding, and position changes.
- Recommended change: do not remove static active-state contrast to avoid animation.
- Acceptance: hover and active states preserve element bounding boxes.
- Acceptance: no transform, scale, translate, or size interpolation occurs on control hover.
- Acceptance: focus indicator remains visible for keyboard users.
- Acceptance: active state is immediate when the action occurs.
- Acceptance: pointer enter/leave over header and tactile pills causes no geometric movement.
- Validation: compare `getBoundingClientRect()` before and after hover.
- Validation: inspect computed transition-property for all controls using `.tactile-button` and `.tactile-pill`.
- Validation: repeat under reduced motion and normal preference.
- Priority: P2; scope it narrowly and avoid removing useful state feedback without evidence.

### Pointer drag and wheel zoom

- Evidence: `src/sky/SkyCanvas.tsx:604-628` handles drag state and updates look angles from pointer deltas.
- Evidence: `src/sky/SkyCanvas.tsx:620-626` applies a sensitivity constant and clamps elevation.
- Evidence: `src/sky/SkyCanvas.tsx:666-671` updates camera field of view from wheel delta.
- Source fact: this is direct manipulation, explicitly initiated by pointer input.
- Source fact: no inertial continuation is implemented in the cited handlers.
- Finding: pointer-driven movement is expected control behavior, not automatic ambient motion.
- Risk: sensitivity can feel jumpy if event deltas are large or pointer events are coalesced.
- Risk: the audit has no runtime observation to determine whether drag feels unstable.
- Reproduction: drag slowly across the sky and stop abruptly.
- Reproduction: drag rapidly and release with pointer still inside the canvas.
- Reproduction: spin the mouse wheel one notch at a time.
- Reproduction: use touch drag if the target browser supports the current pointer path.
- Recommended change: retain direct drag and zoom unless the intended product prohibits manipulation.
- Recommended change: do not add inertia, momentum, spring-back, or auto-centering.
- Recommended change: if drag is independently reported as jitter, inspect input deltas before altering sensitivity.
- Recommended change: process coalesced pointer events only if a measured loss of smoothness warrants it.
- Acceptance: release stops camera movement immediately.
- Acceptance: no residual animation remains after drag release.
- Acceptance: a stationary pointer causes no camera-angle changes.
- Acceptance: wheel zoom applies only the user's wheel input.
- Acceptance: zoom stays within the existing 20 to 85 degree range.
- Acceptance: drag still cancels any pending focus movement.
- Validation: log camera angles after pointer-up and confirm they remain constant.
- Validation: test mouse, trackpad, and touch independently.
- Validation: compare angle delta to pointer delta under high polling rate.
- Priority: P3 unless the user reports direct manipulation jitter.
- Classification: source indicates no inertial motion; perceptual quality requires interaction testing.

### Star and constellation labels

- Evidence: `src/sky/SkyCanvas.tsx:328-356` projects cardinal labels each overlay sync.
- Evidence: `src/sky/SkyCanvas.tsx:361-385` projects constellation labels when the toggle is active.
- Evidence: `src/sky/SkyCanvas.tsx:388-417` projects numbered trace badges.
- Evidence: `src/sky/SkyCanvas.tsx:420-448` projects the selected-star reticle.
- Source fact: labels derive positions from the current camera and celestial-group matrix.
- Source fact: all these elements share the same overlay rebuild path.
- Hypothesis: subpixel text positions may rasterize differently frame-to-frame during movement.
- Hypothesis: rewriting the overlay string each frame can increase apparent edge shimmer.
- No source evidence shows intentional label bobbing, orbit, or pulse.
- Reproduction: select a star, stop camera movement, and watch its reticle.
- Reproduction: enable constellation labels and let the camera settle.
- Reproduction: leave a traced path visible while moving the camera slowly.
- Recommended change: keep positions stable when camera and celestial transform do not change.
- Recommended change: update projection on dirty events, not on idle frames.
- Recommended change: round coordinates only if measurements show subpixel shimmer; avoid introducing visible snapping.
- Recommended change: ensure the label and star geometry use the same transform snapshot.
- Acceptance: selected reticle stays fixed relative to its star while idle.
- Acceptance: labels move only when camera, date, observer, or visibility state changes.
- Acceptance: overlay update is atomic with the scene render after an interaction.
- Acceptance: trace numbering and selected marker do not flash during static observation.
- Validation: capture selected-star marker at fixed viewport and inspect successive frames.
- Validation: test with browser zoom at 100%, 125%, and 150%.
- Validation: test fractional device-pixel ratio if available.
- Priority: P2 investigation tied to the continuous rebuild finding.

## Mode-by-mode improvement tasks

### Global shell and navigation

- Surface: `src/App.tsx` mounts one active view inside the shared shell.
- Surface: `src/components/HeaderNav.tsx` owns route-like view selection and search.
- Surface: `src/App.css` owns shared tactile styling and reticle borders.
- Source evidence: header actions use `transition-all` around lines 225, 246, and 357.
- Source evidence: brand mark uses `transition-opacity` around line 94.
- Source evidence: search controls use color/border transitions around lines 123 and 259.
- Likely motion: visual state changes when switching view or selecting navigation/search items.
- Risk: `transition-all` can produce future geometry changes without a local audit.
- Task: list every transition utility in HeaderNav and classify exact properties being animated.
- Task: remove only transitions that affect position, size, transform, or opacity.
- Task: remove transition-all and make navigation state changes immediate.
- Task: make route changes immediate.
- Task: keep selected navigation state visually distinct without sliding indicators.
- Task: do not animate the brand mark on hover if the target is a motion-free interface.
- Task: preserve dropdown open/close behavior without animated travel.
- Task: preserve search filtering and keyboard focus while removing movement.
- Acceptance: clicking each nav item changes content once and leaves the header geometry unchanged.
- Acceptance: changing search results does not move the search box or nav row.
- Acceptance: open observer dropdown remains at a stable final position.
- Acceptance: no active-tab underline or highlight travels between navigation items.
- Acceptance: header hover and focus feedback does not translate or scale controls.
- Acceptance: keyboard focus remains visible without an animated ring.
- Acceptance: route changes respect reduced-motion preference.
- Repro: move across each header item slowly and watch neighboring controls.
- Repro: switch rapidly among all eight view items and inspect for delayed movement.
- Repro: type and clear a query while observing dropdown size and anchor.
- File task: `src/components/HeaderNav.tsx`, remove or narrow transitions by property.
- File task: `src/App.css`, narrow tactile utility transition definitions.
- File task: `src/App.tsx`, leave route mounting behavior unchanged unless a verified transition is added elsewhere.

### Live Sky idle and focus

- Surface: `src/sky/SkyCanvas.tsx` renders stars, constellation lines, horizon, grid, and projected labels.
- Source evidence: camera focus interpolation lives at lines 285-321.
- Source evidence: overlay replacement lives at line 451.
- Source evidence: playback interval lives at lines 474-481.
- Source evidence: pointer and wheel interactions live at lines 604-671.
- Likely motion: camera rotates on focus and explicit drag.
- Confirmed motion utility: trace instruction pulse at line 737.
- Hypothesized jitter: frame-rate-dependent camera interpolation and repeated SVG replacement.
- Task: remove ambient RAF work after the scene is cleanly rendered.
- Task: remove all focus easing for the strict motion-removal profile.
- Task: keep pointer drag and wheel zoom as direct manipulation.
- Task: keep playback opt-in and preserve pause/step actions.
- Task: remove the trace instruction pulse.
- Task: update the overlay only when projection inputs change.
- Task: check observer/date changes for instant and coherent transform updates.
- Task: verify resize schedules one correct projection update.
- Acceptance: idle sky is pixel-stable over ten seconds, excluding external display noise.
- Acceptance: focus selection positions the camera immediately.
- Acceptance: a paused scene does not move.
- Acceptance: no pulse repeats while hovering.
- Acceptance: date/time changes are the only automatic source of sky position change.
- Acceptance: date changes occur only after explicit playback, step, or reset action.
- Acceptance: drag and wheel stop changing the scene when input stops.
- File task: `src/sky/SkyCanvas.tsx`, remove animation loop or convert to dirty render path.
- File task: `src/sky/SkyCanvas.tsx`, remove focus interpolation refs and animation branch.
- File task: `src/sky/SkyCanvas.tsx`, replace per-frame SVG assignment with state-driven update.
- File task: `src/sky/SkyCanvas.tsx`, remove `animate-pulse`.
- File task: `src/stores/useAstroStore.ts`, change only if time playback lifecycle is proven to continue unexpectedly.
- Repro: run focus, drag, zoom, pause, step, select, and trace hover separately.
- Repro: repeat with labels, grid, horizon, and constellation lines independently enabled.

### Trace mode and trace feedback

- Surface: `src/features/traceMode/TraceHud.tsx` overlays trace controls in Live Sky.
- Surface: `src/sky/SkyCanvas.tsx` renders trace markers and hover instructions.
- Surface: `src/features/traceMode/PatternAnalysisModal.tsx` and `RecognitionResultsModal.tsx` show results.
- Source evidence: Trace HUD slides in from the left at line 106.
- Source evidence: analysis modal zoom/fade begins at line 47.
- Source evidence: recognition results modal zoom/fade begins at line 64.
- Source evidence: trace dot pulses at SkyCanvas line 737.
- Likely motion: trace HUD entrance on every fresh mount.
- Likely motion: modal scaling during open.
- Confirmed motion: recurring status dot animation.
- Task: remove slide-in and zoom/fade utility classes from all trace surfaces.
- Task: retain static four-dot progress indication, changing only discrete color state.
- Task: remove the pulse from the instruction dot.
- Task: ensure trace point additions update immediately without animated movement.
- Task: keep undo and clear state changes discrete.
- Task: avoid animating the drawn trace line between old and new geometry.
- Task: verify recognition status replacement does not cause layout movement.
- Task: keep modal placement fixed regardless of result text length.
- Acceptance: entering trace mode places the HUD at its final location.
- Acceptance: opening either trace modal shows final size and opacity on the first paint.
- Acceptance: tracing a point changes counters and static markers without pulsing.
- Acceptance: undo removes the last point without sliding it backward.
- Acceptance: clearing trace removes markers without fade or shrink.
- Acceptance: modal open/close has no travel or scaling.
- Acceptance: static step indicators convey count and recognition state.
- Acceptance: no recurring animation appears in hover telemetry.
- File task: `src/features/traceMode/TraceHud.tsx`, remove entrance class.
- File task: `src/features/traceMode/PatternAnalysisModal.tsx`, remove entrance classes.
- File task: `src/features/traceMode/RecognitionResultsModal.tsx`, remove entrance classes.
- File task: `src/sky/SkyCanvas.tsx`, remove pulse class and verify overlay update.
- Repro: enter trace mode, add points, undo, clear, open both modals, and repeat quickly.
- Repro: hover a star without moving for ten seconds.

### Timeline and time playback

- Surface: `src/components/TimelineBar.tsx` contains play, pause, step, reset, and speed controls.
- Surface: `src/sky/SkyCanvas.tsx` applies date-dependent sky transforms.
- Source evidence: play state toggles at TimelineBar lines 58-69.
- Source evidence: speed options are declared at lines 94-107.
- Likely motion: sky moves in timestamp increments during playback.
- Source-based concern: updates are interval ticks, not continuous elapsed-time values.
- Task: keep play disabled until explicit user activation.
- Task: stop updates synchronously when pause is activated.
- Task: ensure view unmount or tab switching does not leave a hidden timer running.
- Task: keep discrete step buttons immediate and non-animated.
- Task: preserve selected speed when paused without changing date.
- Task: don't auto-start playback on mount, focus, or navigation.
- Task: document whether 1x is meant to represent real time or a sped-up update cadence.
- Acceptance: time text remains constant while paused.
- Acceptance: sky orientation remains constant while paused.
- Acceptance: one click on +1H produces one deterministic date increment.
- Acceptance: one click on -1D produces one deterministic date decrement.
- Acceptance: reset updates date once and pauses playback.
- Acceptance: changing speed while paused does not resume movement.
- Acceptance: returning to the sky view does not restart a previously paused timer.
- Acceptance: a high speed visibly steps only while play is active.
- File task: `src/components/TimelineBar.tsx`, keep controls stateful and remove any newly introduced motion classes.
- File task: `src/sky/SkyCanvas.tsx`, verify interval cleanup and date transform update.
- File task: `src/stores/useAstroStore.ts`, inspect state actions only if a hidden update persists.
- Repro: exercise every speed, pause, step and reset.
- Repro: navigate away while paused and return after ten seconds.

### Sky Tonight

- Surface: `src/features/skyTonight/SkyTonight.tsx` presents above-horizon data and selection actions.
- Source evidence: card transitions appear at lines 201, 224, and 357.
- Source evidence: selection can route back to Live Sky near line 465.
- Source search shows no `animate-in`, `animate-pulse`, or RAF loop in this component.
- Likely motion: card and star selection hover transitions.
- Source fact: the searched transitions are broad, but affected property behavior needs computed-style review.
- Task: inspect the three transition-all usages and identify transformed properties.
- Task: ensure selected constellation or star cards don't scale or shift.
- Task: ensure the tiny star indicators remain static after selection.
- Task: keep hover feedback as immediate static color/border state, without interpolation.
- Task: remove any inherited animation from card utility classes if discovered.
- Task: retain navigation back to Live Sky without spatial transition.
- Acceptance: card bounds are identical before and after hover.
- Acceptance: selection changes text/state immediately.
- Acceptance: no star dot pulses or bounces on focus.
- Acceptance: list scrolling is user-driven and has no automatic snap animation.
- Acceptance: no content animates on initial view mount.
- File task: `src/features/skyTonight/SkyTonight.tsx`, remove transition-all and make hover state immediate.
- File task: `src/App.css`, adjust shared utilities only if this view uses them.
- Repro: hover all cards, select each representative item, and switch back to sky.
- Repro: pause pointer over each star indicator and inspect for cycling styles.
- Classification: no source-confirmed perpetual motion in this mode.

### Constellation Explorer

- Surface: `src/features/constellationExplorer/ConstellationExplorer.tsx` shows cards, filters, and detail view.
- Source evidence: card hover transition-all at line 360.
- Source evidence: detail panel entrance motion at line 422.
- Source search shows no dedicated repeating animation loop here.
- Likely motion: hover appearance change and one-shot detail-panel scale/fade.
- Task: remove fade and zoom entrance classes from the detail panel.
- Task: remove card transition-all; update card hover state immediately.
- Task: preserve card selection, detail content, and back/close behavior.
- Task: ensure long detail content does not animate its height on selection.
- Task: verify that filtering results causes normal immediate reflow.
- Acceptance: detail panel appears at full size and final location immediately.
- Acceptance: card bounds do not change on pointer hover or focus.
- Acceptance: changing the selected constellation does not animate panel geometry.
- Acceptance: scrolling is explicit and no smooth auto-scroll is triggered.
- Acceptance: no repeating motion appears while a detail panel is open.
- File task: `src/features/constellationExplorer/ConstellationExplorer.tsx`, remove entrance and hover transition classes.
- File task: check project Tailwind utilities only if unexpected transition styles remain after cleanup.
- Repro: open and close details for several cards in quick succession.
- Repro: filter the list while watching card positions and detail-panel dimensions.
- Classification: one-shot panel motion is confirmed in source; visual intensity unmeasured.

### Automata Lab

- Surface: `src/features/automataLab/AutomataLab.tsx` hosts tabs and export modal.
- Surface: simulator and subset construction have interval-driven step advancement.
- Evidence: `SimulatorView.tsx:43-53` defines and cleans an interval.
- Evidence: `SubsetConstructionView.tsx:13-20` defines and cleans an interval.
- Evidence: transition-all appears in tab and state controls in multiple automata components.
- Source fact: interval playback is user-triggered if its controls are respected; inspect callbacks before changing.
- Source fact: no automatic graph animation is found by the motion search.
- Likely motion: highlighted state changes and animated tab/control properties.
- Task: preserve step-by-step algorithm demonstration when the user explicitly starts it.
- Task: make stop/pause immediate and cancel scheduled advancement.
- Task: remove automatic traversal or auto-play on view entry.
- Task: remove transition-all on tabs and state choices; update state immediately.
- Task: verify state highlights change discretely without scaling, bouncing, or glow pulsing.
- Task: inspect export modal for entrance classes even though none were found in search results.
- Acceptance: opening Automata Lab does not start simulation.
- Acceptance: manual next/previous updates exactly one state per click.
- Acceptance: automatic step control runs only while explicitly enabled.
- Acceptance: pause cancels the timer immediately.
- Acceptance: changing tabs does not slide or scale the tab row.
- Acceptance: selected DFA/NFA states do not move their cards.
- File task: `src/features/automataLab/SimulatorView.tsx`, preserve explicit timer control and cleanup.
- File task: `src/features/automataLab/SubsetConstructionView.tsx`, preserve explicit timer control and cleanup.
- File task: `src/features/automataLab/AutomataLab.tsx`, audit export modal and tab transition properties.
- File task: `DfaView.tsx`, `MinimizedDfaView.tsx`, `EpsilonClosureView.tsx`, narrow transition-all.
- Repro: enter each tab, verify idle, manually step, play, pause, and leave/re-enter.
- Classification: step playback is intentional user-driven algorithm motion; tabs show broad CSS transition potential.

### Hunt Mode

- Surface: `src/features/huntMode/HuntMode.tsx` includes target tasks and success dialog.
- Source evidence: success dialog uses zoom-in-95 at line 79.
- Source evidence: hunt mode is mounted only for the hunt active view in App.
- Likely motion: one-shot zoom on successful completion.
- Task: remove the zoom entrance class from the success dialog.
- Task: keep target selection and hint level changes immediate.
- Task: keep any user-initiated sky tracing direct and motion-free after each click.
- Task: do not introduce confetti, bouncing badges, shake, or auto-scroll on success.
- Acceptance: success dialog appears at final dimensions and opacity immediately.
- Acceptance: successful recognition changes text and controls without spatial movement.
- Acceptance: moving to next target does not auto-focus or pan the sky unless explicitly requested.
- Acceptance: hint button changes static text/state and does not pulse.
- Acceptance: repeated success cycles show no motion.
- File task: `src/features/huntMode/HuntMode.tsx`, remove entrance utilities and audit feedback classes.
- File task: `src/sky/SkyCanvas.tsx`, verify hunt hints and focus are static absent direct selection.
- Repro: complete a hunt target, close/advance, and complete a second target.
- Repro: activate hints at each level, then hold still for ten seconds.
- Classification: one-shot success movement is source-confirmed; other ambient motion not found.

### Image Lab

- Surface: `src/features/imageLab/ImageLab.tsx` includes image interaction and analysis actions.
- Source search shows no explicit animate utility or animation loop in the component.
- Source search shows no `requestAnimationFrame` or `setInterval` in this component.
- Potential changes to image position may be direct user actions; inspect the relevant handlers before editing.
- Task: inspect image upload, selection, and result states for inline style transforms.
- Task: verify no animated loading indicator is hidden behind conditional class construction.
- Task: keep image input and analysis results static once complete.
- Task: do not add zoom-to-fit or auto-pan as a side effect of switching tabs.
- Task: if a user can zoom an image, require direct input and stop immediately on release.
- Acceptance: initial view and result mount without scale/fade movement.
- Acceptance: image bounds remain fixed when results change.
- Acceptance: loading state does not pulse, spin, or blink unless the user authorizes that feedback.
- Acceptance: selecting a different image does not animate the previous image out.
- File task: `src/features/imageLab/ImageLab.tsx`, audit inline styles and conditional classes for motion.
- Repro: upload/select an image, run analysis, and switch tabs while watching the image viewport.
- Repro: leave a completed result idle for ten seconds.
- Classification: no explicit motion found in searched source; full inline-style review remains required.

### Academic Walkthrough

- Surface: `src/features/academic/AcademicWalkthrough.tsx` contains step selection pills.
- Source evidence: step pills use transition-all at line 94.
- Source search shows no recurring timer or RAF in this component.
- Likely motion: state transition on active walkthrough pill.
- Task: remove transition-all from step pills and make active state immediate.
- Task: ensure step changes replace content immediately rather than sliding.
- Task: do not auto-advance the walkthrough.
- Task: preserve previous/next actions as discrete navigation.
- Acceptance: step selection changes content once and then remains still.
- Acceptance: active pill bounds and position do not change.
- Acceptance: no automatic content scroll or focus shift happens without user action.
- Acceptance: re-opening Viva Mode starts at the existing intended step with no animation.
- File task: `src/features/academic/AcademicWalkthrough.tsx`, remove transition-all and audit step effects.
- Repro: select every step in order, then jump backward and forward while watching content boundaries.
- Classification: only broad transition potential is found in source.

### Credits

- Surface: `src/components/CreditsModal.tsx` is shown as the credits active view.
- Source search shows no explicit animation utility in this component.
- Source search shows no continuous timer or RAF in this component.
- Task: inspect any shared utility classes on the credits content.
- Task: keep navigation to sky immediate.
- Acceptance: view mounts directly at final layout.
- Acceptance: no fade, slide, or zoom occurs when opening credits.
- Acceptance: no content continues moving after mount.
- File task: `src/components/CreditsModal.tsx`, remove any inherited entrance motion if found.
- Repro: open credits from each surrounding view and return to sky.
- Classification: no explicit motion confirmed in searched component.

## Strict acceptance protocol

- Run the complete checklist at the same fixed browser size before and after implementation.
- Use one browser build and device pixel ratio for direct before/after comparison.
- Record the viewport size and display refresh rate.
- Use an idle capture of at least ten seconds per static mode.
- Keep the pointer outside interactive hover targets during idle capture.
- Run a second capture with pointer held over an interactive control.
- Run a third capture with pointer held over a star in trace mode.
- Confirm idle visual coordinates do not change between frames.
- Confirm no repeated opacity, scale, translation, rotation, or size cycle remains.
- Confirm all ambient motion is removed from every active view.
- Confirm no scroll animation starts without a direct scroll action.
- Confirm focus movement has been removed or explicitly approved as a remaining user-triggered effect.
- Confirm modal surfaces have no entrance or exit translation.
- Confirm modal surfaces have no entrance or exit scaling.
- Confirm no status dot pulses, blinks, or cycles its brightness.
- Confirm card and control bounds are stable under hover.
- Confirm selected state feedback is immediate and static.
- Confirm pointer drag ends at pointer-up with no inertial continuation.
- Confirm wheel zoom changes only during wheel input.
- Confirm playback is stopped by default.
- Confirm paused playback leaves the date and sky fixed.
- Confirm playback controls still work when activated.
- Confirm single-step date controls remain deterministic.
- Confirm simulation stop and timer cleanup work on unmount.
- Confirm algorithm playback is stopped by default.
- Confirm algorithm playback stops immediately when paused.
- Confirm no algorithm state changes after leaving its view.
- Confirm labels stay attached to their corresponding celestial geometry.
- Confirm static overlay elements do not flicker during idle.
- Confirm selected-star reticle remains stable during idle.
- Confirm trace markers remain stable during idle.
- Confirm every view can be reached and exited without motion.
- Confirm Escape and close actions remain immediate.
- Confirm keyboard focus remains obvious without moving controls.
- Confirm `prefers-reduced-motion: reduce` produces no motion.
- Confirm the ordinary-motion preference also honors the strict no-motion request.
- Confirm no new animation utility was introduced in replacement styles.
- Capture performance traces for idle sky after making the render loop event-driven.
- Count RAF callbacks during five seconds of idle sky.
- Count SVG mutations during five seconds of idle sky.
- Expect zero repeated RAF callbacks after the initial dirty render.
- Expect zero repeated SVG mutations without a state change.
- Record any remaining motion as intentional, user-triggered, and explicitly approved.
- If any remaining motion is not required, remove it rather than documenting it as acceptable.
- Keep this acceptance report separate from functional correctness tests.
- Functional controls must still work after motion removal.
- No failed acceptance item should be waived as a mere aesthetic preference without a user decision.
- Implementation evidence should include changed file names and exact removed utilities.
- Implementation evidence should include one screenshot per static mode.
- Implementation evidence should include one short recording of live sky idle.
- Implementation evidence should include recordings of focus, modal opening, and playback controls.
- Implementation evidence should include before/after measurements for camera focus if focus is retained.
- Implementation evidence should name browser, OS, refresh rate, viewport, and device pixel ratio.
- Implementation evidence should distinguish static capture evidence from source inspection.
- Do not claim pixel stability from source review alone.
- Do not claim refresh-rate independence unless checked at multiple refresh rates.
- Do not claim reduced-motion compliance unless the media preference was actually tested.
- Do not claim zero GPU use from code inspection alone.
- Treat frame timing and jitter as runtime observations, not assumptions.
- Treat source-level repeating animations as confirmed regardless of runtime capture availability.
- Escalate only real motion still visible after these checks.
- The target state is quiet by default and direct under explicit interaction.

## Exact file-by-file change list

- `src/sky/SkyCanvas.tsx`: remove per-frame focus easing for strict motion removal.
- `src/sky/SkyCanvas.tsx`: remove the recurring trace hint pulse.
- `src/sky/SkyCanvas.tsx`: stop rebuilding SVG overlay markup on unchanged frames.
- `src/sky/SkyCanvas.tsx`: render on dirty inputs or explicit user interaction.
- `src/sky/SkyCanvas.tsx`: keep pointer drag and wheel zoom synchronous and direct.
- `src/sky/SkyCanvas.tsx`: ensure time playback interval is cleaned when paused and unmounted.
- `src/components/StarInspector.tsx`: remove right-slide and fade entrance classes.
- `src/features/traceMode/TraceHud.tsx`: remove left-slide and fade entrance classes.
- `src/features/traceMode/PatternAnalysisModal.tsx`: remove zoom and fade entrance classes.
- `src/features/traceMode/RecognitionResultsModal.tsx`: remove zoom and fade entrance classes.
- `src/features/constellationExplorer/ConstellationExplorer.tsx`: remove detail entrance classes.
- `src/features/constellationExplorer/ConstellationExplorer.tsx`: narrow card hover transitions.
- `src/features/huntMode/HuntMode.tsx`: remove success dialog zoom entrance classes.
- `src/App.css`: replace broad `transition: all` with the smallest explicit property list or none.
- `src/components/HeaderNav.tsx`: remove any property transitions that move or resize controls.
- `src/components/TimelineBar.tsx`: preserve play and step behavior without spatial transitions.
- `src/features/skyTonight/SkyTonight.tsx`: narrow the three transition-all usages.
- `src/features/automataLab/AutomataLab.tsx`: audit export modal and tab controls.
- `src/features/automataLab/SimulatorView.tsx`: preserve explicit playback and timer cleanup.
- `src/features/automataLab/SubsetConstructionView.tsx`: preserve explicit playback and timer cleanup.
- `src/features/automataLab/DfaView.tsx`: remove any geometric transition from state selection.
- `src/features/automataLab/MinimizedDfaView.tsx`: remove any geometric transition from tabs/state selection.
- `src/features/automataLab/EpsilonClosureView.tsx`: remove any geometric transition from state selection.
- `src/features/academic/AcademicWalkthrough.tsx`: narrow transition-all on step controls.
- `src/features/imageLab/ImageLab.tsx`: inspect inline and conditional motion properties; remove if found.
- `src/components/CreditsModal.tsx`: verify static mount and immediate return action.
- `src/App.tsx`: do not add view transition wrappers; current switch mounts the selected view directly.
- `src/index.css`: add a scoped reduced-motion safety rule only if residual transitions remain.
- `src/index.css`: avoid a global wildcard that disables unrelated functional scroll behavior.
- Tests: add no motion tests as part of this audit; use the acceptance protocol during implementation review.




<a id="reference-1-4"></a>
# Reference measurement: first four UI images

**Scope:** Independent visual audit of the first four entries in `C:\ommd3076\Proejcts\automata-theory\UI-REFENECE`, plus the shared visual language and app entry/fixture links those screenshots can reasonably support. This is reference-side evidence, not a full code change audit. No repository files were modified.

## Findings in brief

- There are four files in this slice but only two distinct images: images 1 and 3 have identical SHA-256; images 2 and 4 have identical SHA-256.
- A complete `UI-REFENECE` directory listing contains 12 PNG files overall; this report covers the first four in timestamp/name sort order only.
- Unique screen A is an **Overview analytics dashboard**. Unique screen B is a **Sky Explorer with an inspector**. Treat the later duplicate as confirmation or another capture slot, not an independent design state.
- Both are 1586 × 992 PNGs. The visible application panel sits within a blue textured surround; the surround is part of the supplied reference image and should not be assumed to be application UI.
- Both use a compact fixed left navigation column, pale cards, dark technical text, cobalt active accents, outlined rounded controls, and generous empty space around a data-dense grid.
- The reference's 228-ish-pixel left rail and 1586 × 992 canvas differ materially from the project's top header, tray, and dark sky canvas. Reproducing the references requires an explicit structural redesign or a design-scoped subset; the screenshots do not show the current app shell.
- The most direct source render entry points implicated by the Sky Explorer image are `src/App.tsx` (`activeView === 'sky'`) and its `SkyCanvas`, `StarInspector`, `TimelineBar`, and `TraceHud` children. The overview is not represented by an existing `activeView` branch in `App.tsx`; do not claim `SkyTonight` or another route is a dashboard match without further evidence.
- Screenshot copy and telemetry values are illustrative reference data. No sampled value proves that the actual astronomy calculation, source catalog, or app store must yield the displayed number.

## Inventory and identity

| Sort | File | Dimensions | Visual identity | Duplicate status |
|---:|---|---:|---|---|
| 1 | `ChatGPT Image Nov 11, 2026, 07_57_18 PM-1.png` | 1586 × 992 | Overview dashboard | Exact duplicate of sort 3 |
| 2 | `ChatGPT Image Nov 11, 2026, 07_57_37 PM-2.png` | 1586 × 992 | Sky Explorer | Exact duplicate of sort 4 |
| 3 | `ChatGPT Image Nov 11, 2026, 07_57_58 PM-1.png` | 1586 × 992 | Overview dashboard | Exact duplicate of sort 1 |
| 4 | `ChatGPT Image Nov 11, 2026, 07_58_13 PM-2.png` | 1586 × 992 | Sky Explorer | Exact duplicate of sort 2 |

### Verification of duplicates

- Hashes were calculated from the original PNG files with `Get-FileHash` (SHA-256).
- Sort 1 and sort 3 both have SHA-256 `F998472C47BFFDD94A76D1F09DE0CC0B2EB310CDF4D38B311BFB1D4851C94D63`.
- Sort 2 and sort 4 both have SHA-256 `142701A6B16C388E2E3087F41948220C8692FB0144C0737B6428BC184301A470`.
- The two different screen families returned different hashes.
- Visual inspection likewise found no changed text, layout, color, object, or state between duplicate pairs.
- Duplicate equality is a strong fact: byte-identical files cannot encode distinct UI states; identical bytes also guarantee identical decoded pixels.
- Any count of “four references” should still retain all four filenames while reporting two unique reference designs.

## Method and confidence labels

- **Observed:** Visible directly in a source screenshot, including legible text and relative ordering.
- **Sampled:** Taken from the source raster at stated pixel coordinates with System.Drawing. These are exact pixels at those coordinates, not inferred CSS variables or a claim that the sampled pixel is a flat design token.
- **Measured estimate:** Approximate pixel bounds read from the displayed source image by visual inspection. Treat as a target band with ±3–8 px uncertainty depending on anti-aliased edges and rounded corners.
- **Derived:** A ratio or relationship calculated from sampled dimensions or measured estimates.
- **Inferred:** Likely intent or semantic mapping. Keep separate from requirements until confirmed by a source artifact or owner.
- PNG dimensions and duplicate hashes are exact.
- The outer app frame, card bounding boxes, gaps, and text sizes below are visual estimates, not DOM/CSS inspection.
- Pixel values sampled on gradients, anti-aliased text, shadows, and image art vary by location; the named colors are sampled examples, not recovered palette constants.
- The image viewer downscales for display, but coordinates and color samples were taken from the original 1586 × 992 source PNG.
- All four images were opened and visually inspected. Sorts 1/3 and 2/4 were each visually compared as pairs.
- Sampling points used to characterize image 1 included `(0,0)`, `(33,48)`, `(40,100)`, `(150,100)`, `(260,100)`, `(277,70)`, `(400,70)`, `(300,210)`, `(600,210)`, `(900,210)`, `(1210,210)`, `(278,585)`, `(900,585)`, `(500,300)`, `(500,500)`, `(1545,950)`, and `(1585,991)`.
- Sampling points used to characterize image 2 included `(40,50)`, `(280,60)`, `(300,220)`, `(300,280)`, `(1180,280)`, `(1180,500)`, `(500,500)`, `(1000,500)`, `(800,900)`, and `(1300,800)`.
- The sampling process selected pixels directly; it did not infer palette values by averaging an entire panel.
- For implementation work, use those color values as visual spot checks only; establish actual CSS tokens separately.

## Shared appearance contract

### Canvas and outer composition

- Both PNGs are exactly 1586 px wide and 992 px high.
- The aspect ratio is 1.5988:1 (derived from raster dimensions).
- A soft blue, lightly mottled/textured background fills the full canvas behind the light application frame.
- The app frame appears to begin around x=33 and y=48 and end around x=1546 and y=951.
- Approximate frame width is 1513 px (95.4% of canvas width).
- Approximate frame height is 903 px (91.0% of canvas height).
- The frame corners look square or only slightly rounded at this scale.
- A narrow border/edge marks the application panel against the blue surround.
- The textured blue exterior is visible on every side, including wider top and bottom bands than side bands.
- The frame is light neutral, close to white; it is not the project's dark canvas surface.
- The application frame contains a left rail plus a broad content region.
- The left rail remains visually quiet and lower contrast than active content.
- The content region uses independent bordered/rounded cards rather than one uninterrupted flat dashboard.
- Cards are aligned to common horizontal and vertical guides.
- Most information is set in all-caps monospace or squared technical type.
- Labels are compact and tracked; headings use larger caps; selected numbers are oversized.
- Cobalt or bright blue is reserved for active selection, highlighted chart data, links, and a few emphasized results.
- The broad background and card surfaces use warm/cool near-white grays.
- The visually strongest dark area is the starfield photograph/render in the Sky Explorer image.
- Thin light gray borders separate cards and controls from adjacent surfaces.
- Shadows are very low contrast or absent; hierarchy comes mainly from card boundaries, spacing, and color.
- Common card corner radius visually falls around 20–27 px at 1586 × 992 raster size.
- Small controls are rounded pills or rounded rectangles with thin neutral outlines.
- Buttons avoid deep shadows and heavy elevation.
- The blue outer texture must not be mistaken for the app shell or the sky viewport.
- The card surfaces are slightly translucent-looking/soft, but screenshot evidence alone cannot distinguish translucency from a gentle gradient.
- No hover, focus, loading, error, or responsive state is shown in either unique screen.
- No mobile or narrow breakpoint contract can be inferred from these desktop screenshots.

### Shared left navigation rail

- The rail runs down the full inner application height from approximately y=48 to y=951.
- Its left edge aligns with the inner application's left edge, approximately x=34.
- In the dashboard image, the rail/content seam is near x=261, giving an approximate rail width of 227 px.
- In the Explorer image, the visible rail/content seam is near x=231–247 depending on whether the apparent gutter is included; the rail appears narrower than in the dashboard.
- This discrepancy may reflect slightly different panel measurement or a genuine small layout change; do not force one exact width across both references without checking actual pixels/code intent.
- The logo is at upper left, approximately x=60, y=70 in the dashboard and similar in Explorer.
- The logo combines a small blue four-point star/plus symbol and bold dark text `ASTROFA`.
- Logo baseline and menu label alignment are consistent.
- The rail has eight visible destinations in this order: `OVERVIEW`, `SKY EXPLORER`, `TRACE`, `PATTERNS`, `AUTOMATA`, `IMAGE LAB`, `RESULTS`, `SETTINGS`.
- Each destination pairs a thin line icon with a small all-caps label.
- Row height is around 46 px, estimated from centers near y=154, 201, 249, 296, 342, 388, 435, and 481.
- The active row has blue text/icon, a pale blue fill, and thin blue corner/edge treatment.
- In image 1/3, `OVERVIEW` is active.
- In image 2/4, `SKY EXPLORER` is active.
- Inactive menu labels and icons are a low-contrast charcoal gray.
- The active state uses a saturated cobalt blue similar to visible chart data.
- The active outline is not a thick filled button; it appears as a fine border with small corner brackets.
- The logo and nav fit above the lower half of the rail, leaving substantial blank space below `SETTINGS`.
- No user avatar, account control, collapse button, or secondary sidebar section is visible.
- The navigation wording is reference content; it does not exactly match the current app nav labels in `src/components/HeaderNav.tsx`.
- Current app labels include `LIVE SKY`, `SKY TONIGHT`, `EXPLORER`, `AUTOMATA LAB`, `HUNT`, `IMAGE LAB`, `VIVA MODE`, and `CREDITS`; these are not equivalent one-for-one to the reference rail.

### Shared typography and controls

- The general text face is monospaced or visually monospaced, with compact proportions.
- The brand uses a heavier sans/mono hybrid or bold technical face.
- Headings are all-caps, dark, medium-weight, and slightly tracked.
- Micro-labels are lighter and smaller than card titles.
- KPI values use a segmented or dotted LED display treatment in several places.
- The dotted display face appears on headline numerals and status words, not on every text element.
- Flat monospace text remains used for dates, labels, control captions, and supporting metadata.
- Numbers such as `62`, `96.7%`, `21:34`, and `78.4%` are large enough to act as anchors.
- Font-size estimates from the raster: menu labels around 14–16 px; small labels 12–14 px; body values 16–20 px; card headings 17–20 px; large headline values 34–45 px.
- These are screen-pixel estimates, not CSS rem values; actual CSS sizing depends on browser zoom and device pixel ratio.
- Text color is dark charcoal, not pure black.
- Muted labels are medium gray rather than pale enough to disappear.
- Active or selected text uses a saturated blue; secondary/disabled text uses gray.
- The control border is thin and low contrast.
- Search input, date selector, location selector, zoom controls, view tabs, and fullscreen control share a compact height near 42–44 px in Explorer.
- The Overview image has no visible global top header; identity and navigation live in the left rail.
- No reference confirms use of the existing IBM Plex Mono or Doto fonts, even though the current app defines these fonts.
- No exact font family can be safely derived from a raster screenshot; match visual width, weight, and spacing rather than asserting a specific family.

### Shared color sampling

| Sample point | RGB / hex | Context | Evidence type |
|---|---|---|---|
| Image 1 `(0,0)` | `#6D7ABE` | Blue exterior texture at upper-left corner | Sampled; textured field varies |
| Image 1 `(33,48)` | `#C5CDEB` | Outer/frame edge near upper-left corner | Sampled; edge pixel |
| Image 1 `(40,100)` | `#F2F3F5` | Light app/rail surface | Sampled |
| Image 1 `(150,100)` | `#F1F2F2` | Rail surface | Sampled |
| Image 1 `(277,70)` | `#F0F0F1` | Card surface/edge region | Sampled |
| Image 1 `(400,70)` | `#F6F7F7` | Light top KPI card | Sampled |
| Image 1 `(300,210)` | `#F7F7F7` | Analytics card surface | Sampled |
| Image 1 `(600,210)` | `#F6F5F7` | Analytics card surface | Sampled |
| Image 1 `(900,210)` | `#EEEEF0` | Panel/edge transition sample | Sampled; not a palette token |
| Image 1 `(500,500)` | `#EBEBED` | Chart plotting area / light gray series region | Sampled |
| Image 1 `(1545,950)` | `#457CC4` | Lower outer texture near frame edge | Sampled; texture varies |
| Image 1 `(1585,991)` | `#567EBB` | Bottom-right exterior texture | Sampled; texture varies |
| Image 2 `(280,60)` | `#EDEDF0` | Light top content surface | Sampled |
| Image 2 `(300,220)` | `#F8F9F8` | Search/control surface | Sampled |
| Image 2 `(300,280)` | `#0A0F1B` | Dark sky image at viewport top | Sampled |
| Image 2 `(500,500)` | `#0B121D` | Dark sky field | Sampled; star/nebula variation nearby |
| Image 2 `(1000,500)` | `#353746` | Sky image in brighter nebula region | Sampled |
| Image 2 `(1300,800)` | `#F7F7F9` | Inspector card surface | Sampled |
- Bright blue active elements appear near the current app's cobalt family, but no screenshot-derived exact active color was sampled here.
- Existing project tokens in `src/index.css` include `#1D55F5` for cobalt and `#F5F6F8` for card. They are source facts but not proof of pixel-perfect reference matches.
- A sampled `#F6F7F7` can result from surface + antialiasing or image compression; avoid setting every card to that literal value solely from one sample.
- The outer blue texture has substantial local variation; do not flatten it to a uniform sampled RGB unless a design decision says the texture is decorative and can be replaced.

## Reference A: Overview dashboard

### Identity and frame

- Primary source: `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_57_18 PM-1.png`.
- Duplicate confirmation: `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_57_58 PM-1.png`.
- The image is a desktop analytics/observability overview; the active menu item reads `OVERVIEW`.
- The page has no visible browser chrome, system status bar, footer, or floating dialog.
- The desktop application frame begins at about `(33,48)` and ends around `(1546,951)`.
- The left rail ends near x=261; the dashboard grid starts around x=277.
- Main content width is approximately 1258 px from x=277 to x=1535.
- Content appears to use roughly 15–16 px gutters between cards.
- The top KPI band begins about y=62 and ends around y=186.
- The middle row begins around y=199 and ends around y=585.
- The lower row begins around y=594 and ends around y=936.
- The bottom margin to the frame is around 15 px.
- The grid is compact but not crowded; cards use rounded corners and thin gray outlines.
- Card radii are visually about 20–25 px; corner estimates carry several-pixel uncertainty.
- The screen presents both trend/visibility overview and detailed operational modules on one viewport.
- At 1586 × 992 all card text and controls are visible without vertical scroll.

### Top KPI band

- Four cards occupy a single horizontal row.
- Approximate card bounds: first `(277,62)` to `(586,186)`, second `(595,62)` to `(896,186)`, third `(906,62)` to `(1197,186)`, fourth `(1207,62)` to `(1535,186)`.
- The measured widths are approximate and vary because the cards are not exactly equal.
- All four cards share a small top-left heading and a larger value beneath it.
- A small diagonal arrow appears at the upper-right corner of each card.
- The diagonal-arrow mark implies a navigable/expandable card, but this interaction is inferred.
- Card 1 label: `VISIBLE CONSTELLATIONS`.
- Card 1 value: dotted `78`, followed by `/ 88` in smaller type.
- Card 1 value baseline is in the upper-middle of the card rather than at its bottom.
- Card 2 label: `TRACED PATTERNS`.
- Card 2 value: dotted `1,264`.
- Card 3 label: `MATCH ACCURACY`.
- Card 3 value: dotted `96.7%`.
- Card 4 label: `ACTIVE SESSION`.
- Card 4 primary status: blue dotted `OBSERVING`.
- Card 4 secondary block: vertical divider, `ELAPSED`, then `42 MIN`.
- The active status and elapsed duration are laid out as two adjacent columns.
- KPI headings are around 12–14 px and muted dark gray.
- KPI values are around 36–44 px and use dotted/segmented display typography.
- The top cards have a white/very-light surface against the slightly gray page.
- The arrows are thin strokes, not filled icon buttons.
- KPI values should remain the visual focus; avoid adding unrelated dense subtext.
- Reference data values are exact visible strings but may be mock values, not runtime truth.

### Middle-left analytics card: Sky Activity

- Card bounds estimated around `(277,199)` to `(891,585)`.
- Card title is `SKY ACTIVITY`, aligned near x=301, y=220.
- A small three-item period selector appears at the upper-right: `HOURLY`, `DAILY`, `WEEKLY`.
- `DAILY` is the selected period, rendered blue; adjacent periods are neutral gray.
- The period control is text-like, without a prominent enclosing pill.
- Large headline reads `+24.8%` near the title and above the chart.
- The headline is much larger than the chart labels but smaller than top KPI values.
- A thin horizontal rule separates the headline from the plot area.
- The plot has a vertical value axis and seven day categories.
- The vertical value labels shown are `0`, `500`, `1.0K`, `1.5K`, `2.0K`, and `2.5K`.
- Horizontal dashed gridlines are pale gray and low contrast.
- Categories from left to right read `SUN`, `MON`, `TUE`, `WED`, `THU`, `FRI`, and `SAT`.
- Each daily column is made of stacked circular dots, not bars with a filled rectangular body.
- Most days use gray dots.
- Wednesday is the selected/highlighted column and uses bright cobalt dots.
- Wednesday appears to be the tallest column, ending slightly above the 2.0K line.
- Saturday and Monday appear among the taller gray columns; their precise values are not readable with confidence.
- The chart uses a consistent dot diameter around 4–5 px and vertical step around 12–14 px (visual estimates).
- The horizontal span of the graph is roughly x=356–859.
- The plot vertical span is roughly y=350–538.
- The chart background matches the card; it is not a separate dark plot tile.
- The blue selected data is the only strong chart accent.
- The x-axis labels are small and centered under each dot column.
- The chart is illustrative; the image does not disclose dataset, aggregation formula, time period, or timezone.
- A strict implementation should preserve the seven category order and selected Wednesday visual while replacing unsupported numbers with real data or explicitly labeled demo values.

### Middle-right analytics card: Tonight Visibility

- Card bounds estimated around `(906,199)` to `(1535,585)`.
- Heading reads `TONIGHT VISIBILITY` at the upper-left.
- Location string at upper-right reads `LAT 37.77° N   LON 122.42° W`.
- Large count near upper-left reads `62 CONSTELLATIONS`.
- The numerical `62` is substantially larger than the word `CONSTELLATIONS` on the same baseline.
- A thin horizontal divider separates the headline from a 5-row availability matrix.
- Rows read `ORI`, `UMA`, `CAS`, `CYG`, and `SCO`.
- Each row uses a regular horizontal sequence of small circular markers.
- Gray dots indicate unavailable or inactive intervals; blue dots indicate highlighted intervals.
- From left to right, blue visible windows begin at varied times per constellation.
- Approximate onset positions: ORI around 22:40; UMA around 19:00; CAS around 19:40; CYG around 22:30; SCO around 23:40.
- These onset times are visual estimates based on marker positions, not semantic labels printed beside every dot.
- Time ticks along the bottom read `18:00`, `19:00`, `20:00`, `21:00`, `22:00`, `23:00`, `00:00`, `01:00`, `02:00`.
- The matrix appears to cover an overnight range and wraps midnight.
- Rows and dots align to a common grid; row spacing is around 38–40 px.
- The dot markers are around 5 px diameter, with tight regular horizontal spacing.
- The location display uses a compact uppercase label and degrees with N/W suffixes.
- The count and row matrix represent the same subject: visibility tonight at the displayed location.
- The image does not show date, observation conditions, or whether visibility is based on altitude threshold.
- The exact 62 count is reference content, not a verified calculation for San Francisco or a date.
- No legend is visible for gray versus blue; meaning is inferred from the contrasting states.

### Lower-left module: Recent Recognitions

- Card bounds estimated around `(277,594)` to `(639,935)`.
- Card title reads `RECENT RECOGNITIONS` at upper-left.
- The card has five list rows separated by light horizontal rules.
- Each row begins with a small constellation line-icon.
- Row 1: `ORION (ORI)`, `98.3%`, `2 MIN AGO`.
- Row 2: `URSA MAJOR (UMA)`, `97.6%`, `6 MIN AGO`.
- Row 3: `CASSIOPEIA (CAS)`, `96.9%`, `9 MIN AGO`.
- Row 4: `CYGNUS (CYG)`, `96.5%`, `14 MIN AGO`.
- Row 5: `SCORPIUS (SCO)`, `95.8%`, `18 MIN AGO`.
- Names appear in the central-left column; confidence values align in a right-side value column.
- Recency aligns at the far-right and is smaller/more muted.
- Row height is approximately 53 px.
- Icon color is near dark gray with small blue or light dots.
- The row text hierarchy prioritizes constellation name, then match percentage, then elapsed time.
- `RECENT RECOGNITIONS` implies an event history. No event provenance or retention behavior is visible.
- The displayed percent values are examples; they must not be read as measured accuracy claims for the app.
- The exact row ordering is descending recency, not descending confidence.

### Lower-middle module: Pattern Library

- Card bounds estimated around `(649,594)` to `(1095,935)`.
- Card title reads `PATTERN LIBRARY`.
- A blue `VIEW ALL` action and right arrow sit at the upper-right.
- Three preview tiles form a horizontal row.
- Tile labels are `ORION`, `URSA MAJOR`, and `CASSIOPEIA`.
- Each preview uses a pale card border and a light grid/dot field.
- Each preview depicts a blue line-connected star pattern with small blue nodes.
- Orion is represented as a compact, vertically oriented multi-segment outline, with a short lower extension.
- Ursa Major is represented as an angled dipper-like polyline with an extended handle.
- Cassiopeia is represented as a simple zigzag/W-like polyline.
- The first preview tile is approximately 132 px wide and 174 px tall; other tile widths are similar.
- The tiles have rounded corners near 18 px.
- Names are centered beneath the graph within each tile.
- A divider separates the preview row from a compact summary row.
- The summary row contains `PATTERNS` with dotted value `312`.
- It contains `TYPES` with dotted value `88`.
- A five-swatch blue scale appears at right, ranging from very pale to saturated cobalt.
- The screenshot does not define what the five blue swatches encode.
- The card's summary count `88` and dashboard visible count denominator `/ 88` are visually consistent, but that semantic relationship is inferred.
- The exact preview coordinates/constellation edges are not fully recoverable from the raster; use actual catalog line-segment data rather than trace-by-eye.
- `VIEW ALL` is a visible action; its destination and behavior are not shown.

### Lower-right modules: DFA Recognition and Observation Window

- The rightmost bottom column spans approximately x=1107–1535.
- Its upper module is `DFA RECOGNITION`, from about y=594 to y=768.
- Its lower module is `OBSERVATION WINDOW`, from about y=782 to y=935.
- The upper module contains a horizontal state-transition visualization.
- A right-facing input arrow precedes states labeled `S0`, `S1`, `S2`, and `S3`.
- Thin arrows connect each successive state.
- `S0` is a neutral white circle with gray outline.
- `S1` and `S2` have pale blue fill and blue outlines.
- `S3` is filled strong blue with a bright outer ring and white label, indicating the emphasized terminal state.
- The state node diameter is approximately 47–50 px.
- The displayed state summary is `STATE  S3 (ACCEPT)`.
- The word `ACCEPT` is blue and parenthetical.
- A `CONFIDENCE` field at right displays `97.6%`.
- The diagram is a simplified sequence; the alphabet, transition labels, and rejecting path are not shown.
- No initial state marker beyond the input arrow is shown.
- The exact recognition semantics are not specified by this screenshot.
- The lower card shows three columns separated by a vertical rule before duration.
- Left block label `START`, value `21:00`.
- Center block label `END`, value `01:30`.
- Right block label `DURATION`, value `4 HR 30 MIN`.
- Values use dotted/LED numerals.
- The end time crosses midnight; the elapsed duration is correctly 4.5 hours.
- The layout should preserve this wraparound relationship if represented as real time data.
- The screenshot does not show a date, timezone, or edit action for the window.

### Overview data and semantic conflicts

- Top card says `VISIBLE CONSTELLATIONS 78 / 88` while Tonight Visibility says `62 CONSTELLATIONS`; the two may use different definition/time windows, but no distinction is stated.
- The overview `ACTIVE SESSION` says `OBSERVING 42 MIN`.
- Observation Window says `21:00 — 01:30` and `4 HR 30 MIN`.
- If the dashboard depicts a current session inside that window, an elapsed value of 42 minutes is plausible but the screenshot provides no current clock to confirm it.
- The same figure `96.7%` appears as match accuracy and as a possible reference-row score nearby only in this dashboard; it must not be conflated with scientific accuracy.
- Recent Recognition values range 95.8–98.3%; they are individual sample results, not a documented evaluation benchmark.
- `TRACED PATTERNS 1,264` and `PATTERNS 312` could refer to total attempts and unique stored patterns, but the relationship is not defined.
- `PATTERNS 312` and `TYPES 88` require data definitions before implementation.
- Five dot-matrix rows list five constellations; no statement says these are exhaustive.
- The visible line chart and visibility matrix do not identify their data sources.
- Geographic coordinates use San Francisco in the location line, but `ACTIVE SESSION` doesn't explicitly identify the observer.
- The dashboard is visually rich but its shown copy mixes historical, catalog, current-session, and recognition concepts without a visible period control except for the one activity chart.
- A faithful visual reproduction can preserve layout and labels while replacing example content with accurately sourced app data; it should not silently imply measured model performance.

## Reference B: Sky Explorer

### Identity and frame

- Primary source: `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_57_37 PM-2.png`.
- Duplicate confirmation: `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_58_13 PM-2.png`.
- The active rail item is `SKY EXPLORER`.
- The image combines location/time metadata, a star chart, and a selected-object inspector.
- The same blue textured outer surround and light inner application panel appear as in the Overview image.
- Outer application bounds are approximately x=33–1546 and y=48–951.
- The main content seems to begin around x=247 in this image, slightly left of the Overview main content start near x=277.
- This may be a genuine screen-specific horizontal allocation or a measurement uncertainty at the rail edge.
- The top metric cards occupy around y=62–183.
- The control toolbar occupies around y=194–255.
- The chart and inspector row begins around y=273 and ends around y=936.
- The main row is split into a broad sky viewport and a narrower inspector.
- The viewport width is approximately 920 px from x=251 to x=1171.
- The inspector width is approximately 358 px from x=1178 to x=1536.
- The gap between viewport and inspector is around 7 px.
- The viewport is a large rectangular image with rounded corners of approximately 18 px.
- The inspector is a light card with matching rounded corners.
- The scene's bottom horizon and azimuth labels remain inside the viewport.
- The full scene and inspector fit into the page without apparent scroll.

### Top telemetry cards

- Four cards form a single row, beginning near x=247 and ending near x=1536.
- First card approximate bounds `(247,62)` to `(586,183)`.
- Second card approximate bounds `(598,62)` to `(896,183)`.
- Third card approximate bounds `(908,62)` to `(1209,183)`.
- Fourth card approximate bounds `(1221,62)` to `(1536,183)`.
- Card 1 heading: `CURRENT LOCATION`.
- Card 1 value: `37.77° N   122.42° W`.
- Card 1 supporting label: `SAN FRANCISCO, USA`.
- A small target/crosshair icon appears toward its upper-right.
- Card 2 heading: `VISIBLE CONSTELLATIONS`.
- Card 2 value: dotted `62`, followed by `/ 88`.
- A small diagonal arrow appears in the upper-right.
- Card 3 heading: `MOON PHASE`.
- Card 3 contains a grayscale gibbous moon image.
- Card 3 phase text reads `WAXING GIBBOUS`.
- Card 3 illumination reads `ILLUM. 78.4%`.
- Card 4 heading: `TIME (LOCAL)`.
- Card 4 primary time is dotted `21:34`.
- Card 4 date reads `JAN 23, 2025`.
- Card 4 weekday reads `THU`.
- A small diagonal arrow appears near the card's upper-right.
- Each card has the same light surface, neutral thin boundary, rounded corners, and compact heading.
- The moon image and numeric time are the only visual content beyond text.
- The cards present location and observation state before the chart toolbar.
- Location and date/time values are examples; the screenshot does not show current runtime context.
- `37.77° N, 122.42° W` repeats in the toolbar and object inspector's computed context, reinforcing a shared location.

### Search and chart toolbar

- A single horizontal row sits between the top cards and chart.
- Search field spans approximately x=261–630 and y=213–255.
- Search prompt reads `SEARCH CONSTELLATION, STAR, OR OBJECT`.
- A magnifying glass sits at the left inside the search field.
- Date/time selector spans about x=644–840.
- Its displayed value is `2025-01-23 21:34` with a calendar icon and down chevron.
- Location selector spans about x=850–1070.
- It shows a pin icon and `37.77° N, 122.42° W`, plus a down chevron.
- Zoom controls follow: circular minus, `100%`, circular plus.
- Three view mode tabs follow: `CONST`, `DEEP`, and `GRID`.
- `CONST` is active with pale blue fill and cobalt border/text.
- `DEEP` and `GRID` are neutral gray outlined pills.
- A square-corners/fullscreen icon is at far right.
- Controls appear around 42 px high.
- Horizontal spaces are compact and aligned to a common centerline.
- Search and selectors have pill-like rounded outlines rather than filled surfaces.
- The location and date controls display full values in the reference; narrow-screen truncation is not depicted.
- The screenshot does not reveal whether selecting `DEEP` or `GRID` changes rendering layers or toggles panels.
- The screenshot does not show a query in the search field or an open selector menu.
- A full-screen control is visible but no expanded state is shown.
- Minus and plus imply zoom adjustment; no min/max constraints are displayed.
- Selected `CONST` plus constellation lines/text in the viewport suggests, but does not prove, a constellation overlay mode.

### Star-field viewport and chart composition

- The viewport bounds are approximately `(251,273)` through `(1171,936)`.
- It occupies approximately 920 × 663 px, aspect ratio about 1.39:1 (derived from estimated bounds).
- The background is a dark photographic/painted night-sky scene, with many stars and a brighter Milky Way region on the right.
- A low jagged mountain/horizon silhouette runs along the bottom edge.
- The sky color is nearly black/navy with scattered blue-white stars.
- A diffuse nebula/Milky Way band crosses the right half diagonally from upper-right toward lower center-right.
- The field contains a faint star chart grid or coordinates only along the bottom, not a strong full-frame grid.
- White/gray thin lines connect selected neighboring stars into surrounding constellations.
- The selected Orion constellation is brighter blue and more saturated than surrounding constellations.
- Orion's bright stars are marked with white/blue points, and Betelgeuse is warm amber/orange.
- Orion is centered around x=700, y=590–700 within the viewport.
- The Orion label is blue, uppercase, and positioned around x=684, y=530.
- Neighboring constellation names are white or near-white, smaller and less prominent.
- Legible surrounding labels include `AURIGA`, `TAURUS`, `GEMINI`, `CANIS MINOR`, `CANIS MAJOR`, `ERIDANUS`, and `LEPUS`.
- Some nearby stars are named in small white text: `Betelgeuse`, `Bellatrix`, `Alnitak`, `Alnilam`, `Mintaka`, `Rigel`, and `Saiph`.
- The selected constellation line geometry forms the familiar Orion figure, including belt, shoulders, and legs.
- The selected Orion edges are brighter blue than generic constellation lines.
- Background constellation lines are low contrast enough to keep Orion dominant.
- Star sizes vary; brighter stars have halos or larger cores.
- A few stars have warm colors, but most points are white/blue.
- The scene has a horizon overlay with azimuth degree markers and compass directions.
- Visible bottom azimuth labels include `120°`, `SE`, `150°`, `180°`, `S`, `210°`, `SW`, and `240°`.
- The azimuth scale and direction labels sit just above the silhouette, along a thin horizontal baseline with small ticks.
- Viewport edges crop surrounding constellations naturally; no card-like subpanels appear inside it.
- The starfield looks photographic, not simply flat black; a static gradient replacement would not be visually equivalent.
- The reference does not show mouse pointer, crosshair, tooltip, or drag state.
- Star locations and constellation arrangement are screen-projected for a particular date/location/time but no projection details are visible.
- Do not infer scientific correctness from visual star placement alone; use the application's astronomy data and projection logic.
- Current project source has `SkyCanvas` built with Three.js and imports star/constellation data; this is a plausible render owner for a sky scene.
- The screenshot's Milky Way and mountain silhouette are not confirmed assets in the existing code by the screenshot itself.
- Current code's dark sky canvas token is `#060A14`, consistent with sampled dark raster values but not sufficient to prove the current rendered scene matches.

### Selected-object inspector

- Inspector bounds estimated around `(1178,273)` to `(1535,936)`.
- Its heading reads `SELECTED OBJECT`.
- Main selected object name is dotted `ORION`.
- Previous and next controls are small outlined rounded squares with left and right chevrons.
- A thin horizontal divider separates the heading/name row from metadata.
- Metadata rows read `TYPE` / `CONSTELLATION`, `VISIBILITY` / `VISIBLE`, `ALTITUDE` / `52.6°`, `AZIMUTH` / `183.4° (S)`.
- Values align to the right-hand column.
- `VISIBLE` is blue to indicate a positive/current state.
- A second divider separates metadata from `NOTABLE STARS (3)`.
- Three notable-star rows are present: `BETELGEUSE`, `RIGEL`, `BELLATRIX`.
- Each notable-star row includes a small blue circular marker at left.
- Betelgeuse also appears to have a crescent or phase-like overlay on its marker; exact meaning is not stated.
- Each row includes a Greek Bayer designation: `α Ori`, `β Ori`, and `γ Ori`.
- Each row ends with `MAG` and a value: `0.42`, `0.13`, and `1.64` respectively.
- Row separators are thin, pale gray horizontal lines.
- Another divider separates star list from `BEST VIEWING TIME`.
- Best viewing time reads `20:00 – 02:00`.
- The threshold note reads `ALT > 30°`.
- Another divider separates this from `QUICK ACTIONS`.
- Two bottom buttons read `START TRACE` and `OPEN DETAILS` with a right-arrow icon on the latter.
- `START TRACE` is the primary filled blue action.
- `OPEN DETAILS` is a pale/white secondary action with cobalt text and light border.
- Bottom buttons sit side by side, each about half the inspector content width.
- The inspector has about 21 px of horizontal inset from the card boundary.
- Text and values maintain clear two-column alignment.
- Visible state, altitude, azimuth, best time, and notable-star magnitude values are examples; they should be tied to actual astronomy calculations if shown in the product.
- The inspector shows an aggregate constellation selection, not an individual star selection.
- Arrow controls imply cycling selected objects but no interaction behavior is shown.
- `OPEN DETAILS` implies another view/modal, but destination is not visible.
- The screenshot does not show inspector empty state, loading state, invisible object state, or unselected state.

### Sky Explorer cross-consistency notes

- Current location appears in top telemetry and toolbar and matches visually: San Francisco at 37.77° N, 122.42° W.
- Top date/time reads Jan 23, 2025, Thursday, 21:34 local; the toolbar repeats ISO `2025-01-23 21:34`.
- The timezone is not specified. The string `LOCAL` does not prove PST/PDT or daylight-saving behavior.
- The Moon phase card says waxing gibbous and illumination 78.4%; no source or calculation details are shown.
- Selected Orion has visibility `VISIBLE`, altitude 52.6°, azimuth 183.4° (S).
- An azimuth of 183.4° reasonably aligns with the displayed south-facing horizon label, but this is a visual consistency observation only.
- The selected Orion label in the viewport is centered near the south direction tick, consistent with the inspector's southerly azimuth.
- The `ALT > 30°` criterion and altitude 52.6° are internally plausible, but the screenshot does not define the selected observation moment for best-time interval.
- Best viewing window 20:00–02:00 spans midnight; no date adjustment is displayed.
- View mode `CONST` appears active while Orion constellation edges and names are drawn.
- The screenshot's sky rendering may intentionally approximate realistic sky art; don't conflate art direction with exact scientific coordinate mapping.
- Location is repeated as coordinate text rather than the full observer label in toolbar; top card adds city/country.
- The inspector's `NOTABLE STARS (3)` list contains three Orion stars, which correspond to visible labels in the viewport.
- The screenshot displays `Rigel` within the chart and `RIGEL` in metadata; casing varies by context.
- The image likely represents the same app ecosystem as Overview, but the two screens differ in sidebar width and number of top KPI cards.

## Exact current-source entry points and likely fixture links

### Confirmed render entry paths

- `src/App.tsx` is the top-level view switch.
- The current `activeView` union and default store value are defined in `src/stores/useAstroStore.ts`.
- Current default `activeView` is `'sky'`.
- The `'sky'` branch in `src/App.tsx` renders `SkyCanvas`, `TraceHud`, `StarInspector`, and `TimelineBar` inside a dark viewport card.
- This is the strongest direct route match for Reference B's astronomical plot area and inspector behavior.
- `src/components/StarInspector.tsx` is the source-file candidate for selected-star details, though the screenshot describes a selected constellation; inspect its actual branches before claiming direct visual parity.
- `src/components/TimelineBar.tsx` is the source-file candidate for date/time navigation and an observation timeline; its current design may not resemble the compact Reference B toolbar.
- `src/components/HeaderNav.tsx` currently owns the global header navigation and search/location controls.
- Reference B presents nav in a vertical rail and embeds search/date/location controls above its plot, so the existing component boundaries do not prove matching placement.
- `src/features/constellationExplorer/ConstellationExplorer.tsx` renders a constellation catalog/explorer view.
- `src/App.tsx` maps `'constellations'` to `ConstellationExplorer`.
- Reference B's title `SKY EXPLORER` and full-sky map are semantically closer to `'sky'` than a catalog grid, but the named mode could map to either after a product decision.
- Do not wire Reference B solely to `ConstellationExplorer` because that component name contains the word “Explorer.”
- The screenshot's central chart should be evaluated against the actual `SkyCanvas` output, not inferred from source naming alone.
- Reference A has no obvious existing page-level equivalent in `App.tsx`.
- The current route branches are sky, tonight, constellations, automataLab, hunt, imageLab, academic, and credits.
- No branch is labeled overview, dashboard, results, settings, or pattern library as a complete top-level dashboard.
- `src/features/skyTonight/SkyTonight.tsx` is the closest route by visible content intent, but it is not established as Reference A's dashboard.
- The broad component grid in Reference A likely requires new route-level composition or a substantial rework of an existing route.
- This report does not recommend which route to change; it preserves the evidence and calls out the mismatch.

### Confirmed store and data modules to inspect

- `useAstroStore` in `src/stores/useAstroStore.ts` stores active view, observer, date, sky render toggles, selection state, trace state, automata state, and hunt state.
- Store default observer is `PRESET_OBSERVERS[0]` with an inline comment saying Greenwich prime meridian; therefore default store coordinates conflict with the San Francisco reference values unless a fixture, preset change, or user action supplies another observer.
- The default observation date is `new Date()`, whereas both reference date strings use Jan 23, 2025. A screenshot fixture would need a fixed date if pixel output is expected to be stable.
- `src/data/astroData.ts` imports/organizes `STARS`, `CONSTELLATIONS`, and `REFERENCE_PATTERNS`.
- Reference B's Orion selection could plausibly come from a constellation selection or focused constellation state; the screenshot does not disclose the exact store field.
- `src/astronomy/coordinates.ts` is a likely calculation module for horizontal coordinates; it is listed as a project source file and imported by the explorer/sky logic.
- `src/sky/SkyCanvas.tsx` imports catalog and horizontal-coordinate/projection helpers and owns a Three.js scene.
- Those source facts support a data-backed route mapping, but no inspected screenshot fixture or storybook state was found in this reference-only pass.
- No explicit test fixture for the exact SF/Orion/Jan 23 2025/21:34 state was verified in this pass.
- Do not call the screenshots fixtures; they are visual references.
- Search the test and app setup for a deterministic story/snapshot/fixture before using one in a code plan.

### Inferred state values to prepare for a stable visual comparison

- Observer: San Francisco, approximately latitude +37.77 and longitude −122.42 degrees.
- Observation moment: 2025-01-23 21:34 local time; timezone remains unspecified.
- Selected object: Orion constellation, if represented in the project's selected/focused constellation state.
- Sky layer: constellation mode active; neighboring constellation lines/labels visible.
- Scene: south-facing view; selected Orion centered close to azimuth 180 degrees.
- Observer viewport zoom: 100% in screenshot toolbar.
- Inspector: open and populated for Orion.
- Date/time toolbar: date Jan 23, 2025; time 21:34.
- Moon phase: waxing gibbous, 78.4%; whether this should be calculated or static remains a data decision.
- This combination should be treated as an inferred candidate scenario, not a verified existing fixture.

## Measurable visual contract

### At source raster size (1586 × 992)

- Preserve a light application frame surrounded by blue texture if the design intentionally retains the reference backdrop.
- The frame should occupy approximately 95% of canvas width and 91% of canvas height, centered with clear top/bottom margins.
- Shared rail width is approximately 14–15% of the full screenshot width; allow the observed screen-specific variance until the design owner resolves it.
- In Reference A, four KPI cards fit one row without wrapping.
- In Reference B, four top cards fit one row without wrapping.
- Reference A has two middle cards with approximate width ratio 1.7:1 (left: right) and similar height.
- Reference A lower row uses three columns with approximate width ratio 0.85:1.05:1.0 (left: center: right).
- Reference B lower content uses a wide chart and narrower inspector, approximately 2.57:1 width ratio.
- All visible cards fit vertically into the app frame at this source size.
- No screenshot exhibits a vertical scrollbar.
- Panel/card gaps are approximately 8–16 px, depending on row and image.
- Large card corner radius is approximately 20–25 px; small control radius is approximately 10–18 px.
- Outer card border is thin and low contrast.
- Active cobalt is used sparingly and consistently across nav, selection, highlighted data, and primary action.
- The left rail contains eight menu items at approximately 47 px vertical intervals.
- Use all-caps in rail labels, card headings, table/category labels, and compact metadata, matching visible text.
- Keep dotted/segmented display numerals limited to KPI/status values rather than body text.
- Maintain clear value/label hierarchy across cards.

### Overview screen acceptance observations

- The `OVERVIEW` rail item is visibly active.
- Four KPI cards appear above content: visible constellations, traced patterns, match accuracy, active session.
- Sky Activity occupies left middle; Tonight Visibility occupies right middle.
- Recent Recognitions occupies lower left; Pattern Library occupies lower middle; DFA Recognition and Observation Window are stacked lower right.
- Daily is the selected period in the activity card.
- Wednesday is the blue-highlighted activity column.
- Tonight Visibility shows five constellation rows and nine time labels.
- Recent Recognitions shows five rows in a descending-recency order.
- Pattern Library shows three previews and the pattern/type summary.
- DFA Recognition emphasizes terminal state S3 and `ACCEPT`.
- Observation Window shows a 21:00–01:30 period and 4 HR 30 MIN duration.
- These visible strings should be preserved only if the product intends the same information architecture.
- If screenshot values remain demo values, make their illustrative nature explicit in product/test data rather than implying verified production telemetry.

### Sky Explorer acceptance observations

- The `SKY EXPLORER` rail item is visibly active.
- Four top cards show current location, visible constellation count, moon phase, and local time.
- Search, date/time, location, zoom, three view mode tabs, and fullscreen controls appear in one toolbar row.
- `CONST` is the selected mode.
- A central starfield dominates the main content width.
- The starfield includes surrounding constellation lines/names, brighter selected Orion geometry/name, named Orion stars, a Milky Way region, and horizon/azimuth scale.
- The right inspector is open and describes Orion.
- Inspector content order is selection header, basic properties, notable stars, viewing time, quick actions.
- Selected Orion is marked visible and has altitude/azimuth values.
- Inspector contains three notable star rows.
- `START TRACE` is primary; `OPEN DETAILS` is secondary.
- A screenshot comparison must pin the date/time/location if it expects deterministic astronomy projection.
- If the sky art is procedurally generated, fixture state may stabilize geometry but will not reproduce the reference's Milky Way texture and mountain silhouette unless those layers/assets exist.

## Conflicts and ambiguities to resolve before calling the reference “implemented”

- **Duplicate files:** four source files yield two unique screens. Do not count same-hash copies as distinct states.
- **Page architecture:** image 1 has a dashboard screen absent from the current `App.tsx` route list.
- **Navigation architecture:** references use a vertical rail; current `HeaderNav` is a horizontal top header.
- **Visual shell:** references use light surfaces and a blue external texture; current app includes a recessed tray architecture and dark viewport theme.
- **Rail width:** estimates differ between the two unique images; inspect exact source pixels or settle a responsive layout choice before setting a hard shared width.
- **Sky scene assets:** star names and connection geometry are consistent with astronomy data, but Milky Way art and mountain horizon are not confirmed by this pass as available source assets.
- **View naming:** reference says `SKY EXPLORER`; current app has both `'sky'` and `'constellations'`, and neither name maps exactly.
- **Selected entity:** reference inspector selects a constellation, while current `StarInspector` naming may focus on individual stars; confirm component capability before promising a direct reuse.
- **Observer default:** reference is San Francisco; current store's default is Greenwich.
- **Reference time:** reference is Jan 23, 2025 21:34; current store defaults to current date.
- **Timezone:** screenshot says local time but does not identify timezone or DST policy.
- **Count mismatch:** dashboard 78/88 versus Tonight Visibility 62; semantics/time/window could explain this, but reference provides no explanation.
- **Data provenance:** chart, recognition confidence, visibility, and pattern counts have no visible source/legend.
- **Accuracy wording:** `MATCH ACCURACY 96.7%` is a potentially strong claim. Screenshot alone does not prove a measured accuracy statistic.
- **Usage semantics:** 1,264 traced patterns and 312 patterns could refer to different metrics; clarify before binding live data.
- **Moon phase:** 78.4% is shown, but no source or computed state is identified.
- **Horizon orientation:** screenshot shows south-centered azimuth, but no camera/projection controls are exposed beyond zoom and mode.
- **Activity period:** daily is selected while the absolute date range is hidden.
- **Sky visibility timeline:** markers are dots but there is no visible legend; exact criteria are not stated.
- **State machine:** DFA panel shows a linear sample path, not a full transition graph; avoid claiming that it represents the actual automaton model without verifying.
- **No responsive evidence:** only one desktop viewport is provided; don't infer phone/tablet behavior.
- **No interaction evidence:** arrows, pills, tabs, quick actions, and card links are visible affordances; screenshots do not prove their behavior.
- **No accessibility evidence:** contrast, focus order, keyboard support, alt text, and screen-reader labels cannot be validated from the raster.
- **Reference-to-current parity:** a single screenshot can support visual composition and displayed states, but not implementation quality or functional correctness.

## Per-file visual review notes

### Sort 1: `07_57_18 PM-1.png`

- Displays `ASTROFA` brand at upper left.
- Displays `OVERVIEW` selected in the left rail.
- Shows overview KPI row with 78 / 88, 1,264, 96.7%, and observing/42 min.
- Shows Sky Activity with Daily selected and Wednesday in blue.
- Shows Tonight Visibility for five abbreviations.
- Shows Recent Recognitions, Pattern Library, DFA Recognition, and Observation Window.
- Pixel dimensions: 1586 × 992.
- SHA-256 grouping: exact same bytes as sort 3.
- This is the canonical Overview frame for the slice because it is the earliest timestamp.
- The displayed values remain reference text only.

### Sort 2: `07_57_37 PM-2.png`

- Displays `SKY EXPLORER` selected in the left rail.
- Top cards report San Francisco, 62 / 88 visible constellations, waxing gibbous 78.4%, and 21:34 on Jan 23, 2025.
- Toolbar displays search, date/time, coordinates, 100% zoom, CONST/DEEP/GRID, and fullscreen controls.
- Chart has Orion selected, neighboring constellations, star labels, Milky Way, and a south-oriented horizon scale.
- Inspector displays Orion metadata, notable stars, best viewing interval, and quick actions.
- Pixel dimensions: 1586 × 992.
- SHA-256 grouping: exact same bytes as sort 4.
- This is the canonical Sky Explorer frame for the slice because it is the earliest timestamp.

### Sort 3: `07_57_58 PM-1.png`

- Visual contents match sort 1 exactly.
- Pixel dimensions: 1586 × 992.
- SHA-256 grouping: exact same bytes as sort 1.
- No unique state, text, or layout detail is added by this copy.
- Preserve it in inventory so no source image is silently omitted.

### Sort 4: `07_58_13 PM-2.png`

- Visual contents match sort 2 exactly.
- Pixel dimensions: 1586 × 992.
- SHA-256 grouping: exact same bytes as sort 2.
- No unique state, text, or layout detail is added by this copy.
- Preserve it in inventory so no source image is silently omitted.

## Strict audit checklist for the first four references

### Evidence and reference hygiene

- [ ] All four source files are present in the master inventory.
- [ ] Each source file is recorded with its exact filename and dimensions.
- [ ] Duplicate pairs are identified as exact-hash duplicates.
- [ ] Only two unique visual screens are counted for unique-state coverage.
- [ ] Every claim is tagged or worded as observed, sampled, measured estimate, derived, or inferred.
- [ ] Exact pixel samples are not presented as recovered CSS tokens.
- [ ] Visual geometry estimates include tolerance or are described as approximate.
- [ ] Blue outer texture is separated conceptually from the application frame.
- [ ] Reference values are not presented as verified runtime or evaluation results.
- [ ] No unshown responsive or interaction behavior is described as established.
- [ ] No filename has been shortened in a way that makes duplicates ambiguous.
- [ ] Visual inspection covers the entire screen, not only top cards or hero content.
- [ ] The possibility that card colors are gradients/translucent is left open where raster evidence is insufficient.

### Overview composition

- [ ] Overview active state is represented.
- [ ] Four KPI cards appear in the upper band.
- [ ] KPI labels and values have clear small/large hierarchy.
- [ ] Sky Activity and Tonight Visibility align as the middle row.
- [ ] Activity chart has seven day categories, a vertical value scale, and highlighted Daily selection.
- [ ] Wednesday is the highlighted dot column in the reference state.
- [ ] Visibility panel has five rows and overnight hour ticks.
- [ ] Recent Recognition list has five entries and separates identity, percentage, and recency.
- [ ] Pattern Library has three preview tiles plus summary figures.
- [ ] DFA path makes S3 the selected/accepted state.
- [ ] Observation interval and duration are shown together.
- [ ] Right-bottom cards stack without exceeding the viewport height.
- [ ] Card gutters and baseline alignment are visually consistent.
- [ ] Content remains legible at 1586 × 992.
- [ ] Demo/sample values are distinguished from actual product data if retained.

### Sky Explorer composition

- [ ] Sky Explorer active state is represented.
- [ ] Four telemetry cards precede the control toolbar.
- [ ] Toolbar contains all visible controls and preserves their order.
- [ ] CONST is selected in the shown state.
- [ ] Chart is substantially wider than the inspector.
- [ ] Dark sky scene is visually distinct from light card surfaces.
- [ ] Selected Orion constellation is more prominent than neighboring patterns.
- [ ] Named Orion stars are legible but secondary to the constellation name.
- [ ] Surrounding constellation labels remain lower contrast.
- [ ] Horizon/azimuth scale is anchored along the bottom of the chart.
- [ ] Inspector contains the visible metadata, list, viewing time, and actions in order.
- [ ] Primary and secondary quick actions have distinct visual emphasis.
- [ ] Chart state is pinned to a stable location/time for screenshot checks.
- [ ] Scientific values are calculated or explicitly treated as fixture data.
- [ ] The inspector's selected constellation behavior is confirmed in the actual code.

### Source mapping and product truth

- [ ] `App.tsx` branch mapping distinguishes current routes from reference naming.
- [ ] Existing horizontal header versus reference vertical rail is called out.
- [ ] No dashboard route is falsely claimed to exist if it does not.
- [ ] `StarInspector` is not assumed to inspect constellations without confirming its implementation.
- [ ] Current default Greenwich observer is distinguished from reference San Francisco state.
- [ ] The screenshot's fixed date is distinguished from `new Date()` store default.
- [ ] Date/time timezone ambiguity is documented.
- [ ] Exact fixture candidates are labeled inferred unless an existing fixture is found.
- [ ] `SkyCanvas` is assessed as an actual render, not only by its component name.
- [ ] Pattern and automata data semantics are checked before claiming parity.
- [ ] Match accuracy claim has a documented evaluation basis before being surfaced as product truth.
- [ ] Visibility count differences are either explained or left explicitly unresolved.
- [ ] All source file paths cited in a final implementation plan point to the actual owners.

## Compact source map for follow-up

| Concern | Source candidate | What this pass confirms | What this pass does not establish |
|---|---|---|---|
| Top-level route choice | `src/App.tsx` | `sky` and `constellations` branches exist; no `overview` branch is shown | Which route product owner intends to remodel |
| Active route state | `src/stores/useAstroStore.ts` | Union includes `sky`, `tonight`, `constellations`, `automataLab`, `hunt`, `imageLab`, `academic`, `credits`; default is `sky` | A dashboard fixture or route state |
| Observer default | `src/stores/useAstroStore.ts` | Starts from `PRESET_OBSERVERS[0]`; comment says Greenwich | Whether runtime changes to SF before screenshot |
| Main star render | `src/sky/SkyCanvas.tsx` | Imports Three.js, stars, constellations, and coordinate helpers | Whether it draws reference Milky Way/mountains or matches framing |
| Search/nav controls | `src/components/HeaderNav.tsx` | Current nav is horizontal and search/location controls are in header | Exact reference vertical rail implementation |
| Time strip | `src/components/TimelineBar.tsx` | File is mounted in `sky` branch | Exact visual or interaction parity with toolbar |
| Selected details | `src/components/StarInspector.tsx` | Component is mounted in `sky` branch | Constellation inspector capability and exact content match |
| Catalog screen | `src/features/constellationExplorer/ConstellationExplorer.tsx` | A constellation explorer/catalog component exists | That it is the reference full-sky view |
| Data sets | `src/data/astroData.ts` | Named data exports are imported by render components | Values/counts shown in the images |
| Coordinates | `src/astronomy/coordinates.ts` | Coordinate helper module is imported in related components | Reference values' scientific correctness |

## Handoff notes

- The wider audit should measure the remaining eight filenames independently; this slice's measurement conventions should carry forward.
- Report each later image's dimensions and any duplicate groups before counting its visual states.
- Preserve full names even if an abbreviated file label is added for readability.
- For cross-screen color comparisons, take all samples from the original raster, not the viewer rendition.
- The next reviewer should verify whether the blue background is an image texture or a procedural field only if that affects implementation scope.
- The strongest evidence conflict is structural: the reference vertical rail/dashboard composition differs from the current top-header application shell.
- The strongest data consistency conflict is the SF screenshot state against the current Greenwich default and dynamic date default.
- The strongest scope risk is treating the first screenshot as merely a restyle; the current route structure has no explicit dashboard page.
- This reference audit does not edit the source repo, alter user data, or claim that the UI has been implemented.



<a id="implementation-1-4"></a>
# Reference implementation mapping: screenshots 1–4

## Audit scope and reading key

This section covers only the first four screenshot files in filename order.

The assigned files are `07_57_18`, `07_57_37`, `07_57_58`, and `07_58_13`.

The first and third files show the same Overview composition.

The second and fourth files show the same Sky Explorer composition.

These duplicate references are counted separately in the image inventory.

They do not represent four distinct UI states.

The repeated screenshots provide no evidence of hover, loading, or selected-state changes.

The recommendations below are implementation mapping and audit findings.

They are not changes applied to the read-only application.

Line anchors refer to the inspected source snapshot in `C:\ommd3076\Proejcts\automata-theory`.

Use symbol names as stable anchors if line numbers shift during implementation.

The screenshot values are visual examples, not verified application data.

Every displayed number should be derived from the project data or labeled as sample data.

Do not claim session history until the app records session events.

Do not claim recognition accuracy until the app has a defined evaluation denominator.

Do not infer a real user's location from a screenshot.

The screenshot's San Francisco location is a specific fixture, not a safe product default.

## Screenshot order and identity

### Ordinal 1: `ChatGPT Image Nov 11, 2026, 07_57_18 PM-1.png`

This is the pale Overview dashboard with a fixed left navigation rail.

Its right content area starts with four summary cards.

The summary cards read Visible Constellations, Traced Patterns, Match Accuracy, and Active Session.

The middle band contains Sky Activity and Tonight Visibility.

The lower band contains Recent Recognitions, Pattern Library, DFA Recognition, and Observation Window.

The visible values include 78 of 88, 1,264 traced patterns, 96.7 percent, and 42 minutes.

The activity chart marks Wednesday in cobalt and other days in grey.

The tonight visibility card uses five constellation rows and hourly dot marks.

The lower recognition list shows Orion, Ursa Major, Cassiopeia, Cygnus, and Scorpius.

The pattern cards depict constellation line figures rather than photographs.

The DFA card renders a short state progression and an accept label.

The observation card presents a start time, end time, and duration.

No live app interaction is visible in this static reference.

### Ordinal 2: `ChatGPT Image Nov 11, 2026, 07_57_37 PM-2.png`

This is the Sky Explorer screen with the same pale shell and left navigation rail.

Its top row summarizes current location, visible constellations, moon phase, and local time.

The toolbar offers search, date and time, observer coordinates, zoom, chart mode, grid, and fullscreen controls.

The main viewport is a wide, dark, two-dimensional sky chart.

The chart labels nearby constellations and several named Orion stars.

Orion is the selected constellation and receives the strongest cobalt emphasis.

The right pane is a persistent selected-object inspector.

The inspector presents type, visibility, altitude, azimuth, notable stars, best viewing time, and quick actions.

The bottom chart edge includes a horizon silhouette and azimuth labels.

### Ordinal 3: `ChatGPT Image Nov 11, 2026, 07_57_58 PM-1.png`

This image duplicates ordinal 1's Overview composition.

Treat it as a repeated visual reference, not another dashboard state.

Its selected navigation item remains Overview.

It provides no evidence for a different date, metric, or interaction.

### Ordinal 4: `ChatGPT Image Nov 11, 2026, 07_58_13 PM-2.png`

This image duplicates ordinal 2's Sky Explorer composition.

Treat it as a repeated visual reference, not a second chart mode.

Its selected object remains Orion.

It provides no evidence of a chart control being operated.

## Confirmed application structure

`src/App.tsx` owns the active view switch at lines 17–18 and 25–59.

The current view cases are `sky`, `tonight`, `constellations`, `automataLab`, `hunt`, `imageLab`, `academic`, and `credits`.

There is no `overview` route in the current `ActiveView` union.

The default active view is `sky` in `src/stores/useAstroStore.ts` line 109.

`src/components/HeaderNav.tsx` owns the current horizontal header and nav list.

Its view list is declared around lines 74–83.

It currently labels the sky route `LIVE SKY` and the catalog route `EXPLORER`.

The current header also owns global search, trace mode, and observer controls.

The header's active-view buttons are rendered around lines 217–236.

`src/sky/SkyCanvas.tsx` implements the current `sky` view.

It initializes a Three.js scene around lines 92–105.

It synchronizes an SVG overlay for labels around lines 335–452.

It renders its scene container and overlay around lines 686–700.

The current sky view is therefore a Three.js canvas with a projected SVG overlay.

It is not the screenshot's two-dimensional chart layout.

`src/components/StarInspector.tsx` is conditional on a selected star.

It returns no pane while `selectedStarId` is null at lines 18–20.

It derives live horizontal coordinates from observer and observation date at lines 22–24.

Its current fields describe a star, not a selected constellation summary.

`src/features/constellationExplorer/ConstellationExplorer.tsx` is the constellation catalog.

It filters all 88 catalog entries and shows ranking cards.

It is not the chart screen shown by ordinals 2 and 4.

`src/features/skyTonight/SkyTonight.tsx` calculates horizon status and viewing times.

It contains data useful to dashboard summaries and the selected-object inspector.

It currently renders an above-horizon ranking and timeline instead of the screenshot's chart.

`src/data/astroData.ts` is the source for stars, constellations, and reference patterns.

`src/astronomy/coordinates.ts` provides horizontal coordinate calculations and observer presets.

`src/recognition/matcher.ts` and `src/recognition/types.ts` define current pattern match results.

`src/automata/types.ts` and related simulation modules define state data for the automata lab.

`src/stores/useAstroStore.ts` stores observer, observation date, selected star, focus, trace points, and recognition report.

The store has no persistent event history or session timer field in its current state interface.

`src/index.css` defines the pale shell, grey card, dark viewport, cobalt signal, mono font, and dot font tokens.

The two screenshots use this same high-level light-shell and dark-sky contrast.

`src/App.css` defines the current `.bento-shell`, `.bento-tray`, and `.bento-card` primitives.

The current application has reusable surface tokens but not the reference's sidebar dashboard structure.

The available tests are Vitest files under `tests/`.

`tests/e2e-telemetry.test.ts` is mostly static invariant and domain integration coverage.

The package includes React 19, Zustand 5, Three.js, Vitest, and Lucide React.

No dedicated browser component test library appears in the package dependencies.

Do not assume React Testing Library is installed.

## Ordinal 1 and 3 implementation mapping: Overview

### Route and shell tasks

Add an `overview` member to `ActiveView` in `src/stores/useAstroStore.ts` around lines 15–23.

Keep `sky` as the separately addressable interactive chart route.

Choose whether the initial route becomes `overview` only after the user approves that product behavior.

If Overview becomes the initial route, update the default at store line 109.

Add the overview render case to `src/App.tsx` around lines 25–59.

Create a dedicated `[PROPOSED / NEW] src/features/overview/Overview.tsx` component for dashboard composition.

Keep the overview layout isolated from the Three.js rendering lifecycle.

Extract a reusable app shell with sidebar navigation if that structure is intended across routes.

Do not keep the current horizontal header and add a second duplicate navigation surface.

Move existing global search, trace toggle, and observer access into deliberate shell affordances.

Add an explicit Overview nav item to the navigation model in `HeaderNav.tsx` or its replacement.

Update nav rendering to a vertical rail at desktop widths when matching the screenshot.

Preserve accessible button labels when the rail collapses to icons.

Ensure active route state has a non-color visual cue such as border, background, or icon shape.

Use an `aria-current="page"` marker for the active navigation item.

Keep the brand control as a button or link with an accessible name.

Use responsive CSS so the rail becomes a compact drawer or bottom navigation at narrow widths.

Do not shrink all eight current routes into a tiny unreadable rail.

Separate primary navigation from secondary utility actions.

The reference's Overview nav item is primary and should be visibly selected on that route.

The current brand `COSTELLAR` differs from the screenshot brand `ASTROFA`.

Confirm whether product naming changes before copying the screenshot label.

### Overview data contract tasks

Build overview values from selectors instead of embedding reference numbers in JSX.

Define a typed `OverviewSummary` model near the overview feature or in a dashboard selector module.

Represent visible constellation count as a numerator and a catalog total.

Derive the catalog total from `CONSTELLATIONS.length` rather than hardcoding 88.

Derive visible count by evaluating the active observer and observation date.

Reuse `getHorizontalCoordinates` for visibility at the selected location and time.

Use the observer and observation date from Zustand so changing either updates the cards.

Do not hardcode the screenshot's 78 visible objects.

Do not silently replace the current Greenwich default with San Francisco.

Display the observer name and coordinate convention near the summary when the count is location-sensitive.

Use a consistent longitude sign label such as east-positive or west-positive.

The reference prints longitude as `122.42° W`.

The current observer model stores numeric longitude and presets include Greenwich.

Format west-positive display labels from the stored signed longitude without changing stored coordinates.

Visible count must use the same observation timestamp shown in the UI.

Do not use a browser-local date string for a field labeled UTC.

If the interface says local time, format through the observer's intended time zone.

The current `ObserverLocation` model should be checked for time-zone data before claiming local civil time.

If no observer time zone is available, show UTC and label it UTC.

Define `traced patterns` carefully before adding a count card.

The store's `tracedStarIds` and `tracedPoints` represent current trace input, not historical completed patterns.

The store's `recognitionReport` is the current report, not a lifetime event count.

The screenshot's 1,264 count requires a persisted event source that does not currently exist.

Until event history exists, omit the card or show a truthful current-session count with explicit scope.

Do not relabel the current number of reference patterns as traced patterns.

The current `REFERENCE_PATTERNS` list contains curated reference data, not a user activity log.

Define `match accuracy` as a metric with a numerator, denominator, and evaluation source.

The current matcher result confidence or residual is not the same as empirical recognition accuracy.

Do not show 96.7 percent from the image as a live accuracy claim.

If this card is retained as a demo, label it sample data and isolate that state from production.

Define `active session` behavior before rendering its timer.

The current store does not record session start or session elapsed time.

Use a monotonic clock for elapsed duration if a session feature is approved.

Pause or stop the timer only according to explicit lifecycle semantics.

Persisting history requires a privacy and storage decision outside this screen mapping.

Do not infer that route changes end or preserve an observing session.

### Overview module mapping

Create selectors for visible constellation count and current observer summary.

Keep astronomy calculations in pure functions where practical.

Prefer a testable `getVisibleConstellationCount` selector with injected data and coordinates.

Use `useMemo` in the view only when measurement shows recalculation affects rendering.

Do not compute coordinate results independently in multiple dashboard cards.

Create a `SummaryMetricCard` presentational component for consistent labels and values.

Pass a stable key, label, formatted value, and optional contextual detail to each metric card.

Keep metric card layout responsive and allow long values to wrap without colliding.

Use Doto only for numeric telemetry where the font is legible at the actual rendered size.

Keep explanatory labels in IBM Plex Mono or the existing mono token.

Avoid using dot font for small time suffixes or dense paragraphs.

Use semantic headings for dashboard sections.

Give each chart a visible title and a textual summary for screen reader users.

Create a `SkyActivityPanel` only if activity data is available.

The app currently has no per-day activity history model.

If synthetic activity is intended for a prototype, mark it as illustrative within the view.

Avoid implying a real weekly trend from invented values.

Create a `TonightVisibilityPanel` using the existing coordinate utilities and observer state.

Keep its count tied to a single explicitly defined time window.

The reference shows hourly dots from 18:00 to 02:00 and five named rows.

Do not imply that five rows represent every constellation.

Label a truncated list and provide a route to the full result set.

Use `SkyTonight` calculations as a source only after checking their time basis and range semantics.

The SkyTonight implementation uses UTC-sampled hour values in its timeline constants.

Expose the same timezone in the dashboard labels when reusing those samples.

Create a `RecentRecognitionsPanel` only after recognition events can be enumerated.

The current recognition report contains the latest recognition state, not a collection of recent events.

Do not fabricate recency labels such as `2 MIN AGO`.

If a single current result is surfaced, label it Current Recognition and show its real status.

Create a `PatternLibraryPreview` from `REFERENCE_PATTERNS` or `CONSTELLATIONS` with clear source semantics.

Deduplicate patterns by constellation if the UI promises unique constellation cards.

The store's curated pattern list can include multiple traversal variants for one constellation.

Use existing line segments and star coordinates to draw preview geometry.

Reuse or adapt `MiniAsterismPreview` from `ConstellationExplorer.tsx` if ownership and extraction are acceptable.

Avoid copying its drawing algorithm into a second component without a shared helper.

Give each preview an accessible name based on the constellation.

Link View All to the catalog route `constellations` rather than to the sky route.

Create a `DfaRecognitionPanel` only when the UI has a recognition report to summarize.

The store currently exposes `recognitionReport` and the automata machine definitions.

The state visualization should be derived from actual simulation steps or report fields.

Never hardcode a progression such as S0 to S3 as though it were the current execution.

Inspect `RecognitionReport` before mapping labels or confidence to this card.

If a current trace has no report, show a quiet empty state with a link to begin tracing.

Do not equate acceptance with confidence percentage.

Create an `ObservationWindowPanel` only from a documented window-calculation source.

The existing astronomy utilities can calculate culmination windows for a selected target.

The screenshot's 21:00 to 01:30 interval should not be a universal default.

Show target name, location, date, timezone, and threshold assumptions with the interval.

If there is no selected target, show a call to action instead of a fabricated window.

### Overview visual and interaction tasks

Use a content grid with four metric cards, a two-panel middle band, and a three-panel lower band at wide desktop sizes.

Set explicit minimum widths for the larger panels so chart labels remain readable.

Allow the grid to collapse to two columns and then one column.

Prevent page-level horizontal scrolling at tablet and phone widths.

Keep the rail and content aligned to a consistent page gutter.

Match the reference's soft grey cards using existing surface tokens before adding new colors.

Preserve cobalt for selected states and positive active marks.

Use muted grey dots for unavailable periods only when the underlying timeline includes those periods.

Include chart axes or labels where marks encode magnitude or time.

For bar or dot charts, ensure text or shapes distinguish data beyond color alone.

Ensure chart tooltips are reachable by keyboard and pointer.

Provide a textual list or table fallback for chart data.

Make all navigation, timeline selectors, and View All actions keyboard operable.

Use focus-visible styles with adequate contrast against the pale card surface.

Respect reduced-motion preferences for card entrance and chart transitions.

Do not use a static decorative chart that looks interactive but accepts no interaction.

Do not add click targets to metrics that have no destination or state change.

Use the active observer state for all location-dependent panels in one consistent render.

Keep a loading state distinct from zero visible constellations.

Keep an error state distinct from an empty history state.

If an astronomy computation fails, identify the affected panel without hiding the full dashboard.

## Ordinal 2 and 4 implementation mapping: Sky Explorer

### Route semantics and component boundary

Treat ordinals 2 and 4 as the `sky` route, consistent with the parent task's route decision.

The screenshot calls this screen Sky Explorer, while the current nav calls the same route LIVE SKY.

Confirm the desired route label before changing the navigation wording.

Keep `constellations` mapped to the catalog experience in `ConstellationExplorer.tsx`.

Do not repurpose the catalog route for the 2D chart.

Add the selected-object pane to the `sky` route composition in `src/App.tsx` around lines 27–37.

Consider a new `SkyExplorer` shell component that composes chart toolbar, plot, and inspector.

Keep `SkyCanvas` reusable if hunt mode and trace mode depend on its existing interactions.

Do not replace or disable Three.js behavior globally without auditing those consumers.

The current app mounts `SkyCanvas` only within the `activeView === 'sky'` branch.

The app passes `TraceHud` and `StarInspector` over that canvas.

The screenshot's persistent right pane differs from the conditional `StarInspector`.

Create a constellation inspector model separate from star-specific details.

Selection should represent a constellation ID, a star ID, or no selection explicitly.

Avoid overloading `selectedStarId` to mean a selected constellation.

The store already has `focusedConstellationId` and `selectedStarId` fields.

Define selection precedence when a clicked star belongs to a focused constellation.

Keep navigation focus separate from selection if clicking a card should not alter the selected object.

### Chart view and controls

The reference's viewport is a fixed-aspect two-dimensional chart within a larger application canvas.

The current `SkyCanvas` is a Three.js perspective camera with drag and wheel behavior.

Choose a projection deliberately before drawing the screenshot-style chart.

An azimuth-altitude chart should use observer-specific horizontal coordinates.

A right-ascension-declination chart should use equatorial coordinates and label the axes accordingly.

Do not mix RA/Dec positions with azimuth labels on the same chart without a documented transform.

The reference's bottom labels appear to be azimuth degrees and cardinal direction labels.

Its selected-object pane reports altitude and azimuth.

That suggests a local-horizon view, but the background star field may imply a sky-dome rendering.

Treat the exact projection as an inference until confirmed with the design owner.

The reference toolbar includes a date-time control and observer-coordinate control.

Reuse `observationDate` and `setObservationDate` from the store for its time control.

Reuse the existing observer modal or extract the observer picker for the location control.

The screenshot date is Jan 23, 2025 at 21:34.

The store initializes `observationDate` from `new Date()` at store line 115.

Do not change the default observation date to match the screenshot fixture.

Use a controlled date-time input and preserve timezone semantics explicitly.

The current timeline and SkyTonight components operate on UTC in their labels and calculations.

Keep all chart and inspector values synchronized to the same `observationDate` value.

Add zoom state only if the chart uses a projection with a defined scale.

The toolbar's minus and plus controls should change zoom in predictable bounded steps.

Show the current zoom as a formatted percentage only if the value maps to actual scale.

The screenshot has CONST, DEEP, and GRID mode buttons.

The store currently exposes constellation line, label, horizon, and equatorial grid toggles.

Map CONST to constellation line and label visibility only if that is the product's intended mode.

Define DEEP mode as a real rendering-layer change before exposing a control.

Map GRID to an existing equatorial grid toggle only when the projection is equatorial.

For an azimuth-altitude projection, implement a matching local horizon grid instead.

Do not reuse `showEquatorialGrid` as a generic grid flag across incompatible projections.

The screenshot has a fullscreen affordance.

Use the browser Fullscreen API with a documented fallback when it is unavailable.

Keep fullscreen state and button labels synchronized with browser exit events.

Support Escape as the browser-native exit action.

The screenshot has a search input for constellation, star, or object.

The current header search returns stars and constellations and supports focus actions.

Reuse its search result logic or extract it into a reusable selector.

When the user selects a constellation result, use `focusOnConstellation` or a new selection action.

When the user selects a star result, use `focusOnStar`.

Do not present unsupported object categories in the placeholder or results.

Clear search by keyboard and expose a labeled clear button.

Make arrow-key selection and Escape dismissal work for the result popover.

### Sky plot rendering and object interaction

The plot should render the star catalog using a deliberate screen-space mapping.

Use `STARS` and `CONSTELLATIONS` from `astroData.ts` as catalog sources.

Use `STAR_BY_ID` and `CONSTELLATION_BY_ID` for stable lookups.

Use constellation `lineSegments` to connect catalog stars.

Use star magnitude as a visual-size input only with a bounded scale.

Preserve star color from the current B-V mapping only if the chart intentionally encodes stellar color.

The screenshot uses mostly white stars with a small number of cobalt highlights.

Its chart should not color every star by spectral type without a product decision.

Label only the selected constellation and nearby context at first.

Avoid drawing all 88 labels into a dense, unreadable plot.

Use projected label positions that update when zoom or pan changes.

Keep text labels from clipping outside the plot bounds.

Make star and constellation hit targets large enough for pointer and touch use.

Use a keyboard-accessible list or search route to select plot objects.

Do not rely on tiny SVG circles as the only selection mechanism.

Use the selected constellation ID to apply the cobalt outline and label treatment.

Use the selected star ID to expose star-specific data without overwriting constellation identity.

The screenshot presents Orion as selected.

Do not initialize the app with Orion selected unless that is an approved product default.

Use an explicit empty-selection state that invites search or chart selection.

Keep click-to-select distinct from drag-to-pan.

The current `SkyCanvas` already separates pointer movement and drag detection.

Preserve that distinction if the current canvas remains in the implementation.

Add an accessible selected state announcement for screen readers.

Expose plot controls with visible focus indicators.

If drawing a horizon silhouette, derive its shape from a documented horizon model.

Do not use an arbitrary mountain silhouette that implies geographic terrain data.

If the horizon illustration is decorative, label it as decorative and keep altitude semantics accurate.

The reference includes a Milky Way texture in the background.

The current assets include `src/assets/hero.png`, though its suitability has not been confirmed here.

Check license, resolution, crop, contrast, and intended usage before using that asset.

Do not assume the decorative texture is astronomically aligned to the chart projection.

If the texture is decorative, do not use it to imply precise sky-background positions.

Keep star points and connecting lines legible against the dark viewport token.

Maintain the existing dark viewport `#060A14` unless the design system owner approves a change.

### Selected-object inspector mapping

Create a persistent inspector panel for the selected constellation.

Use `focusedConstellationId` as the initial source if selection semantics are confirmed.

Resolve the constellation through `CONSTELLATION_BY_ID`.

Compute altitude and azimuth with `getHorizontalCoordinates` using the current observer and date.

Format azimuth direction with a helper such as the existing `getAzimuthDirection` in `ConstellationExplorer.tsx`.

Avoid copying the helper when it can be extracted into astronomy presentation utilities.

Compute visibility from the coordinate helper result, not from screenshot text.

Display a visible or below-horizon status with text and icon treatment.

Do not make status depend on cobalt color alone.

The screenshot's selected object is a constellation, not a star.

The current `StarInspector` reports stellar magnitude, color index, RA, Dec, distance, and catalog IDs.

Keep those stellar facts in a star inspector variant rather than assigning them to the constellation panel.

For notable stars, resolve the constellation's `starIds` and sort by magnitude ascending.

Guard against missing stars in the data map.

Limit the list to a small number and offer a path to view all member stars.

Use each star's proper name when available, falling back to catalog name.

Show Bayer designation or magnitude only when the catalog source provides it.

Do not synthesize Greek-letter designations from array position.

The screenshot shows Betelgeuse, Rigel, and Bellatrix for Orion.

Verify those names and magnitudes from the actual bundled catalog before using them as fixture assertions.

The `ConstellationExplorer` detail modal already computes selected-constellation geometry and viewing values.

Its `asterismDiagramData` logic begins around lines 180–248.

Its `modalHor` calculation appears around line 251.

Its selection actions include focus sky, start trace, and inspect automaton handlers around lines 157–178.

Reuse domain calculations from that component without copying its catalog-card layout into the sky route.

The screenshot's best-viewing interval should come from a clearly identified calculation.

`SkyTonight.tsx` computes culmination and optimal viewing windows around lines 24–50.

Cross-check whether its UTC window is appropriate for the inspector's local-time labels.

If a target never rises at the current observer, show that state rather than a fabricated viewing window.

If a target is circumpolar, communicate that the normal set-and-rise interval may not apply.

The screenshot quick actions are Start Trace and Open Details.

Wire Start Trace to the existing `loadPresetTrace` action when a forward pattern exists.

For a constellation without a curated trace pattern, focus the object and route to the sky trace flow with an explanatory state.

Do not show an enabled Start Trace action if no valid trace can be started.

Wire Open Details to a constellation detail route or existing catalog detail modal.

Preserve the current catalog filtering state if opening and returning from details.

Do not label `setFocusedConstellationId` as a full navigation action if it does not change routes.

### Sky explorer structure and style

At desktop widths, use a toolbar row above a two-column chart and inspector region.

Give the chart the dominant width and the inspector a stable readable width.

Allow the inspector to scroll independently only if the viewport height requires it.

At narrow widths, stack the inspector below the chart or present it as a collapsible drawer.

Keep chart controls reachable without covering the selected object panel.

Use the existing pale card and cobalt tokens for shell and active controls.

Use a dark chart viewport with subtle borders to preserve the reference's contrast hierarchy.

Reserve the brightest cobalt for selection and current control state.

Keep labels at readable sizes on high-density displays.

Do not rely on image-like background texture to carry star identity.

Give the chart a textual accessible description of observer, time, projection, and current selection.

Provide a list view or search-driven alternative to the interactive plot.

Do not set `user-select: none` on all application content if it blocks text copying or accessibility.

Avoid scroll traps in the inspector and fullscreen chart.

Respect reduced motion when animating zoom, selection, or focus changes.

Provide a visible reset view control when pan and zoom can move the sky out of view.

Use responsive controls that do not depend on hover alone.

Keep the inspector heading and selection controls in a predictable focus order.

## Suggested deterministic fixtures

Use a fixed fixture observer at latitude 37.77 and longitude -122.42 for screenshot-oriented UI tests.

Name the fixture `San Francisco, USA` only within test data.

Do not set this fixture as the application default as a side effect of screenshot work.

Use a fixed observation instant matching Jan 23, 2025 at 21:34 only after resolving its timezone.

If interpreting the screenshot time as local Pacific time, encode the timezone explicitly in test setup.

If interpreting it as UTC, label the fixture UTC and expect different astronomy results.

Use the real `CONSTELLATIONS` dataset for count and identity assertions.

Use a small synthetic star catalog for isolated inspector edge cases.

Include one constellation with a complete set of star IDs.

Include one constellation with a missing star ID to exercise defensive rendering.

Include one constellation with no curated reference pattern.

Include one object below the horizon for status assertions.

Include one circumpolar object for viewing-window behavior.

Include a current trace report fixture with a known accepted pattern.

Include a pending or null recognition report fixture.

Include a report with a rejected status if the recognition type supports it.

Avoid inventing a confidence property if `RecognitionReport` does not define one.

For dashboard tests, inject an event history fixture only after a typed history model is added.

Use sample event timestamps around a fixed clock instant for recency labels.

Test zero events separately from unavailable history.

Test one event separately from many events.

Test duplicate traversal variants when counting unique library cards.

Test a long observer name and long constellation name for overflow behavior.

Test negative longitude formatting as west and positive longitude formatting as east.

Test coordinates at zero longitude and zero latitude for sign edge cases.

Test UTC date boundaries when stepping across midnight.

Test daylight-saving boundaries only if the UI converts to local civil time.

Test a catalog with zero visible objects without presenting an error state.

Test missing catalog data as a recoverable panel error if the loading model allows it.

Test fullscreen API unavailability without breaking other chart controls.

Test the fullscreen exit event so the toolbar button state does not become stale.

Test keyboard focus across chart toolbar, plot selection list, and inspector actions.

Test reduced-motion preferences on transitions if the application animates focus or zoom.

## Suggested tests: Overview route and selectors

Add a unit test for the visible-count selector using a fixed observer and date.

Assert its numerator does not exceed the real catalog length.

Assert its denominator is derived from the injected constellation collection.

Assert changing observer coordinates can change the count.

Assert changing observation date can change the count when the fixture makes visibility differ.

Assert the selector uses the same date argument for every constellation calculation.

Assert longitude is formatted with the correct hemisphere sign convention.

Assert a zero longitude renders without an incorrect east or west suffix.

Add a unit test that pattern cards are deduplicated by constellation when that is the displayed promise.

Assert every preview star resolves before drawing a line segment.

Assert a missing star does not crash the preview.

Add a component test that Overview route renders from the nav action.

Assert the active navigation item uses `aria-current="page"`.

Assert the Overview heading is visible when route state is overview.

Assert the existing sky route remains reachable from navigation.

Assert the catalog route remains separate from the sky chart route.

Add a component test that the metric card uses selector values rather than screenshot constants.

Assert `78`, `1264`, `96.7`, and `42` do not appear unless supplied by fixture data.

Assert a missing history source produces a labeled empty or unavailable state.

Assert an empty history source does not produce a misleading zero accuracy claim.

Assert a current recognition report does not appear under a Recent Recognitions heading without history context.

Assert no `N MIN AGO` label appears without a timestamp source and fixed clock.

Assert no fabricated observation window appears when no target is selected.

Assert a failed panel can show its own error while other dashboard panels remain available.

Add a responsive visual check at a wide viewport for four summary cards in one row.

Add a responsive visual check at a tablet viewport for two-column card flow.

Add a responsive visual check at a phone viewport for a single column and no horizontal overflow.

Add a keyboard test that all rail controls can receive focus and activate.

Add an accessibility assertion for chart title and text alternative.

Add a chart data fallback assertion when visual chart marks are present.

Add a color-independent assertion for active versus inactive visibility marks.

Add a reduced-motion assertion if the card grid has entrance transitions.

## Suggested tests: Sky Explorer chart and inspector

Add a unit test for the selected constellation inspector selector.

Assert it resolves the selected ID from `CONSTELLATION_BY_ID`.

Assert an unknown ID produces an explicit empty state and no exception.

Assert its altitude and azimuth are computed for the current observer and date.

Assert a changed observation date causes the displayed coordinates to update.

Assert a changed observer causes the displayed coordinates to update.

Assert visibility text matches the coordinate calculation result.

Assert azimuth direction handles wraparound near 360 degrees.

Assert direction sector boundaries are tested explicitly if an eight-point compass is used.

Assert notable stars are sorted by brightness using lower magnitude as brighter.

Assert missing star records are omitted safely.

Assert a constellation without a reference pattern disables or explains Start Trace.

Assert a constellation with a forward pattern starts the trace using that pattern.

Assert Open Details navigates to or opens the documented details surface.

Assert selected-star details remain distinct from selected-constellation details.

Add a chart projection unit test for known coordinate input and expected screen direction.

Assert the projection and axis labels share the same coordinate convention.

Assert azimuth wraparound does not create a line across the full plot.

Assert chart zoom is bounded and has a defined reset value.

Assert zoom preserves the selected object's screen anchor if that behavior is intended.

Assert constellation line segments omit endpoints missing from the star map.

Assert unselected and selected constellation styles remain distinguishable without color alone.

Assert dragging changes chart center without selecting a nearby star accidentally.

Assert a click without a drag selects the intended target.

Assert touch interaction has a reachable alternative to hover tooltips.

Assert search results can select both a star and a constellation.

Assert Escape closes search suggestions without changing the selected chart object.

Assert date-time controls preserve the intended timezone.

Assert date stepping across midnight updates date and time coherently.

Assert fullscreen state reflects external Escape exit.

Assert fullscreen fallback leaves the chart usable where the API is unsupported.

Add an integration test that observer changes update chart positions and inspector values together.

Add an integration test that selecting Orion updates the selected outline and inspector identity.

Add an integration test that selecting a star opens star details without losing constellation context.

Add an integration test that Start Trace creates the store state expected by TraceHud.

Add a test that the trace flow does not leave the chart in an inconsistent mode after navigation.

Add an accessibility test for chart toolbar button names, selected state, and tab order.

Add a screenshot check for wide layout with the inspector visible beside the chart.

Add a screenshot check for narrow layout with inspector content available without chart occlusion.

Add a no-horizontal-overflow check for both layouts.

## Contradictions and unresolved decisions

The reference brand reads ASTROFA while the current brand reads COSTELLAR.

The reference says Sky Explorer while the current sky route is labeled LIVE SKY.

The current route named constellation explorer is a catalog grid rather than a sky plot.

The image's San Francisco coordinates conflict with the store's Greenwich default.

The image's local time presentation conflicts with current UTC-oriented calculations and labels.

The image's fixed date conflicts with the store's current-time initialization.

The image shows a moon phase, but the current app source inspected here does not establish a moon-phase UI contract.

The image reports session totals and accuracy that the current store does not persist.

The image shows a two-dimensional sky chart while current `SkyCanvas` uses a Three.js perspective scene.

The image's star-field background could be decorative or projection-aligned.

The image does not define chart projection mathematically.

The image's `CONST`, `DEEP`, and `GRID` controls do not map one-to-one to current store booleans.

The image's selected constellation inspector differs from the current star-only `StarInspector`.

The image presents a best viewing interval without showing its calculation threshold.

The image includes recent recognition data without a visible event-history source.

The image uses estimated session and recognition figures without provenance.

The screenshot's 78 visible out of 88 should be recomputed under its observer, timestamp, and horizon semantics.

The screenshot's Orion stars should be verified against the bundled catalog before being used as acceptance fixtures.

The screenshot pair duplicates do not resolve these contradictions.

Treat brand, default route, location, date basis, projection, activity metrics, and chart modes as explicit product decisions.

## Evidence anchors for implementers

`src/App.tsx` lines 17–18 read `activeView` from Zustand.

`src/App.tsx` lines 25–59 render the current route branches.

`src/components/HeaderNav.tsx` lines 74–83 define the current route labels.

`src/components/HeaderNav.tsx` lines 217–236 render the current horizontal nav buttons.

`src/components/HeaderNav.tsx` lines 238–265 render trace and observer utility actions.

`src/stores/useAstroStore.ts` lines 15–23 define the current route union.

`src/stores/useAstroStore.ts` lines 35–105 define current store fields and actions.

`src/stores/useAstroStore.ts` lines 107–127 define initial route, observer, and date.

`src/stores/useAstroStore.ts` lines 138–164 define selected-star and focused-constellation behavior.

`src/stores/useAstroStore.ts` lines 190–227 define current trace inputs and recognition report updates.

`src/sky/SkyCanvas.tsx` lines 39–90 define renderer state and interaction references.

`src/sky/SkyCanvas.tsx` lines 92–105 initialize the Three.js scene and camera.

`src/sky/SkyCanvas.tsx` lines 335–452 synchronize projected SVG labels and selected-star marks.

`src/sky/SkyCanvas.tsx` lines 686–700 mount the canvas container and SVG overlay.

`src/components/StarInspector.tsx` lines 6–24 resolve selected-star state and astronomy coordinates.

`src/components/StarInspector.tsx` lines 29–100 render current star status and horizontal coordinates.

`src/components/StarInspector.tsx` lines 122–187 render stellar identifiers and constellation association.

`src/components/StarInspector.tsx` lines 189–201 render the trace action.

`src/features/constellationExplorer/ConstellationExplorer.tsx` lines 7–102 draw miniature asterism previews.

`src/features/constellationExplorer/ConstellationExplorer.tsx` lines 104–178 define catalog filtering and action handlers.

`src/features/constellationExplorer/ConstellationExplorer.tsx` lines 180–251 define selected constellation geometry and current coordinate values.

`src/features/skyTonight/SkyTonight.tsx` lines 24–72 compute per-constellation visibility and culmination data.

`src/features/skyTonight/SkyTonight.tsx` lines 105–120 derive counts and set UTC sample time.

`src/index.css` lines 5–27 declare the reference-aligned palette and font tokens.

`src/App.css` lines 76–120 declare core shell, tray, card, and dot-font classes.

`tests/e2e-telemetry.test.ts` lines 31–81 assert current visual tokens.

`tests/e2e-telemetry.test.ts` lines 471–501 cover recognition results for Orion and Cassiopeia fixtures.

`tests/e2e-telemetry.test.ts` lines 571–586 cover catalog counts and Greenwich preset expectations.

`package.json` declares Vitest as the test runner and has no React Testing Library dependency.




<a id="implementation-5-8"></a>
# Independent visual audit: reference screens 5–8

## Scope and evidence

- This section covers only the ordinal middle group in `UI-REFENECE`.
- Ordinals follow filename order, not screenshot contents.
- Ordinal 5 is `ChatGPT Image Nov 11, 2026, 07_58_21 PM-3.png`.
- Ordinal 6 is `ChatGPT Image Nov 11, 2026, 07_58_28 PM-4.png`.
- Ordinal 7 is `ChatGPT Image Nov 11, 2026, 07_58_40 PM-5.png`.
- Ordinal 8 is `ChatGPT Image Nov 11, 2026, 07_58_46 PM-6.png`.
- Native PNG dimensions were read from the file headers: each is 1586 by 992 pixels.
- The image viewer presented them at 1600 by 1000 CSS pixels during visual inspection.
- Bounds transcribed below originate in that displayed preview coordinate space.
- Convert displayed x coordinates and widths to native pixels by multiplying by 1586/1600 (0.99125).
- Convert displayed y coordinates and heights to native pixels by multiplying by 992/1000 (0.992).
- Bounds remain approximate because they were visually measured from scaled raster previews.
- Source findings are code inspection findings, not runtime observations.
- No app changes were made during this audit.
- No browser capture was available for this section.
- Where a reference suggests an interaction absent from source, it is identified as an inference.
- Where the screenshot conflicts with an existing feature contract, the conflict is stated explicitly.
- Preserve current calculations, state, events, and route switches while moving their controls.
- The root instruction treats these screenshots as layout authority at their native 1586 by 992 frame.
- Preview-scaled measurements place the persistent rail at approximately 224 native pixels.
- The shell should map each application view into that shared rail and content frame.
- Existing top navigation must be relocated or adapted, not silently removed.
- Per-screen geometry should scale with the content frame and preserve scroll access on short viewports.
- Read-only source reviewed: `PROJECT.md`, `ORIGINAL_REQUEST.md`, `src/App.tsx`, `src/App.css`, `src/components/HeaderNav.tsx`, and the four corresponding view components.
- Relevant component paths are repeated with line anchors under each screen.
- Relevant line numbers are from the inspected checkout at audit time.
- Reconfirm anchors against the current branch before editing because concurrent work may shift lines.
- The code emits one root route at a time through `activeView` in `src/App.tsx:20-48`.
- Trace mode is an overlay attached only to the live sky route in `src/App.tsx:27-34`.
- Recognition results are a modal nested in TraceHud, not an `activeView` route.
- The references depict Trace and Results as independent page compositions.
- Mapping those screen compositions requires shell-level presentation changes and lifted display placement.
- Lifting presentation must not fork or duplicate the existing calculations and handlers.
- This audit does not authorize replacing the data model, routes, stores, or algorithms.
- Cobalt signal in the reference is approximately `#1457F5` to `#1D5BFF`.
- The approved project cobalt token is `#1D55F5` and remains authoritative over noisy raster sampling.
- Reference panels are near-white with fine neutral dividers and low-contrast cool borders.
- The screenshots use a blue textured desktop around the app plate.
- That desktop texture is a reference observation, not a confirmed requirement from the approved token contract.
- Do not introduce an image texture without a matching approved asset or token instruction.
- A flat `--bg-shell` chassis with a white plate is the safer implementation inference.
- References contain line segments in star diagrams and the live sky.
- The request's “zero continuous lines” applies to data visualization traces, not literal asterism edges.
- Keep astronomy line segments because they encode constellation topology.
- Replace continuous progress and metric charts with the requested discrete marks.
- References include icons, glyphs, and emoji-like symbols.
- Their use does not overturn the explicit all-monospaced text requirement.
- Keep icon glyphs only if rendered legibly and consistently with the design.
- All major labels in the four screens are uppercase and compact.
- The reference screenshots are illustrative compositions, not evidence that current data matches displayed sample values.
- Do not hard-code example constellation rankings, coordinates, timestamps, fit scores, or star counts.
- Actual observer, date, trace, and recognition data must remain live from the store.
- Do not claim pixel-perfect fidelity on other viewport sizes based solely on these 1586 by 992 files.

## Ordinal 5: Sky Tonight dashboard

### What the image shows

- Source filename is `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_58_21 PM-3.png`.
- Native canvas size is 1586 by 992 pixels; bounds below are preview measurements, converted by x×0.99125 and y×0.992.
- The pale app plate spans approximately x=34 through x=1546.
- The pale app plate spans approximately y=48 through y=950.
- The left rail occupies approximately x=34 through x=260.
- The main dashboard begins around x=278 and ends around x=1536.
- Sidebar width is approximately 224 native pixels, converted from the displayed 226-pixel estimate.
- The visible frame reserves about 18 pixels between rail and dashboard.
- The screen has a 104-pixel top metrics band across the main content area.
- Five metric cards occupy that band with about 8-pixel gaps.
- Metric cards show date, observer location, sunset, moon illumination, and visible count.
- Date and sunset readouts use large dotted numeric glyphs.
- The observer card separates latitude and longitude values into compact fields.
- The moon card pairs a percentage with a phase disc.
- The visible count is a large dotted integer.
- The main Sky Tonight table starts near y=187 and ends around y=568.
- The table has a heading and three compact mode choices at its top edge.
- Its header row includes constellation, visibility window, and hourly labels.
- The hourly labels cover 18:00 through 04:00 with eleven hour columns.
- Five example constellation rows have schematic asterism glyphs, names, windows, and dot tracks.
- Each track uses approximately four dots per hour in alternating neutral and cobalt states.
- The table uses thin horizontal row rules rather than boxed cards per cell.
- Three lower modules begin around y=578 and end near y=934.
- The lower left panel is a ranked list of recommended observation windows.
- The middle panel is a short list of tonight highlights.
- The right panel is a large dark-sky preview with labeled asterisms.
- The selected recommendation is indicated by pale periwinkle fill.
- Most surface cards use a 12–16 pixel corner radius and no visible drop shadow.
- The sky preview is the exception to the pale panel treatment and has a dark navy field.
- The sidebar highlights Overview in this image.
- The sidebar includes Overview, Sky Explorer, Trace, Patterns, Automata, Image Lab, Results, and Settings.
- The reference labels Results, while the current source names its modal rather than a result route.
- Top metrics use ink labels and cobalt or Doto-style numeric emphasis.
- Light card dividers define columns without heavy outlines.
- The table’s blue dots are discrete state marks, not a connected line.
- The example values are sample composition only.
- The reference has a phase disc and named asterism preview; neither proves a specific source event.

### Existing source behavior and anchors

- `src/features/skyTonight/SkyTonight.tsx:6-7` defines eleven hour markers and four 15-minute quanta.
- `SkyTonight.tsx:24-73` derives current horizontal coordinates, meridian culmination, brightest-star information, time windows, and eleven visibility samples.
- The visibility samples currently occur at exact whole hours, not four quarter-hour samples per hour.
- `SkyTonight.tsx:75-103` filters by horizon, hemisphere, and search, then sorts by altitude, transit, name, or area.
- `SkyTonight.tsx:105-119` derives counts and the current UTC readout.
- `SkyTonight.tsx:123-177` currently renders a header card with observer coordinates and quick time controls.
- The existing quick controls step by hours and include Now and plus 24 hours.
- `SkyTonight.tsx:179-276` draws a separate 11-column time stepper, four clickable quanta per hour, and ±15 minute/±1 hour controls.
- The quarter-hour button calls `handleSetQuantumTime` and `setObservationDate`.
- The visible 11-hour stepper is a time-control instrument, not the per-constellation visibility table in the reference.
- `SkyTonight.tsx:278-350` provides search, horizon, hemisphere, and sort controls.
- `SkyTonight.tsx:352-430` renders a responsive grid of constellation cards with altitude, azimuth, and whole-hour visibility indicators.
- `SkyTonight.tsx:431-485` contains additional card data and route actions; verify exact current line positions before moving these controls.
- Source currently has no separate `above-horizon / all / circumpolar` visibility timeline row for every one of four quarter-hour quanta.
- The screen’s three lower panels do not exist as a combined static composition in current JSX.
- Current source does not expose sunset or moon illumination values in this component.
- The reference’s date and observer figures can be mapped from store values where available.
- The available sunset and moon calculations must be verified elsewhere before implementing these metric cards.
- Never fabricate sunset or moon values to match the example image.
- `src/components/HeaderNav.tsx:66-80` lists the current views and has no explicit Results or Settings route.
- `HeaderNav.tsx:85-279` renders a horizontal header, search omnibar, view rocker, trace toggle, and observer action.
- `src/App.tsx:20-48` places HeaderNav above the content and sends `tonight` to SkyTonight.
- `src/App.css:52-91` sets full-viewport shell and a vertical tray that currently assumes top navigation.
- These source anchors prove component structure and handlers, not exact rendered pixel behavior.

### Strict implementation direction

- Retain the 11-hour axis and each existing 15-minute clickable quantum.
- Convert the current 11-column selector into the header control strip or a compact dedicated time instrument.
- Keep each quantum a real button; preserve `handleSetQuantumTime` semantics.
- Preserve UTC semantics and label all times with UTC where appropriate.
- Keep Now, ±1 hour, ±2 hour, ±24 hour, and ±15 minute actions reachable.
- Do not let the screen reference’s simpler hour axis remove quarter-hour stepping.
- Create a top metrics strip sized to the content frame, with responsive wrapping below tablet widths.
- Render only real source fields in metric cards.
- Map Date to `observationDate`, observer location to the current observer, and visible count to the live above-horizon calculation.
- If sunset or moon illumination are unavailable, use existing truthful derived fields or omit those two cards with no fake values.
- Verify whether those values are already available from `astroData`, astronomy utilities, or another existing feature before making a design omission.
- Preserve time display timezone consistency; avoid mixing local date in the header with UTC labels in the timeline.
- Build the large timeline table with constellation rows sourced from the current filtered data.
- Preserve search and all filter/sort options in an accessible control band.
- The reference only shows Evening, Night, and Full toggles; these have no proven one-to-one existing state equivalent.
- Do not relabel the current horizon filter as Evening/Night/Full unless a truthful behavior mapping is defined.
- A sensible mapping inference would expose those modes as real filters only after product semantics are established.
- Existing `horizonFilter` remains Above, All, Circumpolar unless intentionally preserved under a changed control presentation.
- For each constellation, produce a discrete visibility matrix from actual sampled times.
- The existing per-row `nightVisibilityDots` is hourly, while the existing top selector has quarter-hour quantum labels.
- Use 44 points per row only if sampling at 15-minute intervals over eleven hours is deliberate and coordinate calculations remain performant.
- Four dots per hour imply 44 samples across the 18:00–04:00 interval when both endpoints are counted by hour bucket.
- Resolve endpoint conventions so 04:00 is represented once and do not accidentally create a 45th dot.
- Keep visibility derived from `getHorizontalCoordinates` and the current observer and date.
- A row’s visibility sample date should be based on the currently selected observation date’s UTC calendar date.
- Handle the 00:00–04:00 samples crossing midnight with UTC date rollover.
- Current code creates sampleDate from observationDate and then sets UTC hour; that naturally preserves its date but fails to advance after midnight when the base date starts in the evening.
- Correcting the overnight date rollover changes a calculation, so treat it as a separately reviewed defect fix rather than a visual-only edit.
- Until approved, keep current samples unchanged and do not imply the displayed hour track is a continuous date-aware forecast.
- Use thin row dividers and no per-cell card boxes to match the screenshot.
- Render the constellation identifier as a small dot font label if legible.
- Render line segments only in the tiny topology glyph or sky preview; do not replace the larger visibility matrix with connected paths.
- Construct recommendation and highlights panels only from existing sorted/filtered values and genuine observation window semantics.
- Current component has culmination and window strings to support truthful time-window lists.
- A “recommended observation window” ranking can use current culmination data only after the ranking rule is explicit.
- Do not invent a “best” ranking based on appearance.
- Use three lower panels at desktop width: ranked windows, highlights, and sky preview.
- If no current sky-preview component can be reused, build the preview from existing sky drawing data; do not create a second Three.js scene without checking the runtime cost.
- The source likely has SkyCanvas and constellation vectors; a static SVG schematic can be driven by the same lineSegments and star coordinates.
- Preserve route transitions when a constellation is selected and when it is sent to sky or trace.
- The resulting screen should make search and filters visible without forcing users to scroll past the top band.
- On shorter viewports, allow the main content to scroll; do not clip lower panels behind `overflow:hidden`.
- At native 1586 by 992, estimated rail, gap, and content widths are approximately 224, 18, and 1247 pixels.
- These are measurements for this frame, not normalized responsive tokens.

### Sky Tonight fixtures and checks

- Fixture S5-A uses a known observation date and observer with at least one above-horizon and one below-horizon constellation.
- Assert date changes update live coordinates and visibility marks.
- Assert observer changes update altitude, azimuth, visible count, and row states.
- Assert Now uses the actual current date rather than the screenshot’s fixed sample date.
- Assert +24 hours preserves clock time while advancing one day.
- Assert ±15 minute controls update the same observation date field used by the header and sky view.
- Assert each quarter-hour cell is keyboard-focusable and updates the selected UTC time when activated.
- Assert 18:00, 23:00, 00:00, and 04:00 axis labels render in ascending displayed night order.
- Assert 00:00 through 04:00 do not silently disappear when the selected date begins before midnight.
- Treat overnight visibility sample values as a known caveat until rollover semantics are resolved.
- Assert Above, All, and Circumpolar filters preserve existing membership behavior.
- Assert north and south filters do not change when the layout moves into the control row.
- Assert search by common name, English name, identifier, and brightest-star name returns the same rows.
- Assert altitude, transit, name, and area sort choices preserve their current order semantics.
- Assert counts remain live after filters are changed and distinguish filtered count from above-horizon count.
- Assert the matrix uses only discrete states with no connected visibility spline.
- Assert chart-like status marks expose accessible text such as above horizon or below horizon.
- Assert 15-minute controls and hourly visibility samples are labeled as different instruments if both remain.
- Assert no sample values from the reference are hardcoded into production output.
- Assert missing sunset or moon data renders as absent/unknown, never copied from the image.
- Assert every content panel remains reachable at 1280 by 720 with page or panel scrolling.
- Assert constellation action buttons preserve current sky focus and trace behavior.
- Capture at native 1586 by 992 and compare the approximately 224-pixel rail and dashboard bounds.
- These checks are proposed verification, not tests run by this audit.

## Ordinal 6: Constellation Library

### What the image shows

- Source filename is `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_58_28 PM-4.png`.
- Native canvas size is 1586 by 992 pixels; bounds below are preview measurements, converted by x×0.99125 and y×0.992.
- The shared app plate and rail match the adjacent reference screens.
- The main area begins near x=268 and ends around x=1536.
- The library list area spans about 870 pixels at the pictured width.
- The detail inspector occupies about 386 pixels to its right.
- The main area is a two-column split with a narrow internal gap.
- The library title begins near x=294 and y=92.
- A long search field occupies the upper right of the library list header.
- A filter row follows the title header, with six pill options.
- The options shown are All, Zodiac, Seasonal, Northern, Southern, and Favorites.
- The visible card grid has four columns and two visible rows.
- Each card is approximately 204 by 333 pixels at this frame.
- The first card has a cobalt outline and a pale blue selected fill.
- The remaining cards have fine neutral outlines and white surfaces.
- Each card uses a centered blue-star asterism drawing occupying its upper half.
- Each card has an outline star toggle near its top-right corner.
- Card footers show name, three-letter identifier, best season, key-star count, and a right arrow.
- Eight constellations are visible in the screenshot but are illustrative examples.
- The right inspector begins with the selected name, identifier, and favorite star control.
- A large asterism canvas has a pale dot grid and blue stars joined by thin gray edges.
- A Notable Stars list shows three names and Greek-letter identifiers.
- A Visibility block shows season, key-star count, and region in three columns.
- The inspector footer has View in Sky and Start Trace actions.
- The right panel retains the same content while the card selection changes.
- The screenshot uses “favorites” and per-card star controls.
- Existing source state has no evidenced favorite collection.
- The visible “both” region label is a display sample, not a verified source value.
- Star lines represent topology and are not continuous metric charts.
- The screenshot’s cards prioritize asterism shapes over the metadata and live altitude currently surfaced in cards.
- The images appear to show neutral card styling with cobalt selection emphasis and pale neutral canvas fill.

### Existing source behavior and anchors

- `src/features/constellationExplorer/ConstellationExplorer.tsx:13-102` defines `MiniAsterismPreview` and draws an 8-pixel dot grid, topology edges, and star nodes.
- The current mini preview uses a dark navy background at `ConstellationExplorer.tsx:58-99`.
- The reference preview uses a pale background with low-contrast dots and blue stars.
- `ConstellationExplorer.tsx:104-122` owns search, family, hemisphere, season, recognition-only, selected constellation, and hovered star state.
- There is no favorite state in the inspected component state.
- `ConstellationExplorer.tsx:124-155` builds family options and filters the IAU catalog by family, hemisphere, season, recognition support, and text search.
- `ConstellationExplorer.tsx:157-178` implements trace, automata inspection, and sky focus handoffs.
- `ConstellationExplorer.tsx:180-248` derives detail asterism positions and ordered traversal sequence data.
- `ConstellationExplorer.tsx:253-279` starts the current page with a large intro card and search input.
- `ConstellationExplorer.tsx:281-347` renders filter controls for family, hemisphere, season, and recognition-only, plus catalog count.
- Current controls do not expose a Favorites filter or per-card favorite toggle.
- `ConstellationExplorer.tsx:349-` begins a responsive grid and builds each preview card.
- `ConstellationExplorer.tsx:357-360` attaches card selection to `setSelectedConstellation`.
- The component tail conditionally renders a selected constellation detail modal; line anchors can be refreshed with `rg -n "selectedConstellation|Notable|BEST SEASON|FIND IN SKY"` before implementation.
- The detail modal includes live coordinates, seasonal classification, and sky/trace/automata actions.
- Current detail uses a modal rather than a persistent adjacent inspector.
- Current detail diagram uses 460 by 240 SVG coordinates and a neutral star geometry representation.
- `src/App.tsx:42-44` maps the `constellations` view to this component.
- `src/components/HeaderNav.tsx:66-80` labels this route Explorer rather than Patterns.
- `HeaderNav.tsx:85-279` places route selection in a horizontal bar.
- These findings describe source, not a runtime screenshot.

### Strict implementation direction

- Keep the current 88-constellation IAU catalog and its search breadth.
- Keep family filtering even if the reference presents the narrower Zodiac/Seasonal choices.
- Keep hemisphere and season filters and the recognizer-only toggle.
- Present filters in a compact toolbar that can wrap without hiding active state.
- The reference’s Favorites filter requires persistence and state not present in the audited source.
- Do not implement a nonfunctional Favorites chip or silently introduce local-only favorite state.
- If favorite functionality is approved separately, define persistence and the source of truth before binding a toggle.
- The Zodiac filter can be derived from existing family taxonomy only if that taxonomy explicitly identifies zodiac constellations.
- Verify `CONSTELLATIONS` family values before mapping a Zodiac category; do not infer from names.
- “Seasonal” currently corresponds to a four-state season filter but the source uses RA classification thresholds.
- Keep the existing season classifier semantics unless a separately authorized astronomy correction is made.
- Replace the current modal presentation with an adjacent inspector on desktop.
- Keep the modal or a stacked disclosure at narrow widths so details remain usable.
- The selected card should remain selected after opening inspector data.
- The detail inspector should be a stable column so grid geometry does not jump on each selection.
- If no card is selected, show a neutral prompt and retain the same inspector space.
- Do not invent a default selected constellation merely because Orion is selected in the screenshot.
- Render four cards per row at native 1586 by 992 within the list pane; adapt to 3, 2, and 1 columns as width narrows.
- The list pane plus inspector pane must fit within the main content width without horizontal page overflow.
- At current reference geometry, use roughly a 2.2:1 list-to-inspector split after internal padding.
- Keep list scrolling independent from the details inspector if the app frame is height constrained.
- Card art must use existing constellation line segments and star coordinates.
- Reuse `MiniAsterismPreview` as the small card graphic and restyle the canvas to a light dot grid.
- Avoid adding duplicate SVG identifiers; the existing ID uses `dg-${con.id}` and should remain unique per constellation card.
- Keep SVG aspect ratio stable so long constellations do not crop their stars.
- The inspector diagram should reuse `asterismDiagramData` and its `refPattern` ordering.
- Clearly distinguish catalog lines from trace traversal order.
- The reference detail graph shows neutral gray edges and cobalt points; a selected reference traversal can use a deliberate accent only when it is actually present.
- Current star positions and lines are not a trace; do not assign ordered numbers unless the matching reference pattern provides them.
- Notable-star data should come from the selected constellation’s star IDs and existing `STAR_BY_ID` lookup.
- Current source has star IDs and proper names, but no proof that a selected top-three list is already ordered by brightness.
- If choosing three notable stars, sort by real magnitude and label the ranking rule or use the existing `brightestStar` value only.
- Do not copy Betelgeuse, Rigel, and Bellatrix unless Orion is selected and those identifiers match actual data.
- Visibility metrics may use existing `getHorizontalCoordinates`, season classifier, star count, family, and region values if source definitions support them.
- Source does not currently derive a named “region” for both hemispheres; avoid the reference’s BOTH value unless a truthful field exists.
- Preserve `handleFocusSky`, `handleStartTrace`, and `handleInspectAutomaton` behavior.
- The View in Sky action should call the existing focus handoff and close any narrow-screen detail sheet.
- Start Trace should keep using the existing forward reference pattern and fallback route behavior.
- Inspect in Automata Lab remains a source capability even though the reference omits it.
- Preserve that capability in the inspector, possibly in a secondary action group.
- A hidden automata action would violate feature retention even if the reference only shows two buttons.
- Keep card search matching name, English name, identifier, and brightest-star name.
- Keep catalog count derived from filtered results.
- Use the shell rail label “Patterns” only if the root navigation map intentionally adopts the reference wording.
- The current destination is still the ConstellationExplorer view; navigation copy can change without changing `activeView`.
- Source currently displays live altitude and azimuth on cards; preserve that information somewhere if removing it from card face.
- It can move into the detail inspector as current altitude and azimuth values.
- Avoid changing the source’s RA/Dec projection mathematics while restyling diagram fills, strokes, or labels.
- The reference’s no-shadow, restrained border treatment should be retained in card and panel states.
- A selected outline should be visible by color and not depend on fill alone.
- Hover, keyboard focus, selected state, and disabled state must remain distinguishable.

### Constellation Library fixtures and checks

- Fixture S6-A selects Orion and verifies its name, abbreviation, star count, and star listing come from source data.
- Fixture S6-B selects a constellation without a forward recognition pattern and verifies trace fallback behavior remains valid.
- Fixture S6-C selects a constellation with a forward pattern and verifies the trace action loads the same preset symbols.
- Assert the Automata action still selects the DFA tab and routes to `automataLab`.
- Assert the sky action calls `focusOnConstellation` with the selected identifier.
- Assert selection opens or updates the inspector without mutating catalog data.
- Assert search matches at least one native name, English name, ID, and brightest star.
- Assert family, hemisphere, season, and recognition-only filters still combine conjunctively.
- Assert clear search and All filter states restore the expected catalog count.
- Assert favorites does not appear as an enabled behavior until persistence and ownership exist.
- If favorites are later approved, test reload persistence and cross-view state before accepting it.
- Assert preview SVG edges connect only listed `lineSegments` endpoints that have valid stars.
- Assert missing star records do not crash small previews or the inspector.
- Assert every constellation preview has a stable viewBox and retains all plotted nodes.
- Assert the selected card state is announced to assistive technology and visible without relying on color alone.
- Assert 4-column geometry at native 1586 by 992 and responsive reflow at 1280 and 768 pixels.
- Assert the detail panel remains visible while the catalog list scrolls at 900-pixel viewport height.
- Assert narrow widths switch inspector into a modal or stacked panel without cutting off action buttons.
- Assert live altitude and azimuth remain available after moving them off the cards.
- Assert no Orion-specific details leak when another constellation is selected.
- Assert the preview’s dot grid uses neutral light dots with cobalt nodes and subdued connecting edges.
- Assert diagram line geometry remains unchanged after CSS-only restyling.
- Assert visible cards are real first results from current source data, not copied screenshot content.
- Capture the desktop split and compare x/y bounds and card count against the reference.
- These checks are proposals; none were run as part of this read-only audit.

## Ordinal 7: Trace-to-recognize workspace

### What the image shows

- Source filename is `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_58_40 PM-5.png`.
- Native canvas size is 1586 by 992 pixels; bounds below are preview measurements, converted by x×0.99125 and y×0.992.
- The shared app plate and persistent rail remain present.
- The content starts near x=264 and spans about 1276 pixels.
- A title occupies the upper left of the content frame.
- A stats band below it contains selected stars, sequence length, active candidates, and trace-session elapsed time.
- The main drawing canvas begins near x=283 and y=249.
- The canvas is approximately 836 by 590 pixels and uses a dark star field.
- Zoom controls and an expand control sit at upper corners of the sky canvas.
- A large current trace is centered in the canvas with numbered nodes and cobalt paths.
- The right candidate panel is approximately 400 pixels wide and aligns with the canvas top.
- Candidate panel header shows Candidate Matches and a compact updating indicator.
- Candidate rows include preview topology, candidate name, fit score, segmented score bar, and disclosure arrow.
- The top-ranked candidate is selected with cobalt border and pale periwinkle fill.
- A Show All Candidates control sits beneath candidate rows.
- Four primary actions sit in a bar below the canvas: Undo, Clear Path, Show Hints, Complete Trace.
- The canvas is the dominant region, not an inset image.
- The screenshot includes a live elapsed timer and “active candidates” text.
- Current source does not expose trace elapsed time or a session timer in the inspected component.
- The reference has candidate-match cards but no source proof for scores as displayed.
- The result’s example score bar is segmented, with filled and inactive pill segments.
- Existing star picking and trace recognition must remain bound to the same state.
- The screenshot’s layout suggests a dedicated Trace route or view state, unlike current overlay activation.
- The same sidebar remains visible when entering Trace, so moving trace out of the canvas must not lose global navigation.
- The reference does not show the current preset demo selector or geometry-analysis action.
- Current trace feature includes both and they must remain reachable.
- The main scene includes all existing sky objects, not only the simplified selected pattern.

### Existing source behavior and anchors

- `src/features/traceMode/TraceHud.tsx:7-25` reads trace and result state from `useAstroStore`.
- `TraceHud.tsx:27-101` implements preset loading and three deterministic demos.
- The demos exercise symbolic reject, geometric reject, and rotation/scale invariance.
- `TraceHud.tsx:104-131` returns null when trace mode is off and otherwise begins a compact overlay.
- The overlay is absolutely positioned at top 4, left 4, width 96 (`w-96`) and uses a card surface.
- `TraceHud.tsx:159-245` renders status-specific recognition feedback for full match, valid prefix, geometric reject, and symbolic reject.
- `TraceHud.tsx:247-295` renders encoded symbols and selected-star sequence data.
- `TraceHud.tsx:297-369` implements Undo, Clear Path, Complete Trace, Geometry, presets, and Automata Lab drilldown.
- `TraceHud.tsx:370-375` mounts recognition and geometry modals.
- `src/sky/SkyCanvas.tsx` owns the existing Three.js sky scene; inspect current line numbers before moving overlay anchors.
- `src/App.tsx:27-34` currently mounts TraceHud over SkyCanvas only for `activeView === 'sky'`.
- `src/components/HeaderNav.tsx:238-255` toggles `isTraceMode` and routes back to sky if another view is active.
- Current source stores traced star IDs, traced points, recognized report, and visibility state in `useAstroStore`.
- Current source does not define a timer field in `RecognitionReport` or TraceHud local state.
- `src/recognition/types.ts:25-37` defines the report’s symbolic, DFA, prefix, geometric-score, match, status, and explanation fields.
- There is no `fitScore` field in `GeometricCandidateScore`; it exposes residual, verified flag, rotation, and scale.
- A score percentage must therefore be a display transformation and cannot be presented as canonical engine output without a defined formula.
- Candidate selection state is not apparent in TraceHud source; inspect the store before adding one.
- These source findings are from code, not a browser capture.

### Strict implementation direction

- Keep SkyCanvas as the large central drawing surface.
- Move the trace controls from the compact left overlay into the right candidate/trace side panel and the bottom action rail.
- Keep the same `useAstroStore` state and exact event handlers for point addition, undo, clear, preset, and recognition modals.
- Do not implement a second recognizer or copy a trace into local-only view state.
- The right column can present the active recognition result and geometric candidates already in `recognitionReport.geometricScores`.
- Candidate ordering should preserve the current source order from the report unless an explicit source rule already sorts it.
- Verify whether `geometricScores` is sorted before rendering; do not assume best-first ordering solely from the example image.
- Use `bestMatch` only to mark a candidate selected if its pattern ID matches a score in the list.
- If there is no best match, clearly show an empty/no-result state instead of selecting Orion or a stale candidate.
- Do not add candidate-click state that changes engine evaluation unless its purpose is only presentation and it remains clearly separate.
- Do not invent fit-score percentages from residual as if they were engine values.
- If a normalized score is shown, label its exact formula and preserve raw residual and verification flag.
- Prefer raw residual RMSE and verified/rejected status if no approved score formula exists.
- Candidate bar segments may encode verification or a documented normalized residual scale.
- The bar must not imply calibrated confidence if it is merely a visual normalization.
- Keep the 4-dot activity indicator or adapt it to the requested 5-dot telemetry only if the count mapping is explicit.
- Current pointCount drives a 4-dot stepped activity display.
- If moving the counter into a top metric tile, retain the same pointCount calculation and star/point pluralization.
- A sequence-length stat can use current `inputSymbols.length` when a recognition report exists.
- Before recognition, use current pointCount for the selected-star count and avoid implying symbols are available.
- The active-candidate statistic can use `prefixMatch.reachableAcceptingLabels.length` only for a valid prefix result.
- For full match, reject, or no report, use a truthful status-specific count or placeholder rather than stale candidates.
- Add elapsed time only if a session start time already exists or is explicitly introduced as a presentational local timer.
- A timer requires start, pause/reset, and navigation semantics; screenshot alone does not define them.
- In the absence of timer state, omit elapsed rather than display a fabricated duration.
- Preserve the header’s live observer and time controls elsewhere in the shared app shell.
- Provide enough sky viewport vertical room at 1000 pixels for canvas plus bottom actions.
- The target desktop proportions are about 2.1:1 canvas to side panel, with a small gap.
- The canvas should retain pan/zoom behavior and existing star click hit targets.
- Keep zoom and expand controls anchored inside the sky viewport without intercepting star clicks.
- Place Undo, Clear Path, Hints, and Complete Trace in the bottom action row, as the image does.
- Keep Geometry analysis and curated preset selection reachable in a secondary toolbar or disclosure.
- Keep the Automata Lab drilldown accessible when a result exists.
- Preserve disabled state semantics: undo and clear when empty, complete without report, geometry below two points.
- Preserve hint toggle state and ensure the control reflects `showTraceHints`.
- The candidate panel must be scrollable independently if there are more candidates than fit the viewport.
- The reference shows three candidates, but source may produce more; never truncate the list without an explicit Show All control.
- “Show All Candidates” should reveal the full existing result set, not trigger new matching calculations.
- If the list is already complete, the label may indicate the count and not be a dead button.
- For no recognition report, show a neutral instruction and no false candidate cards.
- For `VALID_PREFIX`, show reachable accepting labels and the existing prefix explanation.
- For `FULL_MATCH`, identify best match and raw verification values.
- For `GEOMETRIC_REJECT`, retain the DFA-accepted versus geometry-rejected distinction.
- For `SYMBOLIC_REJECT`, retain the actual explanation and empty geometric candidates when appropriate.
- Keep recognizer output sourced from the existing report.
- Overlay status, modal actions, and result page must not fight over z-index or capture pointer input intended for SkyCanvas.
- Keep the preset/demo selector available for academic and test scenarios.
- Current quick candidate cards may show existing constellation mini-previews only if they use matching source pattern geometry.
- A preview generated from `referencePoints` must preserve order and use the source’s coordinates.
- The screenshot’s bright numbered nodes are a visual convention, not proof that source IDs equal sequence numbers.
- Use the current traced point order for trace indices, not arbitrary star IDs.
- Keep the star identification text from `STAR_BY_ID` when available.
- Do not change canvas coordinate mapping to fit the screenshot’s sample shape.
- Shared rail and content frame must remain present in Trace mode.
- Trace mode should preserve all primary route navigation and avoid forcing a user to toggle back to sky to exit.
- A dedicated view label may map to existing state, but route truth and state transitions need one canonical path.

### Trace workspace fixtures and checks

- Fixture S7-A begins with an empty trace and verifies no candidate score is fabricated.
- Fixture S7-B loads a known reference preset and verifies the existing recognizer reports the same status and symbols.
- Fixture S7-C activates the symbolic-reject demo and verifies the reject status and explanation remain unchanged.
- Fixture S7-D activates the geometric-reject demo and verifies DFA acceptance is distinct from geometric rejection.
- Fixture S7-E activates the invariance demo and verifies rotation and scale values still come from the existing report.
- Assert selecting a star in SkyCanvas appends the same star ID to existing store state.
- Assert clicking a star continues to work with the right panel and bottom action bar visible.
- Assert undo removes exactly the last point and recalculates the report through existing store behavior.
- Assert clear resets both traced stars and custom points and removes stale candidate cards.
- Assert hints toggle changes the existing hint state and visible sky guide.
- Assert Geometry opens the same analysis modal and remains disabled below two points.
- Assert Complete Trace opens the existing recognition result presentation only when a report exists.
- Assert the Automata drilldown receives `inputSymbols` and selects the simulator tab as before.
- Assert preset selection still includes all real forward patterns and the three academic demos.
- Assert result candidate list includes all report `geometricScores` unless user deliberately expands/collapses the visible area.
- Assert candidate identity, residual, verified state, rotation, and scale match source data exactly.
- Assert a percentage bar has a documented transformation and is not labeled engine confidence.
- Assert active candidate labels are drawn from `prefixMatch.reachableAcceptingLabels` only when the status supports that interpretation.
- Assert no elapsed-time field is shown unless a timer has reliable start/reset lifecycle.
- Assert the sky canvas remains visible and input-responsive at native 1586 by 992.
- Assert narrow screens stack the candidate panel below the sky without losing Undo or Complete Trace.
- Assert the candidate panel scrolls independently when the candidate count exceeds its height.
- Assert close/exit controls return to the intended existing view without dropping trace state unexpectedly.
- Assert full-screen, zoom-in, zoom-out, and trace interactions do not overlap hit regions.
- Compare the frame bounds to the reference after implementation; proposed verification only.
- These checks were not executed during the audit.

## Ordinal 8: Recognition result dashboard

### What the image shows

- Source filename is `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_58_46 PM-6.png`.
- Native canvas size is 1586 by 992 pixels; bounds below are preview measurements, converted by x×0.99125 and y×0.992.
- The shared rail persists and highlights Results.
- Main content occupies approximately x=264 through x=1535.
- The top band contains a large recognition verdict panel and a dark-sky comparison graphic.
- The verdict panel occupies about 714 by 314 pixels.
- It shows a large dotted constellation name, a large confidence percentage, and a three-part status line.
- The status line displays matched state, geometric fit, and symbol match.
- The adjacent dark-sky canvas shows traced and reference geometry with a legend.
- The canvas legend distinguishes the traced pattern from the reference pattern.
- The second row has a candidate comparison list on the left and recognition diagnostics on the right.
- Candidate comparison cards show rank, topology thumbnail, name, geometric-fit dots, symbol-match state, and confidence box.
- The first candidate is selected with a blue border and pale blue fill.
- The DFA recognition panel shows a sequence of states with arrows and a final accepted state.
- A matched-features matrix lists observed, reference, and error values.
- The right diagnostic panel and feature table are distinct, with the table below the DFA panel.
- The title is Recognition Result, while the navigation rail uses Results.
- Accent color emphasizes best candidate and acceptance; all other surfaces remain cool neutral.
- The diagram’s dashed white segment is a topology comparison treatment, not a graph metric spline.
- The sample gives Orion, 97.6 percent confidence, and 98.3 percent geometric fit.
- These values are illustrative and must not be hardcoded.
- Screenshot also implies report page state survives after leaving the trace screen.
- Existing source represents this content in a modal overlay on trace mode.
- The modal already contains useful diagnostics but does not show an explicit graphical overlay comparison.
- The reference’s comparison geometry can use existing trace and reference coordinates only when both data sets exist.
- Existing recognizer output has `bestMatch`, geometric scores, and quantized steps but no explicit calibrated confidence field.
- Treat its confidence KPI as a design sample, not a contract for a new calculation.

### Existing source behavior and anchors

- `src/features/traceMode/RecognitionResultsModal.tsx:8-17` reads report and trace data and returns null when no report exists.
- `RecognitionResultsModal.tsx:19-27` sends symbols to the simulator and opens the Automata Lab on the simulator tab.
- `RecognitionResultsModal.tsx:29-42` exports timestamp, traced star IDs, and the complete report as JSON.
- `RecognitionResultsModal.tsx:44-60` derives status flags, candidate display name, and residual-based `confidenceScore`.
- The current `confidenceScore` is a local display formula using residual divided by 0.45 and capped at 99.9.
- `RecognitionResultsModal.tsx:62-83` renders a fixed modal backdrop and report title.
- `RecognitionResultsModal.tsx:85-133` renders constellation verdict, explanation, confidence KPI, and state badge.
- `RecognitionResultsModal.tsx:135-178` renders DFA and geometric verification details.
- `RecognitionResultsModal.tsx:180-212` renders a discrete step sequence from report symbols.
- `RecognitionResultsModal.tsx:214-289` renders ranked geometric candidate scores in a table with a 10-dot visualization.
- `RecognitionResultsModal.tsx:291-322` implements JSON export, close, and Automata Lab actions.
- `src/recognition/types.ts:25-37` does not declare a confidence score or matched-feature comparison table.
- The type does expose candidate residual, rotation, scale, and verification status.
- Existing report does not carry per-feature observed/reference/error values.
- `src/features/traceMode/TraceHud.tsx:370-` mounts the modal from a boolean stored in the global store.
- `src/App.tsx:27-34` mounts TraceHud only within the sky route.
- This source is authoritative for current behavior; no browser rendering was captured.

### Strict implementation direction

- Present results as a dedicated content state or route in the shared shell while retaining one existing `recognitionReport` source.
- The reference’s Results rail state must map to a real `activeView` or explicit result presentation state.
- Current `ActiveView` and root switch do not include a results route.
- Do not add a disconnected hardcoded Results navigation item that cannot open the current report.
- A valid result view can be activated from Complete Trace, the trace result modal action, or a result status in the store.
- Decide one route/state transition and ensure modal close returns to the prior relevant screen.
- If the root shell keeps modal behavior for narrow screens, desktop result route and narrow modal should render the same component/data contract.
- Preserve export, close, and Automata simulator actions exactly.
- Preserve all current DFA, geometric, prefix, and symbolic status distinction in the new layout.
- Make the verdict card adapt its label and status for `VALID_PREFIX`, `SYMBOLIC_REJECT`, and `GEOMETRIC_REJECT`.
- Do not show “MATCHED” for rejected or unresolved results.
- The report’s `bestMatch` is nullable; handle null without pretending a candidate was accepted.
- `acceptedPatterns[0]` is a symbolic label fallback, not necessarily a verified geometric constellation.
- Label any fallback state clearly and never present it as a confirmed constellation result.
- The current confidence formula is visually convenient but is not part of `RecognitionReport` and is not a calibrated probability.
- Strictly preserve current computed values unless logic changes are authorized.
- Better display wording is “RESIDUAL-DERIVED DISPLAY SCORE” or present residual directly instead of implying statistical confidence.
- If the reference requires confidence, define and validate the mapping separately with domain approval before retaining that label.
- Do not change the `confidenceScore` formula inside a presentation-only redesign.
- Preserve geometric fit as the raw residual/verification output, not a fabricated 98.3 percent match.
- The source’s 10-dot candidate bar is based on residual divided by 0.45; it is already a visual transform.
- Keep the dot bar if its scale is disclosed and it does not replace raw residual.
- The sample image has a separate symbol-match boolean; map to `dfaAccepted` and current status with truthful copy.
- Add a dark-sky comparison only when traced points and reference points are both available.
- Existing `RecognitionReport` alone does not include the reference point coordinates.
- Resolve the matched `patternId` from `bestMatch` and `REFERENCE_PATTERNS` to obtain `referencePoints`.
- Resolve traced coordinates from existing `tracedPoints` or selected stars using the same source transformations already used for recognition.
- Do not mutate or recalculate recognizer geometry in view code.
- Before creating a diagram, verify the store shape and the coordinate basis of traced points.
- The reference path must be dashed or otherwise distinct from the solid trace path in the legend.
- Keep the background canvas decorative and no interactive if an interaction would conflict with trace state.
- If reference geometry is unavailable, show a neutral empty state rather than an unrelated example diagram.
- The candidate comparison cards can replace the long table while retaining every report field currently exposed.
- Preserve full candidate list access, even if only first three cards are visible in the initial viewport.
- Preserve candidate order exactly as generated by the report unless source code establishes a sort.
- Keep the selected/best candidate treatment tied to `bestMatch.patternId`, not a hardcoded first row.
- Keep residual, rotation, scale, and verification badge available for every candidate.
- Keep the existing 10-dot visual encoding or replace it with a segmented bar only if both map the same documented residual scale.
- The DFA state traversal stepper currently uses `finalState` and synthesizes intermediate names as `s${i+1}`.
- That synthesized path is not evidence of actual per-symbol state transitions.
- Do not label synthesized states as actual traversal states.
- Use `simulationResult` if it contains exact transition trace data; verify its type before rendering a sequence.
- Otherwise retain the current final-state summary and input-symbol list instead of fabricating intermediate transitions.
- `RecognitionReport.quantizedSteps` is available and can support an encoded-symbol feature view.
- A matched-features matrix is not present in report data.
- Do not invent per-feature angle/distance errors from the example table.
- If a feature table is desired, derive each entry from actual quantized steps or geometry fields and name the metric precisely.
- Do not label a value observed/reference/error without both actual values and a defined error formula.
- The screenshot’s 97.6 and 98.3 are not report fixtures.
- Keep JSON export byte semantics and data fields intact; it currently exports the original report and traced IDs.
- Moving modal markup must not accidentally add local presentation values to the exported report.
- Keep focus management, close behavior, and scroll bounds when converting modal to page.
- Preserve Automata action’s `setSimulatorSymbols`, `setAutomataTab('simulator')`, and `setActiveView('automataLab')`.
- The result page should stay readable when geometric score arrays are long.
- Use a two-column upper and lower layout at wide widths and stack sections at narrow widths.
- At native 1586 by 992, keep the top verdict and comparison image roughly in a 1.8:1 width ratio.
- Place candidate comparison and technical diagnostics in the lower half as shown.
- Use the same persistent sidebar as the other three reference screens.
- Keep route navigation active while report is displayed.
- Ensure report content updates if the source recognition report changes, rather than keeping stale modal data.
- No local copy of the report should outlive the store's report identity.
- Ensure empty report behavior is explicit and navigation to Results is disabled or hidden when no report exists.
- This behavior is an implementation inference because the image shows only a populated report.

### Recognition result fixtures and checks

- Fixture S8-A loads a known successful report and verifies name, raw residual, rotation, scale, and verified status match the report.
- Fixture S8-B uses `VALID_PREFIX` and verifies no confirmed constellation name is shown as a full match.
- Fixture S8-C uses `SYMBOLIC_REJECT` and verifies explanation and no-candidate handling.
- Fixture S8-D uses `GEOMETRIC_REJECT` and verifies the UI shows DFA acceptance alongside geometric rejection.
- Fixture S8-E includes a null `bestMatch` and verifies all fallback copy remains explicit and non-confirming.
- Assert Results navigation is unavailable or explanatory when there is no recognition report.
- Assert Complete Trace opens the dedicated result state without altering the report.
- Assert close returns to Trace or the prior route as designed and preserves trace state.
- Assert JSON export includes the same timestamp, traced IDs, and recognition report fields as before.
- Assert Automata handoff sends the exact input symbol sequence to the simulator.
- Assert candidate rows are identified and selected by `patternId` and best-match linkage.
- Assert candidate ordering matches source order unless explicitly sorted upstream.
- Assert raw residual, rotation, scale, and verification are available for each row.
- Assert percentage labels are not called confidence unless their calibration is established.
- Assert no hardcoded Orion, 97.6%, 98.3%, angle, distance, or error values enter runtime output.
- Assert reference and trace geometry are omitted or labeled unavailable when either source is absent.
- Assert any overlay uses coordinate values already generated by existing logic.
- Assert no view code mutates recognition data to support its diagram.
- Assert any displayed traversal states correspond to actual `simulationResult` transitions.
- Assert intermediate DFA states are never synthesized and presented as real transitions.
- Assert feature matrix values come from real data with explicit metric definitions.
- Assert the candidate list is scrollable and all scores remain reachable.
- Assert the report page responds to report replacement and nulling in the store.
- Assert keyboard escape and close controls work if the modal form remains at mobile sizes.
- Assert screen reader labels distinguish status, raw residual, visual scale, and candidate identity.
- Capture at native 1586 by 992 and compare the two top panels, lower list, and diagnostic columns.
- These are proposed checks; this audit did not run them.

## Cross-screen layout contract and interaction map

- All four images share a persistent left rail and application plate.
- The reference rail is approximately 224 native pixels wide, converted from the displayed preview estimate.
- Do not normalize that measurement into a 244-pixel token without a separate observed shell constraint.
- A 244-pixel rail would be about 9% wider than the measured native reference rail.
- Do not hardcode the content coordinate x value independently in each component.
- Define shell tokens for rail width, content gap, page inset, and panel gap.
- Keep the header/brand block in a consistent rail position.
- Keep the same ordered destinations in all images where possible.
- Reference labels Overview, Sky Explorer, Trace, Patterns, Automata, Image Lab, Results, and Settings.
- Current source routes include sky, tonight, constellations, automataLab, hunt, imageLab, academic, and credits.
- The reference navigation omits Tonight, Hunt, Academic, and Credits.
- The source has no Settings route and no Results route.
- Reconcile these labels by mapping existing views into the rail and grouping secondary routes only if no view is dropped.
- Do not replace valid source routes with decorative destinations.
- Sky Explorer can map to the current live sky view.
- Patterns can map to `constellations` without renaming its state identifier.
- Trace can activate existing trace mode and route to sky or to a dedicated presentation state.
- Results can map only when a real recognition report exists.
- Settings cannot be made interactive without a corresponding settings behavior.
- Tonight can stay a first-class route in the rail even though the four supplied sidebars do not show it.
- Hunt, Academic, and Credits need explicit access in the final navigation architecture.
- A “More” group is one possible inference, not a source fact.
- If a More group is chosen, all routes must stay reachable by keyboard and pointer.
- Shared sidebar should show selected route through both a cobalt mark and a pale blue field.
- Avoid relying only on icon or color to communicate the active route.
- Main frame should retain sufficient interior margin so 12-pixel panel radii do not touch the viewport edge.
- Use 6–8 pixel gaps between cards where the reference visibly has tight bento spacing.
- Reference card borders are thin and low contrast.
- Avoid applying the global `overflow:hidden` shell to every page body if it prevents lower panels from scrolling.
- Each route should own its scroll region and preserve bottom actions at short heights.
- Reusable visual primitives can include stat tile, metadata label, dot track, mini topology, and side inspector.
- Component reuse must not merge independent source state into one global view-specific state.
- Route controls should preserve existing `setActiveView` and store state handlers.
- Do not move algorithms into UI wrappers to fit layouts.
- Do not change `src/automata/*`, `src/geometry/*`, `src/recognition/*`, `src/astronomy/*`, or `useAstroStore.ts` as a visual-only step.
- Existing callbacks and state ownership should be passed into presentation components where needed.
- If a view needs to show recognition, read the existing store report rather than creating a parallel score.
- If a view needs the selected constellation, use the current selected state or ID and resolve from source data.
- If a screen needs a time field, use the existing observation date rather than an independent date variable.
- Tests should compare pre-change and post-change outputs for those state transitions, not just CSS presence.
- Do not mark these four references fully implemented based on visual shell alone.
- Each screen has data-specific layout and interaction requirements above.

## Contradictions and inference register

- **The screenshot has a left sidebar; current source has a horizontal top header.** The root instruction now treats screenshots as layout authority. Adopt the shared persistent rail and move navigation/search/actions deliberately while retaining each action.
- **The reference rail has Results and Settings; current `ActiveView` does not.** Results can be a report state when data exists. Settings has no proven equivalent. Do not create inert navigation.
- **The reference rail omits Sky Tonight and several source routes.** Keep the source views reachable. A grouped menu is an implementation inference requiring a deliberate navigation design.
- **Sky Tonight references sunset and moon illumination; inspected component does not provide those metrics.** Search other project modules before omission. Never use screenshot values as data.
- **Sky Tonight shows 44 quarter-hour marks per constellation row; current visibility data is eleven hourly booleans.** The top time stepper has 44 selectable quanta in a different component region. Do not misrepresent the hourly array as quarter-hour observations.
- **Overnight sampling current code resets hour on the same observation date.** Correct midnight rollover only as a separately evaluated logic defect; strict visual-only work must not silently change this calculation.
- **Reference library has Favorites and category pills; current source has no favorite state and family-based filters.** Favorites require new persistence; preserve existing filters and do not fake support.
- **Reference library detail actions show Sky and Trace, while source also has Automata inspection.** Preserve the third action even if placed in a secondary control.
- **Reference trace view shows a timer; source has no session timer.** No elapsed duration is safe to display without a real start lifecycle.
- **Reference trace view shows percentage fit scores; report has raw residual and boolean verification.** Do not invent an engine metric. If a bar maps residual, label that transformation.
- **Reference trace view uses candidate selection; source report has no selected-candidate state beyond bestMatch.** Tie highlighting to bestMatch and do not introduce false selection semantics.
- **Reference recognition image uses confidence and feature-error values; source report does not contain calibrated confidence or matched-feature table.** Do not infer probability or error values from sample pixels.
- **Reference recognition image shows stepwise DFA states; current view synthesizes intermediate state labels.** That display is not proven to be the simulator’s actual path. Use actual trace data or do not show intermediate states as fact.
- **Reference outputs show different example constellations and fit values.** These are screenshot content examples, not fixtures to hardcode.
- **References have illustrations with connecting lines while the project contract bans continuous lines in charts.** Keep meaningful asterism topology edges; quantize progress and time/status visualization.
- **Reference shell has a blue textured outside desktop; approved shell token is a solid cool gray.** Treat the texture as art direction evidence only and avoid adding an unapproved asset.
- **Reference card dimensions depend on the native 1586 by 992 frame.** At other dimensions, reflow and scroll rather than crop to preserve the exact pictured placement.
- **The date in the reference is 2025-01-26 and sample sunset values are fixed.** Runtime must remain tied to the current selected observer/date.
- **Reference UI suggests page navigation for Trace and Results; current trace and result are overlays.** Move presentation placement only after defining one state transition path and preserving modal behavior where appropriate.
- **No current capture was taken.** All current-state comparisons here are source-code comparisons and should not be represented as pixel-level runtime mismatches.
- **No tests were run in this read-only audit.** The fixture lists are recommendations for implementation verification, not evidence of passing behavior.

## Implementation acceptance for this slice

- The four supplied screens all use the same persistent rail and same outer plate.
- Sky Tonight preserves observer, date, time stepping, search, filter, sort, and route handoffs.
- Sky Tonight visualizes visibility with discrete truthful samples and states the sample interval.
- Constellation Library preserves all 88 entries, current search/filter semantics, asterism geometry, and all existing actions.
- Constellation Library does not expose favorites until real state/persistence exists.
- Trace workspace preserves the current trace store, canvas events, recognition states, demos, geometry analysis, and Automata handoff.
- Trace workspace never labels an uncalibrated residual transform as engine confidence.
- Recognition result presentation preserves exported report content and the Automata simulator handoff.
- Recognition result presentation never fabricates intermediate DFA transitions or per-feature errors.
- Existing calculated values remain unchanged unless an independent defect fix is explicitly reviewed.
- The native 1586 by 992 composition aligns with the image bounds within practical raster differences.
- Smaller viewports retain every source action and permit scrolling.
- Test data comes from current project fixtures and real report shapes rather than screenshot sample text.
- All screen-specific checks above are executed by the implementation owner before reporting completion.
- No conclusion about passing tests or visual QA is made by this audit section.



<a id="implementation-9-12"></a>
# Late Reference Screens Audit

## Scope and evidence

- This note covers only filename ordinals 9 through 12 in `UI-REFENECE`.
- The screenshots are `ChatGPT Image Nov 11, 2026, 07_58_54 PM-7.png`.
- The second assigned screenshot is `ChatGPT Image Nov 11, 2026, 07_59_01 PM-8.png`.
- The third assigned screenshot is `ChatGPT Image Nov 11, 2026, 07_59_08 PM-9.png`.
- The fourth assigned screenshot is `ChatGPT Image Nov 11, 2026, 07_59_17 PM-10.png`.
- Directory inventory contains twelve PNG files in total.
- All four assigned screenshots have intrinsic dimensions of 1586 by 992 pixels.
- Intrinsic dimensions were read from each PNG image header, not inferred from the rendered preview.
- Horizontal rail seam coordinates were measured visually from the intrinsic image's left edge, with the app-frame inset accounted for when deriving rail widths.
- Seam measurements have medium confidence with estimated uncertainty of plus or minus three pixels. The app frame begins near x 34 in each image, so derived rail widths inherit that uncertainty.
- Pixel measurements are coordinates in the screenshot file, not browser CSS pixels.
- Browser device scale, viewport, zoom, and browser chrome are not available from PNG metadata.
- Reference dimensions therefore describe the provided images, not a required implementation viewport.
- Existing source anchors refer to the current read-only checkout at `C:\ommd3076\Proejcts\automata-theory`.
- The image review is visual and static, with no claim that screenshot numbers are genuine application output.
- Implementation recommendations preserve scientific truth and current calculations.
- A value shown by a mockup is a layout cue unless code or a reproducible fixture verifies its semantics.
- Work here does not modify the application, tests, or source checkout.
- The project-wide palette in `src/index.css` already matches the pale shell and cobalt instrument language.
- The strongest differences are screen composition and data semantics, rather than token color selection.
- Screen-specific recommendations below name the owner component and source anchor explicitly.
- Suggested fixtures use deterministic local data and must not be presented as live observation results.
- Where the mockup proposes unsupported measurements, show an unavailable state or implement a real computation.
- Do not fill unsupported panels with fabricated scientific data.
- Do not claim recognition precision, recall, or confidence unless an evaluation set and method exist.
- Screenshot values such as 98.3 percent are illustrative and are not supported by current recognition output.
- Cross-screen consistency should follow measured repetition, while visible per-screen deviations remain recorded.
- The shell recommendation uses the common palette and card language, not a forced identical grid for every screen.
- The parent audit should merge this note as a screen-specific evidence section.

## Shared design measurements across assigned screenshots

- The Patterns screen rail/content seam is near x 257 pixels from the PNG left edge. With the app frame beginning near x 34, the derived rail width is about 223 pixels, or 14.1 percent of the full PNG width.
- The Automata screen rail/content seam is near x 278 pixels from the PNG left edge. With the app frame beginning near x 34, the derived rail width is about 244 pixels, or 15.4 percent of the full PNG width.
- The Image Lab screen rail/content seam is near x 262 pixels from the PNG left edge. With the app frame beginning near x 34, the derived rail width is about 228 pixels, or 14.4 percent of the full PNG width.
- The Orion detail screen rail/content seam is near x 267 pixels from the PNG left edge. With the app frame beginning near x 34, the derived rail width is about 233 pixels, or 14.7 percent of the full PNG width.
- The derived rail widths span about 223 to 244 pixels, a difference of about 21 pixels.
- This spread is larger than the estimated three pixel measurement uncertainty.
- The 21 pixel rail-width difference is visible and should be reported as a genuine reference inconsistency.
- A practical shared rail token can begin near 235 CSS pixels at this reference size, within the observed 223 to 244 pixel range. This is a CSS sizing estimate inferred from image coordinates.
- Do not encode four separate arbitrary widths unless a live reference or interaction reveals a reason.
- The side rail background is near-white and visually separated from the pale work canvas by a subtle vertical seam.
- Navigation icons and labels use dark ink, with cobalt for the selected destination.
- The selected item has a soft blue rectangular fill and small corner or edge markers.
- The outer work area is a cool blue textured field visible around a large off-white application frame.
- The app frame occupies roughly x 34 through 1553 and y 45 through 950 in the first three screens.
- The Orion detail frame begins near x 34 and y 47, with the same rounded outer boundary.
- The outer textured blue material is more saturated than the project token palette.
- That blue material is a reference image background effect, not a required CSS gradient mesh.
- Preserve the project constraint against gradient meshes when implementing the actual interface.
- The main content background is white to cool off-white, with fine cool-gray borders.
- Cards are rounded rectangles with thin low-contrast outlines.
- The assigned screenshots use an almost white card surface rather than a visibly gray tray cavity.
- The project tokens define `--bg-shell: #ECEEF2`, `--bg-tray: #E2E5EC`, and `--bg-card: #F5F6F8`.
- These tokens remain compatible, though the screenshots render the surface separation more subtly.
- Use cobalt near `#1D55F5` for selected controls, data points, graph nodes, and primary actions.
- The screenshots use bright royal blue close to cobalt rather than multiple unrelated signal colors.
- Most typography is uppercase or technical monospace, with more generous display numerals on metric tiles.
- Existing project fonts and token declarations are in `src/index.css` lines 3 through 63.
- Shared outer-shell classes are in `src/App.css` lines 76 through 103.
- Shared global header placement is in `src/App.tsx` lines 21 through 26.
- Shared route navigation is currently a top strip implemented by `HeaderNav.tsx` lines 74 through 90 and 219 onward.
- That global top strip is structurally different from the left rail repeated by all four references.
- Any global navigation overhaul belongs to `HeaderNav.tsx` and `App.tsx`, not individual feature screens.
- Per-screen card hierarchy belongs to the feature owner named in each section.
- At narrow viewports, a persistent 235 pixel rail could consume too much of the app frame.
- Collapse the rail to an icon strip or drawer below a documented responsive breakpoint.
- Keep the destination labels available to assistive technology when the rail is compact.
- Preserve keyboard focus visibility when the active state uses only a pale-blue background.
- The visible screenshots show no phone layout, so mobile behavior remains an implementation inference.
- Preserve existing keyboard and control behavior while changing only presentation and component composition.

## Screenshot 9: Pattern analysis dashboard

### Reference composition

- Source file: `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_58_54 PM-7.png`.
- Intrinsic image size: 1586 by 992 pixels.
- Left rail/content seam: approximately x 257 pixels from the PNG left edge, medium confidence. With the frame starting near x 34, derived rail width is about 223 pixels.
- The top metric strip begins near x 258 and y 59.
- Six compact metric cards span the upper content region.
- Their labels are Pattern Analysis, Traced Points, Normalized Points, Encoded Symbols, Top Match, and Match Score.
- The first KPI shows a completion state rather than a numeric value.
- The remaining cards show 12 traced points, 12 normalized points, 22 encoded symbols, Orion, and 98.3 percent.
- These exact values describe the image only and are not verified application state.
- The body uses three adjacent cards with unequal widths.
- Input Geometry occupies the left card from about x 259 to 521.
- Analysis: Normalization occupies the center card from about x 530 to 1087.
- Feature tables occupy the right region from about x 1097 to 1543.
- The input diagram uses a light dotted grid, small cobalt nodes, and thin gray connecting lines.
- The center comparison presents a traced shape, a right-pointing transformation arrow, and a normalized shape.
- The two diagrams are placed side by side in one card, with raw and canonical captions below.
- Angle Features and Length Features are stacked in separate tables in the right column.
- Each table shows a compact two-panel list of twelve entries.
- The angle table names index, angle, and delta angle columns.
- The length table names index, normalized edge length, and a ratio column.
- A symbol sequence panel spans the lower left and displays symbol tokens as outlined or selected pills.
- Angle Distribution and Length Distribution occupy two small lower cards to its right.
- Both distributions use discrete blue dots rather than a connecting line.
- Candidate Pattern Comparisons occupy nearly the full bottom width.
- The candidate table shows five rows with constellation, match score, three similarity bars, and residual columns.
- The first candidate row is selected using a pale-blue row background.
- The cards have white surfaces, subtle borders, rounded corners, and compact internal spacing.
- The active navigation item is PATTERNS in cobalt on a light-blue background.
- No tooltip, hover, filter, or expanded state can be inferred from this static image.

### Current source mapping and limits

- The actual entry point for trace analysis is `TraceHud.tsx`.
- `TraceHud.tsx` lines 5 through 18 read the current trace and report from the shared store.
- `TraceHud.tsx` lines 31 through 39 derives a point count and opens the automata workflow.
- The analysis modal is `PatternAnalysisModal.tsx`.
- `PatternAnalysisModal.tsx` lines 11 through 16 reads traced points and computes normalization and encoding.
- `PatternAnalysisModal.tsx` lines 28 through 38 aggregates left, straight, right, and distance-category counts.
- Its current component begins its modal composition at line 45.
- It computes normalized coordinates using the geometry module rather than showing a separately scored model.
- The recognition implementation is `src/recognition/matcher.ts` lines 14 through 18.
- It simulates symbolic input against the DFA and evaluates geometric Procrustes residuals.
- Candidate score generation and ordering occur in matcher lines 69 through 98.
- A full verified geometric result is returned through matcher lines 102 through 114.
- The only documented geometric threshold is `PROCRUSTES_RESIDUAL_THRESHOLD` in `src/geometry/similarity.ts` line 4.
- The project does not define independent angle-similarity, length-similarity, or symbol-similarity percentages.
- Therefore, the three percentage bars in the reference cannot be copied as computed output.
- The current `App.tsx` has no `patterns` active view branch at lines 28 through 58.
- `HeaderNav.tsx` navigation entries at lines 74 through 90 have no PATTERNS destination.
- This screen must not be implemented by relabeling the 88-constellation catalog.
- The constellation catalog owner is `ConstellationExplorer.tsx`, while trace geometry owner is `PatternAnalysisModal.tsx`.
- The Pattern Analysis dashboard belongs to the trace feature and its trace-derived data.
- If promoted to a first-class nav item, add a distinct active view and compose a trace-pattern screen.
- If first-class navigation is out of scope, retain the existing Pattern Analysis modal entry and adapt its internal composition.
- That route decision should be explicit before implementation because the reference depicts persistent global navigation.
- Do not create a second source of truth for trace points, encoded symbols, or recognition report.
- Read all point and recognition state from the existing store or existing modal inputs.
- No source evidence supports 22 symbols from 12 points without the exact encoded sequence and rules.
- For a polyline with twelve points, the number of segments is normally eleven.
- The encoded symbol count depends on the encoder and should be rendered from `encoded.symbols.length`.
- This mismatch is a reference data inconsistency, not proof of a production bug.
- `PatternAnalysisModal.tsx` already computes the normalized geometry and symbols needed for honest metric cards.
- Its existing trace modal likely lacks space for the entire reference dashboard at smaller viewport heights.
- The reference screen appears to be a full page rather than a constrained dialog.
- A modal-only implementation should use responsive scroll with a clear title and no nested horizontal overflow.

### Required implementation tasks

- Build a trace-pattern analysis surface owned by the trace-mode feature. Reuse the existing normalized point list and encoded sequence from `PatternAnalysisModal.tsx`.
- Keep the shared geometry functions untouched. Keep the recognition matcher and DFA generation untouched.
- Use a top KPI row with completion state, actual traced-point count, actual normalized-point count, actual encoded-symbol count, best candidate, and verified residual. Render unavailable states when there is no completed recognition report.
- Display a match score only if a defined calibrated score is added to the recognition contract. If no calibrated score exists, label the measured residual with its real unit and threshold.
- Use the screenshot's input and canonical shape cards as the dominant main-row panels. Use the existing normalized data for the canonical points and the same traced points for the raw plot.
- Draw both plots in SVG or canvas with a matching viewBox and equal geometric aspect ratio. Apply one shared fitting transform per plot and preserve the actual shape orientation rules.
- Show the centroid and scale metadata only when those values exist in the normalization result. Make the transformation arrow decorative and hide it from assistive technology.
- Use the actual ordered trace for edges; do not invent extra closure segments. Render turn-angle rows from computed turn features, preserving signed versus unsigned conventions.
- Render edge-length rows from actual normalized distances, with explicit indexing and units. Do not silently substitute a different definition of angle delta to fill the table.
- State the chosen distance normalization in a visible header or accessible table caption. Show an em dash with a reason for empty or undefined features.
- Use the actual encoded string and allow horizontal scrolling or wrapping without clipping. Build angle and distance distributions from the arrays already used by the encoder.
- Use count or density scales with labeled axes, not decorative values. Preserve zero bins when doing so clarifies the category range.
- Use individual dots or dot stacks to honor the discrete visual system. Do not connect distribution points with continuous spline lines.
- Build candidate rows only from `recognitionReport.geometricScores` or the authoritative equivalent. Match each candidate row to its verified candidate identity and its actual residual.
- Do not display unimplemented similarity channels as if they were computed. If sub-similarity metrics are added, document the exact formula and verify that weights sum to the intended score.
- Highlight the actual best match, not a hard-coded Orion row. Display “NO MATCH” or “PREFIX” accurately when the report status is not a full verified match.
- Preserve the current action that opens the selected encoded sequence in the automata simulator. Do not duplicate the simulator's state or playback clock inside the dashboard.
- Retain the existing close action if the surface remains a modal. Keep focus within the modal while it is open and restore focus to its opener when closed.
- If promoted to a page, keep active trace state in the store when navigating to the screen and back. Align table headers and numeric values using tabular figures where available.
- Use blue to identify the active candidate and not to imply statistical certainty. Use subtle card dividers; do not draw high-contrast borders around every cell.
- Maintain a 6 to 8 pixel card gutter, close to the screenshot's tight arrangement. At 1586 pixels, use a three-column main row with a wider normalization panel.
- At narrower widths, stack the input plot and normalized plot before feature tables. At narrow widths, move the feature table below the plots and allow independent vertical scrolling.
- At short heights, allow the full page or modal to scroll rather than hiding the candidate table. Give SVG plots a minimum readable size so point labels remain distinguishable.
- Preserve 4.5:1 text contrast for small gray captions and table content. Use semantic headings for each metric and panel rather than styling generic divs as headings.
- Expose metric values and chart descriptions to screen readers. Mark decorative grid dots and transformation arrows as hidden from assistive technology.
- Keep keyboard access to candidate rows and simulator actions. A selected row must have a visible focus ring distinct from its selected background.

### Fixtures and verification for screenshot 9

- Use a deterministic fixture containing at least five points with unequal segment lengths. Choose a point sequence with both left and right turns to validate signed direction handling.
- Include a two-point trace fixture with zero turn angles. Include a one-point trace fixture with no edge-length entries.
- Include an empty trace fixture with all metrics unavailable. Include a known constellation trace fixture whose encoded symbols are derived by the actual encoder.
- Include a perturbed point fixture that produces a non-zero Procrustes residual. Include a translated and scaled copy of the same fixture to verify normalization invariance.
- Include a rotated copy if the current normalization contract claims rotation invariance. Assert the displayed traced count equals the fixture point count.
- Assert normalized point count equals the normalized output count. Assert encoded sequence count equals the encoder's actual symbol count.
- Assert candidate ordering matches the recognition report's residual ordering. Assert a candidate is marked verified only when the matcher says it is verified.
- Assert an empty report never displays a percentage copied from the reference image. Assert all numeric labels are derived from the fixture and not hard-coded.
- Assert the raw and normalized plots preserve point order and number of edges. Assert one-point and two-point edge cases render without NaN or an exception.
- Assert a zero or undefined scale uses an explicit fallback state. Assert tables expose captions and column headers to accessibility queries.
- Assert the dashboard can be scrolled to the candidate table at a short viewport height. Use a visual fixture screenshot at the reference's 1586 by 992 dimensions for card hierarchy only.
- Use a second visual fixture at a narrow viewport to catch clipping and inaccessible horizontal scrolling. A visual comparison may assert card ratios and alignment, not reference placeholder values.
- If browser automation is unavailable, keep these as component-level or DOM-render checks in the existing test stack. Do not report test execution from this audit; these are proposed acceptance checks.

## Screenshot 10: Automata Lab DFA dashboard

### Reference composition

- Source file: `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_59_01 PM-8.png`.
- Intrinsic image size: 1586 by 992 pixels.
- Left rail/content seam: approximately x 278 pixels from the PNG left edge, medium confidence. With the frame starting near x 34, derived rail width is about 244 pixels.
- The top strip contains four broad metric cards.
- Their labels are Pattern Count, Alphabet Size, DFA States, and Minimized States.
- The displayed values are 312, 2, 6, and 3.
- Those values are illustrative until they agree with live project data.
- The center body has a wide automaton graph card and a formal definition card.
- The graph card occupies about 61 percent of the body width.
- The formal definition card occupies about 30 percent, separated by a narrow gutter.
- The graph uses circular states, directional edges, loop arcs, and symbol labels.
- The initial state has a left-entry arrow.
- The accepting state is cobalt-filled with an outer double ring.
- Intermediate states use white or pale-blue fill with cobalt outlines.
- A top rocker switches between NFA, DFA, and Minimized views.
- Reset and expand icons appear beside the rocker.
- The formal definition is shown as a formula plus rows for Q, alphabet, delta, start state, and final states.
- A lower row places a transition table on the left and a string simulator on the right.
- The transition table exposes one state per row and one input symbol per column.
- The simulator has a text field, run action, step controls, and a trace of visited states.
- The final result shows accept or reject, terminal state, and step count.
- The screenshot reports sample input `010110`, but no source fixture proves that exact string belongs here.
- The footer-like lower layout remains inside the app canvas with a consistent card rhythm.
- The app navigation labels the destination AUTOMATA.
- No responsive or intermediate interaction state is shown.

### Current source mapping and truth boundary

- Global route dispatch to the automata lab is in `src/App.tsx` line 46.
- The current lab top strip and sub-navigation are in `AutomataLab.tsx` lines 14 through 90.
- The current lab exposes eight separate tabs rather than the three-panel graph/table/simulator dashboard.
- The tab definitions at `AutomataLab.tsx` lines 16 through 27 include NFA, closure, subset, DFA, minimized DFA, simulator, formal tuple, and transition table.
- The rendered active tab branches are at `AutomataLab.tsx` lines 82 through 89.
- The project already calculates the NFA, determinized DFA, and minimized DFA in `src/data/astroData.ts` lines 18 through 30.
- The DFA visualization owner is `src/features/automataLab/DfaView.tsx`.
- `DfaView.tsx` lines 9 through 43 groups DFA states by graph distance from the initial state.
- `DfaView.tsx` lines 57 through 82 renders an overview and a three-column state navigator/inspector layout.
- `DfaView.tsx` is not currently an edge-drawn SVG automaton graph.
- The formal tuple owner is `FormalDefinitionView.tsx`.
- The transition matrix owner is `TransitionTableView.tsx` lines 5 through 10 and 38 onward.
- The simulator owner is `SimulatorView.tsx` lines 6 through 30.
- `SimulatorView.tsx` lines 44 through 54 owns playback progression and cleanup.
- Its transition result and interaction controls are separate from `DfaView`.
- The active machine used by the simulator is the minimized DFA at `SimulatorView.tsx` line 30.
- `TransitionTableView.tsx` can select minimized or original DFA at lines 10 and 47 through 63.
- `FormalDefinitionView.tsx` derives state and transition counts from actual machines at lines 163 through 174.
- The graph in the screenshot appears to have five states named Q0, Q1, Q2, Q3, and Q5.
- The metric says six DFA states and three minimized states.
- The project-generated state IDs and state counts must be inspected at runtime before using these labels.
- Do not assume the screenshot's state labels, transition graph, or numeric counts match `DFA_MACHINE`.
- The screenshot's “Pattern Count 312” may refer to catalog patterns, traversals, generated sequences, or another source.
- Existing source has reference patterns in `astroData.ts`, but no evidence establishes a count of 312 in this screen.
- The alphabet size should be derived from the active machine's alphabet, not fixed to 2.
- A graph edge drawing must include every transition exactly once or visibly combine duplicate transitions.
- Missing transitions must be handled according to the actual DFA completion semantics.
- The minimization count must match `MINIMIZED_DFA_MACHINE.states.length`.
- No additional automata algorithm changes are required to implement this screen.
- Existing tabs remain useful for teaching closure, subset construction, and formal details.
- A single dashboard can be an additional overview, with the existing detailed tabs retained.
- That overview belongs to `AutomataLab.tsx` composition, and graph rendering belongs to `DfaView.tsx` or a graph child component.
- Do not place constellation recognition candidate logic in the automata view.
- Do not make the automata dashboard the owner of general app navigation.

### Required implementation tasks

- Create a DFA overview composition within `AutomataLab` while retaining the current detailed learning tabs. Use a clear name such as “DFA Overview” so it is not confused with the existing DFA matrix tab.
- Let the active machine selection be explicit and shared across graph, table, and simulator. Default to the generated DFA or minimized DFA and visibly label which one is active.
- Compute the four summary cards from live machines and patterns. Replace the screenshot's unverified pattern count with a count whose definition is written in the UI.
- Display alphabet size from the selected machine's alphabet length. Display state count from the selected machine's state list.
- Display minimized state count from the minimized machine's actual state list. Display a comparison only when both machines correspond to the same input pattern set.
- Draw the automaton graph from the selected machine's transitions and states. Use SVG marker definitions for directional arrows and unique IDs per component instance.
- Use curved paths for self-loops and for transitions whose endpoints are already connected. Keep edge hit targets wide enough for pointer selection without widening the visible stroke.
- Label each edge with the actual alphabet symbol. Use a consistent deterministic graph layout with adequate space between state circles.
- Identify the start state with an entry arrow and text or accessible description. Identify accepting states with a double ring or equivalent shape and a text label.
- Do not use cobalt fill alone to encode acceptance because the current state can also be selected. Distinguish selected, current-simulation, initial, and accepting states with independent visual cues.
- Keep graph controls reachable by keyboard if they modify machine selection or expand the graph. If reset is shown, define whether it resets the simulator, graph pan, or selected machine.
- If expand is shown, make it enter a genuine full-screen graph mode and restore focus on exit. Keep graph state read-only; transitions remain defined by the generated automaton.
- Render formal tuple values from the same selected machine used by the graph. Use the actual Q, Σ, δ, q0, and F data in the formal card.
- Provide overflow handling for large state and alphabet sets. Render the transition table from that same selected machine.
- Keep row and column headings sticky only if scrolling would otherwise lose context. Include a blank or sink state when the selected machine's total transition function requires it.
- Make state and symbol names visible and exact, not truncated beyond recovery. Let a table state selection focus the matching graph node.
- Let a graph node selection focus or scroll to the matching table row. Reuse the existing simulator behavior or extract a presentation-neutral simulator child.
- Avoid mounting two simulators with separate timers on the overview and simulator tab. Keep one source of truth for simulator input, current step, playing state, and speed.
- A sample string must be stored as a named fixture and shown as sample input. Use explicit input validation for symbols outside the active alphabet.
- Show a clear invalid-input result without silently deleting unrecognized characters. Keep run, previous, next, reset, and step-mode controls functional.
- Respect bounds at step zero and at total input length. Show the sequence of input symbols and states consumed from the active machine's actual trace.
- Derive acceptance, final state, and step count from the simulator result. Keep the overview usable when the machine has many states or transitions.
- At the reference width, use a two-column graph/formal layout and a lower table/simulator row. Give the graph about twice the width of the formal definition panel.
- At narrow widths, stack graph, formal definition, transition table, then simulator. Allow vertical scrolling of the dashboard rather than forcing the whole four-panel view into a short screen.
- Keep card padding and gaps consistent with the global six-pixel tray system. Use 12-pixel card rounding and thin outlines consistent with the existing bento utilities.
- Retain dot-matrix display numerals only for actual metrics or selected state IDs. Keep formula text readable and do not turn the whole formal definition into a decorative image.
- Provide state names as actual text in SVG, not only as a color or path shape. Use `<title>` and accessible descriptions for the graph and its edges.
- Ensure minimum text sizes remain readable, especially table values around 11 to 12 pixels. Use a visible focus indicator for graph nodes, table controls, and simulator actions.
- Preserve every existing educational tab and its current transition logic. Keep the route `automataLab` and existing store field names intact unless an explicit architecture change is approved.

### Fixtures and verification for screenshot 10

- Use the generated `DFA_MACHINE` as the primary dashboard fixture. Use `MINIMIZED_DFA_MACHINE` as the second machine fixture.
- Include a tiny deterministic DFA fixture with two symbols and at least one accepting state. Include a self-loop edge in the fixture.
- Include two transitions between the same state pair with different symbols. Include at least one unreachable state if the project supports it, to test graph layout behavior.
- Include an empty alphabet or invalid machine fixture only if the domain permits it. Include a valid sample string with a known accepting outcome.
- Include a valid sample string with a known rejecting outcome. Include an invalid symbol string to verify explicit validation.
- Assert the metric cards match the active machine and pattern fixture counts. Assert the graph has one node per state and one edge per transition.
- Assert self-loops and duplicate-endpoint transitions remain individually labeled. Assert initial and accepting state markings agree with the machine metadata.
- Assert table cells map to the same transition targets as the graph edges. Assert formal tuple Q, Σ, q0, and F values match the selected machine.
- Assert changing the selected machine updates graph, table, and formal definition together. Assert simulator acceptance and final state agree with `simulateDfa` for each fixture input.
- Assert previous and next controls cannot move beyond the valid step range. Assert unmounting or switching away stops simulator playback timers.
- Assert unknown symbols are rejected clearly and do not produce false acceptance. Add a visual fixture at 1586 by 992 with a stable deterministic graph layout.
- Add a small viewport fixture to verify the four panels stack without content clipping. Compare graph layout and panel proportions, not the screenshot's hard-coded 312/6/3 values.
- Do not claim these checks ran as part of this read-only section.

## Screenshot 11: Image Lab detection workspace

### Reference composition

- Source file: `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_59_08 PM-9.png`.
- Intrinsic image size: 1586 by 992 pixels.
- Left rail/content seam: approximately x 262 pixels from the PNG left edge, medium confidence. With the frame starting near x 34, derived rail width is about 228 pixels.
- The top row has four metric tiles: Image Size, Detected Stars, Detection Rate, and Recognition Preview.
- Displayed values include 4096 by 2731, 1,264 detected stars, 96.7 percent, and Orion at 98.3 percent confidence.
- None of the percentage claims is supported by the current source.
- The middle workspace has three columns.
- The left column contains upload and preprocessing cards.
- The center column is a large original/detected image preview.
- The right column contains star-detection metrics, threshold settings, and manual correction tools.
- The center preview has a 16:9-like panel area with the image contained inside a dark surface.
- Detected stars are visible as cobalt circles over the image.
- Original and Detected are two mutually exclusive preview modes.
- Upload presents an outlined drop target and a file metadata row.
- Preprocessing exposes Debayer and Background mode toggles plus Denoise, Contrast, Sharpen, and Normalize controls.
- The threshold panel shows a histogram with a vertical threshold marker and a numeric threshold.
- The manual-correction row shows selection, add, remove, region, and delete-like tools.
- The footer presents a pipeline from upload through detection, point editing, trace, and recognition.
- The shown filename is `ORION_RAW.FITS` with an image size and file size.
- The control surface therefore implies real FITS support, but that support is not present in the inspected source.
- The reference indicates a detection pipeline and a match preview as separate stages.
- Its confidence and detection-rate percentages appear to be unsupported illustrative numbers.
- The visual language uses a dark image viewport while the rest of the cards remain pale.
- The image itself is astrophotography, not the source's deterministic simple sample image.
- The reference's 1264 points and screenshot's Orion shape are not evidence that the app has detected those points.
- No browse or user interaction state is visible in the static screenshot.

### Current source mapping and behavior

- The owner is `src/features/imageLab/ImageLab.tsx`.
- Initial threshold is a luminance value of 180 at line 13.
- Initial preprocessing state and its controls are declared at lines 18 through 27.
- The sample image generator begins at line 32.
- It generates an 800 by 600 synthetic star field at lines 33 through 43.
- It places a Cassiopeia W asterism at lines 45 through 53.
- It adds random faint background points with `Math.random()` at lines 54 through 63.
- It adds generated bright gradients at lines 65 through 75.
- The random sample means repeated sample runs do not create an identical detection fixture.
- Local image upload begins at line 88.
- The file validation accepts any MIME type starting with `image/` at lines 92 through 95.
- The file picker markup is at lines 327 through 330.
- Its `accept` value is limited to `image/png, image/jpeg` at line 330.
- Therefore the label “UPLOAD FITS / IMAGE” overstates the supported file formats.
- The current implementation loads an HTML image with `FileReader`, not an FITS decoder.
- Canvas dimensions are set from the decoded image at lines 118 through 120.
- Image pixel data is read back at lines 121 through 128.
- Grayscale luminance is calculated with a standard weighted RGB sum at lines 130 through 144.
- The current contrast transformation is applied at lines 138 through 142.
- The histogram is accumulated into 24 bins over luminance 50 to 240 at lines 146 through 153.
- Detection scans pixel coordinates on a three-pixel grid and uses radius-eight local maxima at lines 155 through 180.
- A candidate is retained when its luminance reaches the current threshold at lines 159 through 177.
- Detected points are stored at line 182.
- Cobalt corner reticles are drawn over detections beginning at line 184.
- `ImageLab.tsx` threshold controls display the raw 50-to-240 scale around lines 482 through 580.
- The image preview canvas is rendered around lines 589 through 596.
- The trace controls and recognition report are rendered around lines 599 through 704.
- The empty state offers a sample loader at lines 711 through 724.
- Current preprocessing state includes denoise, contrast, sharpen, debayer, and background subtraction.
- In the observed detection loop, contrast affects luminance; the other named options require careful source confirmation before implying they alter pixels.
- A real preview mode must distinguish source pixels from detection-overlay rendering.
- Current `RecognitionReport` provides formal match status, candidate score/residual details, and symbols.
- It does not provide calibrated confidence percentages or precision/recall statistics.
- Precision, recall, F1, and detection rate require labeled ground truth and a defined evaluation method.
- Do not rename residual or heuristic scores to “confidence.”
- The screenshot's threshold value `0.64` does not match the current raw 8-bit luminance threshold.
- A displayed normalized threshold may be a valid presentation mapping if it is explicitly reversible.
- A normalized value in `[0,1]` can map to luminance via a documented conversion such as `round(value * 255)`.
- Such mapping must preserve min/max, keyboard increment behavior, histogram marker location, and threshold comparison semantics.
- Prefer retaining the established luminance domain internally and deriving the normalized label from it.
- Do not change detector behavior solely to imitate the reference's 0.64 format.
- A matching control can display both `0.64` and `163 / 255` to preserve semantic clarity.
- If the code instead adopts a normalized state, test inverse conversion and exact endpoint behavior.

### Required implementation tasks

- Compose the existing image-lab state into a left upload/preprocess column, central preview, and right detection control column. Keep existing detection, trace, and recognition algorithms unchanged unless separately authorized.
- Add a top KPI strip derived from the current uploaded image, detections, and report. Show actual source width and height after image decode.
- Show actual file name and byte size from the selected `File` object. Show detected point count from `detectedStars.length`.
- Remove “detection rate” unless it is computed against labeled ground truth. Remove “precision,” “recall,” and “F1” unless an evaluation dataset and pipeline produce them.
- Show recognition status and actual residual or score fields from the matcher contract. Label a heuristic residual as residual and describe its threshold.
- Never render Orion or another constellation before the current recognition result identifies it. Add a semantic upload dropzone while keeping the file input reachable by keyboard.
- Match the `accept` attribute to actually supported PNG and JPEG formats. Change the UI label to exclude FITS until a FITS parser is implemented.
- If FITS is a hard requirement, add a decoder as a separate explicit feature and document its supported BITPIX/axes/scaling behavior. Do not treat a FITS file as an image MIME type or feed raw FITS bytes to `Image`.
- Preserve error feedback for unsupported formats and failed decoding. Handle large images without blocking the interface or exhausting the canvas memory budget.
- Keep image dimensions and file size available after selection. Make detected and original modes actual stateful preview modes.
- The original view must render the unmodified decoded input without detection overlays. The detected view must render that same input with the currently detected points.
- Do not use the screenshot's Orion sample image as the app's default real-data claim. Use the existing generated Cassiopeia image as a clearly labeled synthetic sample unless a curated fixture is added.
- Seed the sample generator so a visual fixture and detection count remain deterministic. Keep generated sample imagery visibly labeled as synthetic.
- Implement the threshold indicator against the same luminance histogram bins used by the detector. Provide accessible numeric threshold input in addition to a graphical histogram interaction.
- If showing a normalized threshold, define the range and conversion beside the value. Keep threshold bounds synchronized across click bins, steppers, presets, and text entry.
- Prevent repeated button actions from producing out-of-range values. Preserve the existing 50 to 240 supported range unless product requirements redefine it.
- Ensure histogram axis labels represent actual values, with zero or clipping behavior documented. Explain that a point is a sampled local maximum, not a confirmed astronomical star.
- Keep dot markers centered on source-image coordinates under scaling and letterboxing. Map screen clicks back to source image coordinates using the rendered image rectangle and scale.
- Respect device pixel ratio when rendering overlays to canvas. Prevent image-fit resizing from shifting manual trace clicks away from displayed stars.
- For manual add/remove tools, implement actual hit testing and visible tool state before exposing them. If manual-correction actions are not implemented, omit or disable them with a reason.
- Do not add controls that look active while having no event behavior. Keep traced points in source image coordinates until the existing geometry API is called.
- Keep the recognition report connected to the current traced points and detection set. Changing the image must clear stale detections, trace points, and recognition report.
- Changing threshold must recompute detections and should clear or update any trace whose points no longer exist. Keep the score/recognition card synchronized with the latest report state.
- Convert preprocessing controls to compact discrete hardware-style controls while retaining exact values. Do not imply that denoise, sharpen, debayer, background subtraction, or normalization alter preview pixels unless they actually do.
- If an option is currently state-only, either implement the operation or label it as a reserved setting. Keep the preview as the dominant area at desktop width.
- Preserve minimum 360 pixel viewport height only where it does not force controls below an inaccessible scroll region. At desktop width, allocate approximately 22 percent to controls, 43 percent to preview, and 22 percent to metrics, with gutters.
- The remaining width is consumed by margins and spacing. At narrower widths, put the preview first, then controls, then report metrics.
- Keep upload and threshold controls visible without horizontal page scrolling. Place pipeline steps in a footer row only when each step's completed/current state comes from actual app state.
- A pipeline step should navigate or focus its real stage, not merely decorate the page. Use accessible names for image preview modes, threshold controls, and correction tools.
- Include text summaries for detection results instead of relying only on blue circles. Provide alternative access to point coordinates when an image is not perceivable.
- Maintain the dark image viewport token, but avoid introducing a different accent color for detection points. Avoid smoothing over missing detections with additional decorative stars.

### Fixtures and verification for screenshot 11

- Create a small deterministic PNG fixture with known dimensions and known pixel luminance values. Include one isolated local maximum above threshold.
- Include one isolated local maximum below threshold. Include two close bright pixels to test the non-maximum suppression radius.
- Include a uniform gray image to test the empty-detection case. Include a bright border to verify the radius exclusion near image edges.
- Include a transparent PNG to establish alpha compositing behavior. Include a JPEG fixture with expected tolerance rather than exact raw pixel equality.
- Include an invalid text file renamed with a `.png` extension to verify decode failure. Include a file above the supported size limit if one is introduced.
- Seed the synthetic Cassiopeia generator or replace randomness with a fixed fixture. Assert the file picker and validation agree on PNG/JPEG support.
- Assert FITS is not presented as accepted while no FITS decoder exists. Assert a successful decode displays actual dimensions, name, and byte size.
- Assert a failure shows a visible error and leaves no stale result presented as current. Assert normalized threshold conversion round-trips every allowed luminance integer.
- Assert threshold minimum and maximum are enforced identically by every control. Assert detection counts change correctly at the threshold boundary.
- Assert histogram totals and threshold marker align with the actual pixel data. Assert original mode has no cobalt detection markers.
- Assert detected mode overlays only the current detector outputs. Assert resizing and letterboxing preserve coordinate mapping for click tracing.
- Assert image replacement clears prior trace and recognition state. Assert manual-correction controls invoke real actions or are not rendered as active.
- Assert no detection percentage is displayed without a labeled ground-truth denominator. Assert no confidence number is created from a residual without calibration.
- Assert actual matcher output controls the recognized constellation label. Add visual fixtures for empty, loaded, detected, and recognition-result states.
- Compare panel proportions, dominant preview, and control hierarchy, not placeholder metrics. Include a narrow viewport fixture to test order, scrolling, and readable controls.
- Treat performance checks for large image processing as separate from static presentation snapshots. These checks are acceptance recommendations and have not been executed by this audit.

## Screenshot 12: Orion constellation detail

### Reference composition

- Source file: `UI-REFENECE/ChatGPT Image Nov 11, 2026, 07_59_17 PM-10.png`.
- Intrinsic image size: 1586 by 992 pixels.
- Left rail/content seam: approximately x 267 pixels from the PNG left edge, medium confidence. With the frame starting near x 34, derived rail width is about 233 pixels.
- The top header includes a back button and CONSTELLATION DETAILS title.
- A broad summary row shows Orion, abbreviation ORI, type, area, rank, and magnitude range.
- The screenshot labels the type as constellation.
- Its displayed area is 594 square degrees.
- Its rank is 26 of 88.
- Its magnitude range is -0.7 to 5.4.
- These values must be checked against catalog definitions before reuse.
- A pair of actions on the top right opens the object in the sky or starts a trace.
- The main content begins with three aligned columns.
- The left column is a large constellation diagram.
- The center column is a notable-stars table.
- The right column is a sky preview card.
- The diagram plots cobalt star points on a pale dotted grid and connects asterism segments.
- Betelgeuse and Rigel have labels and emphasized rings.
- The diagram is a distinct catalog figure visualization, not a detector output.
- The notable-star table has star name, type, and magnitude columns.
- The sky preview is a dark photographic-looking panel with a connected line overlay.
- The next row places a seasonal visibility matrix on the left and best viewing months on the right.
- A night-visibility chart displays a dotted curve across 18:00 to 04:00.
- The chart axes show percentages from 0 to 100 and local time labels.
- The bottom row has metadata on the left and observation summary on the right.
- Metadata includes name, abbreviation, area, rank, and family.
- Observation summary displays current visibility, next best window, and peak altitude.
- The screenshot says current visibility HIGH, next window 21:00 to 01:30, and peak altitude 73 degrees.
- The selected rail item is SKY EXPLORER rather than a separate detail destination.
- The composition suggests an in-app detail route or page state entered from the explorer.
- The screenshot is coherent as a single selected-object view.
- Static placeholder values do not establish current location, date, timezone, or season conventions.

### Current source mapping and contradictions

- Constellation catalog owner is `src/features/constellationExplorer/ConstellationExplorer.tsx`.
- The screen's selected-object state is declared at line 121.
- Selected constellation season and current horizontal coordinates are derived at lines 250 and 251.
- The detail modal begins at line 420.
- The modal currently renders a large title, identifiers, descriptive labels, diagram, and actions.
- The modal's diagram data is built from `starIds`, `lineSegments`, and star coordinates at lines 181 through 248.
- The geometry uses a fixed 460 by 240 SVG coordinate system at lines 207 through 209.
- Notable-star data can be obtained from the existing `STARS` and `STAR_BY_ID` catalog.
- The constellation type structure is not present as a separate typed field in `IAUConstellation`.
- The type shown by the screenshot can therefore be generic display text, not a catalog-derived category.
- `src/types/astronomy.ts` lines 31 through 39 define constellation identity, area, center, brightest star, family, polylines, and star IDs.
- The type also includes connected line segments, but no explicit ranking, magnitude range, seasonal curve, or observing window.
- The stellar catalog type in `astronomy.ts` lines 5 through 18 has magnitude, spectral type, proper name, coordinates, and related catalog fields.
- The exact visible notable-star subset should be selected by a documented rule, such as the brightest members of this asterism.
- The current seasonal function maps right ascension to a four-way season at lines 129 through 136.
- It does not compute astronomical visibility by month or location.
- The existing modal dots at lines 573 through 604 highlight the single chosen season across eight dots.
- This is a categorical decorative display, not a computed monthly visibility profile.
- The four season buckets are based solely on right ascension.
- Their boundaries are a coarse rule and must not be described as observation availability.
- The current coordinate helper computes current horizontal coordinates for a selected observer/date.
- The current modal shows current altitude and azimuth in the metric cards at lines 606 through 632.
- It does not compute an hourly altitude curve in this component.
- The screenshot's next-best window and peak altitude require repeated time sampling and horizon filtering.
- The current observer and observation date are external shared state.
- A correct visibility panel must use those same observer/date values and label its timezone.
- The screen does not currently have a route separate from the catalog modal.
- `handleFocusSky` is at lines 176 onward and is wired to FIND IN SKY CANVAS around lines 635 through 645.
- `handleStartTrace` is at lines 157 through 165 and is wired to TRACE IN LIVE SKY around lines 646 through 655.
- `handleInspectAutomaton` is at lines 167 through 174 and is wired to the third action around lines 656 through 665.
- Current actions already preserve the key cross-view workflows shown by the mockup.
- The detail panel therefore maps most naturally to the existing selected constellation detail state.
- Do not create an unrelated second constellation source or duplicate selected-object state.
- The mockup's Orion measurements require verification against the catalog fixture and astronomy engine.
- The magnitude range cannot be inferred safely from only the brightest star.
- A range must identify whether it covers all member stars, only notable stars, or a human-visible subset.
- The shown top five notable stars need not equal every star in the constellation's asterism.
- Catalog ranking is not currently a field, so rank must be computed from all 88 areas or sourced from a maintained catalog.
- The screenshot's 594 square degrees and rank 26/88 should be checked against the actual catalog area data.
- The screenshot labels Orion as `HERCULEAN`, while the catalog record says family `Orion`.
- The Orion family's official catalog family may differ from the mockup's label and must not be corrected from visual intuition.
- This discrepancy is verified in the screenshot and `src/data/constellations.json` for Orion.
- The screenshot's family string and app data are evidence that reference data may be illustrative.
- Do not overwrite catalog fields to make the screenshot appear internally consistent.
- The current modal's season card is already misleading if its dots suggest a month-by-month availability signal.
- It should be relabeled as a coarse RA-based season category or replaced with a real computation.

### Required implementation tasks

- Refactor the existing selected-constellation modal into the screenshot's detail-page composition if that is the approved navigation direction. Otherwise preserve the modal entry and reflow the same content into the modal, without introducing duplicate selected state.
- Keep `ConstellationExplorer.tsx` as the sole owner of selected catalog entity and cross-view actions. Keep all observation calculations in the existing astronomy domain modules.
- Add the back action to close the selected detail state and restore the explorer selection context. Keep the currently selected constellation in state when entering detail and returning to the explorer.
- Keep OPEN IN SKY and START TRACE actions wired to the existing handlers. Make action button text reflect actual availability and disable unsupported actions visibly.
- Populate name, abbreviation, area, center coordinates, family, and brightest-star data from the catalog. Compute catalog rank from a deterministic descending sort by area if rank is desired.
- Include a stable tie-breaker for equal areas. State whether area rank is among all 88 catalog entries.
- Compute magnitude range from an explicitly defined star subset. Label the subset in the UI so the range is reproducible.
- Use `STAR_BY_ID` and constellation `starIds` to build a notable-star list. Filter missing star IDs defensively instead of dereferencing absent catalog records.
- Sort notable-star rows by magnitude ascending because lower visual magnitudes are brighter. Show proper name, spectral type, and magnitude only when present in the catalog.
- Use an em dash and “catalog value unavailable” for missing fields. Keep the asterism diagram tied to the exact `lineSegments` in the data.
- Keep positions derived from catalog RA and Dec in the existing diagram transform. Preserve labeled-star focus and hover behavior if retained in the refactor.
- Use the catalog's brightest star and other notable members as diagram annotations only when they are members of the selected asterism. Keep SVG labels from overlapping nodes or clipping at the viewBox edge.
- Preserve an adequate hit target for diagram nodes and provide keyboard access to selectable stars. Use a secondary dark sky preview only if it represents an actual renderer or real supplied image.
- Do not synthesize a Milky Way sky and present it as live observation data. If sky preview is decorative, label it as a schematic preview and avoid unsupported planetarium accuracy claims.
- The current `SkyCanvas` can render the actual sky, but the detail component should not create another competing astronomy scene without a scoped requirement. Replace the categorical season dots with a real seasonal visibility calculation if the panel is to claim visibility.
- A real monthly matrix should sample the selected observer location across representative dates and times. Define whether a month is visible by altitude above the horizon, darkness, and observation duration.
- Display the observer location and timezone used for the computation. Show unavailable values if observer coordinates or a valid date are missing.
- If a genuine monthly calculation is out of scope, keep a clearly named RA-season estimate without a probability scale. Do not display all twelve monthly bins as measured visibility using the current four-bin `getConstellationSeason` function.
- Implement the hourly visibility curve by sampling `getHorizontalCoordinates` over an explicit local-time interval. Identify whether the time curve uses the constellation center or the highest point in its figure.
- Use the same date, observer, timezone, and horizon criteria for the curve and summary metrics. Compute peak altitude from sampled or analytically computed values within the same interval.
- Compute the next viewing window from contiguous time samples satisfying the visibility condition. If the window crosses midnight, show the date boundary clearly.
- Keep time zone labels visible because 21:00 has no meaning without a locale or timezone. Use discrete points for the visibility curve to match the quantized chart language.
- Connect dots only if the chart contract permits line segments; the project requirement favors no continuous splines. Show current altitude and azimuth from the actual current observer and date.
- Replace “HIGH” with an explicit definition of the visibility category. For example, define high through an altitude threshold and indicate the threshold in a tooltip or label.
- Use the selected observer and date from the shared store, not local duplicate controls. Do not add a location label unless it is available from observer state.
- Keep current metadata fields and actions if they are not represented in the screenshot. Preserve card spacing while prioritizing diagram and useful observation data.
- At desktop width, use one large diagram, one compact star list, and one sky preview column. Keep the diagram at least 420 pixels wide at the reference viewport where possible.
- At narrower widths, stack the summary, diagram, star list, visibility charts, then metadata. Avoid a two-column metadata card that forces the chart outside the viewport.
- Make the page scroll vertically on short screens. Give the header back button a label and a visible keyboard focus state.
- Use semantic table markup for notable stars. Give both charts accessible titles, axis descriptions, and textual summary values.
- Do not use color alone to distinguish the current season or selected star. Keep no-data and below-horizon states explicit rather than rendering a flat fabricated curve.
- Use source citations or catalog provenance in product detail only if the project already tracks that metadata.

### Fixtures and verification for screenshot 12

- Use the actual Orion record from `src/data/constellations.json` as the primary catalog fixture. Assert its area, RA center, Dec center, family, and star IDs match the source record.
- Compute its area rank from all catalog entries and assert the stated rank equals that sort result. Include a second constellation with equal-area tie behavior if any catalog values tie.
- Include a fixture with a missing or null proper star name. Include a fixture with a missing spectral type or missing magnitude.
- Include a fixture with one absent star ID to verify defensive rendering. Assert notable-star order follows magnitude ascending.
- Assert the magnitude range uses the documented selected-star set. Assert diagram edges exactly match the selected constellation's `lineSegments`.
- Assert diagram nodes exactly match valid members in `starIds`. Assert coordinate wrapping around RA zero does not create a huge discontinuous diagram.
- Assert selected-star labels remain within the SVG viewBox. Use a deterministic observer fixture with known latitude and longitude.
- Use a fixed observation date and timezone for current-coordinate assertions. Assert current altitude and azimuth match `getHorizontalCoordinates` for the selected observer/date.
- For a monthly matrix, define fixed sample dates and local-time policy in the fixture. Assert each visibility cell is derived from those samples and the documented horizon rule.
- Assert changing observer location changes the results when geometry predicts a difference. Assert missing observer data renders an unavailable state rather than a fabricated season.
- For the hourly curve, test a known interval where the object rises and sets. Assert all sampled curve points derive from the same selected date and observer.
- Assert peak altitude equals the maximum of the actual curve samples or documented analytic result. Assert the next viewing window boundaries are computed from the same threshold as the chart.
- Assert intervals crossing midnight include both date/time endpoints and timezone. Assert current visibility label follows its documented altitude rule.
- Assert action buttons call the existing focus and trace handlers with the selected constellation ID. Assert back navigation restores the previous catalog view and does not clear selection unexpectedly.
- Add a visual fixture for the desktop detail composition at 1586 by 992. Add a visual fixture for a narrow viewport and short vertical viewport.
- Assert the charts retain captions and descriptions when reduced to dot-only marks. Compare relative panel hierarchy and action placement, not the mockup's unverified Orion values.
- These are proposed checks; no tests were run during this audit.

## Cross-screen implementation and contradiction register

- All four screenshots repeat a left navigation rail. Seam coordinates range from x 257 to x 278, measured from the PNG left edge. With the app frame inset near x 34, derived rail widths range from about 223 to 244 pixels. The implementation should select one responsive rail token and report the 21 pixel image inconsistency.
- The screenshots do not justify an exact fixed width at all device sizes. All four repeat a white/cool-gray card language and cobalt interaction signal.
- The project tokens already provide the correct base colors. Keep the shell and feature panels on the existing token matrix unless a measured contrast defect proves otherwise.
- The screenshot outer backdrop includes blue texture, but project requirements prohibit gradient meshes. Avoid implementing the backdrop as a gradient mesh or adding unrelated blue decorative texture.
- Use a static restrained chassis color or subtle approved texture only if it does not violate the original specification. The global navigation currently lives in `HeaderNav.tsx` and renders above the main content.
- The references instead show a persistent left rail with screen-specific labels. A global shell change should be implemented once in `HeaderNav.tsx` and `App.tsx`.
- Do not imitate the sidebar separately in each individual feature view. Patterns is a new destination in the screenshots but does not exist in the current `ActiveView` list.
- Add that destination only with a clear owner and shared store contract. The trace analysis screen must consume current trace and recognition state.
- The Constellation Explorer must remain the owner of catalog selection and object detail state. Automata overview should share the active DFA selection and simulator model with the existing tabs.
- Image Lab should remain the owner of image pixels, detector points, and its current recognition report. Orion detail should read from the catalog and astronomy store, not duplicate or hard-code metadata.
- 07_58_54's exact Orion and 98.3 percent values are not verified by the matcher. 07_59_01's 312 patterns and 6/3 state counts are not verified by the current runtime in this read-only review.
- 07_59_08's 4096 by 2731 dimensions may be a sample image value, not supported project fixture evidence. 07_59_08's detection rate, precision, recall, F1, and confidence require labeled evaluation data.
- 07_59_17's Orion rank, magnitude range, family, seasonal visibility, and viewing window require catalog/calculation verification. The 07_59_17 family field in the screenshot may conflict with current Orion catalog data.
- Verify the Orion record in `src/data/constellations.json` before repeating the screen's family label. The 07_59_08 FITS upload label conflicts with the PNG/JPEG picker contract.
- The 07_59_08 normalized threshold label conflicts with the current raw luminance threshold scale unless mapped explicitly. The 07_59_17 current visibility summary needs an observer, date, timezone, and a defined visibility rule.
- The 07_59_17 “best viewing months” cannot be derived from one coarse season estimate. The 07_59_17 hourly curve cannot be substituted by a decorative fixed polyline.
- Any reference-only values should be replaced with real values, explicit unavailable states, or labeled sample fixtures. Keep architecture and algorithm changes outside this presentation-only audit unless separately scoped.
- Avoid claiming full fidelity because only one static state per screen is available. Avoid claiming pixel-perfect layout because original browser viewport and scale are unknown.
- Treat the geometry and color estimates as reproducible reference descriptions with stated uncertainty. Treat all screenshots as visual targets, not truth sources for catalog or algorithm behavior.
- No application files were changed during this subtask. No test suite, development server, build, or browser capture was run during this subtask.
- Next reviewer should inspect the existing tests before choosing component fixture tooling. Before writing implementation code, resolve the Patterns destination versus modal scope.
- Before accepting any scientific KPI, document its formula and data source. Before adding FITS, document actual format support and file-size behavior.
- Before drawing visibility charts, document location/date/timezone and horizon criteria. Before merging UI work, verify shared shell behavior with all four screen states.
- A responsive regression should check the left rail, feature body, cards, and table/chart overflow together. A functionality regression should check trace-to-recognition, automata simulation, image detection, and catalog-to-sky actions.
- Use deterministic fixtures so screenshots and metric assertions remain stable between runs. Keep the implementation changes presentation-only where possible.
- If a visual requirement needs data not currently available, expose its absence honestly and scope the data feature separately.





# Costellar implementation order

Audience: Antigravity. Read-only audit handoff for sequencing, ownership, integration contracts, fixtures, and release.

Application checkout: `C:\ommd3076\Proejcts\automata-theory`
Reference directory: `UI-REFENECE/`
Owner reported baseline: `50fc866bae318900833df2cab34d3f454d521605`
Git safe status was unavailable during audit. Recheck branch and dirty files before editing. No AGENTS.md was reported in audit scope.

## Scope and constraints

1. Implement the presentation in `ORIGINAL_REQUEST.md` and the unique reference frames.
2. Preserve the existing React behavior, calculations, handlers, state, and view IDs.
3. Keep Zustand as the contract for cross-view state.
4. Keep Three.js, astronomy, geometry, recognition, automata, and export logic unchanged.
5. Leave source datasets and generated data untouched.
6. Do not add URL routing. This app routes through Zustand state.
7. Do not remove features because one screenshot omits them.
8. Avoid new dependencies. React, Tailwind, lucide-react, Vite, and Vitest already exist.
9. Preserve keyboard focus, input labels, modal close actions, scroll access, and pointer behavior.
10. Do not ship screenshots, fixture data, or invented telemetry.
11. Use IBM Plex Mono throughout and reserve Doto for legible matrix readouts.
12. Use the existing cool-grey, cobalt, and periwinkle tokens.
13. Reuse shared classes before adding alternatives.
14. Avoid broad selectors and global overflow or animation changes.
15. Keep canvas host dimensions nonzero and measurable.
16. Record existing edits before changing files. Preserve other workers' work.
17. No commit or deployment is implied by this handoff.
18. Report verification only for checks actually performed.

## Source ownership

- `src/index.css`: global tokens, base typography, body and scrollbar rules.
- `src/App.css`: shared shell, card, reticle, typography, and control utilities.
- `src/App.tsx`: top-level composition and live sky frame.
- `src/components/HeaderNav.tsx`: header, search, view selector, observer modal.
- `src/stores/useAstroStore.ts`: view state and cross-feature session API.
- `src/sky/SkyCanvas.tsx`: Three.js viewport integration.
- `src/components/TimelineBar.tsx`: sky time controls.
- `src/components/StarInspector.tsx`: selected-star telemetry.
- `src/features/traceMode/TraceHud.tsx`: trace controls.
- Trace `RecognitionResultsModal.tsx` and `PatternAnalysisModal.tsx`: trace result presentations.
- `src/features/skyTonight/SkyTonight.tsx`: above-horizon browse and time controls.
- `src/features/constellationExplorer/ConstellationExplorer.tsx`: catalog, selection, and details.
- `src/features/automataLab/AutomataLab.tsx`: lab tabs, content outlet, export modal.
- Automata children: `NfaView`, `EpsilonClosureView`, `SubsetConstructionView`, `DfaView`, `MinimizedDfaView`, `SimulatorView`, `FormalDefinitionView`, `TransitionTableView`, `ExportModal`.
- `src/features/huntMode/HuntMode.tsx`: hunt controls, hints, scoring.
- `src/features/imageLab/ImageLab.tsx`: image loading, processing, canvas.
- `src/features/academic/AcademicWalkthrough.tsx`: eleven-step walkthrough.
- `src/components/CreditsModal.tsx`: attribution and licensing content.
- `src/data`, `public/data`, `src/automata`, `src/geometry`, `src/astronomy`, `src/recognition`, and `src/types` are outside visual ownership.
- Any shared CSS belongs in `App.css`. Feature-local CSS belongs to its feature.
- Proposed only if repetition is proven: `[PROPOSED / NEW] src/components/TelemetryPrimitives.tsx` or `[PROPOSED / NEW] src/components/ModalFrame.tsx`.

## Route inventory and APIs to preserve

The top-level route values in `ActiveView` are `sky`, `tonight`, `constellations`, `automataLab`, `hunt`, `imageLab`, `academic`, and `credits`. `App.tsx` has matching conditional views. `HeaderNav` stays mounted. The brand returns to sky. Activating trace from another view routes to sky. The observer modal is owned by `HeaderNav`.

The sky route composes `SkyCanvas`, `TraceHud`, `StarInspector`, and `TimelineBar`. Other values render `SkyTonight`, `ConstellationExplorer`, `AutomataLab`, `HuntMode`, `ImageLab`, `AcademicWalkthrough`, and `CreditsModal`, respectively.

Automata tabs are `nfa`, `closure`, `subset`, `dfa`, `minimized`, `simulator`, `formal`, and `table`. The minimized view has local `partitions`, `sideBySide`, and `proof` tabs. Preserve the export modal entry point.

Preserve `setActiveView`, `setAutomataTab`, observer and date actions, `focusOnStar`, `focusOnConstellation`, `setIsTraceMode`, `addTracedStar`, `addTracedCustomPoint`, `undoLastTracePoint`, `clearTrace`, and `loadPresetTrace`. Keep trace state and recognition report in Zustand.

Preserve `simulatorSymbols`, `simulatorStep`, `simulatorIsPlaying`, `setSimulatorSymbols` reset behavior, and `startNewHunt(patternId?)`. Keep callback shapes, form behavior, SVG geometry, event handlers, and export payload formats intact. Avoid remounts that reset local state. Keep flex child `min-height: 0` where scrolling depends on it. Keep dropdowns outside clipped ancestors and modals above content.

## Reference and fixture boundary

There are 12 PNGs in `UI-REFENECE/`. The first four comprise two duplicate pairs. Design owners identify these as Overview and Sky Explorer. Remaining unique frames cover Sky Tonight, Library, Trace, Recognition Result, Patterns, Automata Lab, Image Lab, and Orion Detail. Use the first two as shell starting points where the later references agree.

Do not rename or alter reference files. Do not copy them into `public/`, use them as backgrounds, or replace live data with screenshot text. Proposed local-only paths are `work/reference-fixtures/` and `work/screenshots/`. Neither belongs in app imports or production output. Record screenshot viewport dimensions. Compare desktop and narrow views. Do not claim pixel comparison without captures and comparison. Use the per-reference owner's mappings and measurements before final tuning.

## Dependency order

1. Baseline: recheck branch, dirty paths, and applicable local instructions. Record baseline commit and preserve other workers' edits.
2. Tokens: inspect `index.html` and `index.css`. Doto and IBM Plex Mono are already requested. Keep token names stable and add only missing definitions. Preserve fallbacks.
3. Primitives: inspect `App.css`. Reuse `bento-shell`, `bento-tray`, `bento-card`, reticle classes, typography utilities, and tactile controls. Define focus and active states once.
4. Shell: adjust `App.tsx` presentation classes without changing imports, conditions, or route mappings. Keep the canvas host measurable.
5. Header: update `HeaderNav.tsx` due to broad reach. Preserve nav IDs, search filtering and caps, observer validation, geolocation, and callbacks. Check overflow and z-order.
6. Live sky and trace: update `TimelineBar`, `StarInspector`, `TraceHud`, and trace modals. Preserve handlers, overlays, trace handoff, and canvas input.
7. Astronomy browse: update `SkyTonight` and `ConstellationExplorer`. Preserve filters, sort, focus, date, preset, and lab handoffs.
8. Automata shell: update `AutomataLab` before its child views. Preserve tab values, order, mapping, and export entry.
9. Automata children: update one at a time. Keep graph geometry, simulator store synchronization, table scrolling, and SVG export sizing.
10. Hunt and Image Lab: preserve target, hints, scoring, upload, processing ranges, threshold behavior, coordinate mapping, recognition, and simulator handoff.
11. Academic and Credits: preserve eleven-step ordering, navigation bounds, scientific text, citations, license content, and scrolling.
12. Reconcile: compare all relevant unique references. Check active/focus states, typography, overflow, modals, dropdowns, empty states, canvas resize, and narrow layout.
13. Release: review the diff for domain changes, run existing checks, and record files, results, assumptions, gaps, and rollback.

## Integration checklist

- Each of the eight ActiveView values still reaches its expected view.
- Header stays mounted across top-level views.
- Brand and trace activation still route to sky as before.
- Observer selection updates every observer reader.
- Time controls update the shared date.
- Star and constellation focus still update coordinates and route.
- Canvas selection still drives StarInspector.
- Preset trace retains IDs, points, report, focus, and route.
- Undo updates point count and report. Clear leaves a valid empty trace.
- Trace-to-lab controls still supply intended symbols and tab.
- All eight Automata tabs remain reachable without leaving Automata Lab.
- Simulator stepping and playback remain store-synchronized.
- Symbol edits retain the existing reset behavior.
- Export still emits existing formats and content.
- Transition table filters remain usable while content overflows.
- NFA, DFA, and minimized-DFA interactions remain accessible.
- Hunt target, hint progression, scoring, and handoff still work.
- Image upload and processing controls retain current behavior and ranges.
- Image canvas coordinate mapping remains stable after CSS sizing changes.
- Image recognition still supplies simulator symbols and routes correctly.
- Sky Tonight filters, sorting, and date updates remain intact.
- Explorer filters, selection, focus, preset, and handoff remain intact.
- Academic step selection remains bounded from one through eleven.
- Credits remain readable with working links.
- Modals close and remain above content. Dropdowns remain unclipped.
- Keyboard focus reaches all controls. Long content remains scrollable.
- Canvas remains nonzero after view switching and viewport resize.
- No new remount resets component or store state.
- Text remains monospaced. Cobalt remains the sole strong signal color.
- No new shadows or gradient meshes appear. Discrete indicators stay quantized.

## Commands, release, rollback

`package.json` defines `npm run build` as `tsc -b && vite build`, `npm run lint` as `oxlint`, `npm test` as `vitest run`, `npm run dev` as `vite`, and `npm run preview` as `vite preview`. Run build, lint, and tests from the app checkout.

Present test files are `astronomy.test.ts`, `automata.test.ts`, `e2e-telemetry.test.ts`, `geometry.test.ts`, and `recognition.test.ts` under `tests/`. Read the telemetry file before calling it browser E2E. There is no Playwright or browser-test script in package scripts. `vite.config.ts` configures React and Tailwind. `TEST_INFRA.md`, `TEST_READY.md`, `docs/TEST_REPORT.md`, and README badges are not fresh execution evidence.

Record exact commands, outcomes, and timestamps. Separate environment failures from regressions. Reopen the app after final CSS edits. Recheck route switching, canvas resize, modal layers, and dropdowns. Record which references and viewports were inspected and which were not.

Keep work on the owner-assigned branch. Stage only intended UI files. Exclude `node_modules`, `dist`, screenshots, and generated data. Prefer per-file rollback for isolated visual regressions. For shared token regressions, restore the token owner file and reapply a smaller fix. For one-feature regressions, revert that feature group and retain independent reviewed work. Never use blanket reset or clean. Never discard another worker's edits. Record baseline SHA, changed paths, final branch, unresolved criteria, and whether deployment occurred. Deployment is outside scope unless requested.

## Assumptions and open items

Assumption: this remains a state-switched SPA. Evidence: `App.tsx` reads `activeView` and renders conditionals.
Assumption: all eight views and lab tabs remain in scope. Evidence: `HeaderNav`, `App.tsx`, and `AutomataLab`.
Assumption: references guide visual direction rather than data values. Evidence: ORIGINAL_REQUEST names them design inspiration and provides explicit tokens.
Assumption: remote Google Fonts may fail offline. Preserve readable mono fallbacks.
Open: verify branch status before editing.
Open: use visual-owner mappings for reference-to-view assignment.
Open: record viewport sizes and baseline test outcomes.
Open: confirm screenshot capture tooling availability.
Open: verify duplicate pairs by hash only if independent proof is needed.
Stop if visual matching requires domain logic changes, feature removal, or shipped fixture data.
Completion requires a preserved mapping and visual check for every route, recorded build/lint/test status, explicit gaps, and safe rollback steps.




<a id="runtime-evidence"></a>
# Independent Runtime Audit — Costellar

Audit date: 2026-11-11 (local time Asia/Calcutta)

## Scope and verdict

This is an independent read-only baseline audit of `C:\ommd3076\Proejcts\automata-theory` for the Antigravity handoff. It records the checked-out source and the app visible in the already-running Brave tab.

The starting browser state was the Live Sky view at `http://localhost:5173/`, New York City observer, simulated timestamp `2026-11-11 16:33:54 UTC`, speed `60×`, selected star `HR 205`, and trace mode off. This tab was already open before this audit.

I navigated between existing modes, inspected controls, and loaded the built-in sample image. I did not edit app files, upload a file, grant a permission, save data, or change repository build output. Loading the sample and changing views were temporary in-memory actions.

The live page is a Vite development origin by evidence: the browser URL uses port 5173, `package.json` declares Vite, and `index.html` points at `/src/main.tsx`. HMR activity itself was not instrumented, so “HMR-connected” is not asserted. No version/build stamp is rendered in the UI.

A separate production build passed in a scratch copy. A production browser run and an independent 1600×1000 headless capture could not be completed: local socket access was denied when binding port 5319 and when requesting the headless browser’s DevTools port. Vite preview against the original read-only tree also failed because Vite attempted to create a temporary config under the repository’s `node_modules`.

The only retained image artifact is a contact sheet of the 12 provided references: `C:\Users\ommd3\Documents\Codex\2026-11-11\indepnedtly-audit-and-give-an-strict-2\work\ref-contact.png`. Browser captures were visually inspected in the CUA session but could not be exported to files from that interface. The observations below identify those captures by route and viewport; they are not screenshot files.

## Evidence and reproducibility

| Evidence | Result | Exact path or origin |
| --- | --- | --- |
| Repository location | Found at the project path below; the originally supplied `C:\Users\ommd3076\...` path did not exist. | `C:\ommd3076\Proejcts\automata-theory` |
| Package scripts and dependency versions | Vite, TypeScript, React 19, Three.js, Vitest; build script is `tsc -b && vite build`. | `C:\ommd3076\Proejcts\automata-theory\package.json` |
| Browser start state | Existing Brave tab, URL `http://localhost:5173/`, title `COSTELLAR // Constellation Recognition & Automata Analysis`. | Brave tab `1132941550` as observed in CUA |
| Browser viewport capture | CUA screenshot measured 1536×640 pixels. This is the content viewport returned by the tool, not verified OS window dimensions. | CUA screenshot observations, no persistent file |
| Vite source entry | HTML references `/src/main.tsx`; the origin is not the `dist/` static bundle. | `C:\ommd3076\Proejcts\automata-theory\index.html` |
| Production artifacts present at start | Existing `dist/index.html`, JS, CSS, and data existed; JS bundle was ~3.13 MB on disk. | `C:\ommd3076\Proejcts\automata-theory\dist` |
| Fresh build | `npm run build -- --configLoader native --outDir build-dist` passed in an isolated copy; 64 modules transformed. | `C:\Users\ommd3\Documents\Codex\2026-11-11\indepnedtly-audit-and-give-an-strict-2\work\baseline-copy` |
| Build output log | Captures command output and the chunk-size warning. | `C:\Users\ommd3\Documents\Codex\2026-11-11\indepnedtly-audit-and-give-an-strict-2\work\baseline-build.log` |
| Independent baseline limitations | Production assets were built, but not served or opened in a browser in this run. | Port 5319 bind/request denied by environment |
| Reference inputs | Twelve PNGs, each 1586×992; contact sheet created in scratch for side-by-side review. | `C:\ommd3076\Proejcts\automata-theory\UI-REFENECE` |

The scratch build was made from copied `src`, `public`, package/config files, and `node_modules`; the source repository was not the build destination. Scratch TypeScript build-info paths were redirected into scratch. The `build-dist` output and build log are reproducible scratch artifacts, not changes to the product.

Commands attempted and outcomes:

1. `npm run preview -- --host 127.0.0.1 --port 5319 --strictPort` in the source repository: failed with `EPERM` when Vite opened `node_modules/.vite-temp/vite.config.ts.timestamp-...mjs`.
2. A read-only Node static server intended to serve `dist` on `127.0.0.1:5319`: process could not establish an accessible local socket; subsequent request returned “access to a socket ... forbidden”.
3. Headless Brave was launched with its own `work/browser-profile` and DevTools port 5320. The environment denied access to `http://127.0.0.1:5320/json/version`; no DevTools-driven screenshot or DOM capture was possible.
4. Scratch production build command: `npm run build -- --configLoader native --outDir build-dist` from `work/baseline-copy`; passed.
5. No automated unit or E2E tests were run; this task asked for an independent browser/runtime baseline, not test execution.

## Rendered observations

| Surface | Observed state | Runtime evidence |
| --- | --- | --- |
| Global header | White/light hardware-style bar with Costellar brand, search field, eight mode buttons, trace toggle, and observer control. All were exposed in the accessibility tree. | 1536×640 CUA capture, initial Live Sky view |
| Live Sky | Dark star field populated with labels and constellation lines; a bottom date/simulation bar and line/label/horizon/grid toggles. A star inspector and azimuth telemetry were present. | Initial CUA screenshot and accessibility snapshot |
| Sky Tonight | Observer/time banner, 18:00–04:00 dot timeline, step controls, 36-above-horizon filter, all-88 and circumpolar filters, north/south and sort controls, four-column compact constellation cards. | CUA screenshot after selecting “SKY TONIGHT” |
| Explorer | 88/88 catalog count, search, family/hemisphere/season filters, show-asterisms control, dense four-column cards. | CUA screenshot after selecting “EXPLORER” |
| Automata Lab | Eight sub-tabs, export control, Minimized DFA selected by default, 63×15 table count (945 cells), 15 symbol headers, state filter, symbol filter, dense transition matrix. | CUA screenshot after selecting “AUTOMATA LAB”; full AX tree contained table rows |
| Hunt | A target card identified Leo (Sickle & Triangle), six stars, hint and next-target controls over the sky. | CUA screenshot after selecting “HUNT” |
| Trace | Sky canvas with trace HUD and zero-star path, undo/clear/complete/geometry controls disabled until points exist, curated pattern/demo selector. | AX tree after switching trace mode on from Hunt |
| Image Lab empty state | Five process stages, upload/sample controls, large empty prompt. | CUA screenshot before loading the sample |
| Image Lab sample loaded | 24 detected stars, filter active, contrast/denoise/sharpen controls, debayer/background options, 24-bin histogram, threshold 180, presets, image canvas, traced-node count 0, recognition instructions, local-only disclaimer. | AX tree and screenshot after selecting “LOAD SAMPLE NIGHT SKY IMAGE” |
| Viva | 11-stage academic walkthrough title, stage list, Cassiopeia coordinate catalog table beginning at stage 1. | CUA screenshot after selecting “VIVA MODE” |
| Credits | HYG v3.8, Constellation Lines, Astronomy Engine source/license cards; IAU region-versus-asterism distinction; client-side privacy claim. | CUA screenshot after selecting “CREDITS” |

The 1536×640 view is 352 pixels shorter than the supplied 1586×992 reference images. It still rendered the main header and primary controls, but lower content in Image Lab and Viva extended below the captured fold and required scrolling. No narrower/mobile viewport was available from the selected CUA browser binding; responsive behavior is therefore unverified.

The supplied references show an older AstroFA composition: a left rail, a blue/purple outer background, white rounded data cards, and a 1586×992 canvas. The current render uses a fixed top navigation bar and a light gray/cobalt “hardware telemetry” theme, with a dark sky canvas only in sky modes. This is a substantial visual divergence from those references, not a pixel-diff verdict; there was no approved pixel tolerance or machine-readable reference contract supplied.

### Notable observed geometry and state behavior

- In the initial Live Sky screenshot, the upper-left instrument overlay sat at the top edge of the canvas and some of its content appeared clipped/occluded by the viewport boundary. This is a visual observation at 1536×640, not a measured CSS overlap.
- The Live Sky header stayed visible while the sky occupied nearly all remaining height; the bottom timeline fit at 640px height.
- Explorer and Sky Tonight controls fit on one row at this width, with small monospace text and highly compressed catalog rows.
- Automata Lab rendered the transition matrix as a high-density table. The header remained legible, while cell labels were small. Vertical scroll was indicated in the screenshot.
- Image Lab empty state centered the main prompt within a large blank card. After loading the sample, the image and report panel populated and the document became scrollable; the workflow strip still showed Upload Asset / Detect Stars rather than marking those stages as completed.
- Viva’s central step list was horizontally constrained and its stage details/table began below it; several stages were below the fold at this height.
- After entering Hunt and returning to Live Sky, the Leo target overlay remained visible over the sky. The trace toggle could be turned off, but the hunt target itself had no visible clear action in the tested route controls. This is a reproducible state-leak candidate; it may be intentional if Hunt context is meant to persist.
- I restored the tab to Live Sky, trace mode off, the original NYC observer and `16:33:54 UTC` simulated time, and reselected the original HR 205 / Andromeda star. The Hunt target overlay remained because clearing it would require a reload or hidden state mutation. Reloading would discard the pre-existing simulated time, so I preserved it.

## Reference comparison by screen family

| Reference screen family | Reference composition | Closest current surface | Difference observed |
| --- | --- | --- | --- |
| Overview (references 1 and 3) | Left navigation, KPI row, activity chart, tonight visibility, recent matches and DFA recognition. | Live Sky plus Sky Tonight and Explorer. | No overview dashboard aggregates; navigation moved to top; primary content is a 3D sky canvas. |
| Sky explorer (references 2 and 4) | Large dark sky within a white dashboard and persistent left rail; observer/date strip and star details to right. | Live Sky. | Main canvas is edge-to-edge inside app shell; controls moved to global header/timeline; no left rail. |
| Tonight (reference 5) | Date/location cards, visibility percentage, dot timelines, observation windows and sky preview. | Sky Tonight. | Current surface provides timeline and catalog filters, without reference dashboard KPI/card composition. |
| Pattern library (reference 6) | Card gallery with a selected pattern detail sidebar. | Explorer. | Current catalog is compact rows and requires selecting a constellation; no persistent pattern-detail sidebar is visible in the captured default. |
| Trace (reference 7) | Large sky photo/diagram, trace step controls, candidate panel and top-level metrics. | Trace Mode on Live Sky. | Current trace is over real 3D sky; no dashboard metrics row in captured state. |
| Recognition result (reference 8) | Dedicated result page with large match label, confidence, diagram, DFA path and candidates. | TraceHud modal path (not exercised to completion). | Not compared at runtime; no successful full trace was submitted during this audit. |
| Results analytics (reference 9) | Dense analytics dashboard with metrics, candidate comparison, charts and history. | No equivalent route observed. | No analytics/results page appears among the eight global navigation items. |
| Automata dashboard (reference 10) | DFA diagram, formal definition, table, simulator and top-level metrics in one screen. | Automata Lab. | Current UI exposes these as eight separate tabs; table fills the viewport on the default captured tab. |
| Image Lab (reference 11) | Two-column image preview and processing panels with a visible metrics/result sidebar. | Image Lab. | Current empty state is sparse; loaded sample becomes a large image plus recognition panel and requires vertical scrolling. |
| Constellation detail (reference 12) | Pattern diagram, notable stars, best viewing months and visibility/observation cards. | Explorer detail after row selection (not captured). | Default catalog screenshot showed only list; detail-state visual comparison remains unverified. |

## Focused interaction regression matrix

This matrix separates interactions actually observed from the stricter rerun checks recommended for Antigravity. “Observed” refers to the initial 1536×640 window and this session only.

| ID | Surface / action | Observed outcome | Acceptance for rerun |
| --- | --- | --- | --- |
| R01 | Open root page in existing Brave tab. | Rendered branded header and Live Sky. | No blank screen or uncaught page error; primary navigation visible. |
| R02 | Select Sky Tonight. | Timeline, filters, and cards rendered. | View changes without an unexpected global header jump. |
| R03 | Select Explorer. | 88/88 catalog and filters rendered. | Catalog count remains 88 and cards remain keyboard/accessibility reachable. |
| R04 | Select Automata Lab. | Transition Table tab rendered by default. | Eight lab tabs and export affordance are visible or horizontally reachable. |
| R05 | Select Hunt. | Target Leo, six reference stars, Hint and Next Target rendered. | Target content must not obscure primary interaction or overlap global controls. |
| R06 | Select Image Lab. | Empty-state prompt and sample/upload controls rendered. | Empty state keeps action visible at short viewport; no overflow traps. |
| R07 | Load built-in sample image. | Sample image populated; 24 centroids reported; controls/histogram appeared. | Loaded state identifies completed steps and maintains visible path to tracing. |
| R08 | Select Viva Mode. | Stage list and Cassiopeia input catalog rendered. | Current stage and next/previous controls remain in view at supported viewport. |
| R09 | Select Credits. | Three data-source cards and explanation rendered. | Links and license labels remain readable without horizontal clipping. |
| R10 | Turn Trace Mode on while leaving Hunt. | TraceHud and sky controls appeared; Hunt context was retained. | Explicitly decide whether Hunt target should persist; if no, clear on exit. |
| R11 | Turn Trace Mode off. | TraceHud disappeared. | Return to a clean sky state without stale Hunt target or trace overlays. |
| R12 | Search `HR 205`. | Autocomplete showed exact `HR 205 (AND)` among similar HR values. | Selecting an exact catalog result focuses that star and closes search. |
| R13 | Select `HR 205 (AND)`. | Search closed and star focus marker appeared. | No collision with hunt target; camera/selection feedback settles without oscillation. |
| R14 | Read observer control. | NYC remained selected; no location permission prompt appeared. | Location remains explicit; no GPS permission request without user action. |
| R15 | Read time control. | Simulation date/time showed `16:33:54 UTC`, `60×`. | Time buttons/speed selector update state once per action and avoid duplicate increments. |
| R16 | Observe top navigation at 1536×640. | Eight buttons fit in the captured width. | At narrow width, nav wraps or scrolls without hiding access to any mode. |
| R17 | Observe Sky Tonight filters. | Above Horizon (36), All 88, Circumpolar (6) and sort controls displayed. | Filter counts correspond to actual filtered rows; toggling does not shift unrelated controls. |
| R18 | Observe Explorer filters. | Family, hemisphere, season, show-asterisms controls displayed. | Filter changes preserve row/card geometry and clear empty-state messaging. |
| R19 | Observe table density. | 63×15 = 945 matrix label displayed for minimized DFA. | Table has a stable header/first column while horizontal and vertical scrolling. |
| R20 | Observe table state search field. | Field was visible. | Searching narrows rows without resizing the overall tray or jumping scroll unexpectedly. |
| R21 | Observe symbol filter. | All Symbols selector exposed 15 options. | Filter selection changes columns without shifting first-column anchor. |
| R22 | Observe sample image detector controls. | Contrast, denoise, sharpen, debayer, background and threshold controls appeared. | Parameter changes update preview without resizing canvas container. |
| R23 | Observe sample image histogram. | 24 bins and threshold 180 appeared; star count 24. | Histogram remains stable size while threshold changes; keyboard focus is visible. |
| R24 | Observe image tracing affordance. | 0 traced nodes; Undo and Clear disabled. | First point enables Undo; undo-to-zero restores disabled state without canvas jitter. |
| R25 | Observe Image Lab disclaimer. | Local 2D image recognition and no blind astrometric solving were stated. | Disclaimer remains associated with results and does not imply plate solving. |
| R26 | Observe Hunt target card. | Card overlaid sky with hint and next-target buttons. | Card stays inside viewport from 320px to 1600px widths and does not block targets. |
| R27 | Observe Credits. | HYG, line dataset, astronomy library attribution rendered. | All source links are actionable and license labels do not wrap into overlap. |
| R28 | Navigate from Hunt to Live Sky. | Hunt target overlay remained after route change. | If this is not intended persistence, no Hunt-only overlay remains on Live Sky. |
| R29 | Return to original star. | HR 205 could be searched and selected again. | Selection marker, inspector, and focus coordinates stay synchronized. |
| R30 | Repeat route navigation twice. | No systematic crash observed; exact geometry comparison was not available. | Route shell geometry is identical on repeat at a fixed viewport. |

## No-jitter geometry acceptance matrix (recommended rerun)

The live browser binding exposed screenshots but not viewport overrides, page evaluation, DOM bounding boxes, or file export. None of these tolerances were measured in this run. Use the following as acceptance criteria, not as claimed passing results.

| ID | Fixed viewport / action | Geometry to record | Pass criterion |
| --- | --- | --- | --- |
| G01 | 1600×1000, reload, wait for fonts and canvas. | Header bounds, main tray bounds, canvas bounds, timeline bounds. | Same bounds across three captures; maximum edge drift ≤1 CSS px. |
| G02 | 1600×1000, Live Sky, capture at t0 / t1 / t2 with no input. | Header, telemetry overlay, timeline rectangles. | Static UI rectangles drift ≤1 px; only canvas pixels and clock text may change. |
| G03 | 1600×1000, click each of eight global nav buttons, return to Sky. | Header height and main region top/bottom. | Header height stays 56 px; main region starts at same y and fills remaining height. |
| G04 | 1600×1000, change observer menu open/close three times. | Menu bounds and anchor. | Menu opens at same anchor, remains in viewport, no page-level horizontal shift. |
| G05 | 1600×1000, type/clear a search query repeatedly. | Search input and dropdown bounds. | Dropdown stays under input; header does not resize; no cumulative width drift. |
| G06 | 1600×1000, click +1h and -1h repeatedly. | Timeline and canvas bounds; date bar content. | Controls do not change shell geometry; each click changes exactly one hour. |
| G07 | 1600×1000, toggle Lines, Labels, Horizon, Grid twice. | Canvas and timeline bounds. | All toggles keep canvas bounds constant; state is reversible. |
| G08 | 1600×1000, enable Trace, add/undo/clear trace nodes. | Trace HUD and canvas bounds. | HUD changes do not resize shell; buttons appear/disappear without shifting timeline. |
| G09 | 1600×1000, Hunt → Live Sky → Hunt. | Target card and trace HUD bounds. | The target card’s intended lifetime is consistent; no stale overlay on routes that should not show it. |
| G10 | 1600×1000, Tonight: change horizon/time/hemisphere/sort filters. | Timeline, filter bar, first card row. | Filter changes do not jump card grid origin or resize the filter bar. |
| G11 | 1600×1000, Explorer: switch family/hemisphere/season and show asterisms. | Filter rows and card grid. | Card grid top/columns remain stable; empty state occupies the same content region. |
| G12 | 1600×1000, Automata Lab: switch all eight tabs. | Lab subheader and content tray bounds. | Subheader remains 48 px and content origin is constant for all tabs. |
| G13 | 1600×1000, table: change machine and symbol filter. | Header row, sticky first column, scroll viewport. | Sticky elements remain fixed; filtered columns do not shift state-column origin. |
| G14 | 1600×1000, Image Lab: empty → sample → threshold changes. | Stage strip, image canvas, recognition panel. | Image container bounds remain fixed; threshold changes do not reflow page. |
| G15 | 1600×1000, Image Lab: trace point / undo / clear. | Image canvas and right report panel. | Point markers do not change layout; report state replaces content in place. |
| G16 | 1600×1000, Viva: advance through all 11 stages. | Stepper bounds and stage detail panel. | Stepper remains stable; detail region replaces content without cumulative scroll shift. |
| G17 | 1600×1000, Credits, reload and revisit. | Three attribution cards and explanatory panels. | Card columns and vertical gaps are identical across visits. |
| G18 | 1280×800, repeat route sweep. | Global nav, content tray, route-specific filter bars. | No clipped controls; shell edges remain within viewport. |
| G19 | 1024×768, repeat route sweep. | Nav overflow, table controls, two-column layouts. | Every route has reachable controls; horizontal overflow is intentional and bounded. |
| G20 | 768×1024 portrait/tablet, repeat route sweep. | Header controls, catalog columns, image panel. | No overlap; scrolling occurs in the content region, not behind a clipped shell. |
| G21 | 390×844 mobile, repeat route sweep. | Header, mode navigation, canvas controls, cards. | No hidden primary mode; a single content scroll region; tap targets ≥40×40 px. |
| G22 | 320×700 narrow mobile, repeat core flows. | Brand/search/nav collapse behavior. | No overlapping controls or inaccessible overflow; text remains readable. |
| G23 | 1536×640, current observed viewport. | Instrument cards, first rows, bottom timeline. | No overlay clipped by canvas boundary; lower-page content is clearly scrollable. |
| G24 | 1600×1000 with reduced-motion preference. | Transition durations, canvas animation, focus indication. | State changes remain understandable; nonessential transitions respect reduced motion. |
| G25 | 1600×1000 at browser zoom 125% and 150%. | Header and key control bounds. | No overlap or loss of primary controls; scroll does not jitter between regions. |
| G26 | 1600×1000, slow CPU / throttled rendering. | Canvas, image preview, dropdown anchor. | No transient layout shift >2 px after fonts/data settle; no repeated resize loop. |
| G27 | 1600×1000, load catalog and fonts cold, then warm. | Header text widths, card row heights, matrix headings. | Font swap does not leave layout shifted after 1 s; controls remain hit-test aligned. |
| G28 | 1600×1000, open/close modal/export if available. | Modal bounds, backdrop, close control. | Modal stays centered and contained; body does not jump when scrollbars appear. |
| G29 | 1600×1000, resize smoothly 1600→1280→1024→768. | Header and region bounds at every step. | No oscillation; each final size converges within 1 px on repeated resize. |
| G30 | 1600×1000, trigger resize repeatedly 10× at fixed dimensions. | All stable chrome rectangles. | Exact same CSS-pixel rectangles after each settle; no cumulative drift. |

Recommended no-jitter capture algorithm:

1. Use a clean, dedicated browser profile and a production preview, not the already-open user tab.
2. Set CSS viewport explicitly to the listed width and height; keep device scale factor at 1 and browser zoom at 100% for baseline.
3. Wait for `document.fonts.ready`, data requests, and one animation frame before recording static geometry.
4. Record `getBoundingClientRect()` for the header, content shell, route surface, canvas, and fixed controls.
5. Capture three no-input snapshots at least 500 ms apart; compare static rectangle edges, excluding changing UTC text and animated canvas pixels.
6. Replay each listed click through semantic button names, then repeat the no-input captures after the view settles.
7. Treat static edge movement >1 CSS px, control overlap, changed hit area, or persistent scroll offset as a failure; treat starfield/canvas pixel changes as expected animation.
8. Export PNGs with route, viewport, and step in the name; store under `work/captures/` for this audit or the user-designated evidence folder.
9. Repeat each route sequence twice from a clean state to catch state leakage and cumulative geometry shift.
10. Record browser version, OS scale, font-load status, app origin, build hash, and exact UTC capture time alongside screenshots.

## Production build and warnings

The source-copy production build passed TypeScript build mode and Vite production compilation. Vite transformed 64 modules and emitted:

- `build-dist/index.html`: 0.84 kB (0.47 kB gzip).
- `build-dist/assets/index-CwLsNkGL.css`: 41.79 kB (8.37 kB gzip).
- `build-dist/assets/index-Bb0honsX.js`: 3,132.60 kB (785.13 kB gzip).

Vite emitted its standard warning that a minified chunk exceeded 500 kB, and suggested code splitting or changing the warning threshold. This is a delivery/performance risk for cold mobile loads, not a build failure. Network transfer and time-to-interactive were not measured.

The original `dist/` contained different asset hashes from the scratch build. The browser was on port 5173, so it was not demonstrably running either the old production output or the new scratch output. No commit hash/build identity was observable from the page. Treat the browser route findings as a live dev-server snapshot and the compilation result as a separate production-build check.

## Handoff findings

1. **Build:** PASS in isolated scratch copy. Build output contains a ~3.13 MB JS chunk and a >500 kB warning.
2. **Rendered route coverage:** PASS for shell and eight main routes at 1536×640; no crash or blank route was observed in the tested navigation.
3. **Reference fidelity:** NOT PASSED as a strict comparison. The current shell and navigation differ substantially from the supplied 1586×992 AstroFA references. This task treats those references as binding targets. Exact target-size comparison remains outstanding because matching browser captures and pixel diff were not available.
4. **Responsive / no-jitter acceptance:** NOT TESTED. No viewport override or browser evaluation API was available through the selected browser binding.
5. **Production browser runtime:** NOT TESTED. Fresh production build succeeded, but socket restrictions prevented preview serving on isolated port 5319.
6. **Potential state leak:** Hunt target overlay persisted after leaving Hunt and opening Live Sky. Reproduce by click `HUNT`, then `LIVE SKY`; decide whether persistence is intended. Source path: `C:\ommd3076\Proejcts\automata-theory\src\features\huntMode\HuntMode.tsx` and `C:\ommd3076\Proejcts\automata-theory\src\sky\SkyCanvas.tsx`.
7. **Potential short-viewport clipping:** Live Sky telemetry touched/clipped at the top edge at 1536×640; verify with measured element rectangles at 1600×1000 and 1536×640 before changing CSS. Source shell uses `100vw × 100vh` and `overflow:hidden`: `C:\ommd3076\Proejcts\automata-theory\src\App.css` lines 76–96.
8. **Image Lab stage feedback:** The loaded sample showed detected stars but the top stage strip still presented upload/detect steps as not complete. Check whether stages are intentionally static or should reflect state. Source: `C:\ommd3076\Proejcts\automata-theory\src\features\imageLab\ImageLab.tsx` lines 305 onward and loaded-state render branch.
9. **Reference gap:** Current top navigation and hardware light theme differ from the provided left-rail AstroFA screens. This handoff treats the supplied screens as binding visual targets while distinguishing the observed shell mismatch from the unperformed pixel-level comparison.
10. **Restore status:** The live tab is back on Live Sky with trace mode off, NYC observer, simulated timestamp preserved, and HR 205 selected. Hunt target remains visible because UI did not expose a clear action; reloading would reset more pre-existing user state, so I did not do that.

### Suggested next-run commands (in an environment that permits local sockets)

```powershell
Set-Location C:\ommd3076\Proejcts\automata-theory
npm run build
npm run preview -- --host 127.0.0.1 --port 5319 --strictPort --configLoader native
```

Open `http://127.0.0.1:5319/` in a clean browser profile and verify the built site. If direct preview writes to the source tree, build and preview from a scratch clone as done here. For repeatable capture, use Playwright or browser DevTools only if already available; do not reuse the user's active profile. At the end, compare screenshots at 1600×1000 and 1536×640, then run G01–G30 and R01–R30, recording observed results separately from expected criteria.




<a id="final-completion"></a>
# Final completion gate

Antigravity must complete and report each criterion below before describing the implementation as complete. Attach exact file paths for source changes and evidence artifacts. Use **PASS**, **PARTIAL**, **FAIL**, or **NOT VERIFIED** for every row. Any unresolved P0 or P1 failure prevents a full pass. If a criterion is blocked by an unresolved product semantic, name the decision, owner, affected frame, and honest interim UI state.

| Gate | Required evidence | Pass condition |
|---|---|---|
| C01 — Baseline and scope | Current branch/ref, index/worktree status, applicable instructions, change list, and baseline build identity | Exact starting state is recorded. Unrelated source and domain logic are not changed. If repository status remains inaccessible, the limitation is explicit and no cleanliness claim is made. |
| C02 — Reference map | All 12 original PNG paths, SHA-256 duplicate identities, route/state mapping for 10 unique frames, each at 1586 × 992 | Every frame maps to an implemented route/state or a named blocker. Duplicate pairs are documented. Frame-specific geometry and variants remain distinguishable. |
| C03 — Shared shell | Before/after captures, header/rail/content bounds, interaction regression results | Left-rail composition and common surfaces match the applicable reference frames. All existing primary features remain reachable, including views omitted from reference rails. No duplicate navigation surface or inert item is shipped. |
| C04 — Screen-specific layout | One capture and findings sheet per unique reference frame, including overlays or image diffs | Each route matches its own card hierarchy, measurements, text scale, selected state, density, and per-frame deviations. Any unmatched content is explained. No claim relies on a single global rail width. |
| C05 — Data truth | Source selector/model references for every displayed count, percentage, time, coordinate, ranking, and status | Live values derive from documented sources and definitions. Fixture values are visibly isolated as fixtures. Unsupported semantics are blocked explicitly or use honest unavailable/empty states; no screenshot number is hard-coded as live truth. |
| C06 — Unsupported capability resolution | FITS support decision and parser evidence if added; threshold scale mapping; Orion visibility formula and timezone; session/activity/accuracy definitions where retained | Every retained control represents a supported operation. FITS is accepted only with a real decoder and defined handling; otherwise the label and picker match supported PNG/JPEG. Thresholds, hourly/monthly semantics, and metrics have reproducible definitions. |
| C07 — Functional preservation | Route-by-route interactions and regression results for sky, time, observer, trace, recognition, astronomy browse, automata, hunt, image, academic, credits, and export | Existing handlers, state contracts, algorithms, data, exports, keyboard access, modal close paths, and cross-view handoffs work after presentation changes. No route crashes or state is lost unexpectedly. |
| C08 — Motion and jitter | Idle captures and frame/geometry measurements, focus interactions, event-driven updates, reduced-motion check | Static regions remain stable across repeated no-input captures. Idle rendering does not introduce visible overlay shimmer or unnecessary repeated work. Focus settles without a visible jump. User-controlled drag, zoom, time playback, and explicit state changes still work. |
| C09 — Target dimensions and responsive behavior | Captures at 1586 × 992 for references and at documented narrower sizes; overflow/scroll and keyboard checks | Target comparison is performed at reference dimensions. Narrow screens remain usable and preserve all routes. No clipped controls, horizontal overflow, or obscured content remains without a documented bounded design choice. |
| C10 — Build and automated checks | Exact commands, fresh test totals/output, build output, lint result if run | Current test/build outcomes are recorded from actual runs. Historical 73/74 and 44/45 discrepancies are reconciled or explicitly left unverified. The known >500 kB chunk warning is reported if it remains. |
| C11 — Image Lab truth and alignment | Empty, sample, loaded, detected, and result captures; threshold boundary fixtures; source-coordinate interaction checks | Stage indicators match real state. Detection overlays align with source-image coordinates at multiple sizes. Changing image/threshold does not leave stale trace/report state. Metrics have a ground-truth denominator or are absent. |
| C12 — Review and closeout | Final diff, changed-file list, gate table, remaining risks, rollback note | Every gate has an outcome and evidence link. Remaining PARTIAL/FAIL/NOT VERIFIED items are clearly listed. No deployment or commit is implied unless separately requested. |

## Release decision

- **PASS:** C01–C12 all pass with evidence, and no unsupported data or inert control remains.
- **PARTIAL:** the core implementation works, but one or more gates are explicitly blocked or incomplete. State the remaining criteria and owners. Do not claim strict reference fidelity.
- **FAIL:** a P0 gate fails, data is fabricated, required behavior regresses, or visual comparison shows the target composition is materially unmet.
- **NOT VERIFIED:** evidence was not collected or the environment prevented the check. Treat this as unresolved, not as a pass.

The audit baseline verifies the scratch production build, rendering of eight main routes, and selected navigation, time, trace, and sample-image interactions in the existing 1536 × 640 development tab. It does not establish target-size reference fidelity, a production browser run, responsive behavior, or jitter geometry. The Hunt target overlay remained after returning to Live Sky because the UI exposed no clear action; its intended lifetime still needs an explicit owner rule and regression gate.



