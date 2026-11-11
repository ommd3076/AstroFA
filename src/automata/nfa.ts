import type { NFA, NFAState, NFATransition, StateId } from './types';
import { EPSILON } from './epsilonClosure';

export interface PatternDefinition {
  patternId: string;
  constellationId: string;
  name: string;
  // Primary sequence of symbols
  symbols: string[];
  // Optional tolerance alternate symbols per step (stepIndex -> list of alternate symbols)
  toleranceAlternates?: Record<number, string[]>;
}

/**
 * Builds an ε-NFA from multiple constellation reference patterns.
 * Structure:
 * - A single master initial state q0
 * - ε-transitions from q0 to each pattern's entry state
 * - Linear or branching path of states for each symbol sequence
 * - Accepting state at the end of each pattern path labeled with constellation ID
 */
export function buildNFAFromPatterns(patterns: PatternDefinition[]): NFA {
  const states: NFAState[] = [];
  const transitions: NFATransition[] = [];
  const alphabetSet = new Set<string>();

  // Master initial state
  const initialStateId: StateId = 'q0';
  states.push({
    id: initialStateId,
    name: 'q0 (Start)',
    isInitial: true,
    isAccepting: false,
    acceptingLabels: [],
  });

  patterns.forEach((pattern, pIdx) => {
    const pPrefix = `p${pIdx + 1}_${pattern.patternId}`;
    const startStateId: StateId = `${pPrefix}_s0`;

    states.push({
      id: startStateId,
      name: `${pattern.patternId} [0]`,
      isInitial: false,
      isAccepting: pattern.symbols.length === 0,
      acceptingLabels: pattern.symbols.length === 0 ? [pattern.constellationId] : [],
    });

    // ε-transition from master q0 to this pattern's start state
    transitions.push({
      from: initialStateId,
      to: startStateId,
      symbol: EPSILON,
    });

    let prevStateId = startStateId;

    for (let sIdx = 0; sIdx < pattern.symbols.length; sIdx++) {
      const primarySymbol = pattern.symbols[sIdx];
      alphabetSet.add(primarySymbol);

      const nextStateId: StateId = `${pPrefix}_s${sIdx + 1}`;
      const isFinal = sIdx === pattern.symbols.length - 1;

      states.push({
        id: nextStateId,
        name: `${pattern.patternId} [${sIdx + 1}]`,
        isInitial: false,
        isAccepting: isFinal,
        acceptingLabels: isFinal ? [pattern.constellationId] : [],
      });

      // Primary transition
      transitions.push({
        from: prevStateId,
        to: nextStateId,
        symbol: primarySymbol,
      });

      // Add tolerance alternative transitions if defined
      const alternates = pattern.toleranceAlternates?.[sIdx];
      if (alternates && alternates.length > 0) {
        for (const altSymbol of alternates) {
          alphabetSet.add(altSymbol);
          transitions.push({
            from: prevStateId,
            to: nextStateId,
            symbol: altSymbol,
          });
        }
      }

      prevStateId = nextStateId;
    }
  });

  const acceptingStates = states.filter(s => s.isAccepting).map(s => s.id);
  const alphabet = Array.from(alphabetSet).sort();

  return {
    states,
    alphabet,
    initialState: initialStateId,
    transitions,
    acceptingStates,
  };
}
