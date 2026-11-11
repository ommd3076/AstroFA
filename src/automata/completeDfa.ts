import type { DFA, DFAState, StateId } from './types';

/**
 * Completes a DFA by adding a dead (trap / sink) state and routing all undefined transitions to it.
 * A complete transition function δ: Q × Σ → Q is required by formal minimization algorithms like Hopcroft's.
 */
export function completeDfa(dfa: DFA): DFA {
  // If already marked complete and has deadState, return a clone
  if (dfa.isComplete) {
    return {
      ...dfa,
      states: dfa.states.map(s => ({ ...s })),
      transitions: dfa.transitions.map(t => ({ ...t })),
    };
  }

  const existingTransMap = new Map<string, StateId>();
  for (const t of dfa.transitions) {
    existingTransMap.set(`${t.from}:::${t.symbol}`, t.to);
  }

  // Check if any transitions are missing across all states and alphabet symbols
  const missingTransitions: Array<{ from: StateId; symbol: string }> = [];
  for (const state of dfa.states) {
    for (const symbol of dfa.alphabet) {
      const key = `${state.id}:::${symbol}`;
      if (!existingTransMap.has(key)) {
        missingTransitions.push({ from: state.id, symbol });
      }
    }
  }

  // If no transitions missing, it's already complete
  if (missingTransitions.length === 0) {
    return {
      ...dfa,
      states: dfa.states.map(s => ({ ...s })),
      transitions: dfa.transitions.map(t => ({ ...t })),
      isComplete: true,
    };
  }

  const deadStateId: StateId = 'q_dead';
  const deadState: DFAState = {
    id: deadStateId,
    name: 'q_dead (Trap / Sink)',
    isInitial: false,
    isAccepting: false,
    isDead: true,
    acceptingLabels: [],
    nfaSubset: [],
  };

  const newStates = [...dfa.states.map(s => ({ ...s })), deadState];
  const newTransitions = [...dfa.transitions.map(t => ({ ...t }))];

  // Route all missing transitions to the dead state
  for (const missing of missingTransitions) {
    newTransitions.push({
      from: missing.from,
      to: deadStateId,
      symbol: missing.symbol,
    });
  }

  // The dead state loops to itself on every symbol in the alphabet
  for (const symbol of dfa.alphabet) {
    newTransitions.push({
      from: deadStateId,
      to: deadStateId,
      symbol,
    });
  }

  return {
    states: newStates,
    alphabet: [...dfa.alphabet],
    initialState: dfa.initialState,
    transitions: newTransitions,
    acceptingStates: [...dfa.acceptingStates],
    isComplete: true,
    deadStateId,
  };
}
