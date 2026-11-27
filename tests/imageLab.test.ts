import { describe, it, expect } from 'vitest';
import { recognizePattern } from '../src/recognition/matcher';
import { MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS } from '../src/data/astroData';
import type { Point2D } from '../src/geometry/types';
import { imagePointsToMath } from '../src/recognition/client';
import { isRasterDimensionsAllowed, parseRasterDimensions, projectReferencePointsToImage } from '../src/features/imageLab/imageUpload';

describe('IMAGE-01: ImageLab Logic & Telemetry Contract', () => {
  it('preflights PNG IHDR dimensions before image decode', () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    png.set([0x49, 0x48, 0x44, 0x52], 12);
    png.set([0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x13, 0x12], 16); // 8192 x 4882
    expect(parseRasterDimensions(png)).toEqual({ width: 8192, height: 4882 });
    expect(isRasterDimensionsAllowed(8192, 4882)).toBe(true);
    expect(isRasterDimensionsAllowed(8192, 4883)).toBe(false);
  });

  it('finds JPEG SOF after metadata and permits equivalent EXIF-swapped dimensions', () => {
    const jpeg = new Uint8Array([
      0xff, 0xd8,
      0xff, 0xe1, 0x00, 0x22,
      0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // Exif
      0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // TIFF header
      0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00, // orientation 6
      0x00, 0x00, 0x00, 0x00, // next IFD
      0xff, 0xc0, 0x00, 0x07, 0x08, 0x13, 0x12, 0x20, 0x00,
    ]);
    const parsed = parseRasterDimensions(jpeg);
    expect(parsed).toEqual({ width: 8192, height: 4882 });
    expect(isRasterDimensionsAllowed(parsed!.width, parsed!.height)).toBe(true);
    expect(isRasterDimensionsAllowed(parsed!.height, parsed!.width)).toBe(true);
    expect(isRasterDimensionsAllowed(4999, 8000)).toBe(true); // cropped image, still within the pixel budget
  });

  it('rejects unrecognized or truncated raster headers', () => {
    expect(parseRasterDimensions(new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00]))).toBeNull();
    expect(parseRasterDimensions(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });

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

  it('projects the synthetic Cassiopeia sample from the exact reference shape with image y flipped', () => {
    const cassiopeia = REFERENCE_PATTERNS.find(pattern => pattern.id === 'Cas_fwd')!;
    const imagePoints = projectReferencePointsToImage(cassiopeia.referencePoints, 800, 600, 32);
    const mathPoints = imagePointsToMath(imagePoints, 600);
    cassiopeia.referencePoints.forEach((point, index) => {
      expect(mathPoints[index].x).toBeCloseTo(400 + point.x * 32, 8);
      expect(mathPoints[index].y).toBeCloseTo(300 + point.y * 32, 8);
    });

    const report = recognizePattern(mathPoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);
    expect(report.status).toBe('FULL_MATCH');
    expect(report.dfaAccepted).toBe(true);
    expect(report.bestMatch?.constellationId).toBe('Cas');
    expect(report.bestMatch?.patternName).toContain('Cassiopeia');
    expect(report.bestMatch?.residual).toBeLessThanOrEqual(0.32);
  });

  it('converts Image Lab y-down pixels to y-up math coordinates without reflecting the constellation', () => {
    const pixels: Point2D[] = [
      { x: 180, y: 350 }, { x: 300, y: 220 }, { x: 420, y: 320 },
      { x: 540, y: 200 }, { x: 640, y: 310 },
    ];
    const mathPoints = imagePointsToMath(pixels, 600);
    expect(mathPoints[0]).toEqual({ x: 180, y: 250 });
    expect(mathPoints.map(p => p.x)).toEqual(pixels.map(p => p.x));
    expect(mathPoints.map(p => p.y)).toEqual([250, 380, 280, 400, 290]);
    const report = recognizePattern(mathPoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);
    expect(report.status).toBe('FULL_MATCH');
    expect(report.bestMatch?.constellationId).toBe('Cas');
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
