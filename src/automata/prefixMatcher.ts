import type { DFA, PrefixMatchResult, StateId } from './types';
import { simulateDfa } from './simulate';

/**
 * Checks if a partial string of symbols is a valid prefix of any accepted constellation pattern in the DFA.
 * Uses reachability analysis to discover all candidate constellations that can still be matched.
 */
export function matchPrefix(dfa: DFA, inputSymbols: string[]): PrefixMatchResult {
  const sim = simulateDfa(dfa, inputSymbols);

  if (sim.steps.length < inputSymbols.length && inputSymbols.length > 0) {
    // Died mid-sequence
    return {
      isValidPrefix: false,
      isFullMatch: false,
      currentState: sim.finalState,
      reachableAcceptingLabels: [],
      currentAcceptingLabels: [],
      steps: sim.steps,
    };
  }

  const finalState = dfa.states.find(s => s.id === sim.finalState);
  if (!finalState || finalState.isDead) {
    return {
      isValidPrefix: false,
      isFullMatch: false,
      currentState: sim.finalState,
      reachableAcceptingLabels: [],
      currentAcceptingLabels: [],
      steps: sim.steps,
    };
  }

  // Reachability analysis from finalState: find all accepting states reachable via non-dead transitions
  const reachableAccepting = new Set<string>();
  if (finalState.isAccepting) {
    finalState.acceptingLabels.forEach(lbl => reachableAccepting.add(lbl));
  }

  const visited = new Set<StateId>([finalState.id]);
  const queue: StateId[] = [finalState.id];

  const adj = new Map<StateId, StateId[]>();
  for (const t of dfa.transitions) {
    if (!adj.has(t.from)) adj.set(t.from, []);
    adj.get(t.from)!.push(t.to);
  }

  const stateMap = new Map(dfa.states.map(s => [s.id, s]));

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const targets = adj.get(currId) || [];
    for (const targetId of targets) {
      if (!visited.has(targetId)) {
        visited.add(targetId);
        const targetState = stateMap.get(targetId);
        if (targetState && !targetState.isDead) {
          if (targetState.isAccepting) {
            targetState.acceptingLabels.forEach(lbl => reachableAccepting.add(lbl));
          }
          queue.push(targetId);
        }
      }
    }
  }

  const reachableLabels = Array.from(reachableAccepting).sort();

  return {
    isValidPrefix: reachableLabels.length > 0,
    isFullMatch: finalState.isAccepting,
    currentState: finalState.id,
    reachableAcceptingLabels: reachableLabels,
    currentAcceptingLabels: [...finalState.acceptingLabels],
    steps: sim.steps,
  };
}
