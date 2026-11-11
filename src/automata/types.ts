/**
 * Formal Automata Types for Costellar
 * Formal Definition: M = (Q, Σ, δ, q0, F)
 */

export type StateId = string;

export interface NFAState {
  id: StateId;
  name: string;
  isInitial: boolean;
  isAccepting: boolean;
  acceptingLabels: string[]; // Constellation pattern IDs recognized at this state
}

export interface NFATransition {
  from: StateId;
  to: StateId;
  symbol: string; // empty string '' or 'ε' denotes epsilon-transition
}

export interface NFA {
  states: NFAState[];
  alphabet: string[]; // Σ
  initialState: StateId; // q0
  transitions: NFATransition[]; // δ: Q × (Σ ∪ {ε}) → P(Q)
  acceptingStates: StateId[]; // F
}

export interface DFAState {
  id: StateId;
  name: string;
  isInitial: boolean;
  isAccepting: boolean;
  isDead?: boolean;
  acceptingLabels: string[]; // Constellation pattern IDs recognized
  nfaSubset: StateId[]; // Corresponding NFA state subset from powerset construction
}

export interface DFATransition {
  from: StateId;
  to: StateId;
  symbol: string;
}

export interface DFA {
  states: DFAState[];
  alphabet: string[]; // Σ
  initialState: StateId; // q0
  transitions: DFATransition[]; // δ: Q × Σ → Q (or partial)
  acceptingStates: StateId[]; // F
  isComplete: boolean;
  deadStateId?: StateId;
}

export interface DFAMinimizationResult {
  minimizedDfa: DFA;
  originalStateCount: number;
  minimizedStateCount: number;
  partitions: StateId[][]; // Equivalent state groups
  partitionMap: Record<StateId, StateId>; // original -> minimized state ID
}

export interface SimulationStep {
  step: number;
  currentState: StateId;
  currentStateName: string;
  inputSymbol: string;
  nextState: StateId;
  nextStateName: string;
  transitionTaken: DFATransition;
  remainingSymbols: string[];
  isAccepting: boolean;
  acceptingLabels: string[];
}

export interface SimulationResult {
  accepted: boolean;
  input: string[];
  finalState: StateId;
  finalStateName: string;
  steps: SimulationStep[];
  acceptingLabels: string[];
  failureReason?: string;
}

export interface PrefixMatchResult {
  isValidPrefix: boolean;
  isFullMatch: boolean;
  currentState: StateId;
  reachableAcceptingLabels: string[]; // constellations that can still be reached
  currentAcceptingLabels: string[]; // constellations accepted right now
  steps: SimulationStep[];
}

export interface FormalDefinition {
  Q: string[]; // Set of states
  sigma: string[]; // Alphabet Σ
  q0: string; // Initial state
  F: string[]; // Accepting states
  transitionCount: number;
  description: string;
}
