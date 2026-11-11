import type { Point2D } from '../geometry/types';
import type { DFA } from '../automata/types';
import type { ReferencePattern, RecognitionReport, GeometricCandidateScore } from './types';
import { encodeGeometry } from '../geometry/quantize';
import { simulateDfa } from '../automata/simulate';
import { matchPrefix } from '../automata/prefixMatcher';
import { computeProcrustesAlignment } from '../geometry/similarity';

/**
 * Recognizes a star trace pattern using the dual-layer pipeline:
 * Layer 1: Finite Automata (DFA simulation & Prefix Matching)
 * Layer 2: Geometric Similarity Verification (Procrustes Analysis)
 */
export function recognizePattern(
  points: Point2D[],
  dfa: DFA,
  referencePatterns: ReferencePattern[]
): RecognitionReport {
  // If fewer than 2 points, cannot form an edge
  if (points.length < 2) {
    return {
      inputSymbols: [],
      quantizedSteps: [],
      dfaAccepted: false,
      acceptedPatterns: [],
      finalState: dfa.initialState,
      simulationResult: simulateDfa(dfa, []),
      prefixMatch: matchPrefix(dfa, []),
      geometricScores: [],
      bestMatch: null,
      status: 'VALID_PREFIX',
      explanation: points.length === 0 ? 'Select a star to begin tracing.' : 'Select a second star to establish an edge vector.',
    };
  }

  // 1. Encode geometry into symbolic string
  const encoded = encodeGeometry(points);
  const inputSymbols = encoded.symbols;

  // 2. Automata Simulation & Prefix Matching
  const simResult = simulateDfa(dfa, inputSymbols);
  const prefixResult = matchPrefix(dfa, inputSymbols);

  // 3. For 2 points (0 turn symbols), we have a valid initial segment
  if (points.length === 2) {
    return {
      inputSymbols: [],
      quantizedSteps: [],
      dfaAccepted: false,
      acceptedPatterns: [],
      finalState: dfa.initialState,
      simulationResult: simResult,
      prefixMatch: {
        isValidPrefix: true,
        isFullMatch: false,
        currentState: dfa.initialState,
        reachableAcceptingLabels: Array.from(new Set(referencePatterns.map(p => p.constellationId))),
        currentAcceptingLabels: [],
        steps: [],
      },
      geometricScores: [],
      bestMatch: null,
      status: 'VALID_PREFIX',
      explanation: 'First edge traced. Click a 3rd star to generate turning angles and pattern symbols.',
    };
  }

  // 4. Layer 2: Geometric Similarity Verification
  const candidateScores: GeometricCandidateScore[] = [];

  // If DFA accepted or valid prefix, check geometric similarity against corresponding candidate patterns
  const candidateConstellations = simResult.accepted
    ? simResult.acceptingLabels
    : prefixResult.reachableAcceptingLabels;

  const patternsToCheck = referencePatterns.filter(p =>
    candidateConstellations.includes(p.constellationId)
  );

  for (const pattern of patternsToCheck) {
    // Only compare Procrustes if point count is matching (or prefix)
    if (points.length === pattern.referencePoints.length) {
      const align = computeProcrustesAlignment(points, pattern.referencePoints);
      candidateScores.push({
        patternId: pattern.id,
        constellationId: pattern.constellationId,
        patternName: pattern.name,
        residual: align.residual,
        isVerified: align.isVerified,
        rotationDeg: align.rotationDeg,
        scale: align.scale,
      });
    }
  }

  // Sort candidates by lowest geometric residual (best fit first)
  candidateScores.sort((a, b) => a.residual - b.residual);
  const bestMatch = candidateScores.length > 0 ? candidateScores[0] : null;

  // 5. Determine Final Status & Explanation
  if (simResult.accepted) {
    if (bestMatch && bestMatch.isVerified) {
      return {
        inputSymbols,
        quantizedSteps: encoded.steps,
        dfaAccepted: true,
        acceptedPatterns: simResult.acceptingLabels,
        finalState: simResult.finalState,
        simulationResult: simResult,
        prefixMatch: prefixResult,
        geometricScores: candidateScores,
        bestMatch,
        status: 'FULL_MATCH',
        explanation: `Recognized ${bestMatch.patternName}! DFA accepted symbolic string [${inputSymbols.join(', ')}] and geometric residual (${bestMatch.residual}) is within tolerance.`,
      };
    } else if (bestMatch && !bestMatch.isVerified) {
      return {
        inputSymbols,
        quantizedSteps: encoded.steps,
        dfaAccepted: true,
        acceptedPatterns: simResult.acceptingLabels,
        finalState: simResult.finalState,
        simulationResult: simResult,
        prefixMatch: prefixResult,
        geometricScores: candidateScores,
        bestMatch,
        status: 'GEOMETRIC_REJECT',
        explanation: `DFA accepted symbolic pattern for ${simResult.acceptingLabels.join('/')}, but geometric residual (${bestMatch.residual}) exceeds tolerance (0.32). Shape does not match.`,
      };
    } else {
      // Accepted by DFA, no exact length match reference
      return {
        inputSymbols,
        quantizedSteps: encoded.steps,
        dfaAccepted: true,
        acceptedPatterns: simResult.acceptingLabels,
        finalState: simResult.finalState,
        simulationResult: simResult,
        prefixMatch: prefixResult,
        geometricScores: candidateScores,
        bestMatch: null,
        status: 'FULL_MATCH',
        explanation: `DFA accepted string [${inputSymbols.join(', ')}] matching constellation ${simResult.acceptingLabels.join(', ')}.`,
      };
    }
  }

  if (prefixResult.isValidPrefix) {
    const candidatesStr = prefixResult.reachableAcceptingLabels.join(', ');
    return {
      inputSymbols,
      quantizedSteps: encoded.steps,
      dfaAccepted: false,
      acceptedPatterns: [],
      finalState: simResult.finalState,
      simulationResult: simResult,
      prefixMatch: prefixResult,
      geometricScores: candidateScores,
      bestMatch,
      status: 'VALID_PREFIX',
      explanation: `Valid prefix string [${inputSymbols.join(', ')}]. Candidate constellations: ${candidatesStr}. Keep tracing to complete.`,
    };
  }

  return {
    inputSymbols,
    quantizedSteps: encoded.steps,
    dfaAccepted: false,
    acceptedPatterns: [],
    finalState: simResult.finalState,
    simulationResult: simResult,
    prefixMatch: prefixResult,
    geometricScores: candidateScores,
    bestMatch: null,
    status: 'SYMBOLIC_REJECT',
    explanation: simResult.failureReason || `Symbolic sequence [${inputSymbols.join(', ')}] rejected by automaton. Not a valid constellation pattern prefix.`,
  };
}
