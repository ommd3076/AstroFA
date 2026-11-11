import starsData from './stars.json';
import constellationsData from './constellations.json';
import referencePatternsData from './referencePatterns.json';

import type { Star, IAUConstellation } from '../types/astronomy';
import type { ReferencePattern } from '../recognition/types';
import type { NFA, DFA, DFAMinimizationResult } from '../automata/types';

import { buildNFAFromPatterns } from '../automata/nfa';
import { nfaToDfa, type DeterminizationResult } from '../automata/determinize';
import { minimizeDfa } from '../automata/minimize';

export const STARS: Star[] = starsData as Star[];
export const CONSTELLATIONS: IAUConstellation[] = constellationsData as IAUConstellation[];
export const REFERENCE_PATTERNS: ReferencePattern[] = referencePatternsData as ReferencePattern[];

// Build shared NFA, DFA, and Minimized DFA once at startup
const nfaPatterns = REFERENCE_PATTERNS.map(p => ({
  patternId: p.id,
  constellationId: p.constellationId,
  name: p.name,
  symbols: p.encodedSymbols,
  toleranceAlternates: p.toleranceAlternates,
}));

export const NFA_MACHINE: NFA = buildNFAFromPatterns(nfaPatterns);
export const DETERMINIZATION_RESULT: DeterminizationResult = nfaToDfa(NFA_MACHINE);
export const DFA_MACHINE: DFA = DETERMINIZATION_RESULT.dfa;
export const MINIMIZATION_RESULT: DFAMinimizationResult = minimizeDfa(DFA_MACHINE);
export const MINIMIZED_DFA_MACHINE: DFA = MINIMIZATION_RESULT.minimizedDfa;

// Star and Constellation index maps for instant O(1) lookups
export const STAR_BY_ID = new Map<number, Star>(STARS.map(s => [s.id, s]));
export const STAR_BY_HR = new Map<number, Star>();
for (const s of STARS) {
  if (s.hr !== null) {
    STAR_BY_HR.set(s.hr, s);
  }
}

export const CONSTELLATION_BY_ID = new Map<string, IAUConstellation>(
  CONSTELLATIONS.map(c => [c.id, c])
);
