import type { Point2D } from './types';

export interface NormalizedPathResult {
  normalizedPoints: Point2D[];
  turnAngles: number[]; // degrees [-180, +180] for interior vertices
  lengthRatios: number[]; // ratio |E_{i+1}| / |E_i| for interior vertices
  edgeLengths: number[];
  centroid: Point2D;
  scale: number;
}

/**
 * Performs translation and uniform scale normalization on an ordered sequence of 2D points.
 * Computes invariant relative turning angles and edge length ratios.
 */
export function normalizeGeometry(points: Point2D[]): NormalizedPathResult {
  const n = points.length;
  if (n === 0) {
    return {
      normalizedPoints: [],
      turnAngles: [],
      lengthRatios: [],
      edgeLengths: [],
      centroid: { x: 0, y: 0 },
      scale: 1,
    };
  }

  // 1. Centroid calculation
  let sumX = 0;
  let sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }
  const centroid: Point2D = { x: sumX / n, y: sumY / n };

  // 2. RMS distance scale calculation
  let sumSqDist = 0;
  for (const p of points) {
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    sumSqDist += dx * dx + dy * dy;
  }

  // Avoid division by zero for identical or single points
  const rawScale = Math.sqrt(sumSqDist / n);
  const scale = rawScale > 1e-7 ? rawScale : 1.0;

  // 3. Normalized points
  const normalizedPoints: Point2D[] = points.map(p => ({
    x: (p.x - centroid.x) / scale,
    y: (p.y - centroid.y) / scale,
  }));

  // 4. Edge vectors and lengths
  const edgeVectors: Point2D[] = [];
  const edgeLengths: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = normalizedPoints[i + 1].x - normalizedPoints[i].x;
    const dy = normalizedPoints[i + 1].y - normalizedPoints[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    edgeVectors.push({ x: dx, y: dy });
    edgeLengths.push(len);
  }

  // 5. Turning angles and length ratios at each interior vertex i (1 <= i <= n-2)
  const turnAngles: number[] = [];
  const lengthRatios: number[] = [];

  for (let i = 0; i < edgeVectors.length - 1; i++) {
    const v1 = edgeVectors[i];
    const v2 = edgeVectors[i + 1];
    const len1 = edgeLengths[i];
    const len2 = edgeLengths[i + 1];

    // Cross product (z-component) and dot product
    const cross = v1.x * v2.y - v1.y * v2.x;
    const dot = v1.x * v2.x + v1.y * v2.y;

    const angleRad = Math.atan2(cross, dot);
    const angleDeg = (angleRad * 180) / Math.PI;
    turnAngles.push(angleDeg);

    // Length ratio with degenerate length protection
    const ratio = len1 > 1e-7 ? len2 / len1 : 1.0;
    lengthRatios.push(ratio);
  }

  return {
    normalizedPoints,
    turnAngles,
    lengthRatios,
    edgeLengths,
    centroid,
    scale,
  };
}
