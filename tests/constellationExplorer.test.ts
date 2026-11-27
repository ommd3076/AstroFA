import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CONSTELLATIONS, REFERENCE_PATTERNS, STAR_BY_ID } from '../src/data/astroData';
import { useAstroStore } from '../src/stores/useAstroStore';
import { getHorizontalCoordinates, PRESET_OBSERVERS } from '../src/astronomy/coordinates';
import type { Star } from '../src/types/astronomy';

describe('LIBRARY-01 and DETAIL-01: Constellation Explorer & Detail View Verification', () => {
  let explorerSource: string;

  beforeEach(() => {
    explorerSource = fs.readFileSync(
      path.resolve('src/features/constellationExplorer/ConstellationExplorer.tsx'),
      'utf-8'
    );
  });

  describe('Rank Computation & Catalog Sorting (Area Truth)', () => {
    it('computes rank 26 of 88 for Orion with area 594 sq deg', () => {
      const sorted = [...CONSTELLATIONS].sort(
        (a, b) => b.area - a.area || a.id.localeCompare(b.id)
      );
      const orionIndex = sorted.findIndex(c => c.id === 'Ori');
      expect(orionIndex).toBe(25); // 0-indexed -> Rank 26
      expect(sorted[orionIndex].area).toBe(594);
    });

    it('computes rank 1 for Hydra (largest area) and rank 88 for Crux (smallest area)', () => {
      const sorted = [...CONSTELLATIONS].sort(
        (a, b) => b.area - a.area || a.id.localeCompare(b.id)
      );
      expect(sorted[0].id).toBe('Hya');
      expect(sorted[0].area).toBe(1303);

      expect(sorted[sorted.length - 1].id).toBe('Cru');
      expect(sorted[sorted.length - 1].area).toBe(68);
    });
  });

  describe('Notable Stars Derivation & Magnitude Ordering', () => {
    it('derives Orion notable stars from STAR_BY_ID sorted by magnitude ascending', () => {
      const orion = CONSTELLATIONS.find(c => c.id === 'Ori')!;
      expect(orion).toBeDefined();

      const stars = orion.starIds
        .map(id => STAR_BY_ID.get(id))
        .filter((s): s is Star => Boolean(s))
        .sort((a, b) => a.mag - b.mag);

      expect(stars.length).toBeGreaterThan(5);

      // Top 3 stars should be Rigel, Betelgeuse, Bellatrix
      expect(stars[0].proper || stars[0].name).toBe('Rigel');
      expect(stars[0].mag).toBeCloseTo(0.18, 1);

      expect(stars[1].proper || stars[1].name).toBe('Betelgeuse');
      expect(stars[1].mag).toBeCloseTo(0.45, 1);

      expect(stars[2].proper || stars[2].name).toBe('Bellatrix');
      expect(stars[2].mag).toBeCloseTo(1.64, 1);
    });

    it('defensively handles missing optional star attributes without throwing', () => {
      for (const con of CONSTELLATIONS) {
        for (const sid of con.starIds) {
          const star = STAR_BY_ID.get(sid);
          if (star) {
            expect(typeof star.ra).toBe('number');
            expect(typeof star.dec).toBe('number');
            expect(typeof star.mag).toBe('number');
          }
        }
      }
    });
  });

  describe('Horizontal Coordinate Sampling for Night Altitude Curve', () => {
    it('samples real altitude across 18:00 to 04:00 using getHorizontalCoordinates', () => {
      const orion = CONSTELLATIONS.find(c => c.id === 'Ori')!;
      const obs = PRESET_OBSERVERS[0]; // Greenwich
      const baseDate = new Date(2025, 0, 15); // Jan 15 (Winter peak)

      const nightStart = new Date(baseDate);
      nightStart.setHours(18, 0, 0, 0);

      const altitudes: number[] = [];
      for (let i = 0; i < 31; i++) {
        const t = new Date(nightStart.getTime() + i * 20 * 60 * 1000);
        const hor = getHorizontalCoordinates(orion.raCenter, orion.decCenter, obs, t);
        altitudes.push(hor.altitude);
      }

      expect(altitudes.length).toBe(31);
      const maxAlt = Math.max(...altitudes);
      // Orion reaches ~40° altitude in London/Greenwich in mid-winter
      expect(maxAlt).toBeGreaterThan(30);
    });
  });

  describe('Catalog Search & Filter Invariants', () => {
    it('filters Zodiacal constellations exactly to the 12 classical zodiac signs', () => {
      const zodiacal = CONSTELLATIONS.filter(c => c.family === 'Zodiacal');
      expect(zodiacal.length).toBe(12);
      const ids = zodiacal.map(c => c.id).sort();
      expect(ids).toEqual(['Aqr', 'Ari', 'Cap', 'Cnc', 'Gem', 'Leo', 'Lib', 'Psc', 'Sco', 'Sgr', 'Tau', 'Vir'].sort());
    });

    it('filters northern and southern hemispheres accurately by declination center', () => {
      const north = CONSTELLATIONS.filter(c => c.decCenter >= 0);
      const south = CONSTELLATIONS.filter(c => c.decCenter < 0);
      expect(north.length + south.length).toBe(88);
      expect(north.length).toBeGreaterThan(30);
      expect(south.length).toBeGreaterThan(30);
    });

    it('identifies all 12 DFA recognizable constellations with reference patterns', () => {
      const dfaConstellationIds = new Set(REFERENCE_PATTERNS.map(p => p.constellationId));
      expect(dfaConstellationIds.size).toBe(12);
      expect(dfaConstellationIds.has('Ori')).toBe(true);
      expect(dfaConstellationIds.has('Cas')).toBe(true);
      expect(dfaConstellationIds.has('UMa')).toBe(true);
    });
  });

  describe('Cross-View Handoff Store Integrations', () => {
    it('focuses on constellation and transitions activeView to sky', () => {
      const store = useAstroStore.getState();
      store.focusOnConstellation('Ori');
      const updated = useAstroStore.getState();
      expect(updated.focusedConstellationId).toBe('Ori');
      expect(updated.activeView).toBe('sky');
    });

    it('loads preset trace for recognizable pattern and transitions activeView to sky', () => {
      const store = useAstroStore.getState();
      const pattern = REFERENCE_PATTERNS.find(p => p.constellationId === 'Ori')!;
      expect(pattern).toBeDefined();

      store.loadPresetTrace(pattern);
      const updated = useAstroStore.getState();
      expect(updated.isTraceMode).toBe(true);
      expect(updated.tracedStarIds.length).toBeGreaterThan(0);
      expect(updated.activeView).toBe('sky');
    });

    it('sets automata tab and transitions activeView to automataLab', () => {
      const store = useAstroStore.getState();
      store.setSimulatorSymbols(['R', 'B']);
      store.setAutomataTab('dfa');
      store.setActiveView('automataLab');

      const updated = useAstroStore.getState();
      expect(updated.simulatorSymbols).toEqual(['R', 'B']);
      expect(updated.automataTab).toBe('dfa');
      expect(updated.activeView).toBe('automataLab');
    });
  });

  describe('Visual Reference Source Code Fidelity Checks (Frame 6 & Frame 12)', () => {
    it('renders Space UI Card components on semantic observatory surfaces', () => {
      expect(explorerSource).toMatch(/components\/ui\/space\/card/);
      expect(explorerSource).toMatch(/<Card/);
      expect(explorerSource).toMatch(/rounded-\[12px\]/);
      expect(explorerSource).toMatch(/bg-\[var\(--bg-card\)\]/);
      expect(explorerSource).toMatch(/border-\[var\(--border-subtle\)\]/);
    });

    it('provides Frame 6 filter pills: ALL, ZODIAC, SEASONAL, NORTHERN, SOUTHERN, FAVORITES', () => {
      expect(explorerSource).toMatch(/ZODIAC/);
      expect(explorerSource).toMatch(/SEASONAL/);
      expect(explorerSource).toMatch(/NORTHERN/);
      expect(explorerSource).toMatch(/SOUTHERN/);
      expect(explorerSource).toMatch(/FAVORITES/);
    });

    it('provides accessible search input bound to the search filter query without HUD brackets', () => {
      expect(explorerSource).toMatch(/aria-label="SEARCH CONSTELLATIONS"/);
      expect(explorerSource).toMatch(/value=\{search\}/);
      expect(explorerSource).toMatch(/setSearch\(/);
      expect(explorerSource).not.toMatch(/hud-reticle/);
    });

    it('provides magnitude badge on catalog cards', () => {
      expect(explorerSource).toMatch(/MAG\s+/);
    });

    it('provides full in-app detail view with heading and Back to catalog button', () => {
      expect(explorerSource).toMatch(/selectedConstellation\.name/);
      expect(explorerSource).toMatch(/Back to catalog/);
      expect(explorerSource).toMatch(/setSelectedConstellation\(null\)/);
    });

    it('includes all detail modules under sentence-case headings with underlying data bindings', () => {
      expect(explorerSource).toMatch(/Constellation diagram/);
      expect(explorerSource).toMatch(/asterismDiagramData/);
      expect(explorerSource).toMatch(/Notable stars/);
      expect(explorerSource).toMatch(/selectedStars/);
      expect(explorerSource).toMatch(/Seasonal visibility/);
      expect(explorerSource).toMatch(/seasonalMatrix/);
      expect(explorerSource).toMatch(/Sky preview/);
      expect(explorerSource).toMatch(/Best viewing months/);
      expect(explorerSource).toMatch(/bestMonths/);
      expect(explorerSource).toMatch(/Visibility tonight/);
      expect(explorerSource).toMatch(/nightVisibility\.peakAlt/);
      expect(explorerSource).toMatch(/Observation summary/);
      expect(explorerSource).toMatch(/visibilityCategory/);
      expect(explorerSource).toMatch(/Next best window/);
      expect(explorerSource).toMatch(/nightVisibility\.nextWindow/);
      expect(explorerSource).toMatch(/Peak altitude/);
    });

    it('wires Open in Sky, Start trace, and Inspect in Automata Lab controls to actual handlers', () => {
      expect(explorerSource).toMatch(/Open in Sky/);
      expect(explorerSource).toMatch(/handleFocusSky\(selectedConstellation\)/);
      expect(explorerSource).toMatch(/Start trace/);
      expect(explorerSource).toMatch(/handleStartTrace\(selectedConstellation\)/);
      expect(explorerSource).toMatch(/Inspect in Automata Lab/);
      expect(explorerSource).toMatch(/handleInspectAutomaton\(selectedConstellation\)/);
    });

    it('has zero motion jitter risks (no animate-in or transition-all on dimensions)', () => {
      expect(explorerSource).not.toMatch(/animate-in/);
      expect(explorerSource).not.toMatch(/zoom-in-95/);
      expect(explorerSource).not.toMatch(/transition-all/);
    });
  });
});
