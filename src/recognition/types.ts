import type { Point2D, QuantizedStep } from '../geometry/types';
import type { SimulationResult, PrefixMatchResult } from '../automata/types';

export interface ReferencePattern {
  id: string;
  constellationId: string;
  name: string;
  description: string;
  orderedStarIds: number[];
  orderedHrIds: number[];
  starNames: string[];
  referenceCoordsRaDec: Array<{ ra: number; dec: number }>;
  referencePoints: Point2D[];
  encodedSymbols: string[];
  toleranceAlternates: Record<number, string[]>;
  traversalVariant: 'forward' | 'reverse' | 'alternative';
}

export interface GeometricCandidateScore {
  patternId: string;
  constellationId: string;
  patternName: string;
  residual: number;
  isVerified: boolean;
  rotationDeg: number;
  scale: number;
}

export interface RecognitionReport {
  inputSymbols: string[];
  quantizedSteps: QuantizedStep[];
  dfaAccepted: boolean;
  acceptedPatterns: string[];
  finalState: string;
  simulationResult: SimulationResult;
  prefixMatch: PrefixMatchResult;
  geometricScores: GeometricCandidateScore[];
  bestMatch: GeometricCandidateScore | null;
  status: 'FULL_MATCH' | 'VALID_PREFIX' | 'SYMBOLIC_REJECT' | 'GEOMETRIC_REJECT';
  explanation: string;
}
