import { describe, it, expect } from 'vitest';
import { normalizeGeometry } from '../src/geometry/normalize';
import { encodeGeometry, quantizeTurnAngle, quantizeDistanceRatio } from '../src/geometry/quantize';
import { computeProcrustesAlignment } from '../src/geometry/similarity';
import type { Point2D } from '../src/geometry/types';

describe('Geometric Pattern Encoding & Verification', () => {
  const samplePath: Point2D[] = [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 0 },
    { x: 3, y: 1 },
    { x: 4, y: 0 },
  ];

  it('proves translation invariance: shifting coordinates leaves turn angles and ratios identical', () => {
    const shiftedPath: Point2D[] = samplePath.map(p => ({
      x: p.x + 1000.5,
      y: p.y - 450.2,
    }));

    const encOriginal = encodeGeometry(samplePath);
    const encShifted = encodeGeometry(shiftedPath);

    expect(encShifted.symbols).toEqual(encOriginal.symbols);
    for (let i = 0; i < encOriginal.steps.length; i++) {
      expect(encShifted.steps[i].turnAngleDeg).toBeCloseTo(encOriginal.steps[i].turnAngleDeg, 3);
      expect(encShifted.steps[i].lengthRatio).toBeCloseTo(encOriginal.steps[i].lengthRatio, 3);
    }
  });

  it('proves uniform scale invariance: scaling coordinates leaves symbols identical', () => {
    const scaledPath: Point2D[] = samplePath.map(p => ({
      x: p.x * 5.82,
      y: p.y * 5.82,
    }));

    const encOriginal = encodeGeometry(samplePath);
    const encScaled = encodeGeometry(scaledPath);

    expect(encScaled.symbols).toEqual(encOriginal.symbols);
  });

  it('proves 2D rotation invariance: rotating coordinates preserves relative turns and ratios', () => {
    const angleRad = (63.5 * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    const rotatedPath: Point2D[] = samplePath.map(p => ({
      x: p.x * cosA - p.y * sinA,
      y: p.x * sinA + p.y * cosA,
    }));

    const encOriginal = encodeGeometry(samplePath);
    const encRotated = encodeGeometry(rotatedPath);

    expect(encRotated.symbols).toEqual(encOriginal.symbols);
  });

  it('handles degenerate / zero-length edges without crashing or producing NaN', () => {
    const degeneratePath: Point2D[] = [
      { x: 0, y: 0 },
      { x: 0, y: 0 }, // duplicate
      { x: 1, y: 0 },
    ];
    const enc = encodeGeometry(degeneratePath);
    expect(enc.symbols.length).toBe(1);
    expect(Number.isNaN(enc.steps[0].turnAngleDeg)).toBe(false);
  });

  it('detects boundary proximity and generates alternate symbols for tolerance', () => {
    // 21.0 deg is within 7.5 deg of the 20 deg boundary between S and L
    const turn = quantizeTurnAngle(21.0);
    expect(turn.isNearBoundary).toBe(true);
    expect(turn.alternateCategories).toContain('S');

    // 0.74 ratio is within 0.12 of the 0.75 boundary between S and M
    const ratio = quantizeDistanceRatio(0.74);
    expect(ratio.isNearBoundary).toBe(true);
    expect(ratio.alternateCategories).toContain('M');
  });

  it('Procrustes analysis aligns rotated shapes and yields near-zero residual', () => {
    const theta = (35 * Math.PI) / 180;
    const transformed: Point2D[] = samplePath.map(p => ({
      x: 3.0 * (p.x * Math.cos(theta) - p.y * Math.sin(theta)) + 50,
      y: 3.0 * (p.x * Math.sin(theta) + p.y * Math.cos(theta)) - 25,
    }));

    const result = computeProcrustesAlignment(transformed, samplePath);
    expect(result.isVerified).toBe(true);
    expect(result.residual).toBeLessThan(0.01);
  });

  it('Procrustes analysis rejects significantly distorted shapes', () => {
    const distorted: Point2D[] = [
      { x: 0, y: 0 },
      { x: 0, y: 5 }, // completely distorted geometry
      { x: 5, y: 5 },
      { x: 5, y: 0 },
      { x: 10, y: 10 },
    ];

    const result = computeProcrustesAlignment(distorted, samplePath);
    expect(result.isVerified).toBe(false);
    expect(result.residual).toBeGreaterThan(0.32);
  });

  it('normalizes geometry with zero-centered centroid and unit RMS scale', () => {
    const norm = normalizeGeometry(samplePath);
    expect(norm.normalizedPoints.length).toBe(samplePath.length);

    // Sum of coordinates of normalized points should be 0 (zero-centered)
    const sumX = norm.normalizedPoints.reduce((acc, p) => acc + p.x, 0);
    const sumY = norm.normalizedPoints.reduce((acc, p) => acc + p.y, 0);
    expect(Math.abs(sumX)).toBeLessThan(1e-10);
    expect(Math.abs(sumY)).toBeLessThan(1e-10);

    // Root mean square distance from origin should be 1
    const rms = Math.sqrt(
      norm.normalizedPoints.reduce((acc, p) => acc + p.x * p.x + p.y * p.y, 0) / norm.normalizedPoints.length
    );
    expect(rms).toBeCloseTo(1.0, 5);
  });
});
