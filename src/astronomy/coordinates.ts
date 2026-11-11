import * as Astronomy from 'astronomy-engine';
import type { ObserverLocation } from '../types/astronomy';

export interface HorizontalCoords {
  altitude: number; // degrees [-90, +90]
  azimuth: number; // degrees [0, 360) from North through East
  isAboveHorizon: boolean;
}

/**
 * Computes topocentric Horizontal coordinates (Altitude, Azimuth) for an object at J2000 RA/Dec (degrees)
 * for a specific observer location and UTC date/time.
 */
export function getHorizontalCoordinates(
  raDeg: number,
  decDeg: number,
  observer: ObserverLocation,
  date: Date
): HorizontalCoords {
  const obs = new Astronomy.Observer(observer.latitude, observer.longitude, observer.elevation ?? 0);
  const raHours = (raDeg / 15.0) % 24.0;
  const horizon = Astronomy.Horizon(date, obs, raHours, decDeg, 'normal');

  return {
    altitude: Number(horizon.altitude.toFixed(3)),
    azimuth: Number(horizon.azimuth.toFixed(3)),
    isAboveHorizon: horizon.altitude > 0,
  };
}

export interface MeridianCulmination {
  transitDate: Date;
  diffHours: number;
  maxAltitude: number;
  isCircumpolar: boolean;
  neverRises: boolean;
  optimalWindowStart: Date;
  optimalWindowEnd: Date;
}

/**
 * Computes the meridian culmination (transit time tonight) and maximum altitude
 * for a celestial target at RA/Dec, along with its optimal ±2h viewing window.
 */
export function getMeridianCulmination(
  raDeg: number,
  decDeg: number,
  observer: ObserverLocation,
  date: Date
): MeridianCulmination {
  const raHours = (raDeg / 15.0) % 24.0;
  const gast = Astronomy.SiderealTime(date);
  const lst = ((gast + observer.longitude / 15.0) % 24.0 + 24.0) % 24.0;

  let deltaHours = ((raHours - lst) % 24.0 + 24.0) % 24.0;
  if (deltaHours > 12.0) deltaHours -= 24.0;

  const solarHours = deltaHours * 0.9972696;
  const transitDate = new Date(date.getTime() + solarHours * 3600 * 1000);

  const maxAltitude = 90 - Math.abs(observer.latitude - decDeg);
  const minAltitude = observer.latitude >= 0
    ? observer.latitude + decDeg - 90
    : -observer.latitude - decDeg - 90;

  const isCircumpolar = minAltitude > 0;
  const neverRises = maxAltitude <= 0;

  const optimalWindowStart = new Date(transitDate.getTime() - 2 * 3600 * 1000);
  const optimalWindowEnd = new Date(transitDate.getTime() + 2 * 3600 * 1000);

  return {
    transitDate,
    diffHours: solarHours,
    maxAltitude: Number(maxAltitude.toFixed(1)),
    isCircumpolar,
    neverRises,
    optimalWindowStart,
    optimalWindowEnd,
  };
}

/**
 * Computes the 3x3 rotation matrix from J2000 equatorial frame (EQJ)
 * directly to the observer's topocentric horizontal frame (HOR: X=North, Y=West, Z=Zenith).
 */
export function getEquatorialToHorizontalRotation(
  observer: ObserverLocation,
  date: Date
): number[][] {
  const obs = new Astronomy.Observer(observer.latitude, observer.longitude, observer.elevation ?? 0);
  const rotMatrix = Astronomy.Rotation_EQJ_HOR(date, obs);
  return rotMatrix.rot;
}

/**
 * Converts RA and Dec in degrees to 3D Cartesian coordinates in the J2000 equatorial frame (EQJ).
 * Standard astronomical Cartesian convention:
 * X = radius * cos(dec) * cos(ra) (towards vernal equinox RA=0h, Dec=0°)
 * Y = radius * cos(dec) * sin(ra) (towards RA=6h, Dec=0°)
 * Z = radius * sin(dec)           (towards North Celestial Pole Dec=+90°)
 */
