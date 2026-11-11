import type { DFA, StateId } from '../../automata/types';

/**
 * Visual and behavioral truth fixture matching Frame 10 (ChatGPT Image Nov 11, 2026, 07_59_01 PM-8.png).
 * A canonical deterministic regular language recognizer over alphabet {0, 1}.
 */
export const FRAME_10_DFA: DFA = {
  states: [
    { id: 'Q0', name: 'Q0', isInitial: true, isAccepting: false, acceptingLabels: [], nfaSubset: ['q0'] },
    { id: 'Q1', name: 'Q1', isInitial: false, isAccepting: false, acceptingLabels: [], nfaSubset: ['q1'] },
    { id: 'Q2', name: 'Q2', isInitial: false, isAccepting: false, acceptingLabels: [], nfaSubset: ['q2'] },
    { id: 'Q3', name: 'Q3', isInitial: false, isAccepting: false, acceptingLabels: [], nfaSubset: ['q3'] },
    { id: 'Q5', name: 'Q5', isInitial: false, isAccepting: true, acceptingLabels: ['Accepting Terminal'], nfaSubset: ['q5'] },
  ],
  alphabet: ['0', '1'],
  initialState: 'Q0',
  transitions: [
    { from: 'Q0', to: 'Q1', symbol: '0' },
    { from: 'Q0', to: 'Q2', symbol: '1' },
    { from: 'Q1', to: 'Q1', symbol: '0' },
    { from: 'Q1', to: 'Q3', symbol: '1' },
    { from: 'Q2', to: 'Q1', symbol: '0' },
    { from: 'Q2', to: 'Q3', symbol: '1' },
    { from: 'Q3', to: 'Q5', symbol: '0' },
    { from: 'Q3', to: 'Q3', symbol: '1' },
    { from: 'Q5', to: 'Q5', symbol: '0' },
    { from: 'Q5', to: 'Q5', symbol: '1' },
  ],
  acceptingStates: ['Q5'],
  isComplete: true,
};

export const FRAME_10_METRICS = {
  patternCount: 312,
  alphabetSize: 2,
  dfaStates: 6,
  minimizedStates: 3,
};

export const FRAME_10_NODE_POSITIONS: Record<StateId, { x: number; y: number }> = {
  Q0: { x: 130, y: 155 },
  Q1: { x: 280, y: 155 },
  Q2: { x: 360, y: 245 },
  Q3: { x: 470, y: 155 },
  Q5: { x: 630, y: 155 },
};

export const FRAME_10_DEFAULT_INPUT = '010110';
