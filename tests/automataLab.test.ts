import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  FRAME_10_DFA,
  FRAME_10_METRICS,
  FRAME_10_NODE_POSITIONS,
  FRAME_10_DEFAULT_INPUT,
} from '../src/features/automataLab/referenceFixture';
import {
  DFA_MACHINE,
  MINIMIZED_DFA_MACHINE,
  NFA_MACHINE,
  REFERENCE_PATTERNS,
} from '../src/data/astroData';
import { simulateDfa } from '../src/automata/simulate';

describe('AUTOMATA-01: Automata Lab Hardware Instrument Panel & Frame 10 Visual Truth', () => {
  const labSource = fs.readFileSync(
    path.resolve('src/features/automataLab/AutomataLab.tsx'),
    'utf-8'
  );
  const panelSource = fs.readFileSync(
    path.resolve('src/features/automataLab/AutomataInstrumentPanel.tsx'),
    'utf-8'
  );

  describe('Frame 10 Benchmark Fixture & Deterministic Simulation', () => {
    it('defines Frame 10 DFA with exactly 5 states and alphabet {0, 1}', () => {
      expect(FRAME_10_DFA.states.map(s => s.id)).toEqual(['Q0', 'Q1', 'Q2', 'Q3', 'Q5']);
      expect(FRAME_10_DFA.alphabet).toEqual(['0', '1']);
      expect(FRAME_10_DFA.initialState).toBe('Q0');
      expect(FRAME_10_DFA.acceptingStates).toEqual(['Q5']);
    });

    it('matches Frame 10 visual metric counts (312, 2, 6, 3)', () => {
      expect(FRAME_10_METRICS.patternCount).toBe(312);
      expect(FRAME_10_METRICS.alphabetSize).toBe(2);
      expect(FRAME_10_METRICS.dfaStates).toBe(6);
      expect(FRAME_10_METRICS.minimizedStates).toBe(3);
    });

    it('has node positions defined for all 5 states matching Frame 10 layout', () => {
      for (const state of FRAME_10_DFA.states) {
        const pos = FRAME_10_NODE_POSITIONS[state.id];
        expect(pos).toBeDefined();
        expect(pos.x).toBeGreaterThan(0);
        expect(pos.y).toBeGreaterThan(0);
      }
      // Q0 is start state on left, Q5 is accepting state on right
      expect(FRAME_10_NODE_POSITIONS['Q0'].x).toBeLessThan(FRAME_10_NODE_POSITIONS['Q5'].x);
      // Q2 is positioned lower vertically
      expect(FRAME_10_NODE_POSITIONS['Q2'].y).toBeGreaterThan(FRAME_10_NODE_POSITIONS['Q1'].y);
    });

    it('simulates Frame 10 sample input string "010110" to ACCEPT in exactly 6 steps terminating at Q5', () => {
      const symbols = FRAME_10_DEFAULT_INPUT.split('');
      const sim = simulateDfa(FRAME_10_DFA, symbols);
      expect(sim.accepted).toBe(true);
      expect(sim.steps.length).toBe(6);
      expect(sim.finalState).toBe('Q5');

      const statePath = [FRAME_10_DFA.initialState, ...sim.steps.map(s => s.nextState)];
      expect(statePath).toEqual(['Q0', 'Q1', 'Q3', 'Q5', 'Q5', 'Q5', 'Q5']);
    });

    it('correctly rejects invalid symbol string and non-accepting strings in benchmark fixture', () => {
      // String ending in non-accepting state
      const rejSim = simulateDfa(FRAME_10_DFA, ['1', '1']);
      expect(rejSim.accepted).toBe(false);
      expect(rejSim.finalState).toBe('Q3');

      // String with symbol not in alphabet {0, 1}
      const invalidSim = simulateDfa(FRAME_10_DFA, ['0', '2']);
      expect(invalidSim.accepted).toBe(false);
      expect(invalidSim.failureReason).toBeDefined();
    });
  });

  describe('Live Generated Engine Machine Data Truth', () => {
    it('verifies actual generated DFA_MACHINE states, alphabet, and initial state', () => {
      expect(DFA_MACHINE.states.length).toBe(74);
      expect(DFA_MACHINE.alphabet.length).toBe(15);
      expect(DFA_MACHINE.initialState).toBe('D0');
      expect(DFA_MACHINE.acceptingStates.length).toBe(26);
    });

    it('verifies actual generated MINIMIZED_DFA_MACHINE partition refinement counts', () => {
      expect(MINIMIZED_DFA_MACHINE.states.length).toBe(63);
      expect(MINIMIZED_DFA_MACHINE.alphabet.length).toBe(15);
      expect(MINIMIZED_DFA_MACHINE.initialState).toBe('m0');
      expect(MINIMIZED_DFA_MACHINE.acceptingStates.length).toBe(14);
    });

    it('verifies actual generated NFA_MACHINE structure', () => {
      expect(NFA_MACHINE.states.length).toBe(107);
      expect(NFA_MACHINE.alphabet.length).toBe(15);
      expect(NFA_MACHINE.initialState).toBe('q0');
    });

    it('verifies canonical asterism pattern count is 24', () => {
      expect(REFERENCE_PATTERNS.length).toBe(24);
    });

    it('simulates live constellation patterns (Orion & Cassiopeia) on MINIMIZED_DFA_MACHINE', () => {
      const orion = REFERENCE_PATTERNS.find(p => p.id === 'Ori_fwd')!;
      const cas = REFERENCE_PATTERNS.find(p => p.id === 'Cas_fwd')!;

      const orionSim = simulateDfa(MINIMIZED_DFA_MACHINE, orion.encodedSymbols);
      expect(orionSim.accepted).toBe(true);

      const casSim = simulateDfa(MINIMIZED_DFA_MACHINE, cas.encodedSymbols);
      expect(casSim.accepted).toBe(true);
    });
  });

  describe('Structure, Typography & Component Contracts', () => {
    it('retains all eight educational tab views in AutomataLab', () => {
      const requiredTabs = [
        'NfaView',
        'EpsilonClosureView',
        'SubsetConstructionView',
        'DfaView',
        'MinimizedDfaView',
        'SimulatorView',
        'FormalDefinitionView',
        'TransitionTableView',
      ];
      for (const tab of requiredTabs) {
        expect(labSource).toContain(tab);
      }
    });

    it('contains ExportModal integration', () => {
      expect(labSource).toContain('ExportModal');
      expect(labSource).toContain('EXPORT SUITE');
    });

    it('renders double ring for accepting states in AutomataInstrumentPanel', () => {
      expect(panelSource).toContain('Double Ring for Accepting States');
      expect(panelSource).toContain('r="27"');
      expect(panelSource).toContain('r="22"');
    });

    it('renders entry arrow for initial start state', () => {
      expect(panelSource).toContain('Initial State Entry Arrow');
      expect(panelSource).toContain('entry-arrowhead');
    });

    it('renders formal tuple M = (Q, Σ, δ, q₀, F)', () => {
      expect(panelSource).toContain('M = (Q, Σ, δ, q₀, F)');
    });

    it('uses monospace typography (IBM Plex Mono and Doto)', () => {
      expect(panelSource).toContain('IBM Plex Mono');
      expect(panelSource).toContain('Doto');
      expect(panelSource).toContain('font-mono');
    });

    it('narrowed transitions: no transition-all on interactive state buttons', () => {
      expect(labSource).not.toContain('transition-all');
      expect(panelSource).not.toContain('transition-all');
    });
  });
});
