import type { NFA, StateId } from './types';

export const EPSILON = 'ε';
export const EPSILON_ALT = '';

/**
 * Checks if a transition symbol represents an epsilon transition.
 */
export function isEpsilon(symbol: string): boolean {
  return symbol === EPSILON || symbol === EPSILON_ALT;
}

/**
 * Computes the ε-closure of a single state or a set of states in an NFA.
 * Handles cycles and multi-hop ε-chains cleanly using BFS.
 */
export function computeEpsilonClosure(nfa: NFA, stateOrStates: StateId | StateId[]): StateId[] {
  const initialStates = Array.isArray(stateOrStates) ? stateOrStates : [stateOrStates];
  const closure = new Set<StateId>(initialStates);
  const queue: StateId[] = [...initialStates];

  // Pre-index epsilon transitions for O(1) adjacency lookup
  const epsAdj = new Map<StateId, StateId[]>();
  for (const t of nfa.transitions) {
    if (isEpsilon(t.symbol)) {
      if (!epsAdj.has(t.from)) {
        epsAdj.set(t.from, []);
      }
      epsAdj.get(t.from)!.push(t.to);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = epsAdj.get(current) || [];
    for (const neighbor of neighbors) {
      if (!closure.has(neighbor)) {
        closure.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Return deterministically sorted state IDs
  return Array.from(closure).sort();
}

/**
 * Computes the ε-closure for every individual state in the NFA.
 * Useful for the Automata Lab ε-closure explorer.
 */
export function computeAllEpsilonClosures(nfa: NFA): Record<StateId, StateId[]> {
  const result: Record<StateId, StateId[]> = {};
  for (const state of nfa.states) {
    result[state.id] = computeEpsilonClosure(nfa, state.id);
  }
  return result;
}
