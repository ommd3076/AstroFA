# Costellar Space UI Refinement Plan

## Direction

Rebuild Costellar around official Space UI (`https://www.spaceui.one`) as a calm, neutral-graphite astronomy atlas and observing workspace (`#0B0B0D` shell → `#101013` tray → `#151519` surface → `#1B1B20` subtle surface → `#070709` viewport), led by the live Three.js sky canvas and real catalog/ephemeris data. Pair warm-white prose (`#F3F1EB` / `#B5B2A9`) with one soft periwinkle optical accent (`#8FA3FF` / `#A8B8FF`, dark `#0B0B10` foreground on filled controls), Instrument Sans for UI prose, and IBM Plex Mono (`tabular-nums`) for coordinates, timestamps, magnitudes, residuals, and DFA symbols. Keep telemetry factual, motion event-driven (120–220ms state transitions honoring `prefers-reduced-motion: reduce`), and zero idle chrome animation.

## Scope and Preservation

The app exposes these `activeView` routes in `src/App.tsx`: `overview`, `sky`, `tonight`, `constellations`, `automataLab`, `hunt`, `imageLab`, `academic`, `credits`, `results`, and `patterns`. All routes, deep-linked query params, trace workflows, astronomy calculations, catalog data, recognition engines, Zustand store contracts, NASA SVS #4851 sky shaders (`src/sky/SkyCanvas.tsx`), and backend/native APIs remain preserved. Local DFA matching remains diagnostic and educational; backend recognition provides shape confirmation with explicit pending, available, unavailable, and educational-demo states.

## Verified Space UI Registry Sources & Dependencies

- **Install guide:** `https://www.spaceui.one/docs/installation/vite` (React 19, Tailwind v4, Vite).
- **License:** `https://www.spaceui.one/license` — free community primitives, hooks, and utilities are MIT-licensed.
- **Vendored MIT hooks under `src/hooks/`:**
  - `use-media-query.ts`, `use-isomorphic-layout-effect.ts`, `use-event-listener.ts`
- **Vendored MIT primitives under `src/components/ui/space/`:**
  - `alert.tsx`, `autocomplete.tsx`, `button.tsx`, `card.tsx`, `command.tsx`, `dialog.tsx`, `empty.tsx`, `input.tsx`, `kbd.tsx`, `scroll-area.tsx`, `segmented-control.ts`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`, `slider.tsx`, `spinner.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `toggle.tsx`, `toggle-group.tsx`, `toolbar.tsx`, `tooltip.tsx`, `utils.ts`
- **Adaptations from staged registry JSON:**
  - Rewrote `@/lib/`, `@/hooks/`, and `@/components/ui/` imports to relative workspace paths and omitted metadata-only `@usespaceui/squircle`.
  - Guarded `cookieStore.set(...)` in `sidebar.tsx` with `if (typeof cookieStore !== 'undefined')` for test and non-CookieStore browser environments.
  - Added `@custom-variant dark (&:is(.dark *));`, `class="dark"` on `<html>`, and unprefixed Space UI CSS tokens (`--background`, `--card`, `--sidebar*`, `--error*`, `--info*`, `--success*`, `--warning*`, etc.) in `src/index.css`.

## Completed Atlas Workspace Redesign

1. **Shared Shell, Navigation, Command Palette & Tokens (`index.html`, `src/index.css`, `src/App.css`, `src/App.tsx`, `src/components/PageHeader.tsx`, `src/components/HeaderNav.tsx`):**
   - Mounted Space UI `TooltipProvider`, `SidebarProvider` (`h-svh overflow-hidden`), and `SidebarInset` in `src/App.tsx` with a compact instrument header (`SidebarTrigger`, `Separator`, route label, `Search sky...` launcher, observer quick button) over an `.atlas-workspace` surface preserving WebGL canvas sizing.
   - Standardized editorial page openings around shared `PageHeader` (`eyebrow`, `title`, inline `meta`, `description`, `actions`, and optional `<dl>` ephemeris or filter bar children).
   - Replaced custom left-rail CSS and search listbox in `HeaderNav.tsx` with Space UI `Sidebar` (`variant="inset"`, `collapsible="icon"`, built-in mobile `Sheet`, `SidebarRail`), `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarMenuButton`, and `CommandDialog` / `Command` (`Ctrl/Cmd+K`, catalog constellations + bright stars + direct view navigation).
   - Updated Observer Location settings dialog and `CreditsModal.tsx` with grouped source metadata rows and Space UI `Button`, `Input`, and `Alert variant="error"`.
