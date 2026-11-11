import type { Point2D, ProcrustesResult } from './types';
import { normalizeGeometry } from './normalize';

export const PROCRUSTES_RESIDUAL_THRESHOLD = 0.32;

/**
 * Performs 2D Procrustes Analysis (Kabsch similarity transform) between two ordered point sets.
 * Finds the optimal 2D rotation that aligns reference points with test points,
 * and returns the normalized Root Mean Square Error (residual).
 */
export function computeProcrustesAlignment(
  testPoints: Point2D[],
  referencePoints: Point2D[],
  threshold = PROCRUSTES_RESIDUAL_THRESHOLD
): ProcrustesResult {
  const n = testPoints.length;
  if (n !== referencePoints.length || n < 2) {
    return {
      residual: 999,
      isVerified: false,
      rotationDeg: 0,
      scale: 1,
      alignedReferencePoints: [],
    };
  }

  // Normalize both sets (translation and uniform scale)
  const normTest = normalizeGeometry(testPoints);
  const normRef = normalizeGeometry(referencePoints);

  const P = normTest.normalizedPoints;
  const Q = normRef.normalizedPoints;

  // Compute optimal rotation angle phi
  let num = 0;
  let den = 0;

  for (let i = 0; i < n; i++) {
    // Cross-covariance terms
    num += Q[i].x * P[i].y - Q[i].y * P[i].x;
    den += Q[i].x * P[i].x + Q[i].y * P[i].y;
  }

  const phi = Math.atan2(num, den);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  // Rotate reference points by phi
  const alignedRef: Point2D[] = Q.map(q => ({
    x: q.x * cosPhi - q.y * sinPhi,
    y: q.x * sinPhi + q.y * cosPhi,
  }));

  // Calculate Root Mean Square Error (RMSE)
  let sumSqErr = 0;
  for (let i = 0; i < n; i++) {
    const dx = P[i].x - alignedRef[i].x;
    const dy = P[i].y - alignedRef[i].y;
    sumSqErr += dx * dx + dy * dy;
  }

  const residual = Math.sqrt(sumSqErr / n);
  const isVerified = residual <= threshold;
  const rotationDeg = (phi * 180) / Math.PI;

  return {
    residual: Number(residual.toFixed(3)),
    isVerified,
    rotationDeg: Number(rotationDeg.toFixed(1)),
    scale: Number(normTest.scale.toFixed(2)),
    alignedReferencePoints: alignedRef,
  };
}
