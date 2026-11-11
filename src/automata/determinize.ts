import type { NFA, DFA, DFAState, DFATransition, StateId } from './types';
import { computeEpsilonClosure } from './epsilonClosure';

export interface DeterminizationStep {
  step: number;
  dfaStateId: StateId;
  dfaStateName: string;
  nfaSubset: StateId[];
  symbol: string;
  reachableNfaStates: StateId[];
  epsilonClosureStates: StateId[];
  targetDfaStateId: StateId;
  isNewDfaState: boolean;
}

export interface DeterminizationResult {
  dfa: DFA;
  steps: DeterminizationStep[];
}

/**
 * Converts an ε-NFA to an equivalent DFA using the classic Subset (Powerset) Construction algorithm.
 * Preserves accepting pattern labels across all NFA states in each subset.
 */
export function nfaToDfa(nfa: NFA): DeterminizationResult {
  const steps: DeterminizationStep[] = [];
  const subsetKey = (subset: StateId[]) => [...subset].sort().join(',');

  // Pre-index NFA transitions by (fromState, symbol) for fast lookup
  const nfaTransMap = new Map<string, StateId[]>();
  for (const t of nfa.transitions) {
    if (t.symbol !== '' && t.symbol !== 'ε') {
      const key = `${t.from}:::${t.symbol}`;
      if (!nfaTransMap.has(key)) {
        nfaTransMap.set(key, []);
      }
      nfaTransMap.get(key)!.push(t.to);
    }
  }

  // Pre-index NFA states for fast lookup
  const nfaStateMap = new Map(nfa.states.map(s => [s.id, s]));

  // Helper to extract accepting labels from an NFA subset
  const getAcceptingLabels = (subset: StateId[]): string[] => {
    const labels = new Set<string>();
    for (const sid of subset) {
      const s = nfaStateMap.get(sid);
      if (s && s.isAccepting) {
        s.acceptingLabels.forEach(lbl => labels.add(lbl));
      }
    }
    return Array.from(labels).sort();
  };

  // Initial DFA state: ε-closure of NFA initial state
  const initialSubset = computeEpsilonClosure(nfa, nfa.initialState);
  const initialKey = subsetKey(initialSubset);

  const dfaStates: DFAState[] = [];
  const dfaTransitions: DFATransition[] = [];
  const subsetToDfaId = new Map<string, StateId>();

  let stateCounter = 0;
  const getNextDfaId = () => `D${stateCounter++}`;

  const initialDfaId = getNextDfaId();
  subsetToDfaId.set(initialKey, initialDfaId);

  const initialLabels = getAcceptingLabels(initialSubset);
  const initialDfaState: DFAState = {
    id: initialDfaId,
    name: `D0 {${initialSubset.join(', ')}}`,
    isInitial: true,
    isAccepting: initialLabels.length > 0,
    acceptingLabels: initialLabels,
    nfaSubset: initialSubset,
  };
  dfaStates.push(initialDfaState);

  // Queue of subsets to process: [dfaStateId, subset]
  const queue: Array<{ id: StateId; subset: StateId[] }> = [
    { id: initialDfaId, subset: initialSubset },
  ];

  let stepCount = 0;

  while (queue.length > 0) {
    const { id: currentDfaId, subset: currentSubset } = queue.shift()!;
    const currentStateObj = dfaStates.find(s => s.id === currentDfaId)!;

    for (const symbol of nfa.alphabet) {
      // Find all NFA states reachable from currentSubset on symbol
      const directReachable = new Set<StateId>();
      for (const sid of currentSubset) {
        const key = `${sid}:::${symbol}`;
        const targets = nfaTransMap.get(key) || [];
        targets.forEach(t => directReachable.add(t));
      }

      if (directReachable.size === 0) {
        continue;
      }

      const directArr = Array.from(directReachable).sort();
      // Apply ε-closure
      const closureArr = computeEpsilonClosure(nfa, directArr);
      const targetKey = subsetKey(closureArr);

      let targetDfaId = subsetToDfaId.get(targetKey);
      let isNew = false;

      if (!targetDfaId) {
        isNew = true;
        targetDfaId = getNextDfaId();
        subsetToDfaId.set(targetKey, targetDfaId);

        const targetLabels = getAcceptingLabels(closureArr);
        const newDfaState: DFAState = {
          id: targetDfaId,
          name: `${targetDfaId} {${closureArr.join(', ')}}`,
          isInitial: false,
          isAccepting: targetLabels.length > 0,
          acceptingLabels: targetLabels,
          nfaSubset: closureArr,
        };
        dfaStates.push(newDfaState);
        queue.push({ id: targetDfaId, subset: closureArr });
      }

      dfaTransitions.push({
        from: currentDfaId,
        to: targetDfaId,
        symbol,
      });

      steps.push({
        step: ++stepCount,
        dfaStateId: currentDfaId,
        dfaStateName: currentStateObj.name,
        nfaSubset: currentSubset,
        symbol,
        reachableNfaStates: directArr,
        epsilonClosureStates: closureArr,
        targetDfaStateId: targetDfaId,
        isNewDfaState: isNew,
      });
    }
  }

  const acceptingStates = dfaStates.filter(s => s.isAccepting).map(s => s.id);

  const dfa: DFA = {
    states: dfaStates,
    alphabet: [...nfa.alphabet],
    initialState: initialDfaId,
    transitions: dfaTransitions,
    acceptingStates,
    isComplete: false,
  };

  return { dfa, steps };
}
