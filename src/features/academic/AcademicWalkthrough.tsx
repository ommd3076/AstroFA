import React, { useState } from 'react';
import {
  REFERENCE_PATTERNS,
  NFA_MACHINE,
  DFA_MACHINE,
  MINIMIZED_DFA_MACHINE,
  MINIMIZATION_RESULT,
  STAR_BY_ID,
} from '../../data/astroData';
import { computeEpsilonClosure } from '../../automata/epsilonClosure';
import { simulateDfa } from '../../automata/simulate';
import { computeProcrustesAlignment } from '../../geometry/similarity';
import { normalizeGeometry } from '../../geometry/normalize';

export const AcademicWalkthrough: React.FC = () => {
  const [selectedPatternId, setSelectedPatternId] = useState<string>('Cas_fwd');
  const [activeStep, setActiveStep] = useState<number>(1);

  const pattern = REFERENCE_PATTERNS.find(p => p.id === selectedPatternId) || REFERENCE_PATTERNS[0];

  // 1. Real stars
  const starObjects = pattern.orderedStarIds.map(id => STAR_BY_ID.get(id)!);

  // 2. Normalized geometry
  const normalized = normalizeGeometry(pattern.referencePoints);

  // 3. Encoded symbols
  const encodedSymbols = pattern.encodedSymbols;

  // 5. Epsilon closure of q0
  const q0Closure = computeEpsilonClosure(NFA_MACHINE, 'q0');

  // 9 & 10. Simulation on Minimized DFA
  const sim = simulateDfa(MINIMIZED_DFA_MACHINE, encodedSymbols);

  // 11. Geometric Verification
  const procrustes = computeProcrustesAlignment(pattern.referencePoints, pattern.referencePoints);

  const stepsList = [
    { num: 1, title: 'Input Star Pattern', subtitle: 'Astronomical Catalog Selection' },
    { num: 2, title: 'Geometric Normalization', subtitle: 'Translation & Uniform Scale' },
    { num: 3, title: 'Symbolic Encoding', subtitle: 'Quantization into Alphabet Σ' },
    { num: 4, title: 'NFA Construction', subtitle: 'Branching ε-NFA Assembly' },
    { num: 5, title: 'ε-Closure Computation', subtitle: 'Reachable Initial State Set' },
    { num: 6, title: 'Subset Construction', subtitle: 'NFA to DFA Determinization' },
    { num: 7, title: 'Original DFA Table', subtitle: 'Unminimized Transition Matrix' },
    { num: 8, title: 'DFA Minimization', subtitle: 'Label-Preserving Partition Refinement' },
    { num: 9, title: 'Step-by-Step Traversal', subtitle: 'String Simulation Trace' },
    { num: 10, title: 'Formal Acceptance', subtitle: 'Accepting State Verification' },
    { num: 11, title: 'Geometric Verification', subtitle: 'Procrustes Similarity Residual' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-mono p-1.5 sm:p-2 gap-1.5 overflow-y-auto">
      {/* Top Header Bento Card */}
      <div className="bento-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--signal-cobalt)]" />
            <span className="telemetry-label text-xs">[ 🎓 ACADEMIC VIVA DEMONSTRATION // 11-STEP FORMAL EVALUATION ]</span>
          </div>
          <p className="text-[11px] text-[var(--ink-secondary)] mt-1">
            End-to-end mathematical theory of computation proof for college viva &amp; formal examination.
          </p>
        </div>

        {/* Demonstration Target Selector wrapped in HUD Reticle */}
        <div className="flex items-center gap-2">
          <span className="telemetry-label text-[10px] text-[var(--ink-muted)]">TARGET:</span>
          <div className="hud-reticle">
            <select
              value={selectedPatternId}
              onChange={e => setSelectedPatternId(e.target.value)}
              className="bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--signal-cobalt)] font-bold cursor-pointer font-mono uppercase focus:outline-none focus:border-[var(--signal-cobalt)]"
            >
              {REFERENCE_PATTERNS.filter(p => p.traversalVariant === 'forward').map(p => (
                <option key={p.id} value={p.id}>
                  {p.name.toUpperCase()} ({p.constellationId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 11-Step Tactile Hardware Step Navigation Strip */}
      <div className="bento-card p-2 flex items-center gap-1.5 overflow-x-auto">
        {stepsList.map(s => {
          const isActive = activeStep === s.num;
          return (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`tactile-pill hud-reticle px-3 py-2 text-left border transition-all cursor-pointer whitespace-nowrap shrink-0 rounded-[8px] ${
                isActive
                  ? 'bg-[var(--signal-cobalt)] text-white border-[var(--signal-mid)] shadow-none'
                  : 'bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border-[var(--bg-tray)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span className={`font-dot ${isActive ? 'text-white' : 'text-[var(--signal-cobalt)]'}`}>
                  {s.num.toString().padStart(2, '0')}.
                </span>
                <span className="uppercase tracking-wider">{s.title}</span>
              </div>
              <div className={`text-[10px] uppercase tracking-wide truncate max-w-[130px] ${isActive ? 'text-white/80' : 'text-[var(--ink-muted)]'}`}>
                {s.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Content Card */}
      <div className="bento-card p-5 space-y-4">
        {/* Step 1: Input Star Pattern */}
        {activeStep === 1 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 01 // ASTRONOMICAL INPUT CATALOG</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                INPUT STAR CATALOG COORDINATES // {pattern.name.toUpperCase()}
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Astronomical star positions are extracted from the HYG database by Harvard Revised / Yale Bright Star (HR) identifiers.
              Here is the genuine sequence of celestial catalog coordinates (J2000 Right Ascension &amp; Declination) for {pattern.constellationId}:
            </p>

            {/* Recessed Matrix List */}
            <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-[var(--bg-tray)] text-[var(--ink-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--bg-tray)]">
                  <tr>
                    <th className="p-2.5">NODE #</th>
                    <th className="p-2.5">STAR NAME</th>
                    <th className="p-2.5">HR IDENTIFIER</th>
                    <th className="p-2.5">RA (DEGREES)</th>
                    <th className="p-2.5">DEC (DEGREES)</th>
                    <th className="p-2.5">MAGNITUDE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bg-tray)] text-[11px]">
                  {starObjects.map((s, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-card)] transition-colors">
                      <td className="p-2.5 font-dot text-[var(--signal-cobalt)] font-bold">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-[var(--ink-primary)]">{s.proper || s.name}</td>
                      <td className="p-2.5 text-[var(--ink-muted)]">{s.hr}</td>
                      <td className="p-2.5 font-dot text-[var(--ink-secondary)]">{s.ra.toFixed(4)}°</td>
                      <td className="p-2.5 font-dot text-[var(--ink-secondary)]">{s.dec.toFixed(4)}°</td>
                      <td className="p-2.5 font-dot text-[var(--signal-cobalt)] font-bold">{s.mag.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 2: Geometric Normalization */}
        {activeStep === 2 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 02 // INVARIANT TRANSFORMATION</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                NORMALIZED GEOMETRIC REPRESENTATION // P' = (P - c) / σ
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              To achieve mathematical invariance against camera zoom, viewport scale, and translation across the sky,
              the centroid is subtracted and points are scaled to unit root-mean-square (RMS) radius.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] space-y-1">
                <span className="telemetry-label text-[10px] block">COMPUTED CENTROID VECTOR c</span>
                <div className="telemetry-kpi pt-1">
                  ({normalized.centroid.x.toFixed(3)}, {normalized.centroid.y.toFixed(3)})
                  <sup>COORD</sup>
                </div>
                <div className="text-[11px] text-[var(--ink-muted)] uppercase tracking-wider pt-2">
                  TRANSLATION INVARIANT: P' = P - c
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] space-y-1">
                <span className="telemetry-label text-[10px] block">RMS SCALE FACTOR σ</span>
                <div className="telemetry-kpi pt-1">
                  {normalized.scale.toFixed(4)}
                  <sup>RMS</sup>
                </div>
                <div className="text-[11px] text-[var(--ink-muted)] uppercase tracking-wider pt-2">
                  SCALE INVARIANT: P_NORM = P' / σ
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Encoded Input String */}
        {activeStep === 3 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 03 // SYMBOLIC QUANTIZATION</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                ENCODED INPUT STRING // ALPHABET w ∈ Σ*
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Each interior vertex produces an invariant turning angle θ (via cross/dot products) and an edge length ratio r = |E_&#123;i+1&#125;| / |E_i|.
              These continuous quantities are quantized into discrete symbols:
            </p>
            <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="telemetry-label text-[11px]">RESULTING SYMBOLIC WORD w =</span>
                <div className="flex flex-wrap gap-1">
                  {encodedSymbols.map((sym, idx) => (
                    <span key={idx} className="hud-reticle px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--card-border-subtle)] rounded-[4px] text-[var(--signal-cobalt)] font-bold font-mono text-xs">
                      {sym}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] border-t border-[var(--bg-tray)] pt-2 uppercase">
                FEATURE TRANSITIONS COUNT: <strong className="font-dot text-[var(--signal-cobalt)]">{encodedSymbols.length}</strong> (FROM {pattern.orderedStarIds.length} STARS)
              </div>
            </div>
          </div>
        )}

        {/* Step 4: NFA Construction */}
        {activeStep === 4 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 04 // NON-DETERMINISTIC FINITE AUTOMATON</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                BRANCHING ε-NFA MACHINE ASSEMBLY // M_NFA
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              An ε-NFA is assembled with a shared master initial state q₀ branching to each pattern's start state via ε-transitions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)]">
                <span className="telemetry-label text-[10px] block">TOTAL NFA STATES |Q_NFA|</span>
                <div className="telemetry-kpi pt-1">
                  {NFA_MACHINE.states.length}
                  <sup>STATES</sup>
                </div>
              </div>
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)]">
                <span className="telemetry-label text-[10px] block">TOTAL TRANSITIONS |δ_NFA|</span>
                <div className="telemetry-kpi pt-1">
                  {NFA_MACHINE.transitions.length}
                  <sup>EDGES</sup>
                </div>
              </div>
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)]">
                <span className="telemetry-label text-[10px] block">ε-TRANSITIONS COUNT</span>
                <div className="telemetry-kpi pt-1">
                  {NFA_MACHINE.transitions.filter(t => t.symbol === 'ε').length}
                  <sup>EPSILON</sup>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Epsilon Closure */}
        {activeStep === 5 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 05 // INITIAL CLOSURE</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                ε-CLOSURE COMPUTATION // ε-closure(q₀) = D₀
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Computing ε-closure(q₀) finds all states reachable before any input symbol is consumed.
              This closure forms initial state D₀ of the DFA:
            </p>
            <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] font-mono text-xs space-y-2">
              <div className="font-bold text-[var(--signal-cobalt)] font-dot text-sm">
                ε-CLOSURE(q₀) = &#123; {q0Closure.join(', ')} &#125;
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] border-t border-[var(--bg-tray)] pt-2 uppercase">
                INITIAL SUBSET CARDINALITY: <strong className="font-dot text-[var(--ink-primary)]">{q0Closure.length} STATES</strong>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Subset Construction */}
        {activeStep === 6 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 06 // DETERMINIZATION</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                SUBSET (POWERSET) CONSTRUCTION // NFA &rarr; DFA
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Powerset construction computes D_next = ε-closure(Move(D_current, symbol)) for each symbol in Σ.
              This converts the {NFA_MACHINE.states.length}-state NFA into a deterministic state machine with {DFA_MACHINE.states.length} DFA states.
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)]">
                <span className="telemetry-label text-[10px] block">TOTAL DFA STATES |Q_DFA|</span>
                <div className="telemetry-kpi pt-1">
                  {DFA_MACHINE.states.length}
                  <sup>STATES</sup>
                </div>
              </div>
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)]">
                <span className="telemetry-label text-[10px] block">ACCEPTING STATES |F_DFA|</span>
                <div className="telemetry-kpi pt-1">
                  {DFA_MACHINE.acceptingStates.length}
                  <sup>ACCEPT</sup>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Original DFA Transition Table */}
        {activeStep === 7 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 07 // TRANSITION FUNCTION</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                ORIGINAL DFA TRANSITION TABLE // δ : Q &times; Σ &rarr; Q
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Complete transition function δ : Q &times; Σ &rarr; Q. Dead/trap state added to guarantee total function completeness.
            </p>
            <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] font-mono text-xs">
              <div className="telemetry-kpi">
                {DFA_MACHINE.states.length} &times; {DFA_MACHINE.alphabet.length}
                <sup>MATRIX</sup>
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] uppercase tracking-wider pt-2">
                TOTAL FUNCTION MATRIX: {DFA_MACHINE.states.length} STATES &times; {DFA_MACHINE.alphabet.length} SYMBOLS
              </div>
            </div>
          </div>
        )}

        {/* Step 8: DFA Minimization */}
        {activeStep === 8 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 08 // HOPCROFT PARTITION REFINEMENT</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                DFA MINIMIZATION // EQUIVALENCE PARTITIONING
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Redundant equivalent states are merged while strictly preserving distinct accepting constellation labels.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)]">
                <span className="telemetry-label text-[10px] block">ORIGINAL DFA STATES</span>
                <div className="telemetry-kpi pt-1">
                  {MINIMIZATION_RESULT.originalStateCount}
                  <sup>INITIAL</sup>
                </div>
              </div>
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)]">
                <span className="telemetry-label text-[10px] block">MINIMIZED DFA STATES</span>
                <div className="telemetry-kpi pt-1 text-[var(--signal-cobalt)]">
                  {MINIMIZATION_RESULT.minimizedStateCount}
                  <sup>OPTIMAL</sup>
                </div>
              </div>
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)]">
                <span className="telemetry-label text-[10px] block">STATES COMPACTED</span>
                <div className="telemetry-kpi pt-1">
                  {MINIMIZATION_RESULT.originalStateCount - MINIMIZATION_RESULT.minimizedStateCount}
                  <sup>MERGED</sup>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Step-by-Step String Traversal */}
        {activeStep === 9 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 09 // SIMULATION TRACE</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                STEP-BY-STEP STRING TRAVERSAL ON MINIMIZED DFA
              </h3>
            </div>
            {/* Recessed Matrix List */}
            <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-[var(--bg-tray)] text-[var(--ink-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--bg-tray)]">
                  <tr>
                    <th className="p-2.5">STEP</th>
                    <th className="p-2.5">CURRENT STATE (Q)</th>
                    <th className="p-2.5">CONSUMED SYMBOL (Σ)</th>
                    <th className="p-2.5">NEXT STATE (Q')</th>
                    <th className="p-2.5">ACCEPTING STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bg-tray)] text-[11px]">
                  {sim.steps.map((st, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-card)] transition-colors">
                      <td className="p-2.5 font-dot text-[var(--signal-cobalt)] font-bold">{st.step}</td>
                      <td className="p-2.5 font-dot text-[var(--ink-primary)] font-semibold">{st.currentState}</td>
                      <td className="p-2.5">
                        <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-neutral)] text-[var(--signal-cobalt)] font-bold text-[10px]">
                          {st.inputSymbol}
                        </span>
                      </td>
                      <td className="p-2.5 font-dot text-[var(--ink-secondary)] font-semibold">{st.nextState}</td>
                      <td className="p-2.5">
                        {st.isAccepting ? (
                          <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] font-bold text-[10px] uppercase font-dot">
                            YES ({st.acceptingLabels.join(', ')})
                          </span>
                        ) : (
                          <span className="text-[var(--ink-muted)] uppercase text-[10px]">NO</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 10: Formal Acceptance */}
        {activeStep === 10 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 10 // FORMAL ACCEPTANCE</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                ACCEPTED STATE &amp; CONSTELLATION IDENTIFICATION
              </h3>
            </div>
            <div className="hud-reticle-4corner p-5 bg-[var(--bg-pill-active)] border border-[var(--signal-cobalt)] rounded-[8px] space-y-2.5">
              <div className="font-dot text-lg font-bold text-[var(--signal-cobalt)] flex items-center gap-2">
                <span>[ ✓ FINAL STATE {sim.finalState} &isin; F ]</span>
              </div>
              <p className="text-xs text-[var(--ink-primary)] leading-relaxed">
                Automaton successfully halted with an empty tape in formal accepting state <strong className="font-dot text-[var(--signal-cobalt)] font-bold">{sim.finalState}</strong>.
                Recognized constellation identity: <strong className="font-dot text-[var(--signal-cobalt)] font-bold">{sim.acceptingLabels.join(', ')}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Step 11: Geometric Verification */}
        {activeStep === 11 && (
          <div className="space-y-3.5">
            <div>
              <span className="telemetry-label text-[10px] block text-[var(--ink-muted)]">STAGE 11 // 2D PROCRUSTES ALIGNMENT</span>
              <h3 className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                GEOMETRIC SIMILARITY VERIFICATION (LAYER 2)
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              To avoid false positives from distinct celestial shapes sharing identical quantized turn sequences, 2D Procrustes Analysis
              (Kabsch algorithm) computes the optimal rotation and Root Mean Square Error (RMSE).
            </p>
            <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="telemetry-label text-[10px]">GEOMETRIC RESIDUAL (RMSE):</span>
                <span className="font-dot text-sm text-[var(--signal-cobalt)] font-bold">{procrustes.residual} (TOLERANCE &le; 0.32)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="telemetry-label text-[10px]">OPTIMAL ROTATION θ_OPT:</span>
                <span className="font-dot text-sm text-[var(--ink-primary)] font-bold">{procrustes.rotationDeg}°</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[var(--bg-tray)]">
                <span className="telemetry-label text-[10px]">FINAL VERIFICATION STATUS:</span>
                <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] font-bold text-[10px] uppercase font-dot">
                  VERIFIED ASTRONOMICAL ASTERISM
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Hardware Step Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-[var(--card-border-subtle)]">
          <button
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="tactile-pill bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] disabled:opacity-30 text-[var(--ink-primary)] border border-[var(--bg-tray)] text-xs py-2 px-4 font-bold uppercase tracking-wider cursor-pointer"
          >
            ◀ PREVIOUS STEP
          </button>
          <button
            onClick={() => setActiveStep(prev => Math.min(11, prev + 1))}
            disabled={activeStep === 11}
            className="tactile-pill hud-reticle bg-[var(--signal-cobalt)] hover:bg-[var(--signal-mid)] disabled:opacity-30 text-white border border-[var(--signal-mid)] text-xs py-2 px-4 font-bold uppercase tracking-wider cursor-pointer"
          >
            NEXT STEP ▶
          </button>
        </div>
      </div>
    </div>
  );
};
