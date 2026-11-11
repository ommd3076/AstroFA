export interface Point2D {
  x: number;
  y: number;
}

export type TurnCategory = 'LL' | 'L' | 'S' | 'R' | 'RR';
export type DistanceCategory = 'S' | 'M' | 'G';

export interface QuantizedStep {
  turnCategory: TurnCategory;
  distanceCategory: DistanceCategory;
  symbol: string; // e.g. "L:M"
  turnAngleDeg: number;
  lengthRatio: number;
  isAngleNearBoundary: boolean;
  isRatioNearBoundary: boolean;
  alternateSymbols: string[];
}

export interface EncodedGeometry {
  points: Point2D[];
  normalizedPoints: Point2D[];
  symbols: string[];
  steps: QuantizedStep[];
  toleranceAlternates: Record<number, string[]>;
}

export interface ProcrustesResult {
  residual: number; // Root Mean Square Error (RMSE)
  isVerified: boolean;
  rotationDeg: number;
  scale: number;
  alignedReferencePoints: Point2D[];
}
