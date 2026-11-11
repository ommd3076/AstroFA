import type { Point2D } from './types';

/**
 * Converts celestial coordinates (RA, Dec in degrees) into 2D local tangent plane coordinates
 * using astronomical Gnomonic projection centered at the centroid of the coordinates.
 * Great circles map directly to straight lines, preserving angular geometry faithfully.
 */
export function projectRaDecToTangentPlane(coords: Array<{ ra: number; dec: number }>): Point2D[] {
  if (coords.length === 0) return [];
  if (coords.length === 1) return [{ x: 0, y: 0 }];

  // Convert degrees to radians
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;

  // Compute spherical centroid to avoid RA wraparound at 0/360
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (const c of coords) {
    const raRad = c.ra * toRad;
    const decRad = c.dec * toRad;
    sumX += Math.cos(decRad) * Math.cos(raRad);
    sumY += Math.cos(decRad) * Math.sin(raRad);
    sumZ += Math.sin(decRad);
  }

  const centerRaRad = Math.atan2(sumY, sumX);
  const centerHyp = Math.sqrt(sumX * sumX + sumY * sumY);
  const centerDecRad = Math.atan2(sumZ, centerHyp);

  const sinDec0 = Math.sin(centerDecRad);
  const cosDec0 = Math.cos(centerDecRad);

  return coords.map(c => {
    const raRad = c.ra * toRad;
    const decRad = c.dec * toRad;
    const deltaRa = raRad - centerRaRad;

    const sinDec = Math.sin(decRad);
    const cosDec = Math.cos(decRad);
    const cosDeltaRa = Math.cos(deltaRa);
    const sinDeltaRa = Math.sin(deltaRa);

    // cos(c) = distance from projection center
    const cosC = sinDec0 * sinDec + cosDec0 * cosDec * cosDeltaRa;

    // Avoid division by zero or points beyond the horizon of the tangent plane
    const denom = cosC > 0.001 ? cosC : 0.001;

    const x = (cosDec * sinDeltaRa) / denom;
    const y = (cosDec0 * sinDec - sinDec0 * cosDec * cosDeltaRa) / denom;

    // Scale to astronomical degrees for intuitive scale
    return {
      x: x * toDeg,
      y: y * toDeg,
    };
  });
}
