import { describe, it, expect } from 'vitest';
import {
  getHorizontalCoordinates,
  raDecToCartesian,
  bvToColorHex,
  getEquatorialToHorizontalRotation,
  getEquatorialToThreeJsHorizontalMatrix,
} from '../src/astronomy/coordinates';
import type { ObserverLocation } from '../src/types/astronomy';

describe('Astronomical Calculations & Coordinate Transformations', () => {
  const greenwich: ObserverLocation = {
    name: 'Greenwich',
    latitude: 51.4769,
    longitude: -0.0005,
    elevation: 46,
  };

  const testDate = new Date('2026-03-21T21:00:00Z');

  it('calculates Polaris altitude close to observer latitude in Northern hemisphere', () => {
    // Polaris: RA ~ 2.5h (37.9 deg), Dec ~ +89.26 deg
    const polarisCoords = getHorizontalCoordinates(37.9, 89.26, greenwich, testDate);
    expect(polarisCoords.altitude).toBeGreaterThan(50.0);
    expect(polarisCoords.altitude).toBeLessThan(53.0);
    expect(polarisCoords.isAboveHorizon).toBe(true);
  });

  it('correctly marks Southern stars below the horizon for Northern observer', () => {
    // Acrux (Alpha Crucis): RA ~ 186.6 deg, Dec ~ -63.1 deg
    const acruxCoords = getHorizontalCoordinates(186.6, -63.1, greenwich, testDate);
    expect(acruxCoords.altitude).toBeLessThan(0);
    expect(acruxCoords.isAboveHorizon).toBe(false);
  });

  it('computes valid 3x3 rotation matrix from J2000 to Horizontal frame', () => {
    const rot = getEquatorialToHorizontalRotation(greenwich, testDate);
    expect(rot.length).toBe(3);
    expect(rot[0].length).toBe(3);

    // Orthonormal matrix check: determinant should be ~ +1 or -1, row lengths ~ 1
    const row0Len = Math.sqrt(rot[0][0] ** 2 + rot[0][1] ** 2 + rot[0][2] ** 2);
    expect(row0Len).toBeCloseTo(1.0, 4);
  });

  it('converts RA/Dec to 3D Cartesian coordinates with proper unit sphere radius in J2000 frame', () => {
    // Vernal Equinox (RA=0, Dec=0): should point along +X
    const [x, y, z] = raDecToCartesian(0, 0, 500);
    expect(x).toBeCloseTo(500, 2);
    expect(y).toBeCloseTo(0, 2);
    expect(z).toBeCloseTo(0, 2);

    // North Celestial Pole (Dec=90): should point along +Z
    const [xNorth, yNorth, zNorth] = raDecToCartesian(0, 90, 500);
    expect(xNorth).toBeCloseTo(0, 2);
    expect(yNorth).toBeCloseTo(0, 2);
    expect(zNorth).toBeCloseTo(500, 2);

    // RA 90 deg, Dec 0 deg: should point along +Y
    const [x90, y90, z90] = raDecToCartesian(90, 0, 500);
    expect(x90).toBeCloseTo(0, 2);
    expect(y90).toBeCloseTo(500, 2);
    expect(z90).toBeCloseTo(0, 2);
  });

  it('transforms J2000 star coordinates into accurate Three.js topocentric Alt/Az horizontal positions', () => {
    const m = getEquatorialToThreeJsHorizontalMatrix(greenwich, testDate);
    expect(m.length).toBe(16);

    // Polaris in J2000
    const [px, py, pz] = raDecToCartesian(37.9, 89.26, 500);

    // Apply matrix: v_out = M * v_in
    const tx = m[0] * px + m[1] * py + m[2] * pz;
    const ty = m[4] * px + m[5] * py + m[6] * pz; // Zenith (+Up)
    const tz = m[8] * px + m[9] * py + m[10] * pz; // South (+Z), North (-Z)

    // Calculate altitude in degrees from Y / radius
    const altDeg = (Math.asin(ty / 500) * 180) / Math.PI;
    let azDeg = (Math.atan2(tx, -tz) * 180) / Math.PI;
    if (azDeg < 0) azDeg += 360;

    // Polaris in Greenwich should have Altitude ~ 51.4° (above horizon) and Azimuth ~ 359° (North)
    expect(altDeg).toBeGreaterThan(50.0);
    expect(altDeg).toBeLessThan(53.0);
    expect(ty).toBeGreaterThan(380); // high in the sky (+Y)
    expect(tz).toBeLessThan(-300); // towards North (-Z)

    // Acrux in Greenwich should have negative Y (below horizon)
    const [ax, ay, az] = raDecToCartesian(186.6, -63.1, 500);
    const aTy = m[4] * ax + m[5] * ay + m[6] * az;
    expect(aTy).toBeLessThan(0); // strictly below horizon
  });

  it('maps B-V color index to accurate stellar color hex codes', () => {
    // Hot blue star (e.g. Rigel / Spica, BV ~ -0.2)
    const blueColor = bvToColorHex(-0.2);
    expect(blueColor.startsWith('#')).toBe(true);

    // Cool red giant (e.g. Betelgeuse / Antares, BV ~ 1.8)
    const redColor = bvToColorHex(1.8);
    expect(redColor.startsWith('#')).toBe(true);
    expect(blueColor).not.toBe(redColor);
  });
});
