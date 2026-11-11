import React from 'react';
import { MINIMIZED_DFA_MACHINE, DFA_MACHINE, NFA_MACHINE } from '../../data/astroData';

export const FormalDefinitionView: React.FC = () => {
  const dfa = MINIMIZED_DFA_MACHINE;

  const Q = dfa.states.map(s => s.id);
  const Sigma = dfa.alphabet;
  const q0 = dfa.initialState;
  const F = dfa.acceptingStates;

  return (
    <div className="w-full h-full flex flex-col gap-[6px] font-mono select-none overflow-y-auto pr-0.5">
      {/* Overview Banner — Bento Module Card */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] space-y-1.5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
            <h3 className="font-bold text-[var(--ink-primary,#181A20)] text-[11px] uppercase tracking-wider">
              Mathematical Model: Formal 5-Tuple Definition
            </h3>
            <span className="hud-reticle px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--signal-cobalt,#1D55F5)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              THEORY OF COMPUTATION SPECIFICATION
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary,#525866)] font-mono tracking-wider">
            CANONICAL REGULAR LANGUAGE MACHINE
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-secondary,#525866)] leading-relaxed uppercase tracking-wider">
          Rigorous academic specification of the constellation asterism recognition automaton.
          Complies with canonical Myhill-Nerode regular grammar definitions.
        </p>
      </div>

      {/* Formal Definition Hero Display — Bento Module Card */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-4 rounded-[12px] space-y-3">
        {/* Strict Monospace Technical Formalism */}
        <div className="text-center py-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)]">
          <div className="text-xl sm:text-2xl font-mono font-normal text-[var(--ink-primary,#181A20)] tracking-widest uppercase">
            M = ( Q, Σ, δ, q₀, F )
          </div>
          <div className="text-[10px] font-mono text-[var(--ink-secondary,#525866)] uppercase tracking-wider mt-1 font-semibold">
            DETERMINISTIC FINITE AUTOMATON FOR CONSTELLATION ASTERISM RECOGNITION
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
          {/* Q: States */}
          <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--signal-cobalt,#1D55F5)] text-[11px] uppercase tracking-wider">
                Q (FINITE SET OF STATES)
              </span>
              <span className="text-[10px] text-[var(--ink-muted,#8C93A0)] font-semibold">|Q| = {Q.length}</span>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider leading-relaxed">
              Equivalence classes of NFA state subsets produced by partition-refinement minimization.
            </p>
            <div className="text-[10px] text-[var(--ink-primary,#181A20)] break-words max-h-20 overflow-y-auto p-2 bg-[var(--bg-card,#F5F6F8)] rounded-[6px] border border-[rgba(0,0,0,0.06)]">
              {'{ ' + Q.join(', ') + ' }'}
            </div>
          </div>

          {/* Sigma: Alphabet */}
          <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--signal-cobalt,#1D55F5)] text-[11px] uppercase tracking-wider">
                Σ (FINITE FEATURE ALPHABET)
              </span>
              <span className="text-[10px] text-[var(--ink-muted,#8C93A0)] font-semibold">|Σ| = {Sigma.length}</span>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider leading-relaxed">
              Quantized pairs of relative turning category {'{LL, L, S, R, RR}'} and edge length ratio {'{S, M, G}'}.
            </p>
            <div className="text-[10px] text-[var(--ink-primary,#181A20)] break-words p-2 bg-[var(--bg-card,#F5F6F8)] rounded-[6px] border border-[rgba(0,0,0,0.06)]">
              {'{ ' + Sigma.join(', ') + ' }'}
            </div>
          </div>

          {/* q0: Initial State */}
          <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--signal-cobalt,#1D55F5)] text-[11px] uppercase tracking-wider">
                q₀ (INITIAL START STATE)
              </span>
              <span className="text-[10px] text-[var(--ink-muted,#8C93A0)] font-semibold">q₀ ∈ Q</span>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider leading-relaxed">
              Corresponds to ε-closure(q₀, NFA), the unified entry macro-state before input consumption.
            </p>
            <div className="text-[11px] text-[var(--signal-cobalt,#1D55F5)] font-bold p-2 bg-[var(--bg-card,#F5F6F8)] rounded-[6px] border border-[rgba(0,0,0,0.06)] font-['Doto',monospace]">
              q₀ = {q0}
            </div>
          </div>

          {/* F: Accepting States */}
          <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--signal-cobalt,#1D55F5)] text-[11px] uppercase tracking-wider">
                F (SET OF ACCEPTING STATES)
              </span>
              <span className="text-[10px] text-[var(--ink-muted,#8C93A0)] font-semibold">|F| = {F.length} STATES</span>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider leading-relaxed">
              Terminal acceptance states with constellation asterism label annotations:
            </p>
            <div className="text-[10px] text-[var(--ink-primary,#181A20)] break-words max-h-20 overflow-y-auto p-2 bg-[var(--bg-card,#F5F6F8)] rounded-[6px] border border-[rgba(0,0,0,0.06)] space-y-0.5">
              {F.map(fid => {
                const s = dfa.states.find(state => state.id === fid);
                return (
                  <div key={fid} className="flex items-center gap-1.5">
                    <strong className="text-[var(--signal-cobalt,#1D55F5)] font-['Doto',monospace]">{fid}:</strong>
                    <span className="uppercase text-[9px] text-[var(--ink-secondary,#525866)]">[{s?.acceptingLabels.join(', ')}]</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transition Function delta */}
        <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-1 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--signal-cobalt,#1D55F5)] text-[11px] uppercase tracking-wider">
              δ (TRANSITION FUNCTION)
            </span>
            <span className="text-[10px] text-[var(--ink-muted,#8C93A0)] font-semibold">δ : Q × Σ ➔ Q</span>
          </div>
          <p className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider leading-relaxed">
            Deterministic total mapping. Total transitions defined: <strong className="text-[var(--ink-primary,#181A20)]">{dfa.transitions.length}</strong> (including explicit dead state transitions guaranteeing total function completeness).
          </p>
        </div>
      </div>

      {/* Model Hierarchy Comparison Table — Recessed Matrix List */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3.5 space-y-2 flex-1 flex flex-col">
        <h4 className="text-[11px] font-bold text-[var(--ink-primary,#181A20)] uppercase tracking-wider">
          Automata Hierarchy in Costellar Pipeline
        </h4>
        <div className="overflow-x-auto border border-[var(--bg-tray,#E2E5EC)] rounded-[8px] bg-[var(--bg-card,#F5F6F8)]">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-[var(--bg-tray,#E2E5EC)] text-[var(--ink-secondary,#525866)] uppercase text-[10px] border-b border-[rgba(0,0,0,0.08)] font-semibold tracking-wider">
              <tr>
                <th className="p-2.5">MACHINE MODEL</th>
                <th className="p-2.5">TYPE</th>
                <th className="p-2.5">STATES |Q|</th>
                <th className="p-2.5">TRANSITIONS |δ|</th>
                <th className="p-2.5">DETERMINISM</th>
                <th className="p-2.5">LANGUAGE L(M)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg-tray,#E2E5EC)] text-[11px]">
              <tr className="hover:bg-[var(--bg-pill-neutral,#E6E9EF)] transition-colors">
                <td className="p-2.5 font-bold text-[var(--signal-cobalt,#1D55F5)]">NFA MACHINE</td>
                <td className="p-2.5 text-[var(--ink-secondary,#525866)] uppercase text-[10px]">ε-NFA LINEAR CHAINS</td>
                <td className="p-2.5 text-[var(--ink-primary,#181A20)] font-bold">{NFA_MACHINE.states.length}</td>
                <td className="p-2.5 text-[var(--ink-primary,#181A20)] font-bold">{NFA_MACHINE.transitions.length}</td>
                <td className="p-2.5 text-[var(--ink-secondary,#525866)] uppercase text-[10px]">NONDETERMINISTIC</td>
                <td className="p-2.5 text-[var(--signal-cobalt,#1D55F5)] font-bold text-[10px]">L(COSTELLAR)</td>
              </tr>
              <tr className="hover:bg-[var(--bg-pill-neutral,#E6E9EF)] transition-colors">
                <td className="p-2.5 font-bold text-[var(--signal-cobalt,#1D55F5)]">DFA MACHINE</td>
                <td className="p-2.5 text-[var(--ink-secondary,#525866)] uppercase text-[10px]">SUBSET POWERSET DFA</td>
                <td className="p-2.5 text-[var(--ink-primary,#181A20)] font-bold">{DFA_MACHINE.states.length}</td>
                <td className="p-2.5 text-[var(--ink-primary,#181A20)] font-bold">{DFA_MACHINE.transitions.length}</td>
                <td className="p-2.5 text-[var(--signal-cobalt,#1D55F5)] uppercase text-[10px] font-bold">DETERMINISTIC</td>
                <td className="p-2.5 text-[var(--signal-cobalt,#1D55F5)] font-bold text-[10px]">L(COSTELLAR) IDENTICAL</td>
              </tr>
              <tr className="hover:bg-[var(--bg-pill-neutral,#E6E9EF)] transition-colors">
                <td className="p-2.5 font-bold text-[var(--signal-cobalt,#1D55F5)]">MINIMIZED DFA</td>
                <td className="p-2.5 text-[var(--ink-secondary,#525866)] uppercase text-[10px]">HOPCROFT MINIMIZED</td>
                <td className="p-2.5 text-[var(--signal-cobalt,#1D55F5)] font-bold">{MINIMIZED_DFA_MACHINE.states.length}</td>
                <td className="p-2.5 text-[var(--signal-cobalt,#1D55F5)] font-bold">{MINIMIZED_DFA_MACHINE.transitions.length}</td>
                <td className="p-2.5 text-[var(--signal-cobalt,#1D55F5)] uppercase text-[10px] font-bold">CANONICAL MINIMAL</td>
                <td className="p-2.5 text-[var(--signal-cobalt,#1D55F5)] font-bold text-[10px]">L(COSTELLAR) ISOMORPHIC</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
