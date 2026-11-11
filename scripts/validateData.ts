import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Star, IAUConstellation } from '../src/types/astronomy';
import type { ReferencePattern } from '../src/recognition/types';
import { buildNFAFromPatterns } from '../src/automata/nfa';
import { nfaToDfa } from '../src/automata/determinize';
import { minimizeDfa } from '../src/automata/minimize';
import { simulateDfa } from '../src/automata/simulate';
import { encodeGeometry } from '../src/geometry/quantize';

const STARS_JSON = path.resolve('src/data/stars.json');
const CONST_JSON = path.resolve('src/data/constellations.json');
const PATTERNS_JSON = path.resolve('src/data/referencePatterns.json');

async function main() {
  console.log('=== DATA & AUTOMATA ENGINE VALIDATION ===');

  // 1. Validate star catalog
  const stars: Star[] = JSON.parse(fs.readFileSync(STARS_JSON, 'utf-8'));
  console.log(`Loaded ${stars.length} stars.`);
  const starIdSet = new Set(stars.map(s => s.id));
  const invalidStars = stars.filter(s => isNaN(s.ra) || isNaN(s.dec) || isNaN(s.mag));
  if (invalidStars.length > 0) {
    throw new Error(`Found ${invalidStars.length} stars with NaN coordinates/magnitude!`);
  }
  console.log('✓ All stars have valid numerical coordinates and visual magnitudes.');

  // 2. Validate IAU constellations
  const constellations: IAUConstellation[] = JSON.parse(fs.readFileSync(CONST_JSON, 'utf-8'));
  console.log(`Loaded ${constellations.length} IAU constellations.`);
  if (constellations.length !== 88) {
    throw new Error(`Expected exactly 88 IAU constellations, found ${constellations.length}`);
  }
  console.log('✓ Exactly 88 official IAU constellations present.');

  // Check line segment references
  let missingStarRefs = 0;
  for (const c of constellations) {
    for (const seg of c.lineSegments) {
      if (!starIdSet.has(seg.starId1) || !starIdSet.has(seg.starId2)) {
        missingStarRefs++;
      }
    }
  }
  if (missingStarRefs > 0) {
    throw new Error(`Found ${missingStarRefs} dangling star references in constellation lines!`);
  }
  console.log('✓ All constellation line segments refer to existing stars in catalog.');

  // 3. Validate Reference Patterns
  const patterns: ReferencePattern[] = JSON.parse(fs.readFileSync(PATTERNS_JSON, 'utf-8'));
  console.log(`Loaded ${patterns.length} reference patterns across 12 constellations.`);

  // 4. Construct Automata: NFA -> DFA -> Minimized DFA
  console.log('Building ε-NFA from reference patterns...');
  const nfaPatterns = patterns.map(p => ({
    patternId: p.id,
    constellationId: p.constellationId,
    name: p.name,
    symbols: p.encodedSymbols,
    toleranceAlternates: p.toleranceAlternates,
  }));

  const nfa = buildNFAFromPatterns(nfaPatterns);
  console.log(`NFA constructed: ${nfa.states.length} states, ${nfa.transitions.length} transitions, alphabet size: ${nfa.alphabet.length}`);

  console.log('Determinizing NFA to DFA via subset construction...');
  const { dfa } = nfaToDfa(nfa);
  console.log(`DFA constructed: ${dfa.states.length} states, ${dfa.transitions.length} transitions`);

  console.log('Minimizing DFA using partition refinement...');
  const minResult = minimizeDfa(dfa);
  const minDfa = minResult.minimizedDfa;
  console.log(`Minimized DFA: ${minDfa.states.length} states (reduced from ${minResult.originalStateCount}), ${minDfa.transitions.length} transitions`);

  // 5. Test String Acceptance on DFA and Minimized DFA
  console.log('\nTesting exact reference pattern acceptance...');
  let passedCount = 0;

  for (const p of patterns) {
    const dfaSim = simulateDfa(dfa, p.encodedSymbols);
    const minSim = simulateDfa(minDfa, p.encodedSymbols);

    if (!dfaSim.accepted) {
      throw new Error(`DFA rejected pattern ${p.id}! Failure: ${dfaSim.failureReason}`);
    }
    if (!minSim.accepted) {
      throw new Error(`Minimized DFA rejected pattern ${p.id}! Failure: ${minSim.failureReason}`);
    }

    if (!dfaSim.acceptingLabels.includes(p.constellationId)) {
      throw new Error(`DFA accepted ${p.id} but missing constellation ID ${p.constellationId}`);
    }
    if (!minSim.acceptingLabels.includes(p.constellationId)) {
      throw new Error(`Minimized DFA accepted ${p.id} but missing constellation ID ${p.constellationId}`);
    }

    passedCount++;
  }
  console.log(`✓ All ${passedCount} reference patterns successfully accepted by both DFA and Minimized DFA.`);

  // 6. Test Invariance (Rotation and Uniform Scale)
  console.log('\nTesting geometric rotation and uniform scale invariance...');
  for (const p of patterns.slice(0, 5)) {
    // Rotate 2D points by 47.3 degrees and scale by 2.5x
    const angleRad = (47.3 * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const scale = 2.5;

    const transformedPoints = p.referencePoints.map(pt => ({
      x: scale * (pt.x * cosA - pt.y * sinA) + 123.45,
      y: scale * (pt.x * sinA + pt.y * cosA) - 67.89,
    }));

    const transformedEncoding = encodeGeometry(transformedPoints);
    const sim = simulateDfa(minDfa, transformedEncoding.symbols);

    if (!sim.accepted || !sim.acceptingLabels.includes(p.constellationId)) {
      throw new Error(`Rotation/Scale invariance failed for ${p.id}! Expected: ${p.encodedSymbols.join(' ')}, Got: ${transformedEncoding.symbols.join(' ')}`);
    }
  }
  console.log('✓ Geometric rotation, uniform scale, and translation invariance verified.');

  console.log('\n=== ALL DATA & AUTOMATA ENGINE CHECKS PASSED ===');
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
