# Original User Request

## Initial Request — 2026-11-11T14:58:10Z

Deploy more subagents at a time to finish the project ASAP; implement using multiple agents doing UI implementing simultaneously. Implement the Costellar tactile hardware telemetry UI overhaul for production across the application based on the design inspiration in the UI-REFENECE folder, preserving all existing logic while replacing presentation.

Integrity mode: development

Reference material: Images and design inspiration in workspace folder UI-REFENECE

## Requirements

### R1. Costellar Hardware Telemetry Visual System and Token Architecture
Overhaul the interface to embody tactile hardware telemetry inspired by Braun and Teenage Engineering instrument panels, replacing SaaS clichés:
- Apply the CSS token matrix:
  --bg-shell: #ECEEF2
  --bg-tray: #E2E5EC
  --bg-card: #F5F6F8
  --bg-pill-neutral: #E6E9EF
  --bg-pill-active: #E0E8F9
  --ink-primary: #181A20
  --ink-secondary: #525866
  --ink-muted: #8C93A0
  --signal-cobalt: #1D55F5
  --signal-mid: #6892F6
  --signal-surface: #C7D5EC
  --dot-inactive: #C8CCD4
  --font-mono: 'IBM Plex Mono', monospace
  --font-dot: 'Doto', monospace
- Enforce tri-tier monospace typography using Google Fonts (Doto:wght@600;700;800 and IBM Plex Mono:wght@400;500;600):
  * Tier 1 — Dot-Matrix LED Readouts (Doto): Secondary time windows, fixed session blocks, pixelated directional arrows.
  * Tier 2 — High-Scale Technical Monospace (IBM Plex Mono / JetBrains Mono): Primary KPIs and countdown numerals in Regular 400 weight (32px-40px), with units in 10px uppercase superscript aligned to cap-height.
  * Tier 3 — All-Caps Tracked Micro-Labels: Every section title, navigation link, axis marker, and metadata tag is strictly UPPERCASE (10px-13px) with wide tracking (letter-spacing: 0.06em to 0.10em).
- Implement quantized data visualization with zero continuous lines: 3x10 vertical dot-matrix columns, multi-band horizontal dot matrix, segmented pill barcodes, and 5-dot LED arrays.
- Style HUD corner-bracket reticles ([ ]) with 4px x 4px corner ticks (#8FA4C4 or #5B8DEF) wrapping subtle pill backgrounds.
- Implement recessed cavity bento grid: outer shell (#ECEEF2), recessed bento tray (#E2E5EC) with tight 6px gaps, and off-white module cards (#F5F6F8, border-radius: 12px, border: 1px solid rgba(255,255,255,0.6)).
- Maintain single-signal color architecture: achromatic cool/warm grey palette with single electric cobalt signal (#1D55F5) and soft periwinkle (#C7D5EC).

### R2. Strict Non-Regression and Presentation Replacement
Replace presentation only while keeping all existing functional logic, calculations, event handlers, state hooks, and route structures completely intact:
- Preserve Three.js sky canvas, automata theory lab, trace mode, recognition engine, and coordinate systems without logic alteration.
- Remove all drop shadows, gradient meshes, rounded-full consumer buttons, and proportional sans-serif fonts. Every text node must be monospaced.
- Convert tables to recessed matrix lists with Doto for IDs/timestamps and .hud-reticle for status badges.
- Convert inputs and filters to HUD brackets.
- Convert sliders and progress bars to LED dot arrays.

## Acceptance Criteria

### Visual System & Typography
- [ ] Google Fonts Doto and IBM Plex Mono are imported and loaded across all views.
- [ ] All typography across the application is monospaced; no proportional sans-serif fonts remain.
- [ ] Section titles, navigation links, axis markers, and metadata tags are uppercase with letter-spacing between 0.06em and 0.10em.
- [ ] Recessed cavity bento grid is implemented with #ECEEF2 outer shell, #E2E5EC tray with 6px gaps, and #F5F6F8 cards with 12px radius and subtle borders.
- [ ] Electric Cobalt (#1D55F5) and defined grey palette tokens are applied as the single signal color architecture.
- [ ] Corner-bracket reticles ([ ]) wrap inputs, filters, and status badges.
- [ ] All charts, status indicators, and progress bars use quantized dot-matrix or segmented pill representations with zero continuous spline lines.
- [ ] No drop shadows or gradient meshes exist in the application styling.

### Functional Integrity & Non-Regression
- [ ] Three.js sky canvas initializes, renders, and animates properly.
- [ ] Automata theory lab functions with all state creation, transition definitions, graph interactions, and simulation features operational.
- [ ] Trace mode and recognition engine process inputs, state transitions, and evaluation results without errors.
- [ ] Existing event handlers, routing, state management, and data flows function without breaking changes.
- [ ] Code inspection and manual comparison against reference images in UI-REFENECE confirm visual alignment with hardware telemetry design.
