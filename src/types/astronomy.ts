export interface Star {
  id: number;
  hip: number | null;
  hd: number | null;
  hr: number | null;
  name: string;
  proper: string | null;
  bayer: string | null;
  flam: number | null;
  con: string | null;
  ra: number; // degrees [0, 360)
  dec: number; // degrees [-90, +90]
  mag: number; // visual magnitude
  ci: number | null; // B-V color index
  dist: number | null; // parsecs
  pmra: number | null; // mas/yr
  pmdec: number | null; // mas/yr
  spect: string | null; // spectral type
}

export interface ConstellationLineSegment {
  starId1: number;
  starId2: number;
  hr1: number;
  hr2: number;
}

export interface IAUConstellation {
  id: string; // 3-letter IAU abbreviation, e.g. "Ori"
  name: string; // e.g. "Orion"
  genitive: string; // e.g. "Orionis"
  englishName: string; // e.g. "Hunter"
  area: number; // sq degrees
  raCenter: number; // degrees
  decCenter: number; // degrees
  brightestStar: string;
  family: string;
  polylines: number[][]; // arrays of star IDs
  starIds: number[]; // unique star IDs in this constellation figure
  lineSegments: ConstellationLineSegment[];
}

export interface ObserverLocation {
  name: string;
  latitude: number; // degrees -90 to +90
  longitude: number; // degrees -180 to +180
  elevation?: number; // meters
}

export interface StarHorizontalPosition {
  altitude: number; // degrees above horizon (-90 to +90)
  azimuth: number; // degrees clockwise from North (0 to 360)
  isAboveHorizon: boolean;
}