2. **Every View & Automata Subview:**
   - **Overview (`Overview.tsx`):** Rebuilt into an asymmetric atlas landing page combining inline ephemeris `<dl>`, live Tonight matrix + SVG previews, Peak Horizon dot plot, quick traces, and Automaton state footer.
   - **Sky Explorer & Inspector (`SkyExplorer.tsx`, `TimelineBar.tsx`, `StarInspector.tsx`):** Maximized WebGL planetarium stage with a unified top `Toolbar` (`SkyTelemetryStrip`, zoom, layer toggles, `Trace ↗`, fullscreen), bounded `StarInspector` metadata `<dl>`, and bottom `TimelineBar` dock.
   - **Trace Mode & Reports (`TraceHud.tsx`, `RecognitionResultsModal.tsx`, `PatternAnalysisModal.tsx`):** Stage-first slim HUD + candidate inspector rail, conclusion-first Recognition Result report (`PageHeader`, verdict band, `#070709` SVG geometry preview, `Table`), and Pattern Analysis geometry view.
   - **Sky Tonight & Observing Conditions (`SkyTonight.tsx`, `ObservingConditions.tsx`):** Unified 2-column planning workspace pairing exposed filter controls and inline ephemeris `<dl>` above the 11-hour quantum dot matrix (left) and sticky companion rail (right: `SkyPreview`, `Recommended windows`, `Tonight's highlights`, and Open-Meteo `ObservingConditions`).
   - **Constellation Library (`ConstellationExplorer.tsx`):** Refactored Master/Detail catalog and full detail view onto graphite/periwinkle `.atlas-surface` cards, inline filters (`ToggleGroup`, `Select`, `Switch`, `Input`), `#070709` SVG asterism plots, and notable star `Table`.
   - **Image Lab (`ImageLab.tsx`):** Rebuilt as an image-first studio (`lg:col-span-8` interactive starfield `<canvas>` + server shape bar alongside a `lg:col-span-4` chronological inspector rail covering source upload/sample, 24-bin luminance threshold histogram/slider, contrast switch/slider, and manual correction tools).
   - **Hunt Mode (`HuntMode.tsx`):** Replaced oversized header box with a slim mission & progressive hint strip anchored above the full-bleed `SkyCanvas` + `TraceHud` stage and matched verdict card.
   - **Academic Walkthrough (`AcademicWalkthrough.tsx`):** Upgraded to a two-pane Viva reader with a sticky desktop `01–11` stage index list (and compact `<Select>` switcher on smaller screens) beside focused stage content.
   - **Automata Lab & All 8 Lesson Subviews (`AutomataLab.tsx`, `ExportModal.tsx`, `AutomataInstrumentPanel.tsx`, `NfaView.tsx`, `EpsilonClosureView.tsx`, `SubsetConstructionView.tsx`, `DfaView.tsx`, `MinimizedDfaView.tsx`, `SimulatorView.tsx`, `FormalDefinitionView.tsx`, `TransitionTableView.tsx`):** Removed legacy light-theme fallbacks and HUD bracket chrome; unified the instrument panel, export dialog, and all 8 lesson views on neutral graphite `.atlas-surface` cards, `#070709` graph/tape viewports, high-contrast periwinkle/graphite active states (`bg-primary text-primary-foreground`), and Space UI controls.

## Deliberate Direct HTML Control Exception

An audit scan of `<button|<input|<select|<table|<textarea` across `src/` leaves direct HTML elements only in Space UI internal primitives (`input.tsx`, `sidebar.tsx`, `table.tsx`) plus one intentional native control exception:

- `src/features/imageLab/ImageLab.tsx`: hidden native `<input type="file" className="hidden" />` for OS file selection.

All visible interactive controls across every route and subview—including compact quantum time cells in `SkyTonight.tsx`, luminance threshold histogram bars in `ImageLab.tsx`, state partition/transition rows in `MinimizedDfaView.tsx`, and step progress bars in `SubsetConstructionView.tsx`—use Space UI `Button` primitives.
