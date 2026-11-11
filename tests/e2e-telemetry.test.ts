import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Store & Astronomy
import { useAstroStore } from '../src/stores/useAstroStore';
import {
  STARS,
  CONSTELLATIONS,
  REFERENCE_PATTERNS,
  NFA_MACHINE,
  DFA_MACHINE,
  MINIMIZED_DFA_MACHINE,
  STAR_BY_ID,
} from '../src/data/astroData';
import {
  PRESET_OBSERVERS,
  getHorizontalCoordinates,
  raDecToCartesian,
  getEquatorialToThreeJsHorizontalMatrix,
} from '../src/astronomy/coordinates';
import { projectRaDecToTangentPlane } from '../src/geometry/projection';
import { normalizeGeometry } from '../src/geometry/normalize';
import { encodeGeometry } from '../src/geometry/quantize';
import { computeProcrustesAlignment } from '../src/geometry/similarity';
import { computeEpsilonClosure } from '../src/automata/epsilonClosure';
import { simulateDfa } from '../src/automata/simulate';
import { recognizePattern } from '../src/recognition/matcher';
import type { Point2D } from '../src/geometry/types';

describe('PaceOS Tactile Hardware Telemetry E2E Verification Suite', () => {
  // Read static files once for Tier 1 checks
  let indexHtml: string;
  let indexCss: string;
  let appCss: string;

  beforeAll(() => {
    indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');
    indexCss = fs.readFileSync(path.resolve('src/index.css'), 'utf-8');
    appCss = fs.readFileSync(path.resolve('src/App.css'), 'utf-8');
  });

  // =========================================================================
  // TIER 1: Visual System, Design Tokens & Micro-Architecture Invariants
  // =========================================================================
  describe('Tier 1: Visual System, Design Tokens & Micro-Architecture Invariants', () => {
    describe('F1: Design Token Matrix Invariants', () => {
      it('declares all 7 physical surface & container chassis tokens in :root and @theme', () => {
        expect(indexCss).toMatch(/--bg-shell:\s*#ECEEF2/i);
        expect(indexCss).toMatch(/--bg-tray:\s*#E2E5EC/i);
        expect(indexCss).toMatch(/--bg-card:\s*#F5F6F8/i);
        expect(indexCss).toMatch(/--bg-card-subtle:\s*#EDF0F5/i);
        expect(indexCss).toMatch(/--bg-pill-neutral:\s*#E6E9EF/i);
        expect(indexCss).toMatch(/--bg-pill-active:\s*#E0E8F9/i);
        expect(indexCss).toMatch(/--bg-viewport:\s*#060A14/i);
      });

      it('declares all 4 ink typography color tokens in :root with calibrated greys', () => {
        expect(indexCss).toMatch(/--ink-primary:\s*#181A20/i);
        expect(indexCss).toMatch(/--ink-secondary:\s*#525866/i);
        expect(indexCss).toMatch(/--ink-muted:\s*#8C93A0/i);
        expect(indexCss).toMatch(/--ink-on-signal:\s*#FFFFFF/i);
      });

      it('declares the single-signal electric cobalt color architecture tokens', () => {
        expect(indexCss).toMatch(/--signal-cobalt:\s*#1D55F5/i);
        expect(indexCss).toMatch(/--signal-mid:\s*#6892F6/i);
        expect(indexCss).toMatch(/--signal-surface:\s*#C7D5EC/i);
      });

      it('declares tactile dot matrix and corner reticle tick tokens', () => {
        expect(indexCss).toMatch(/--dot-inactive:\s*#C8CCD4/i);
        expect(indexCss).toMatch(/--dot-active:\s*#1D55F5/i);
        expect(indexCss).toMatch(/--reticle-tick:\s*#8FA4C4/i);
      });

      it('declares strict monospace and dot-matrix font family tokens', () => {
        expect(indexCss).toMatch(/--font-mono:\s*['"]IBM Plex Mono['"]/i);
        expect(indexCss).toMatch(/--font-dot:\s*['"]Doto['"]/i);
      });
    });

    describe('F1: Google Fonts Presence & Preconnect Links', () => {
      it('includes preconnect links to Google Fonts CDN in index.html', () => {
        expect(indexHtml).toContain('https://fonts.googleapis.com');
        expect(indexHtml).toContain('https://fonts.gstatic.com');
        expect(indexHtml).toMatch(/rel=["']preconnect["']/);
      });

      it('imports Doto Google Font with required wght 600, 700, and 800', () => {
        expect(indexHtml).toMatch(/family=Doto:wght@(?:.*?)600/);
        expect(indexHtml).toMatch(/family=Doto:wght@(?:.*?)700/);
        expect(indexHtml).toMatch(/family=Doto:wght@(?:.*?)800/);
      });

      it('imports IBM Plex Mono Google Font with wght 400, 500, and 600', () => {
        expect(indexHtml).toMatch(/IBM\+Plex\+Mono/);
        expect(indexHtml).toMatch(/400/);
        expect(indexHtml).toMatch(/500/);
        expect(indexHtml).toMatch(/600/);
      });
    });

    describe('F1: Universal Monospace Typography & Proportional Font Exclusion', () => {
      it('enforces var(--font-mono) as the root body font family in src/index.css', () => {
        expect(indexCss).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-mono\)[^}]*\}/s);
      });

      it('excludes proportional sans-serif fallbacks (Inter, Roboto, Arial, sans-serif) from body styling', () => {
        const bodyMatch = indexCss.match(/body\s*\{([^}]*)\}/s);
        expect(bodyMatch).not.toBeNull();
        const bodyRules = bodyMatch![1];
        expect(bodyRules).not.toMatch(/font-family:[^;]*\b(?:Arial|Helvetica|Roboto|Segoe UI|sans-serif)\b/i);
      });
    });

    describe('F2: Recessed Cavity Bento Tray Grid & Layout Architecture', () => {
      it('defines .bento-shell class adhering to chassis shell color and monospace font', () => {
        expect(appCss).toContain('.bento-shell');
        expect(appCss).toMatch(/\.bento-shell\s*\{[^}]*background-color:\s*var\(--bg-shell\)/s);
        expect(appCss).toMatch(/\.bento-shell\s*\{[^}]*font-family:\s*var\(--font-mono\)/s);
      });

      it('defines .bento-tray class with recessed cavity color and strict 6px gap and padding', () => {
        expect(appCss).toContain('.bento-tray');
        expect(appCss).toMatch(/\.bento-tray\s*\{[^}]*background-color:\s*var\(--bg-tray\)/s);
        expect(appCss).toMatch(/\.bento-tray\s*\{[^}]*padding:\s*6px/s);
        expect(appCss).toMatch(/\.bento-tray\s*\{[^}]*gap:\s*6px/s);
      });

      it('defines .bento-card class with 12px radius, card surface, and zero drop shadows', () => {
        expect(appCss).toContain('.bento-card');
        expect(appCss).toMatch(/\.bento-card\s*\{[^}]*background-color:\s*var\(--bg-card\)/s);
        expect(appCss).toMatch(/\.bento-card\s*\{[^}]*border-radius:\s*12px/s);
        expect(appCss).toMatch(/\.bento-card\s*\{[^}]*box-shadow:\s*none/s);
      });
    });

    describe('F3: Tactile Hardware HUD Reticles & Control Utilities', () => {
      it('defines .hud-reticle with 4px corner tick pseudo-elements using --reticle-tick', () => {
        expect(appCss).toContain('.hud-reticle');
        expect(appCss).toMatch(/\.hud-reticle::before,\s*\.hud-reticle::after\s*\{[^}]*width:\s*4px/s);
        expect(appCss).toMatch(/\.hud-reticle::before,\s*\.hud-reticle::after\s*\{[^}]*height:\s*4px/s);
        expect(appCss).toMatch(/\.hud-reticle::before,\s*\.hud-reticle::after\s*\{[^}]*border-color:\s*var\(--reticle-tick\)/s);
      });

      it('styles .hud-reticle.active with electric cobalt highlight ticks', () => {
        expect(appCss).toMatch(/\.hud-reticle\.active::before,\s*\.hud-reticle\.active::after\s*\{[^}]*border-color:\s*var\(--signal-cobalt\)/s);
      });

      it('provides .hud-reticle-4corner for panels, inputs, and search omnibars', () => {
        expect(appCss).toContain('.hud-reticle-4corner');
      });

      it('provides tactile button, rocker, and pill utilities in App.css', () => {
        expect(appCss).toContain('.tactile-button');
        expect(appCss).toContain('.tactile-pill');
        expect(appCss).toContain('.tactile-rocker');
      });
    });

    describe('F8: Quantized Display Typography Hierarchy', () => {
      it('defines .font-dot class implementing Tier 1 dot-matrix LED readouts', () => {
        expect(appCss).toContain('.font-dot');
        expect(appCss).toMatch(/\.font-dot\s*\{[^}]*font-family:\s*var\(--font-dot\)/s);
      });

      it('defines .telemetry-kpi class implementing Tier 2 high-scale monospace numerals with superscript unit', () => {
        expect(appCss).toContain('.telemetry-kpi');
        expect(appCss).toMatch(/\.telemetry-kpi\s*\{[^}]*font-family:\s*var\(--font-mono\)/s);
        expect(appCss).toMatch(/\.telemetry-kpi\s*\{[^}]*font-size:\s*36px/s);
        expect(appCss).toMatch(/\.telemetry-kpi sup\s*\{[^}]*text-transform:\s*uppercase/s);
      });

      it('defines .telemetry-label and .micro-label implementing Tier 3 uppercase micro-labels with wide tracking', () => {
        expect(appCss).toContain('.telemetry-label');
        expect(appCss).toMatch(/\.telemetry-label\s*\{[^}]*text-transform:\s*uppercase/s);
        expect(appCss).toMatch(/\.telemetry-label\s*\{[^}]*letter-spacing:\s*0\.08em/s);
        expect(appCss).toContain('.micro-label');
        expect(appCss).toMatch(/\.micro-label\s*\{[^}]*text-transform:\s*uppercase/s);
      });
    });
  });

  // =========================================================================
  // TIER 2: Boundary Conditions, Edge Cases & Mathematical Robustness
  // =========================================================================
  describe('Tier 2: Boundary Conditions, Edge Cases & Mathematical Robustness', () => {
    describe('F5: Trace Mode Boundary States', () => {
      it('clears trace state cleanly: leaves empty arrays and null recognition report', () => {
        useAstroStore.getState().clearTrace();
        const state = useAstroStore.getState();
        expect(state.tracedStarIds).toEqual([]);
        expect(state.tracedPoints).toEqual([]);
        expect(state.recognitionReport).toBeNull();
      });

      it('handles undoLastTracePoint on an already empty trace without throwing or corrupting state', () => {
        useAstroStore.getState().clearTrace();
        expect(() => useAstroStore.getState().undoLastTracePoint()).not.toThrow();
        const state = useAstroStore.getState();
        expect(state.tracedStarIds).toEqual([]);
        expect(state.tracedPoints).toEqual([]);
        expect(state.recognitionReport).toBeNull();
      });

      it('handles single-star trace (1 point) without division by zero or NaN coordinates', () => {
        useAstroStore.getState().clearTrace();
        const sampleStar = STARS[0];
        useAstroStore.getState().addTracedStar(sampleStar);
        const state = useAstroStore.getState();

        expect(state.tracedStarIds).toEqual([sampleStar.id]);
        expect(state.tracedPoints.length).toBe(1);
        expect(Number.isFinite(state.tracedPoints[0].x)).toBe(true);
        expect(Number.isFinite(state.tracedPoints[0].y)).toBe(true);
        // Single star initializes valid prefix status expecting next star
        expect(state.recognitionReport).not.toBeNull();
        expect(state.recognitionReport?.dfaAccepted).toBe(false);
        expect(state.recognitionReport?.status).toBe('VALID_PREFIX');
      });

      it('handles minimal two-point trace (single edge) without throwing or producing NaN', () => {
        useAstroStore.getState().clearTrace();
        useAstroStore.getState().addTracedCustomPoint({ x: 0, y: 0 });
        useAstroStore.getState().addTracedCustomPoint({ x: 10, y: 10 });
        const state = useAstroStore.getState();

        expect(state.tracedPoints.length).toBe(2);
        // Two points have 1 edge but 0 turning angles (needs >= 3 points for angles)
        expect(state.recognitionReport).toBeDefined();
        if (state.recognitionReport) {
          expect(state.recognitionReport.inputSymbols).toEqual([]);
        }
      });

      it('prevents consecutive duplicate star clicks from creating duplicate segments', () => {
        useAstroStore.getState().clearTrace();
        const sampleStar = STARS[5];
        useAstroStore.getState().addTracedStar(sampleStar);
        useAstroStore.getState().addTracedStar(sampleStar); // consecutive duplicate

        const state = useAstroStore.getState();
        expect(state.tracedStarIds).toEqual([sampleStar.id]);
        expect(state.tracedPoints.length).toBe(1);
      });

      it('processes large asterism trace (10+ stars) through tangent projection without error', () => {
        useAstroStore.getState().clearTrace();
        const tenStars = STARS.slice(0, 10);
        for (const star of tenStars) {
          useAstroStore.getState().addTracedStar(star);
        }
        const state = useAstroStore.getState();
        expect(state.tracedStarIds.length).toBe(10);
        expect(state.tracedPoints.length).toBe(10);
        for (const pt of state.tracedPoints) {
          expect(Number.isFinite(pt.x)).toBe(true);
          expect(Number.isFinite(pt.y)).toBe(true);
        }
      });

      it('rejects random non-constellation polygons in DFA recognition', () => {
        const randomPolygon: Point2D[] = [
          { x: 0, y: 0 },
          { x: 10, y: 55 },
          { x: -30, y: 40 },
          { x: 75, y: -20 },
          { x: 12, y: 90 },
        ];
        const report = recognizePattern(randomPolygon, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);
        expect(report.dfaAccepted).toBe(false);
        expect(report.status).not.toBe('FULL_MATCH');
      });
    });

    describe('F4 & F10: Astronomical Coordinate Limits & Horizon Transitions', () => {
      it('projects North and South Celestial Poles (Dec = ±90°) without NaN', () => {
        const ncp = projectRaDecToTangentPlane([
          { ra: 0, dec: 90 },
          { ra: 180, dec: 90 },
        ]);
        expect(Number.isFinite(ncp[0].x)).toBe(true);
        expect(Number.isFinite(ncp[0].y)).toBe(true);

        const scp = projectRaDecToTangentPlane([
          { ra: 0, dec: -90 },
          { ra: 180, dec: -90 },
        ]);
        expect(Number.isFinite(scp[0].x)).toBe(true);
        expect(Number.isFinite(scp[0].y)).toBe(true);
      });

      it('preserves continuity across Right Ascension 0° and 360° boundaries', () => {
        const [x0, y0, z0] = raDecToCartesian(0, 45, 500);
        const [x360, y360, z360] = raDecToCartesian(360, 45, 500);

        expect(x0).toBeCloseTo(x360, 4);
        expect(y0).toBeCloseTo(y360, 4);
        expect(z0).toBeCloseTo(z360, 4);
      });

      it('detects topocentric horizon boundary transitions (rising and setting) over 24 hours', () => {
        const greenwich = PRESET_OBSERVERS[0];
        // Sirius (RA ~ 101.28°, Dec ~ -16.71°) is an equatorial star that rises and sets at Greenwich
        const siriusRa = 101.28;
        const siriusDec = -16.71;

        const baseTime = new Date('2026-03-21T00:00:00Z').getTime();
        let foundAbove = false;
        let foundBelow = false;

        for (let hour = 0; hour < 24; hour++) {
          const sampleDate = new Date(baseTime + hour * 3600 * 1000);
          const coords = getHorizontalCoordinates(siriusRa, siriusDec, greenwich, sampleDate);

          if (coords.isAboveHorizon) {
            foundAbove = true;
            expect(coords.altitude).toBeGreaterThanOrEqual(0);
          } else {
            foundBelow = true;
            expect(coords.altitude).toBeLessThan(0);
          }
        }

        expect(foundAbove).toBe(true);
        expect(foundBelow).toBe(true);
      });
    });

    describe('F9 & F11: Catalog Completeness & Gamification Boundaries', () => {
      it('verifies that all 88 official IAU constellations are present with valid coordinates', () => {
        expect(CONSTELLATIONS.length).toBe(88);
        for (const con of CONSTELLATIONS) {
          expect(con.id).toBeDefined();
          expect(con.name).toBeDefined();
          expect(con.raCenter).toBeGreaterThanOrEqual(0);
          expect(con.raCenter).toBeLessThanOrEqual(360);
          expect(con.decCenter).toBeGreaterThanOrEqual(-90);
          expect(con.decCenter).toBeLessThanOrEqual(90);
          expect(con.family).toBeDefined();
        }
      });

      it('clamps Hunt Mode hint level within boundaries (0 to 3)', () => {
        useAstroStore.getState().setHuntHintLevel(0);
        expect(useAstroStore.getState().huntHintLevel).toBe(0);
        useAstroStore.getState().setHuntHintLevel(3);
        expect(useAstroStore.getState().huntHintLevel).toBe(3);
      });
    });
  });

  // =========================================================================
  // TIER 3: Cross-Feature Interactions & Subsystem Integration
  // =========================================================================
  describe('Tier 3: Cross-Feature Interactions & Subsystem Integration', () => {
    it('F5 -> F8: Trace Mode to Automata Lab simulation handoff cleanly transfers symbol sequence', () => {
      const casFwd = REFERENCE_PATTERNS.find(p => p.id === 'Cas_fwd')!;
      useAstroStore.getState().loadPresetTrace(casFwd);

      const report = useAstroStore.getState().recognitionReport;
      expect(report).not.toBeNull();
      expect(report!.status).toBe('FULL_MATCH');
      expect(report!.inputSymbols.length).toBeGreaterThan(0);

      // Hand off symbols to Automata Lab simulator
      useAstroStore.getState().setSimulatorSymbols(report!.inputSymbols);
      useAstroStore.getState().setAutomataTab('simulator');

      const store = useAstroStore.getState();
      expect(store.simulatorSymbols).toEqual(report!.inputSymbols);
      expect(store.simulatorStep).toBe(0);
      expect(store.automataTab).toBe('simulator');
    });

    it('F8: Simulator stepper executes state transitions until reaching accept state', () => {
      const symbols = ['LL:M', 'RR:M', 'L:M']; // Cassiopeia sample
      useAstroStore.getState().setSimulatorSymbols(symbols);

      const simResult = simulateDfa(MINIMIZED_DFA_MACHINE, symbols);
      expect(simResult.accepted).toBe(true);

      // Increment step through all symbols
      for (let i = 0; i < symbols.length; i++) {
        useAstroStore.getState().setSimulatorStep(prev => prev + 1);
      }
      expect(useAstroStore.getState().simulatorStep).toBe(symbols.length);
    });

    it('F10 -> F4: Time Scrubber steps synchronize with 3D celestial rotation matrix', () => {
      const obs = PRESET_OBSERVERS[0];
      const t0 = new Date('2026-06-21T22:00:00Z');
      useAstroStore.getState().setObserver(obs);
      useAstroStore.getState().setObservationDate(t0);

      const matrix0 = getEquatorialToThreeJsHorizontalMatrix(obs, t0);
      expect(matrix0.length).toBe(16);

      // Step time by +4 hours
      useAstroStore.getState().stepTime(4);
      const t4 = useAstroStore.getState().observationDate;
      expect(t4.getTime()).toBe(t0.getTime() + 4 * 3600 * 1000);

      const matrix4 = getEquatorialToThreeJsHorizontalMatrix(obs, t4);
      expect(matrix4.length).toBe(16);
      // Earth rotation must yield a distinct rotation matrix
      expect(matrix0).not.toEqual(matrix4);

      // Verify row vector is normalized
      const row0Len = Math.sqrt(matrix0[0] ** 2 + matrix0[1] ** 2 + matrix0[2] ** 2);
      expect(row0Len).toBeCloseTo(1.0, 3);
    });

    it('F5: Preset trace loading synchronously sets trace mode, points, report, and focus', () => {
      const orionPattern = REFERENCE_PATTERNS.find(p => p.id === 'Ori_fwd')!;
      useAstroStore.getState().loadPresetTrace(orionPattern);

      const store = useAstroStore.getState();
      expect(store.isTraceMode).toBe(true);
      expect(store.activeView).toBe('sky');
      expect(store.focusedConstellationId).toBe('Ori');
      expect(store.tracedStarIds).toEqual(orionPattern.orderedStarIds);
      expect(store.tracedPoints.length).toBe(orionPattern.referencePoints.length);
      expect(store.recognitionReport?.status).toBe('FULL_MATCH');
      expect(store.recognitionReport?.dfaAccepted).toBe(true);
    });

    it('F11: Hunt Mode orchestration configures target asterism and resets hints', () => {
      useAstroStore.getState().startNewHunt('Cas_fwd');

      const store = useAstroStore.getState();
      expect(store.activeView).toBe('hunt');
      expect(store.huntTarget?.id).toBe('Cas_fwd');
      expect(store.huntHintLevel).toBe(0);
      expect(store.isTraceMode).toBe(true);
      expect(store.showConstellationLines).toBe(false);
      expect(store.focusedConstellationId).toBe('Cas');
    });

    it('F4: Star focus updates coordinates, selection, and routes to sky view', () => {
      const polaris = STARS.find(s => s.name === 'Polaris')!;
      expect(polaris).toBeDefined();
      useAstroStore.getState().focusOnStar(polaris.id);

      const store = useAstroStore.getState();
      expect(store.selectedStarId).toBe(polaris.id);
      expect(store.focusedConstellationId).toBe(polaris.con);
      expect(store.targetFocusCoords).toEqual({ ra: polaris.ra, dec: polaris.dec });
      expect(store.activeView).toBe('sky');
    });

    it('F7: Automata determinization and minimization preserves language acceptance', () => {
      for (const pattern of REFERENCE_PATTERNS) {
        const dfaSim = simulateDfa(DFA_MACHINE, pattern.encodedSymbols);
        const minSim = simulateDfa(MINIMIZED_DFA_MACHINE, pattern.encodedSymbols);

        expect(dfaSim.accepted).toBe(true);
        expect(minSim.accepted).toBe(true);
        // Accepting label for this pattern must be preserved in simulation result
        expect(minSim.acceptingLabels).toContain(pattern.constellationId);
      }
    });
  });

  // =========================================================================
  // TIER 4: Real-World Workflows & Forensic Verification
  // =========================================================================
  describe('Tier 4: Real-World Workflows & Forensic Verification', () => {
    it('F5 & F14: End-to-End Orion asterism trace and recognition workflow', () => {
      const orion = REFERENCE_PATTERNS.find(p => p.id === 'Ori_fwd')!;
      expect(orion).toBeDefined();

      // Tangent plane projection from catalog stars
      const starCoords = orion.orderedStarIds.map(id => {
        const s = STAR_BY_ID.get(id)!;
        return { ra: s.ra, dec: s.dec };
      });
      const projectedPoints = projectRaDecToTangentPlane(starCoords);
      expect(projectedPoints.length).toBe(orion.orderedStarIds.length);

      // Recognize pattern via DFA and Procrustes
      const report = recognizePattern(projectedPoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);
      expect(report.status).toBe('FULL_MATCH');
      expect(report.dfaAccepted).toBe(true);
      expect(report.acceptedPatterns).toContain('Ori');
      expect(report.bestMatch?.constellationId).toBe('Ori');
      expect(report.bestMatch?.residual).toBeLessThan(0.05);
    });

    it('F5 & F14: End-to-End Cassiopeia "W" asterism trace and recognition workflow', () => {
      const cas = REFERENCE_PATTERNS.find(p => p.id === 'Cas_fwd')!;
      expect(cas).toBeDefined();

      const report = recognizePattern(cas.referencePoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);
      expect(report.status).toBe('FULL_MATCH');
      expect(report.dfaAccepted).toBe(true);
      expect(report.acceptedPatterns).toContain('Cas');
      expect(report.bestMatch?.constellationId).toBe('Cas');
      expect(report.bestMatch?.residual).toBeLessThan(0.01);
    });

    it('F7 & F14: Hopcroft Minimization mathematical proof verifies state count reduction', () => {
      // 1. Minimized state count must be strictly less than unminimized DFA
      expect(MINIMIZED_DFA_MACHINE.states.length).toBeLessThan(DFA_MACHINE.states.length);

      // 2. Initial state must exist and be defined
      expect(MINIMIZED_DFA_MACHINE.initialState).toBeDefined();
      const initState = MINIMIZED_DFA_MACHINE.states.find(s => s.id === MINIMIZED_DFA_MACHINE.initialState);
      expect(initState).toBeDefined();
      expect(initState!.isInitial).toBe(true);

      // 3. All accepting states in Minimized DFA must have non-empty acceptingLabels
      for (const accId of MINIMIZED_DFA_MACHINE.acceptingStates) {
        const state = MINIMIZED_DFA_MACHINE.states.find(s => s.id === accId)!;
        expect(state.isAccepting).toBe(true);
        expect(state.acceptingLabels.length).toBeGreaterThan(0);
      }
    });

    it('F12 & F14: Academic Viva Demonstration validates all 11 Theory of Computation stages', () => {
      const cas = REFERENCE_PATTERNS.find(p => p.id === 'Cas_fwd')!;

      // Stage 1: Input Star Pattern catalog lookup
      const starObjects = cas.orderedStarIds.map(id => STAR_BY_ID.get(id));
      expect(starObjects.every(s => s !== undefined)).toBe(true);

      // Stage 2: Geometric Normalization (translation & unit scale)
      const normalized = normalizeGeometry(cas.referencePoints);
      expect(normalized.normalizedPoints.length).toBe(cas.referencePoints.length);
      const cx = normalized.normalizedPoints.reduce((acc, p) => acc + p.x, 0) / normalized.normalizedPoints.length;
      const cy = normalized.normalizedPoints.reduce((acc, p) => acc + p.y, 0) / normalized.normalizedPoints.length;
      expect(cx).toBeCloseTo(0, 4);
      expect(cy).toBeCloseTo(0, 4);

      // Stage 3: Symbolic Encoding into discrete alphabet Σ
      const encoded = encodeGeometry(cas.referencePoints);
      expect(encoded.symbols).toEqual(cas.encodedSymbols);

      // Stage 4: NFA Construction with start state q0
      expect(NFA_MACHINE.initialState).toBe('q0');
      expect(NFA_MACHINE.states.length).toBeGreaterThan(0);

      // Stage 5: Epsilon-closure computation of initial state q0
      const q0Closure = computeEpsilonClosure(NFA_MACHINE, 'q0');
      expect(q0Closure).toContain('q0');
      expect(q0Closure.length).toBeGreaterThan(1);

      // Stage 6: Subset Construction DFA states exist
      expect(DFA_MACHINE.states.length).toBeGreaterThan(0);

      // Stage 7: DFA Transition Matrix totality (has transitions)
      expect(DFA_MACHINE.transitions.length).toBeGreaterThan(0);

      // Stage 8: DFA Minimization state reduction
      expect(MINIMIZED_DFA_MACHINE.states.length).toBeLessThan(DFA_MACHINE.states.length);

      // Stage 9: Step-by-step traversal trace
      const sim = simulateDfa(MINIMIZED_DFA_MACHINE, cas.encodedSymbols);
      expect(sim.steps.length).toBe(cas.encodedSymbols.length);

      // Stage 10: Formal acceptance condition (q_f ∈ F)
      expect(sim.accepted).toBe(true);
      expect(sim.acceptingLabels.length).toBeGreaterThan(0);

      // Stage 11: Procrustes shape alignment verification
      const procrustes = computeProcrustesAlignment(cas.referencePoints, cas.referencePoints);
      expect(procrustes.residual).toBeCloseTo(0, 4);
    });

    it('F13 & F14: Open-Science Data Provenance and Catalog Integrity', () => {
      // HYG Catalog: Stars count >= 1000
      expect(STARS.length).toBeGreaterThanOrEqual(1000);

      // IAU Constellations count === 88
      expect(CONSTELLATIONS.length).toBe(88);

      // Curated reference patterns: 24 patterns across 12 constellations
      expect(REFERENCE_PATTERNS.length).toBe(24);
      const uniqueCons = new Set(REFERENCE_PATTERNS.map(p => p.constellationId));
      expect(uniqueCons.size).toBe(12);

      // Observer presets include Greenwich
      expect(PRESET_OBSERVERS.length).toBeGreaterThanOrEqual(4);
      expect(PRESET_OBSERVERS[0].name).toBe('Greenwich, UK (Prime Meridian)');
    });
  });
});
