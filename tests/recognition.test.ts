import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ReferencePattern } from '../src/recognition/types';
import type { DFA } from '../src/automata/types';
import { buildNFAFromPatterns } from '../src/automata/nfa';
import { nfaToDfa } from '../src/automata/determinize';
import { minimizeDfa } from '../src/automata/minimize';
import { simulateDfa } from '../src/automata/simulate';
import { recognizePattern } from '../src/recognition/matcher';

describe('Trace-to-Recognize End-to-End Pipeline', () => {
  let patterns: ReferencePattern[];
  let minDfa: DFA;

  beforeAll(() => {
    const raw = fs.readFileSync(path.resolve('src/data/referencePatterns.json'), 'utf-8');
    patterns = JSON.parse(raw);

    const nfaPatterns = patterns.map(p => ({
      patternId: p.id,
      constellationId: p.constellationId,
      name: p.name,
      symbols: p.encodedSymbols,
      toleranceAlternates: p.toleranceAlternates,
    }));

    const nfa = buildNFAFromPatterns(nfaPatterns);
    const { dfa } = nfaToDfa(nfa);
    const minResult = minimizeDfa(dfa);
    minDfa = minResult.minimizedDfa;
  });

  it('recognizes all 24 curated reference traversals across 12 constellations', () => {
    for (const pattern of patterns) {
      const report = recognizePattern(pattern.referencePoints, minDfa, patterns);
      expect(report.status).toBe('FULL_MATCH');
      expect(report.dfaAccepted).toBe(true);
      expect(report.acceptedPatterns).toContain(pattern.constellationId);
      expect(report.bestMatch?.constellationId).toBe(pattern.constellationId);
      expect(report.bestMatch?.residual).toBeLessThan(0.01);
    }
  });

  it('recognizes rotated and scaled real constellation shapes', () => {
    const casPattern = patterns.find(p => p.id === 'Cas_fwd')!;
    const angle = (137.5 * Math.PI) / 180;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const scale = 4.2;

    const transformedPoints = casPattern.referencePoints.map(pt => ({
      x: scale * (pt.x * cosA - pt.y * sinA) + 800,
      y: scale * (pt.x * sinA + pt.y * cosA) - 300,
    }));

    const report = recognizePattern(transformedPoints, minDfa, patterns);
    expect(report.status).toBe('FULL_MATCH');
    expect(report.acceptedPatterns).toContain('Cas');
    expect(report.bestMatch?.constellationId).toBe('Cas');
  });

  it('reports VALID_PREFIX and reachable candidates on partial traces', () => {
    const umaPattern = patterns.find(p => p.id === 'UMa_fwd')!;
    // Trace first 4 stars of Big Dipper (first 2 turns)
    const partialPoints = umaPattern.referencePoints.slice(0, 4);

    const report = recognizePattern(partialPoints, minDfa, patterns);
    expect(report.status).toBe('VALID_PREFIX');
    expect(report.dfaAccepted).toBe(false);
    expect(report.prefixMatch.reachableAcceptingLabels).toContain('UMa');
  });

  it('distinguishes symbolic rejection for invalid star sequences', () => {
    // Generate a zigzag sequence not matching any constellation
    const invalidPoints = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 100 }, // sharp 90 deg turn
      { x: 200, y: 100 },
      { x: 200, y: 5 },
    ];

    const report = recognizePattern(invalidPoints, minDfa, patterns);
    expect(report.status).toBe('SYMBOLIC_REJECT');
    expect(report.dfaAccepted).toBe(false);
  });

  it('accepts tolerance alternate branch strings in DFA simulation', () => {
    // Ori_fwd has primary symbols ["LL:G", "LL:S", "LL:G"] and tolerance alternate at index 0: "L:G"
    const simPrimary = minDfa.states.length > 0;
    expect(simPrimary).toBe(true);

    const reportPrimary = recognizePattern(
      patterns.find(p => p.id === 'Ori_fwd')!.referencePoints,
      minDfa,
      patterns
    );
    expect(reportPrimary.dfaAccepted).toBe(true);
    expect(reportPrimary.acceptedPatterns).toContain('Ori');

    // Tolerance alternate string
    const simAlternate = simulateDfa(minDfa, ['L:G', 'LL:S', 'LL:G']);
    expect(simAlternate.accepted).toBe(true);
    expect(simAlternate.acceptingLabels).toContain('Ori');
  });

  it('distinguishes geometric rejection when DFA accepts symbols but Procrustes residual exceeds tolerance', () => {
    // Construct points whose angles and ratios quantize to Ori_fwd symbols ["LL:G", "LL:S", "LL:G"],
    // but whose metric coordinates diverge from Orion's actual constellation figure
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 100, y: 0 }; // len 100, dir 0 rad
    // Turn +140 deg (LL >= 65), len 300 (ratio 3.0 > 1.35 => G)
    const a1 = (140 * Math.PI) / 180;
    const p2 = { x: p1.x + 300 * Math.cos(a1), y: p1.y + 300 * Math.sin(a1) };
    // Turn +66 deg from previous (LL >= 65), len 60 (ratio 60/300 = 0.2 < 0.75 => S)
    const a2 = a1 + (66 * Math.PI) / 180;
    const p3 = { x: p2.x + 60 * Math.cos(a2), y: p2.y + 60 * Math.sin(a2) };
    // Turn +155 deg from previous (LL >= 65), len 240 (ratio 240/60 = 4.0 > 1.35 => G)
    const a3 = a2 + (155 * Math.PI) / 180;
    const p4 = { x: p3.x + 240 * Math.cos(a3), y: p3.y + 240 * Math.sin(a3) };

    const syntheticPoints = [p0, p1, p2, p3, p4];
    const report = recognizePattern(syntheticPoints, minDfa, patterns);

    expect(report.dfaAccepted).toBe(true);
    expect(report.acceptedPatterns).toContain('Ori');
    expect(report.bestMatch).not.toBeNull();
    expect(report.bestMatch?.residual).toBeGreaterThan(0.32);
    expect(report.status).toBe('GEOMETRIC_REJECT');
    expect(report.explanation).toContain('residual');
    expect(report.explanation).toContain('exceeds tolerance');
  });
});
