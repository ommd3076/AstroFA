import type { DFA, DFATransition, SimulationResult, SimulationStep, StateId } from './types';

/**
 * Simulates an input string step-by-step on a DFA.
 * Returns full execution history, transitions taken, and acceptance status.
 */
export function simulateDfa(dfa: DFA, inputSymbols: string[]): SimulationResult {
  const steps: SimulationStep[] = [];
  const stateLookup = new Map(dfa.states.map(s => [s.id, s]));

  // Build transition map (fromState:::symbol -> transition)
  const transMap = new Map<string, DFATransition>();
  for (const t of dfa.transitions) {
    transMap.set(`${t.from}:::${t.symbol}`, t);
  }

  let currentStateId: StateId = dfa.initialState;
  let currentState = stateLookup.get(currentStateId);

  if (!currentState) {
    return {
      accepted: false,
      input: inputSymbols,
      finalState: currentStateId,
      finalStateName: 'Unknown',
      steps: [],
      acceptingLabels: [],
      failureReason: `Initial state ${currentStateId} not found in DFA.`,
    };
  }

  // Handle empty input string (ε)
  if (inputSymbols.length === 0) {
    return {
      accepted: currentState.isAccepting,
      input: [],
      finalState: currentStateId,
      finalStateName: currentState.name,
      steps: [],
      acceptingLabels: [...currentState.acceptingLabels],
      failureReason: currentState.isAccepting ? undefined : 'Empty string does not lead to an accepting state.',
    };
  }

  for (let i = 0; i < inputSymbols.length; i++) {
    const sym = inputSymbols[i];
    const key = `${currentStateId}:::${sym}`;
    const transition = transMap.get(key);

    if (!transition) {
      return {
        accepted: false,
        input: inputSymbols,
        finalState: currentStateId,
        finalStateName: currentState.name,
        steps,
        acceptingLabels: [],
        failureReason: `No valid transition from state '${currentState.name}' on symbol '${sym}' at step ${i + 1}.`,
      };
    }

    const nextState = stateLookup.get(transition.to);
    if (!nextState) {
      return {
        accepted: false,
        input: inputSymbols,
        finalState: currentStateId,
        finalStateName: currentState.name,
        steps,
        acceptingLabels: [],
        failureReason: `Target state '${transition.to}' not found in DFA.`,
      };
    }

    steps.push({
      step: i + 1,
      currentState: currentStateId,
      currentStateName: currentState.name,
      inputSymbol: sym,
      nextState: nextState.id,
      nextStateName: nextState.name,
      transitionTaken: transition,
      remainingSymbols: inputSymbols.slice(i + 1),
      isAccepting: nextState.isAccepting,
      acceptingLabels: [...nextState.acceptingLabels],
    });

    currentStateId = nextState.id;
    currentState = nextState;

    if (currentState.isDead) {
      return {
        accepted: false,
        input: inputSymbols,
        finalState: currentStateId,
        finalStateName: currentState.name,
        steps,
        acceptingLabels: [],
        failureReason: `Execution entered dead/trap state on symbol '${sym}' at step ${i + 1}.`,
      };
    }
  }

  const isAccepted = currentState.isAccepting;
  return {
    accepted: isAccepted,
    input: inputSymbols,
    finalState: currentStateId,
    finalStateName: currentState.name,
    steps,
    acceptingLabels: [...currentState.acceptingLabels],
    failureReason: isAccepted
      ? undefined
      : `Ended in non-accepting state '${currentState.name}'. Pattern is an incomplete prefix or non-matching string.`,
  };
}
