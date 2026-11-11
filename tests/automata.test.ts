import { describe, it, expect } from 'vitest';
import { buildNFAFromPatterns } from '../src/automata/nfa';
import { computeEpsilonClosure } from '../src/automata/epsilonClosure';
import { nfaToDfa } from '../src/automata/determinize';
import { completeDfa } from '../src/automata/completeDfa';
import { minimizeDfa } from '../src/automata/minimize';
import { simulateDfa } from '../src/automata/simulate';
import { matchPrefix } from '../src/automata/prefixMatcher';
import type { NFA } from '../src/automata/types';

describe('Theory of Computation: Finite Automata Core', () => {
  describe('Epsilon Closure', () => {
    it('computes basic ε-closure for single state with no ε-transitions', () => {
      const mockNfa: NFA = {
        states: [{ id: 'q0', name: 'q0', isInitial: true, isAccepting: false, acceptingLabels: [] }],
        alphabet: ['a'],
        initialState: 'q0',
        transitions: [],
        acceptingStates: [],
      };
      expect(computeEpsilonClosure(mockNfa, 'q0')).toEqual(['q0']);
    });

    it('computes multi-hop ε-chains: q0 -> q1 -> q2', () => {
      const mockNfa: NFA = {
        states: [
          { id: 'q0', name: 'q0', isInitial: true, isAccepting: false, acceptingLabels: [] },
          { id: 'q1', name: 'q1', isInitial: false, isAccepting: false, acceptingLabels: [] },
          { id: 'q2', name: 'q2', isInitial: false, isAccepting: true, acceptingLabels: ['L1'] },
        ],
        alphabet: ['a'],
        initialState: 'q0',
        transitions: [
          { from: 'q0', to: 'q1', symbol: 'ε' },
          { from: 'q1', to: 'q2', symbol: 'ε' },
        ],
        acceptingStates: ['q2'],
      };
      expect(computeEpsilonClosure(mockNfa, 'q0')).toEqual(['q0', 'q1', 'q2']);
    });

    it('handles ε-cycles without infinite loops: q0 -> q1 -> q0', () => {
      const mockNfa: NFA = {
        states: [
          { id: 'q0', name: 'q0', isInitial: true, isAccepting: false, acceptingLabels: [] },
          { id: 'q1', name: 'q1', isInitial: false, isAccepting: false, acceptingLabels: [] },
        ],
        alphabet: ['a'],
        initialState: 'q0',
        transitions: [
          { from: 'q0', to: 'q1', symbol: 'ε' },
          { from: 'q1', to: 'q0', symbol: 'ε' },
        ],
        acceptingStates: [],
      };
      expect(computeEpsilonClosure(mockNfa, 'q0')).toEqual(['q0', 'q1']);
    });
  });

  describe('NFA Construction, Determinization & Language Equivalence', () => {
    it('handles empty pattern set gracefully', () => {
      const nfa = buildNFAFromPatterns([]);
      expect(nfa.states.length).toBe(1);
      const { dfa } = nfaToDfa(nfa);
      expect(dfa.states.length).toBe(1);
      expect(dfa.acceptingStates.length).toBe(0);
    });

    it('builds NFA for single pattern and accepts correct string', () => {
      const patterns = [
        {
          patternId: 'p1',
          constellationId: 'Cas',
          name: 'Cassiopeia',
          symbols: ['L:M', 'R:S'],
        },
      ];

      const nfa = buildNFAFromPatterns(patterns);
      const { dfa } = nfaToDfa(nfa);
      const min = minimizeDfa(dfa).minimizedDfa;

      // Positive test
      const sim1 = simulateDfa(dfa, ['L:M', 'R:S']);
      expect(sim1.accepted).toBe(true);
      expect(sim1.acceptingLabels).toContain('Cas');

      const simMin = simulateDfa(min, ['L:M', 'R:S']);
      expect(simMin.accepted).toBe(true);
      expect(simMin.acceptingLabels).toContain('Cas');

      // Negative test: invalid symbol
      const sim2 = simulateDfa(dfa, ['L:M', 'LL:G']);
      expect(sim2.accepted).toBe(false);

      // Negative test: wrong length / prefix
      const sim3 = simulateDfa(dfa, ['L:M']);
      expect(sim3.accepted).toBe(false);
    });

    it('correctly determinizes and recognizes shared prefixes without interference', () => {
      const patterns = [
        {
          patternId: 'p1',
          constellationId: 'Ori',
          name: 'Orion',
          symbols: ['L:M', 'S:S', 'R:G'],
        },
        {
          patternId: 'p2',
          constellationId: 'Cas',
          name: 'Cassiopeia',
          symbols: ['L:M', 'S:S', 'LL:M'],
        },
      ];

      const nfa = buildNFAFromPatterns(patterns);
      const { dfa } = nfaToDfa(nfa);
      const min = minimizeDfa(dfa).minimizedDfa;

      // Check Orion
      const simOri = simulateDfa(min, ['L:M', 'S:S', 'R:G']);
      expect(simOri.accepted).toBe(true);
      expect(simOri.acceptingLabels).toEqual(['Ori']);

      // Check Cassiopeia
      const simCas = simulateDfa(min, ['L:M', 'S:S', 'LL:M']);
      expect(simCas.accepted).toBe(true);
      expect(simCas.acceptingLabels).toEqual(['Cas']);

      // Prefix check: 'L:M', 'S:S' is prefix for both
      const prefix = matchPrefix(min, ['L:M', 'S:S']);
      expect(prefix.isValidPrefix).toBe(true);
      expect(prefix.isFullMatch).toBe(false);
      expect(prefix.reachableAcceptingLabels.sort()).toEqual(['Cas', 'Ori']);
    });

    it('preserves distinct constellation labels during minimization (does NOT conflate different patterns)', () => {
      const patterns = [
        {
          patternId: 'pA',
          constellationId: 'A_Constellation',
          name: 'Pattern A',
          symbols: ['S:M', 'R:S'],
        },
        {
          patternId: 'pB',
          constellationId: 'B_Constellation',
          name: 'Pattern B',
          symbols: ['R:M', 'R:S'],
        },
      ];

      const nfa = buildNFAFromPatterns(patterns);
      const { dfa } = nfaToDfa(nfa);
      const minResult = minimizeDfa(dfa);
      const minDfa = minResult.minimizedDfa;

      const simA = simulateDfa(minDfa, ['S:M', 'R:S']);
      const simB = simulateDfa(minDfa, ['R:M', 'R:S']);

      expect(simA.accepted).toBe(true);
      expect(simA.acceptingLabels).toEqual(['A_Constellation']);

      expect(simB.accepted).toBe(true);
      expect(simB.acceptingLabels).toEqual(['B_Constellation']);

      // Ensure their accepting states are distinct
      expect(simA.finalState).not.toBe(simB.finalState);
    });

    it('exhaustive short-string language equivalence between DFA and Minimized DFA', () => {
      const patterns = [
        {
          patternId: 'p1',
          constellationId: 'Alpha',
          name: 'Alpha',
          symbols: ['A', 'B'],
        },
        {
          patternId: 'p2',
          constellationId: 'Beta',
          name: 'Beta',
          symbols: ['A', 'C'],
        },
      ];

      const nfa = buildNFAFromPatterns(patterns);
      const { dfa } = nfaToDfa(nfa);
      const minDfa = minimizeDfa(dfa).minimizedDfa;

      const testAlphabet = ['A', 'B', 'C', 'D'];
      // Generate all strings of length 0 to 3
      const testStrings: string[][] = [[]];
      for (const c1 of testAlphabet) {
        testStrings.push([c1]);
        for (const c2 of testAlphabet) {
          testStrings.push([c1, c2]);
          for (const c3 of testAlphabet) {
            testStrings.push([c1, c2, c3]);
          }
        }
      }

      for (const str of testStrings) {
        const dfaRes = simulateDfa(dfa, str);
        const minRes = simulateDfa(minDfa, str);

        expect(minRes.accepted).toBe(dfaRes.accepted);
        if (dfaRes.accepted) {
          expect(minRes.acceptingLabels.sort()).toEqual(dfaRes.acceptingLabels.sort());
        }
      }
    });

    it('correctly creates and handles dead/sink state in complete DFA', () => {
      const patterns = [
        {
          patternId: 'p1',
          constellationId: 'Test',
          name: 'Test',
          symbols: ['X', 'Y'],
        },
      ];

      const nfa = buildNFAFromPatterns(patterns);
      const { dfa } = nfaToDfa(nfa);
      const completed = completeDfa(dfa);

      expect(completed.isComplete).toBe(true);
      expect(completed.deadStateId).toBeDefined();

      const deadState = completed.states.find(s => s.id === completed.deadStateId);
      expect(deadState).toBeDefined();
      expect(deadState?.isDead).toBe(true);
      expect(deadState?.isAccepting).toBe(false);

      // Any missing transition in dfa should now point to dead state
      const sim = simulateDfa(completed, ['Y']); // invalid first symbol
      expect(sim.accepted).toBe(false);
      expect(sim.finalState).toBe(completed.deadStateId);
    });

    it('handles ambiguous pattern matches by retaining multiple constellation labels at accepting state', () => {
      const patterns = [
        {
          patternId: 'pA',
          constellationId: 'Constellation_Alpha',
          name: 'Alpha Pattern',
          symbols: ['L:M', 'R:S'],
        },
        {
          patternId: 'pB',
          constellationId: 'Constellation_Beta',
          name: 'Beta Pattern',
          symbols: ['L:M', 'R:S'], // identical symbol sequence
        },
      ];

      const nfa = buildNFAFromPatterns(patterns);
      const { dfa } = nfaToDfa(nfa);
      const minDfa = minimizeDfa(dfa).minimizedDfa;

      const sim = simulateDfa(minDfa, ['L:M', 'R:S']);
      expect(sim.accepted).toBe(true);
      expect(sim.acceptingLabels).toContain('Constellation_Alpha');
      expect(sim.acceptingLabels).toContain('Constellation_Beta');
      expect(sim.acceptingLabels.length).toBe(2);
    });
  });
});
