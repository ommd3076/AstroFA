import { describe, it, expect } from 'vitest';
import { recognizePattern } from '../src/recognition/matcher';
import { MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS } from '../src/data/astroData';
import type { Point2D } from '../src/geometry/types';

describe('IMAGE-01: ImageLab Logic & Telemetry Contract', () => {
  it('normalized threshold correctly maps luminance range [50, 240] to [0.00, 1.00]', () => {
    const toNormalized = (lum: number) => Number(((lum - 50) / 190).toFixed(2));
    const toLuminance = (norm: number) => Math.round(50 + norm * 190);

    expect(toNormalized(50)).toBe(0.00);
    expect(toNormalized(240)).toBe(1.00);
    expect(toNormalized(180)).toBe(0.68);
    expect(toNormalized(172)).toBe(0.64);

    // Verify round-trip conversion for sampled values
    [50, 80, 120, 145, 172, 180, 210, 240].forEach(val => {
      const norm = toNormalized(val);
      const recovered = toLuminance(norm);
      expect(Math.abs(recovered - val)).toBeLessThanOrEqual(2);
    });
  });

  it('histogram bins correctly partition 50-240 luminance into 24 discrete bins', () => {
    const getBinIndex = (val: number) => {
      if (val < 50 || val > 240) return -1;
      return Math.min(23, Math.floor(((val - 50) / 190) * 24));
    };

    expect(getBinIndex(50)).toBe(0);
    expect(getBinIndex(240)).toBe(23);
    expect(getBinIndex(145)).toBe(12);
    expect(getBinIndex(40)).toBe(-1); // outside range
    expect(getBinIndex(250)).toBe(-1); // outside range
  });

  it('deterministic sample asterism coordinates match Cassiopeia (The W) pattern', () => {
    const casPoints: Point2D[] = [
      { x: 180, y: 350 }, // Caph (Beta Cas)
      { x: 300, y: 220 }, // Schedar (Alpha Cas)
      { x: 420, y: 320 }, // Gamma Cas
      { x: 540, y: 200 }, // Ruchbah (Delta Cas)
      { x: 640, y: 310 }, // Segin (Epsilon Cas)
    ];

    const report = recognizePattern(casPoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);
    expect(report.status).toBe('FULL_MATCH');
    expect(report.dfaAccepted).toBe(true);
    expect(report.bestMatch?.constellationId).toBe('Cas');
    expect(report.bestMatch?.patternName).toContain('Cassiopeia');
    expect(report.bestMatch?.residual).toBeLessThanOrEqual(0.32);
  });

  it('partial tracing yields VALID_PREFIX and candidate reachable patterns', () => {
    const partialPoints: Point2D[] = [
      { x: 180, y: 350 },
      { x: 300, y: 220 },
      { x: 420, y: 320 },
    ];

    const report = recognizePattern(partialPoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);
    expect(report.status).toBe('VALID_PREFIX');
    expect(report.dfaAccepted).toBe(false);
    expect(report.prefixMatch.reachableAcceptingLabels).toContain('Cas');
  });

  it('invalid geometric paths yield SYMBOLIC_REJECT', () => {
    const invalidPoints: Point2D[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 5 },
    ];

    const report = recognizePattern(invalidPoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);
    expect(report.status).toBe('SYMBOLIC_REJECT');
    expect(report.dfaAccepted).toBe(false);
  });
});