export function raDecToCartesian(raDeg: number, decDeg: number, radius = 500): [number, number, number] {
  const toRad = Math.PI / 180;
  const raRad = raDeg * toRad;
  const decRad = decDeg * toRad;

  const cosDec = Math.cos(decRad);
  const x = radius * cosDec * Math.cos(raRad);
  const y = radius * cosDec * Math.sin(raRad);
  const z = radius * Math.sin(decRad);

  return [x, y, z];
}

/**
 * Computes the 4x4 row-major transformation matrix that maps vectors from the
 * J2000 equatorial frame (EQJ) into the observer's Three.js topocentric horizontal frame.
 *
 * In Three.js horizontal frame:
 * +Y is Zenith (Up)
 * -Y is Nadir (Down)
 * -Z is North (Horizon)
 * +X is East (Horizon)
 * +Z is South (Horizon)
 * -X is West (Horizon)
 *
 * Astronomy Engine's Rotation_EQJ_HOR produces matrix R where:
 * R[row][col] is in column-major orientation for vector multiplication:
 * x_hor = R[0][0]*x + R[1][0]*y + R[2][0]*z (North)
 * y_hor = R[0][1]*x + R[1][1]*y + R[2][1]*z (West)
 * z_hor = R[0][2]*x + R[1][2]*y + R[2][2]*z (Zenith)
 *
 * Mapping to Three.js:
 * Three.js X = -y_hor (East)
 * Three.js Y = +z_hor (Zenith)
 * Three.js Z = -x_hor (South is +Z, North is -Z)
 */
export function getEquatorialToThreeJsHorizontalMatrix(
  observer: ObserverLocation,
  date: Date
): number[] {
  const obs = new Astronomy.Observer(observer.latitude, observer.longitude, observer.elevation ?? 0);
  const rot = Astronomy.Rotation_EQJ_HOR(date, obs).rot;

  return [
    -rot[0][1], -rot[1][1], -rot[2][1], 0, // Three.js X = East = -West
     rot[0][2],  rot[1][2],  rot[2][2], 0, // Three.js Y = Zenith
    -rot[0][0], -rot[1][0], -rot[2][0], 0, // Three.js Z = South = -North
             0,          0,          0, 1,
  ];
}

/**
 * Converts B-V color index to approximate realistic RGB star color hex.
 * Ballesteros (2012) formula / standard blackbody color ramp for stellar temperatures.
 */
export function bvToColorHex(bv: number | null): string {
  if (bv === null || isNaN(bv)) return '#e2e8f0'; // default neutral white

  // Clamp BV to realistic stellar range [-0.4, 2.0]
  const b = Math.max(-0.4, Math.min(2.0, bv));

  // Temperature T in Kelvin from Ballesteros formula
  const t = 4600 * (1 / (0.92 * b + 1.7) + 1 / (0.92 * b + 0.62));

  // Blackbody approximate RGB
  let r: number;
  let g: number;
  let blue: number;

  const temp = t / 100;

  // Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  // Green
  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
    g = Math.max(0, Math.min(255, g));
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    g = Math.max(0, Math.min(255, g));
  }

  // Blue
  if (temp >= 66) {
    blue = 255;
  } else if (temp <= 19) {
    blue = 0;
  } else {
    blue = temp - 10;
    blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
    blue = Math.max(0, Math.min(255, blue));
  }

  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(blue)}`;
}

/**
 * Preset observer locations across major global observatories and cities
 */
export const PRESET_OBSERVERS: ObserverLocation[] = [
  { name: 'Greenwich, UK (Prime Meridian)', latitude: 51.4769, longitude: -0.0005, elevation: 46 },
  { name: 'Mauna Kea Observatory, Hawaii', latitude: 19.8206, longitude: -155.4681, elevation: 4205 },
  { name: 'Paranal Observatory (VLT), Chile', latitude: -24.6272, longitude: -70.4042, elevation: 2635 },
  { name: 'New York City, USA', latitude: 40.7128, longitude: -74.0060, elevation: 10 },
  { name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503, elevation: 40 },
  { name: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093, elevation: 19 },
  { name: 'Cairo, Egypt', latitude: 30.0444, longitude: 31.2357, elevation: 23 },
  { name: 'Reykjavik, Iceland (Aurora zone)', latitude: 64.1466, longitude: -21.9426, elevation: 15 },
  { name: 'New Delhi, India', latitude: 28.6139, longitude: 77.2090, elevation: 216 },
];
